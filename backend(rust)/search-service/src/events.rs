use lapin::{
    options::QueueDeclareOptions,
    types::FieldTable,
    BasicProperties, Connection, ConnectionProperties,
};
use serde::Serialize;
use std::sync::Arc;
use tracing::{error, info};
use crate::config::Config;

#[derive(Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct TrackDeletedEvent {
    pub event_type: String,
    pub track_id: String,
    pub user_id: String,
}

#[derive(Clone)]
pub struct EventService {
    conn: Arc<Connection>,
    queue_name: String,
}

impl EventService {
    pub async fn new(config: &Config) -> Result<Self, lapin::Error> {
        let mut attempts = 0;
        let conn = loop {
            attempts += 1;
            match Connection::connect(&config.rabbitmq_url, ConnectionProperties::default()).await {
                Ok(c) => break c,
                Err(e) => {
                    if attempts >= 15 {
                        error!("Failed to connect to RabbitMQ after 15 attempts: {}", e);
                        return Err(e);
                    }
                    info!("Waiting for RabbitMQ at {} to be ready... (attempt {}/15)", config.rabbitmq_url, attempts);
                    tokio::time::sleep(tokio::time::Duration::from_secs(2)).await;
                }
            }
        };

        let channel = conn.create_channel().await?;

        let queue_name = "music.events".to_string();
        channel
            .queue_declare(
                &queue_name,
                QueueDeclareOptions {
                    durable: true,
                    ..Default::default()
                },
                FieldTable::default(),
            )
            .await?;

        info!("Connected to RabbitMQ for Search Service");
        Ok(Self {
            conn: Arc::new(conn),
            queue_name,
        })
    }

    pub async fn publish_event(&self, event_type: &str, track_id: &str, user_id: &str) {
        let event = TrackDeletedEvent {
            event_type: event_type.to_string(),
            track_id: track_id.to_string(),
            user_id: user_id.to_string(),
        };

        let payload = match serde_json::to_vec(&event) {
            Ok(b) => b,
            Err(e) => {
                error!("Failed to serialize track deleted event: {}", e);
                return;
            }
        };

        if let Ok(channel) = self.conn.create_channel().await {
            let _ = channel
                .basic_publish(
                    "",
                    &self.queue_name,
                    lapin::options::BasicPublishOptions::default(),
                    &payload,
                    BasicProperties::default().with_content_type("application/json".into()),
                )
                .await;
            info!("Published {} event for track {}", event_type, track_id);
        }
    }
}
