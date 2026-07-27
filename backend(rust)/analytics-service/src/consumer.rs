use futures_util::StreamExt;
use lapin::{
    options::{BasicAckOptions, BasicConsumeOptions, QueueDeclareOptions},
    types::FieldTable,
    Connection, ConnectionProperties,
};
use std::sync::Arc;
use tracing::{error, info, warn};

use crate::{
    config::Config,
    db::DbService,
    models::EventMessage,
};

pub struct ConsumerService {
    config: Config,
    db_service: DbService,
}

impl ConsumerService {
    pub fn new(config: Config, db_service: DbService) -> Self {
        Self { config, db_service }
    }

    pub async fn start_consumer_loop(self: Arc<Self>) {
        info!("Starting RabbitMQ Consumer Loop for Analytics Service...");

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

        let queue_name = "analytics.events.queue";
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
                "rust_analytics_consumer",
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

        info!("Successfully subscribed to RabbitMQ queue '{}' for Analytics Service", queue_name);

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

                    info!("Received event on queue '{}': {}", queue_name, payload_str);

                    if let Ok(event) = serde_json::from_str::<EventMessage>(payload_str) {
                        let user_id = event.user_id.unwrap_or_else(|| "anonymous".to_string());
                        
                        if event.event_type == "TRACK_DELETED" {
                            if let Some(ref tid) = event.track_id {
                                let db = self.db_service.clone();
                                let track_id = tid.clone();
                                tokio::spawn(async move {
                                    let _ = db.delete_logs_by_track_id(&track_id).await;
                                });
                            }
                        } else {
                            let db = self.db_service.clone();
                            let event_type = event.event_type.clone();
                            let track_id = event.track_id.clone();
                            tokio::spawn(async move {
                                let _ = db.save_activity_log(&event_type, track_id.as_deref(), &user_id).await;
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
}
