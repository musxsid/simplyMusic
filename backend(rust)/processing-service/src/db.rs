use mongodb::{
    bson::{doc, oid::ObjectId, Document},
    options::ClientOptions,
    Client, Collection,
};
use tracing::{error, info};
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

#[derive(Clone)]
pub struct DbService {
    metadata_col: Collection<Document>,
}

impl DbService {
    pub async fn new(config: &Config) -> Result<Self, mongodb::error::Error> {
        let options = ClientOptions::parse(&config.mongodb_uri).await?;
        let client = Client::with_options(options)?;
        let database = client.database("simplymusic");
        let metadata_col = database.collection::<Document>("music_metadata");

        info!("Connected to MongoDB successfully for Processing Service");
        Ok(Self { metadata_col })
    }

    pub async fn update_track_metadata(
        &self,
        track_id: &str,
        title: &str,
        artist: &str,
        album: &str,
        release_year: Option<i32>,
        duration: f64,
    ) -> Result<(), String> {
        let filter = build_id_filter(track_id);
        let mut update_doc = doc! {
            "title": title,
            "artist": artist,
            "album": album,
            "duration": duration,
        };

        if let Some(year) = release_year {
            update_doc.insert("releaseYear", year);
        }

        let update = doc! { "$set": update_doc };
        match self.metadata_col.update_one(filter, update).await {
            Ok(res) => {
                info!(
                    "Updated MongoDB metadata for track {}: matched={}, modified={}",
                    track_id, res.matched_count, res.modified_count
                );
                Ok(())
            }
            Err(e) => {
                error!("Failed to update MongoDB metadata for track {}: {}", track_id, e);
                Err(format!("Database update error: {}", e))
            }
        }
    }
}
