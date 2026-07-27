use axum::{
    extract::{Path, Query, State},
    http::{header, HeaderMap, StatusCode},
    response::{IntoResponse, Response},
    Json,
};
use base64::engine::general_purpose::URL_SAFE_NO_PAD;
use base64::Engine;
use serde::Deserialize;
use std::sync::Arc;
use tracing::error;

use crate::{
    models::{CreatePlaylistPayload, PlaylistResponse, SearchQuery},
    AppState,
};

#[derive(Deserialize, Debug)]
struct JwtClaims {
    sub: Option<String>,
    preferred_username: Option<String>,
}

pub fn extract_user_id(headers: &HeaderMap) -> String {
    // 1. Check x-user-id header set by API Gateway
    if let Some(h) = headers.get("x-user-id").or_else(|| headers.get("X-User-Id")) {
        if let Ok(s) = h.to_str() {
            if !s.trim().is_empty() {
                return s.trim().to_string();
            }
        }
    }

    // 2. Fallback to Authorization: Bearer JWT
    let auth_header = match headers.get(header::AUTHORIZATION) {
        Some(h) => match h.to_str() {
            Ok(s) => s,
            Err(_) => return "anonymous".to_string(),
        },
        None => return "anonymous".to_string(),
    };

    if !auth_header.starts_with("Bearer ") {
        return "anonymous".to_string();
    }

    let token = &auth_header[7..];
    let parts: Vec<&str> = token.split('.').collect();
    if parts.len() < 2 {
        return "anonymous".to_string();
    }

    let payload = parts[1];
    let padded = match payload.len() % 4 {
        2 => format!("{}==", payload),
        3 => format!("{}=", payload),
        _ => payload.to_string(),
    };

    let decoded = match URL_SAFE_NO_PAD
        .decode(&padded)
        .or_else(|_| URL_SAFE_NO_PAD.decode(payload))
    {
        Ok(d) => d,
        Err(_) => return "anonymous".to_string(),
    };

    match serde_json::from_slice::<JwtClaims>(&decoded) {
        Ok(claims) => claims
            .sub
            .or(claims.preferred_username)
            .unwrap_or_else(|| "anonymous".to_string()),
        Err(_) => "anonymous".to_string(),
    }
}

// ---------------------------------------------------
// Track & Catalog Handlers
// ---------------------------------------------------

pub async fn search_music_handler(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    Query(query): Query<SearchQuery>,
) -> Response {
    let user_id = extract_user_id(&headers);
    match state
        .db_service
        .search_tracks(&user_id, query.query.as_deref())
        .await
    {
        Ok(tracks) => (StatusCode::OK, Json(tracks)).into_response(),
        Err(e) => {
            error!("Error searching tracks: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, "Failed to query track catalog").into_response()
        }
    }
}

pub async fn recent_tracks_handler(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
) -> Response {
    let user_id = extract_user_id(&headers);
    match state.db_service.get_recent_tracks(&user_id).await {
        Ok(tracks) => (StatusCode::OK, Json(tracks)).into_response(),
        Err(e) => {
            error!("Error fetching recent tracks: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, "Failed to fetch recent tracks").into_response()
        }
    }
}

pub async fn featured_track_handler(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
) -> Response {
    let user_id = extract_user_id(&headers);
    match state.db_service.get_featured_track(&user_id).await {
        Ok(Some(track)) => (StatusCode::OK, Json(track)).into_response(),
        Ok(None) => (StatusCode::NO_CONTENT).into_response(),
        Err(e) => {
            error!("Error fetching featured track: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, "Failed to fetch featured track").into_response()
        }
    }
}

pub async fn delete_track_handler(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
    headers: HeaderMap,
) -> Response {
    let user_id = extract_user_id(&headers);
    match state.db_service.delete_track(&id, &user_id).await {
        Ok(track) => {
            // Delete MinIO file
            let minio = state.minio_service.clone();
            let file_url = track.file_url.clone();
            tokio::spawn(async move {
                minio.delete_file(&file_url).await;
            });

            // Publish RabbitMQ event
            let event = state.event_service.clone();
            let track_id = track.id.clone();
            let uid = user_id.clone();
            tokio::spawn(async move {
                event.publish_event("TRACK_DELETED", &track_id, &uid).await;
            });

            (StatusCode::NO_CONTENT).into_response()
        }
        Err(e) if e == "Unauthorized to delete this track" => {
            (StatusCode::FORBIDDEN, e).into_response()
        }
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e).into_response(),
    }
}

pub async fn add_favourite_handler(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
    headers: HeaderMap,
) -> Response {
    let user_id = extract_user_id(&headers);
    match state.db_service.add_favourite(&id, &user_id).await {
        Ok(_) => (StatusCode::OK).into_response(),
        Err(e) if e.contains("Unauthorized") => (StatusCode::FORBIDDEN, e).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e).into_response(),
    }
}

pub async fn remove_favourite_handler(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
    headers: HeaderMap,
) -> Response {
    let user_id = extract_user_id(&headers);
    let _ = state.db_service.remove_favourite(&id, &user_id).await;
    (StatusCode::NO_CONTENT).into_response()
}

pub async fn get_favourites_handler(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
) -> Response {
    let user_id = extract_user_id(&headers);
    match state.db_service.get_favourite_tracks(&user_id).await {
        Ok(tracks) => (StatusCode::OK, Json(tracks)).into_response(),
        Err(e) => {
            error!("Error fetching favourite tracks: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, "Failed to fetch favourite tracks").into_response()
        }
    }
}

// ---------------------------------------------------
// Playlist Handlers
// ---------------------------------------------------

pub async fn create_playlist_handler(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    Json(payload): Json<CreatePlaylistPayload>,
) -> Response {
    if payload.name.trim().is_empty() {
        return (StatusCode::BAD_REQUEST, "Playlist name required").into_response();
    }
    let user_id = extract_user_id(&headers);
    match state
        .db_service
        .create_playlist(&payload.name, &user_id)
        .await
    {
        Ok(playlist) => (StatusCode::CREATED, Json(playlist)).into_response(),
        Err(e) => {
            error!("Failed to create playlist: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, "Failed to create playlist").into_response()
        }
    }
}

pub async fn get_user_playlists_handler(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
) -> Response {
    let user_id = extract_user_id(&headers);
    match state.db_service.get_user_playlists(&user_id).await {
        Ok(playlists) => (StatusCode::OK, Json(playlists)).into_response(),
        Err(e) => {
            error!("Failed to fetch playlists: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, "Failed to fetch playlists").into_response()
        }
    }
}

pub async fn get_playlist_handler(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
    headers: HeaderMap,
) -> Response {
    let user_id = extract_user_id(&headers);
    let playlist = match state.db_service.get_playlist_by_id(&id).await {
        Ok(Some(p)) => p,
        Ok(None) => return (StatusCode::NOT_FOUND).into_response(),
        Err(e) => {
            error!("Error fetching playlist: {}", e);
            return (StatusCode::INTERNAL_SERVER_ERROR).into_response();
        }
    };

    if playlist.user_id != user_id {
        return (StatusCode::FORBIDDEN).into_response();
    }

    let tracks = match state
        .db_service
        .get_playlist_tracks(&playlist.track_ids, &user_id)
        .await
    {
        Ok(t) => t,
        Err(_) => Vec::new(),
    };

    let response = PlaylistResponse {
        id: playlist.id,
        name: playlist.name,
        user_id: playlist.user_id,
        created_at: playlist.created_at,
        tracks,
    };

    (StatusCode::OK, Json(response)).into_response()
}

pub async fn add_track_to_playlist_handler(
    State(state): State<Arc<AppState>>,
    Path((id, track_id)): Path<(String, String)>,
    headers: HeaderMap,
) -> Response {
    let user_id = extract_user_id(&headers);
    match state
        .db_service
        .add_track_to_playlist(&id, &track_id, &user_id)
        .await
    {
        Ok(updated) => (StatusCode::OK, Json(updated)).into_response(),
        Err(e) if e.contains("Unauthorized") => (StatusCode::FORBIDDEN, e).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e).into_response(),
    }
}

pub async fn remove_track_from_playlist_handler(
    State(state): State<Arc<AppState>>,
    Path((id, track_id)): Path<(String, String)>,
    headers: HeaderMap,
) -> Response {
    let user_id = extract_user_id(&headers);
    match state
        .db_service
        .remove_track_from_playlist(&id, &track_id, &user_id)
        .await
    {
        Ok(updated) => (StatusCode::OK, Json(updated)).into_response(),
        Err(e) if e.contains("Unauthorized") => (StatusCode::FORBIDDEN, e).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e).into_response(),
    }
}

pub async fn delete_playlist_handler(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
    headers: HeaderMap,
) -> Response {
    let user_id = extract_user_id(&headers);
    match state.db_service.delete_playlist(&id, &user_id).await {
        Ok(_) => (StatusCode::NO_CONTENT).into_response(),
        Err(e) if e.contains("Unauthorized") => (StatusCode::FORBIDDEN, e).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e).into_response(),
    }
}
