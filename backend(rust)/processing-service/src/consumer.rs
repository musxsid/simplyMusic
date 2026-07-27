use futures_util::StreamExt;
use lapin::{
    options::{BasicAckOptions, BasicConsumeOptions, QueueDeclareOptions},
    types::FieldTable,
    Connection, ConnectionProperties,
};
use serde::Deserialize;
use std::{io::Write, sync::Arc};
use tracing::{error, info, warn};

use crate::{
    config::Config,
    db::DbService,
    minio::MinioService,
    parser::parse_audio_metadata,
};

#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
#[allow(dead_code)]
pub struct FileUploadedEvent {
    pub event_type: Option<String>,
    pub track_id: String,
    pub user_id: Option<String>,
    pub object_name: String,
    pub filename: Option<String>,
    pub file_hash: Option<String>,
}

pub struct ConsumerService {
    config: Config,
    db_service: DbService,
    minio_service: MinioService,
}

impl ConsumerService {
    pub fn new(config: Config, db_service: DbService, minio_service: MinioService) -> Self {
        Self {
            config,
            db_service,
            minio_service,
        }
    }

    pub async fn start_consumer_loop(self: Arc<Self>) {
        info!("Starting RabbitMQ Consumer Loop for Processing Service...");

        let mut attempts = 0;
        let conn = loop {
            attempts += 1;
            match Connection::connect(&self.config.rabbitmq_url, ConnectionProperties::default()).await {
                Ok(c) => break c,
                Err(e) => {
                    if attempts >= 20 {
                        error!("Failed to connect to RabbitMQ after 20 attempts: {}", e);
                        return;
                    }
                    info!("Waiting for RabbitMQ at {}... (attempt {}/20)", self.config.rabbitmq_url, attempts);
                    tokio::time::sleep(tokio::time::Duration::from_secs(2)).await;
                }
            }
        };

        let channel = match conn.create_channel().await {
            Ok(c) => c,
            Err(e) => {
                error!("Failed to create RabbitMQ channel: {}", e);
                return;
            }
        };

        let queue_name = "music.events";
        let _ = channel
            .queue_declare(
                queue_name,
                QueueDeclareOptions {
                    durable: true,
                    ..Default::default()
                },
                FieldTable::default(),
            )
            .await;

        let mut consumer = match channel
            .basic_consume(
                queue_name,
                "rust_processing_consumer",
                BasicConsumeOptions::default(),
                FieldTable::default(),
            )
            .await
        {
            Ok(c) => c,
            Err(e) => {
                error!("Failed to subscribe to queue '{}': {}", queue_name, e);
                return;
            }
        };

        info!("Successfully subscribed to RabbitMQ queue '{}'. Listening for events...", queue_name);

        while let Some(delivery_result) = consumer.next().await {
            match delivery_result {
                Ok(delivery) => {
                    let payload_str = match std::str::from_utf8(&delivery.data) {
                        Ok(s) => s,
                        Err(_) => {
                            let _ = delivery.ack(BasicAckOptions::default()).await;
                            continue;
                        }
                    };

                    info!("Received RabbitMQ message on '{}': {}", queue_name, payload_str);

                    if let Ok(event) = serde_json::from_str::<FileUploadedEvent>(payload_str) {
                        if event.event_type.as_deref().unwrap_or("FILE_UPLOADED") == "FILE_UPLOADED" {
                            let service = self.clone();
                            tokio::spawn(async move {
                                service.process_event(event).await;
                            });
                        }
                    } else {
                        warn!("Failed to parse event JSON: {}", payload_str);
                    }

                    let _ = delivery.ack(BasicAckOptions::default()).await;
                }
                Err(e) => {
                    error!("Error receiving message from consumer stream: {}", e);
                    tokio::time::sleep(tokio::time::Duration::from_secs(1)).await;
                }
            }
        }
    }

    async fn process_event(&self, event: FileUploadedEvent) {
        info!("Processing FILE_UPLOADED event for track ID: {}", event.track_id);

        let bytes = match self.minio_service.get_object_bytes(&event.object_name).await {
            Ok(b) => b,
            Err(e) => {
                error!("Failed to retrieve binary from MinIO: {}", e);
                return;
            }
        };

        let filename = event
            .filename
            .unwrap_or_else(|| event.object_name.clone());

        // Create temp file for ID3 parsing
        let mut temp_file = match tempfile::NamedTempFile::new() {
            Ok(f) => f,
            Err(e) => {
                error!("Failed to create temp file: {}", e);
                return;
            }
        };

        if let Err(e) = temp_file.write_all(&bytes) {
            error!("Failed to write bytes to temp file: {}", e);
            return;
        }

        let parsed = parse_audio_metadata(temp_file.path(), &filename);

        let title = parsed.title.unwrap_or_else(|| filename.clone());
        let artist = parsed.artist.unwrap_or_else(|| "Unknown Artist".to_string());
        let album = parsed.album.unwrap_or_else(|| format!("{} - Single", title));
        let duration = parsed.duration.unwrap_or(0.0);

        let _ = self
            .db_service
            .update_track_metadata(
                &event.track_id,
                &title,
                &artist,
                &album,
                parsed.release_year,
                duration,
            )
            .await;

        info!("Finished processing track ID: {} (duration: {:.2}s)", event.track_id, duration);
    }
}
