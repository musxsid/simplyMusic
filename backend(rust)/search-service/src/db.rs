use futures_util::TryStreamExt;
use mongodb::{
    bson::{doc, oid::ObjectId, DateTime, Document, Regex},
    options::{ClientOptions, FindOptions},
    Client, Collection,
};
use rand::seq::SliceRandom;
use tracing::info;
use uuid::Uuid;

use crate::{
    config::Config,
    models::{FavouriteDoc, MusicMetadataDoc, PlaylistDoc},
};

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

pub fn build_ids_filter(ids: &[String]) -> Document {
    let mut bson_ids: Vec<mongodb::bson::Bson> = Vec::new();
    for id in ids {
        bson_ids.push(mongodb::bson::Bson::String(id.clone()));
        if let Ok(oid) = ObjectId::parse_str(id) {
            bson_ids.push(mongodb::bson::Bson::ObjectId(oid));
        }
    }
    doc! { "_id": { "$in": bson_ids } }
}

#[derive(Clone)]
pub struct DbService {
    metadata_col: Collection<MusicMetadataDoc>,
    playlist_col: Collection<PlaylistDoc>,
    favourite_col: Collection<FavouriteDoc>,
}

impl DbService {
    pub async fn new(config: &Config) -> Result<Self, mongodb::error::Error> {
        let options = ClientOptions::parse(&config.mongodb_uri).await?;
        let client = Client::with_options(options)?;
        let database = client.database("simplymusic");

        let metadata_col = database.collection::<MusicMetadataDoc>("music_metadata");
        let playlist_col = database.collection::<PlaylistDoc>("playlists");
        let favourite_col = database.collection::<FavouriteDoc>("favourites");

        info!("Connected to MongoDB successfully for Search Service");
        Ok(Self {
            metadata_col,
            playlist_col,
            favourite_col,
        })
    }

    /// Search tracks uploaded by user (filtered by case-insensitive query if provided)
    pub async fn search_tracks(
        &self,
        user_id: &str,
        query: Option<&str>,
    ) -> Result<Vec<MusicMetadataDoc>, mongodb::error::Error> {
        let user_filter = doc! {
            "$or": [
                { "uploadedBy": user_id },
                { "uploadedBy": "anonymous" },
                { "uploadedBy": { "$exists": false } }
            ]
        };

        let filter = match query {
            Some(q) if !q.trim().is_empty() => {
                let regex = Regex {
                    pattern: q.trim().to_string(),
                    options: "i".to_string(),
                };
                doc! {
                    "$and": [
                        user_filter,
                        {
                            "$or": [
                                { "title": &regex },
                                { "artist": &regex },
                                { "album": &regex }
                            ]
                        }
                    ]
                }
            }
            _ => user_filter,
        };

        let mut cursor = self.metadata_col.find(filter).await?;
        let mut tracks = Vec::new();
        while let Some(doc) = cursor.try_next().await? {
            tracks.push(doc);
        }
        Ok(tracks)
    }

    /// Get top 10 most recent tracks for user
    pub async fn get_recent_tracks(
        &self,
        user_id: &str,
    ) -> Result<Vec<MusicMetadataDoc>, mongodb::error::Error> {
        let find_options = FindOptions::builder()
            .sort(doc! { "createdAt": -1 })
            .limit(10)
            .build();

        let filter = doc! {
            "$or": [
                { "uploadedBy": user_id },
                { "uploadedBy": "anonymous" },
                { "uploadedBy": { "$exists": false } }
            ]
        };

        let mut cursor = self
            .metadata_col
            .find(filter)
            .with_options(find_options)
            .await?;

        let mut tracks = Vec::new();
        while let Some(doc) = cursor.try_next().await? {
            tracks.push(doc);
        }
        Ok(tracks)
    }

    /// Get a random featured track from user's recent tracks
    pub async fn get_featured_track(
        &self,
        user_id: &str,
    ) -> Result<Option<MusicMetadataDoc>, mongodb::error::Error> {
        let recent = self.get_recent_tracks(user_id).await?;
        if recent.is_empty() {
            return Ok(None);
        }
        let mut rng = rand::thread_rng();
        Ok(recent.choose(&mut rng).cloned())
    }

    /// Delete a track by ID if owned by user
    pub async fn delete_track(
        &self,
        track_id: &str,
        user_id: &str,
    ) -> Result<MusicMetadataDoc, String> {
        let filter = build_id_filter(track_id);
        let track = match self.metadata_col.find_one(filter.clone()).await {
            Ok(Some(t)) => t,
            _ => return Err("Track not found".to_string()),
        };

        if track.uploaded_by != user_id && track.uploaded_by != "anonymous" && !track.uploaded_by.is_empty() {
            return Err("Unauthorized to delete this track".to_string());
        }

        // Delete from favourites
        let _ = self
            .favourite_col
            .delete_many(doc! { "trackId": track_id })
            .await;

        // Remove from playlists
        let update = doc! { "$pull": { "trackIds": track_id } };
        let _ = self
            .playlist_col
            .update_many(doc! {}, update)
            .await;

        // Delete track doc
        if let Err(e) = self.metadata_col.delete_one(filter).await {
            return Err(format!("Failed to delete track document: {}", e));
        }

        Ok(track)
    }

    /// Add a track to user's favourites
    pub async fn add_favourite(&self, track_id: &str, user_id: &str) -> Result<(), String> {
        let filter = build_id_filter(track_id);
        let _track = match self.metadata_col.find_one(filter).await {
            Ok(Some(t)) => t,
            _ => return Err("Track not found".to_string()),
        };

        let existing = self
            .favourite_col
            .find_one(doc! { "userId": user_id, "trackId": track_id })
            .await;

        if matches!(existing, Ok(None)) {
            let fav = FavouriteDoc {
                id: Uuid::new_v4().to_string(),
                user_id: user_id.to_string(),
                track_id: track_id.to_string(),
                created_at: DateTime::now(),
            };
            if let Err(e) = self.favourite_col.insert_one(fav).await {
                return Err(format!("Failed to save favourite: {}", e));
            }
        }
        Ok(())
    }

    /// Remove a track from user's favourites
    pub async fn remove_favourite(&self, track_id: &str, user_id: &str) -> Result<(), String> {
        let _ = self
            .favourite_col
            .delete_one(doc! { "userId": user_id, "trackId": track_id })
            .await;
        Ok(())
    }

    /// Get user's favourite tracks
    pub async fn get_favourite_tracks(
        &self,
        user_id: &str,
    ) -> Result<Vec<MusicMetadataDoc>, mongodb::error::Error> {
        let mut cursor = self
            .favourite_col
            .find(doc! { "userId": user_id })
            .await?;

        let mut track_ids = Vec::new();
        while let Some(fav) = cursor.try_next().await? {
            track_ids.push(fav.track_id);
        }

        if track_ids.is_empty() {
            return Ok(Vec::new());
        }

        let filter = build_ids_filter(&track_ids);
        let mut tracks_cursor = self.metadata_col.find(filter).await?;

        let mut favourite_tracks = Vec::new();
        while let Some(track) = tracks_cursor.try_next().await? {
            favourite_tracks.push(track);
        }
        Ok(favourite_tracks)
    }

    /// Create a new playlist
    pub async fn create_playlist(
        &self,
        name: &str,
        user_id: &str,
    ) -> Result<PlaylistDoc, mongodb::error::Error> {
        let doc = PlaylistDoc {
            id: Uuid::new_v4().to_string(),
            name: name.to_string(),
            user_id: user_id.to_string(),
            track_ids: Vec::new(),
            created_at: DateTime::now(),
        };

        self.playlist_col.insert_one(&doc).await?;
        Ok(doc)
    }

    /// Get all playlists owned by user or shared
    pub async fn get_user_playlists(
        &self,
        user_id: &str,
    ) -> Result<Vec<PlaylistDoc>, mongodb::error::Error> {
        let filter = doc! {
            "$or": [
                { "userId": user_id },
                { "userId": "anonymous" },
                { "userId": { "$exists": false } }
            ]
        };

        let mut cursor = self
            .playlist_col
            .find(filter)
            .await?;

        let mut playlists = Vec::new();
        while let Some(p) = cursor.try_next().await? {
            playlists.push(p);
        }
        Ok(playlists)
    }

    /// Get playlist by ID
    pub async fn get_playlist_by_id(
        &self,
        playlist_id: &str,
    ) -> Result<Option<PlaylistDoc>, mongodb::error::Error> {
        let filter = build_id_filter(playlist_id);
        self.playlist_col.find_one(filter).await
    }

    /// Get tracks in playlist
    pub async fn get_playlist_tracks(
        &self,
        track_ids: &[String],
        _user_id: &str,
    ) -> Result<Vec<MusicMetadataDoc>, mongodb::error::Error> {
        if track_ids.is_empty() {
            return Ok(Vec::new());
        }

        let filter = build_ids_filter(track_ids);
        let mut cursor = self.metadata_col.find(filter).await?;

        let mut tracks = Vec::new();
        while let Some(t) = cursor.try_next().await? {
            tracks.push(t);
        }
        Ok(tracks)
    }

    /// Add track to playlist
    pub async fn add_track_to_playlist(
        &self,
        playlist_id: &str,
        track_id: &str,
        _user_id: &str,
    ) -> Result<PlaylistDoc, String> {
        let track_filter = build_id_filter(track_id);
        let _track = match self.metadata_col.find_one(track_filter).await {
            Ok(Some(t)) => t,
            _ => return Err("Track not found".to_string()),
        };

        let playlist_filter = build_id_filter(playlist_id);
        let _playlist = match self.playlist_col.find_one(playlist_filter.clone()).await {
            Ok(Some(p)) => p,
            _ => return Err("Playlist not found".to_string()),
        };

        let update = doc! { "$addToSet": { "trackIds": track_id } };
        let _ = self.playlist_col.update_one(playlist_filter, update).await;

        match self.get_playlist_by_id(playlist_id).await {
            Ok(Some(updated)) => Ok(updated),
            _ => Err("Failed to retrieve updated playlist".to_string()),
        }
    }

    /// Remove track from playlist
    pub async fn remove_track_from_playlist(
        &self,
        playlist_id: &str,
        track_id: &str,
        _user_id: &str,
    ) -> Result<PlaylistDoc, String> {
        let filter = build_id_filter(playlist_id);
        let update = doc! { "$pull": { "trackIds": track_id } };
        let _ = self.playlist_col.update_one(filter, update).await;

        match self.get_playlist_by_id(playlist_id).await {
            Ok(Some(updated)) => Ok(updated),
            _ => Err("Failed to retrieve updated playlist".to_string()),
        }
    }

    /// Delete playlist
    pub async fn delete_playlist(&self, playlist_id: &str, _user_id: &str) -> Result<(), String> {
        let filter = build_id_filter(playlist_id);
        let _ = self.playlist_col.delete_one(filter).await;
        Ok(())
    }
}
