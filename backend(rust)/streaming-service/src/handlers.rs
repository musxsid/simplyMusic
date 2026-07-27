use axum::{
    extract::{Path, State},
    http::{header, HeaderMap, StatusCode},
    response::{IntoResponse, Response},
    Json,
};
use base64::engine::general_purpose::URL_SAFE_NO_PAD;
use base64::Engine;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tracing::error;

use crate::AppState;

#[derive(Serialize)]
pub struct StreamUrlResponse {
    pub url: String,
}

#[derive(Deserialize, Debug)]
struct JwtClaims {
    sub: Option<String>,
    preferred_username: Option<String>,
}

pub fn extract_user_id(headers: &HeaderMap) -> String {
    if let Some(h) = headers.get("x-user-id").or_else(|| headers.get("X-User-Id")) {
        if let Ok(s) = h.to_str() {
            if !s.trim().is_empty() {
                return s.trim().to_string();
            }
        }
    }

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

/// Returns streaming URL for track ID & publishes TRACK_PLAYED event to RabbitMQ
pub async fn get_stream_url_handler(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
    headers: HeaderMap,
) -> Response {
    let user_id = extract_user_id(&headers);

    let track = match state.db_service.get_track_by_id(&id).await {
        Ok(Some(t)) => t,
        Ok(None) => return (StatusCode::NOT_FOUND, "Track not found").into_response(),
        Err(e) => {
            error!("Error querying track metadata: {}", e);
            return (StatusCode::INTERNAL_SERVER_ERROR, "Database error").into_response();
        }
    };

    // Direct MongoDB persistence for guaranteed real-time stream tracking
    let db_service = state.db_service.clone();
    let track_id = track.id.clone();
    let uid = user_id.clone();
    tokio::spawn(async move {
        let _ = db_service.record_play_activity(&track_id, &uid).await;
    });

    // Publish TRACK_PLAYED event asynchronously to RabbitMQ
    let event_publisher = state.event_service.clone();
    let track_id_event = track.id.clone();
    let uid_event = user_id.clone();
    tokio::spawn(async move {
        event_publisher.publish_track_played(&track_id_event, &uid_event).await;
    });

    let stream_url = state.minio_service.get_external_stream_url(&track.file_url);

    (StatusCode::OK, Json(StreamUrlResponse { url: stream_url })).into_response()
}

/// Streams raw audio binary out of MinIO with HTTP Range headers (bytes=start-end)
pub async fn stream_binary_handler(
    State(state): State<Arc<AppState>>,
    Path(file_name): Path<String>,
    headers: HeaderMap,
) -> Response {
    let range_header = headers
        .get(header::RANGE)
        .and_then(|h| h.to_str().ok());

    match state
        .minio_service
        .get_object_range(&file_name, range_header)
        .await
    {
        Ok((body, res_headers, status)) => (status, res_headers, body).into_response(),
        Err(e) => {
            error!("Failed to stream audio file '{}': {}", file_name, e);
            (StatusCode::NOT_FOUND, "Audio file not found").into_response()
        }
    }
}
