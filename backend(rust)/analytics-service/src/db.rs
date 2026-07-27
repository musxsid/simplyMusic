use futures_util::StreamExt;
use mongodb::{
    bson::{doc, oid::ObjectId, DateTime, Document},
    options::ClientOptions,
    Client, Collection,
};
use tracing::{error, info};
use crate::{
    config::Config,
    models::{StatsResponse, TrackHistoryDoc},
};

#[derive(Clone)]
pub struct DbService {
    activity_col: Collection<Document>,
    metadata_col: Collection<Document>,
}

impl DbService {
    pub async fn new(config: &Config) -> Result<Self, mongodb::error::Error> {
        let options = ClientOptions::parse(&config.mongodb_uri).await?;
        let client = Client::with_options(options)?;
        let database = client.database("simplymusic");
        let activity_col = database.collection::<Document>("activity_logs");
        let metadata_col = database.collection::<Document>("music_metadata");

        info!("Connected to MongoDB successfully for Analytics Service");
        Ok(Self {
            activity_col,
            metadata_col,
        })
    }

    pub async fn save_activity_log(
        &self,
        event_type: &str,
        track_id: Option<&str>,
        user_id: &str,
    ) -> Result<(), String> {
        let mut log_doc = doc! {
            "eventType": event_type,
            "userId": user_id,
            "timestamp": DateTime::now(),
        };

        if let Some(tid) = track_id {
            log_doc.insert("trackId", tid);
        }

        match self.activity_col.insert_one(log_doc).await {
            Ok(_) => {
                info!("Saved activity log: eventType={}, trackId={:?}, userId={}", event_type, track_id, user_id);
                Ok(())
            }
            Err(e) => {
                error!("Failed to save activity log: {}", e);
                Err(format!("MongoDB insert error: {}", e))
            }
        }
    }

    pub async fn delete_logs_by_track_id(&self, track_id: &str) -> Result<(), String> {
        let filter = doc! { "trackId": track_id };
        match self.activity_col.delete_many(filter).await {
            Ok(res) => {
                info!("Deleted {} activity logs for trackId {}", res.deleted_count, track_id);
                Ok(())
            }
            Err(e) => {
                error!("Failed to delete activity logs for trackId {}: {}", track_id, e);
                Err(format!("MongoDB delete error: {}", e))
            }
        }
    }

    pub async fn get_user_stats(&self, user_id: &str) -> Result<StatsResponse, String> {
        let user_ids = if user_id == "anonymous" {
            vec!["anonymous".to_string()]
        } else {
            vec![user_id.to_string(), "anonymous".to_string()]
        };

        let upload_filter = doc! { "uploadedBy": { "$in": &user_ids } };
        let total_uploads = self
            .metadata_col
            .count_documents(upload_filter.clone())
            .await
            .unwrap_or(0) as i64;

        let mut active_track_ids = Vec::new();
        if let Ok(mut cursor) = self.metadata_col.find(upload_filter).await {
            while let Some(Ok(doc)) = cursor.next().await {
                if let Ok(s) = doc.get_str("_id") {
                    active_track_ids.push(s.to_string());
                } else if let Ok(oid) = doc.get_object_id("_id") {
                    active_track_ids.push(oid.to_hex());
                }
            }
        }

        let total_plays = if active_track_ids.is_empty() {
            0
        } else {
            let plays_filter = doc! {
                "eventType": "TRACK_PLAYED",
                "userId": { "$in": &user_ids },
                "trackId": { "$in": active_track_ids }
            };
            self.activity_col
                .count_documents(plays_filter)
                .await
                .unwrap_or(0) as i64
        };

        Ok(StatsResponse {
            total_uploads,
            total_plays,
        })
    }

    pub async fn get_active_track_ids(&self, user_ids: &[String]) -> Vec<String> {
        let upload_filter = doc! { "uploadedBy": { "$in": user_ids } };
        let mut active_track_ids = Vec::new();
        if let Ok(mut cursor) = self.metadata_col.find(upload_filter).await {
            while let Some(Ok(doc)) = cursor.next().await {
                if let Ok(s) = doc.get_str("_id") {
                    active_track_ids.push(s.to_string());
                } else if let Ok(oid) = doc.get_object_id("_id") {
                    active_track_ids.push(oid.to_hex());
                }
            }
        }
        active_track_ids
    }

    pub async fn get_playback_history(&self, user_id: &str) -> Result<Vec<TrackHistoryDoc>, String> {
        let user_ids = if user_id == "anonymous" {
            vec!["anonymous".to_string()]
        } else {
            vec![user_id.to_string(), "anonymous".to_string()]
        };

        let active_track_ids = self.get_active_track_ids(&user_ids).await;
        if active_track_ids.is_empty() {
            return Ok(Vec::new());
        }

        let pipeline = vec![
            doc! { "$match": { "eventType": "TRACK_PLAYED", "userId": { "$in": user_ids }, "trackId": { "$in": active_track_ids } } },
            doc! {
                "$group": {
                    "_id": "$trackId",
                    "playCount": { "$sum": 1 },
                    "lastPlayed": { "$max": "$timestamp" }
                }
            },
            doc! {
                "$project": {
                    "trackId": "$_id",
                    "playCount": 1,
                    "lastPlayed": 1,
                    "_id": 0
                }
            },
            doc! { "$sort": { "lastPlayed": -1 } },
        ];

        let mut results = Vec::new();
        if let Ok(mut cursor) = self.activity_col.aggregate(pipeline).await {
            while let Some(Ok(doc)) = cursor.next().await {
                let track_id = doc.get_str("trackId").unwrap_or("").to_string();
                let play_count = doc.get_i64("playCount").or_else(|_| doc.get_i32("playCount").map(|i| i as i64)).unwrap_or(0);
                
                let last_played = if let Ok(dt) = doc.get_datetime("lastPlayed") {
                    dt.try_to_rfc3339_string().unwrap_or_else(|_| "2026-01-01T00:00:00Z".to_string())
                } else if let Ok(s) = doc.get_str("lastPlayed") {
                    s.to_string()
                } else {
                    "2026-01-01T00:00:00Z".to_string()
                };

                results.push(TrackHistoryDoc {
                    track_id,
                    play_count,
                    last_played,
                });
            }
        }

        Ok(results)
    }

    pub async fn get_top_tracks(&self, user_id: &str) -> Result<Vec<TrackHistoryDoc>, String> {
        let user_ids = if user_id == "anonymous" {
            vec!["anonymous".to_string()]
        } else {
            vec![user_id.to_string(), "anonymous".to_string()]
        };

        let active_track_ids = self.get_active_track_ids(&user_ids).await;
        if active_track_ids.is_empty() {
            return Ok(Vec::new());
        }

        let pipeline = vec![
            doc! { "$match": { "eventType": "TRACK_PLAYED", "userId": { "$in": user_ids }, "trackId": { "$in": active_track_ids } } },
            doc! {
                "$group": {
                    "_id": "$trackId",
                    "playCount": { "$sum": 1 },
                    "lastPlayed": { "$max": "$timestamp" }
                }
            },
            doc! {
                "$project": {
                    "trackId": "$_id",
                    "playCount": 1,
                    "lastPlayed": 1,
                    "_id": 0
                }
            },
            doc! { "$sort": { "playCount": -1, "lastPlayed": -1, "trackId": 1 } },
            doc! { "$limit": 10 },
        ];

        let mut results = Vec::new();
        if let Ok(mut cursor) = self.activity_col.aggregate(pipeline).await {
            while let Some(Ok(doc)) = cursor.next().await {
                let track_id = doc.get_str("trackId").unwrap_or("").to_string();
                let play_count = doc.get_i64("playCount").or_else(|_| doc.get_i32("playCount").map(|i| i as i64)).unwrap_or(0);
                
                let last_played = if let Ok(dt) = doc.get_datetime("lastPlayed") {
                    dt.try_to_rfc3339_string().unwrap_or_else(|_| "2026-01-01T00:00:00Z".to_string())
                } else if let Ok(s) = doc.get_str("lastPlayed") {
                    s.to_string()
                } else {
                    "2026-01-01T00:00:00Z".to_string()
                };

                results.push(TrackHistoryDoc {
                    track_id,
                    play_count,
                    last_played,
                });
            }
        }

        Ok(results)
    }
}
