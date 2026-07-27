use mongodb::{bson::doc, options::ClientOptions, Client, Collection};
use serde::{Deserialize, Serialize};
use tracing::info;
use crate::config::Config;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct MusicMetadataDoc {
    #[serde(rename = "_id")]
    pub id: String,
    pub title: String,
    pub artist: String,
    pub album: String,
    #[serde(rename = "releaseYear")]
    pub release_year: i32,
    pub duration: f64,
    #[serde(rename = "fileUrl")]
    pub file_url: String,
    #[serde(rename = "fileHash")]
    pub file_hash: String,
    #[serde(rename = "uploadedBy")]
    pub uploaded_by: String,
    #[serde(rename = "createdAt", default = "mongodb::bson::DateTime::now")]
    pub created_at: mongodb::bson::DateTime,
}

#[derive(Clone)]
pub struct DbService {
    collection: Collection<MusicMetadataDoc>,
}

impl DbService {
    pub async fn new(config: &Config) -> Result<Self, mongodb::error::Error> {
        let options = ClientOptions::parse(&config.mongodb_uri).await?;
        let client = Client::with_options(options)?;
        let database = client.database("simplymusic");
        let collection = database.collection::<MusicMetadataDoc>("music_metadata");

        info!("Connected to MongoDB successfully. Target collection: music_metadata");
        Ok(Self { collection })
    }

    pub async fn save_metadata(&self, metadata: &MusicMetadataDoc) -> Result<(), mongodb::error::Error> {
        self.collection.insert_one(metadata).await?;
        info!("Saved MusicMetadata to MongoDB for track ID: {}", metadata.id);
        Ok(())
    }
}
