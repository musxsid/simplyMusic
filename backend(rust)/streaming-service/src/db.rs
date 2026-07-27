use mongodb::{
    bson::{doc, oid::ObjectId, Document},
    options::ClientOptions,
    Client, Collection,
};
use serde::{Deserialize, Serialize};
use tracing::info;
use crate::config::Config;

pub fn build_id_filter(id: &str) -> Document {
    if let Ok(oid) = ObjectId::parse_str(id) {
        doc! {
            "$or": [
                { "_id": id },
                { "_id": oid }
            ]
        }
    } else {
        doc! { "_id": id }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct MusicMetadataDoc {
    #[serde(rename = "_id", default)]
    pub id: String,
    #[serde(default)]
    pub title: String,
    #[serde(default)]
    pub artist: String,
    #[serde(rename = "fileUrl", default)]
    pub file_url: String,
    #[serde(rename = "uploadedBy", default)]
    pub uploaded_by: String,
}

#[derive(Clone)]
pub struct DbService {
    metadata_col: Collection<Document>,
    activity_col: Collection<Document>,
}

impl DbService {
    pub async fn new(config: &Config) -> Result<Self, mongodb::error::Error> {
        let options = ClientOptions::parse(&config.mongodb_uri).await?;
        let client = Client::with_options(options)?;
        let database = client.database("simplymusic");
        let metadata_col = database.collection::<Document>("music_metadata");
        let activity_col = database.collection::<Document>("activity_logs");

        info!("Connected to MongoDB successfully for Streaming Service");
        Ok(Self { metadata_col, activity_col })
    }

    pub async fn get_track_by_id(&self, track_id: &str) -> Result<Option<MusicMetadataDoc>, String> {
        let filter = build_id_filter(track_id);
        match self.metadata_col.find_one(filter).await {
            Ok(Some(doc)) => {
                let id = doc
                    .get_str("_id")
                    .map(|s| s.to_string())
                    .or_else(|_| doc.get_object_id("_id").map(|o| o.to_hex()))
                    .unwrap_or_else(|_| track_id.to_string());

                let title = doc.get_str("title").unwrap_or("Unknown").to_string();
                let artist = doc.get_str("artist").unwrap_or("Unknown Artist").to_string();
                let file_url = doc.get_str("fileUrl").unwrap_or("").to_string();
                let uploaded_by = doc.get_str("uploadedBy").unwrap_or("anonymous").to_string();

                Ok(Some(MusicMetadataDoc {
                    id,
                    title,
                    artist,
                    file_url,
                    uploaded_by,
                }))
            }
            Ok(None) => Ok(None),
            Err(e) => Err(format!("MongoDB query error: {}", e)),
        }
    }

    pub async fn record_play_activity(&self, track_id: &str, user_id: &str) -> Result<(), String> {
        let log_doc = doc! {
            "eventType": "TRACK_PLAYED",
            "trackId": track_id,
            "userId": user_id,
            "timestamp": mongodb::bson::DateTime::now(),
        };

        match self.activity_col.insert_one(log_doc).await {
            Ok(_) => {
                info!("Saved TRACK_PLAYED activity log directly to MongoDB for trackId {}", track_id);
                Ok(())
            }
            Err(e) => {
                tracing::error!("Failed to save TRACK_PLAYED activity log: {}", e);
                Err(format!("MongoDB insert error: {}", e))
            }
        }
    }
}
