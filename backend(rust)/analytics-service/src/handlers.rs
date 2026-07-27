use axum::{
    extract::State,
    http::{header, HeaderMap, StatusCode},
    response::{IntoResponse, Response},
    Json,
};
use base64::engine::general_purpose::URL_SAFE_NO_PAD;
use base64::Engine;
use serde::Deserialize;
use std::sync::Arc;
use tracing::error;

use crate::AppState;

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

pub async fn get_stats_handler(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
) -> Response {
    let user_id = extract_user_id(&headers);

    match state.db_service.get_user_stats(&user_id).await {
        Ok(stats) => (StatusCode::OK, Json(stats)).into_response(),
        Err(e) => {
            error!("Failed to fetch stats for user {}: {}", user_id, e);
            (StatusCode::INTERNAL_SERVER_ERROR, "Database error").into_response()
        }
    }
}

pub async fn get_history_handler(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
) -> Response {
    let user_id = extract_user_id(&headers);

    match state.db_service.get_playback_history(&user_id).await {
        Ok(history) => (StatusCode::OK, Json(history)).into_response(),
        Err(e) => {
            error!("Failed to fetch playback history for user {}: {}", user_id, e);
            (StatusCode::INTERNAL_SERVER_ERROR, "Database error").into_response()
        }
    }
}

pub async fn get_top_tracks_handler(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
) -> Response {
    let user_id = extract_user_id(&headers);

    match state.db_service.get_top_tracks(&user_id).await {
        Ok(top) => (StatusCode::OK, Json(top)).into_response(),
        Err(e) => {
            error!("Failed to fetch top tracks for user {}: {}", user_id, e);
            (StatusCode::INTERNAL_SERVER_ERROR, "Database error").into_response()
        }
    }
}
