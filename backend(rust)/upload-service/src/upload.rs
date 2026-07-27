use axum::{
    extract::{Multipart, State},
    http::{header, HeaderMap, StatusCode},
    response::{IntoResponse, Response},
    Json,
};
use chrono::Datelike;
use mongodb::bson::DateTime;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::sync::Arc;
use tracing::{error, info};
use uuid::Uuid;

use crate::{
    db::MusicMetadataDoc,
    AppState,
};

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UploadResponse {
    pub id: String,
    pub file_hash: String,
    pub uploaded_by: String,
    pub file_url: String,
    pub title: String,
    pub artist: String,
    pub album: String,
    pub release_year: i32,
}

#[derive(Deserialize, Debug)]
struct JwtClaims {
    sub: Option<String>,
    preferred_username: Option<String>,
}

pub async fn upload_handler(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    mut multipart: Multipart,
) -> Response {
    let user_id = extract_user_id(&headers);

    let mut file_bytes: Option<Vec<u8>> = None;
    let mut file_name: Option<String> = None;
    let mut content_type: Option<String> = None;

    while let Ok(Some(field)) = multipart.next_field().await {
        let name = field.name().unwrap_or_default().to_string();
        if name == "file" {
            file_name = field.file_name().map(|s| s.to_string());
            content_type = field.content_type().map(|s| s.to_string());
            match field.bytes().await {
                Ok(bytes) => {
                    file_bytes = Some(bytes.to_vec());
                }
                Err(e) => {
                    error!("Failed to read upload multipart field bytes: {}", e);
                    return (StatusCode::BAD_REQUEST, "Failed to read uploaded file content").into_response();
                }
            }
            break;
        }
    }

    let bytes = match file_bytes {
        Some(b) => b,
        None => {
            return (StatusCode::BAD_REQUEST, "Missing 'file' field in upload request").into_response();
        }
    };

    let original_filename = file_name.unwrap_or_else(|| "track.mp3".to_string());
    let mime = content_type.unwrap_or_else(|| "audio/mpeg".to_string());

    // Basic MIME / Extension validation
    let is_audio = mime.starts_with("audio/")
        || original_filename.ends_with(".mp3")
        || original_filename.ends_with(".wav")
        || original_filename.ends_with(".flac")
        || original_filename.ends_with(".m4a")
        || original_filename.ends_with(".ogg");

    if !is_audio {
        return (
            StatusCode::BAD_REQUEST,
            "Invalid file type: Only audio files are allowed",
        )
            .into_response();
    }

    let file_hash = calculate_hash(&bytes);
    let extension = get_extension(&original_filename);
    let object_name = format!("{}.{}", Uuid::new_v4(), extension);
    let file_id = Uuid::new_v4().to_string();

    let (title, artist) = parse_title_artist(&original_filename);
    let album = format!("{} - Single", title);
    let release_year = chrono::Utc::now().year();

    info!(
        "Processing track upload: id={}, title='{}', artist='{}', hash={}",
        file_id, title, artist, file_hash
    );

    // 1. MinIO S3 Binary Upload
    if let Err(e) = state.minio_service.put_object(&object_name, bytes, &mime).await {
        error!("MinIO upload failed: {}", e);
        return (StatusCode::INTERNAL_SERVER_ERROR, "Failed to store file in object storage").into_response();
    }

    // 2. MongoDB Metadata Persistence
    let metadata_doc = MusicMetadataDoc {
        id: file_id.clone(),
        title: title.clone(),
        artist: artist.clone(),
        album: album.clone(),
        release_year,
        duration: 0.0,
        file_url: object_name.clone(),
        file_hash: file_hash.clone(),
        uploaded_by: user_id.clone(),
        created_at: DateTime::now(),
    };

    if let Err(e) = state.db_service.save_metadata(&metadata_doc).await {
        error!("MongoDB metadata save failed: {}", e);
        return (StatusCode::INTERNAL_SERVER_ERROR, "Failed to save track metadata").into_response();
    }

    // 3. RabbitMQ Asynchronous Event Publication
    let event_publisher = state.event_service.clone();
    let file_id_clone = file_id.clone();
    let user_id_clone = user_id.clone();
    let object_name_clone = object_name.clone();
    let orig_name_clone = original_filename.clone();
    let hash_clone = file_hash.clone();

    tokio::spawn(async move {
        event_publisher
            .publish_file_uploaded_event(
                &file_id_clone,
                &user_id_clone,
                &object_name_clone,
                &orig_name_clone,
                &hash_clone,
            )
            .await;
    });

    // 4. Return HTTP 201 Created Response
    let response_body = UploadResponse {
        id: file_id,
        file_hash,
        uploaded_by: user_id,
        file_url: object_name,
        title,
        artist,
        album,
        release_year,
    };

    (StatusCode::CREATED, Json(response_body)).into_response()
}

fn calculate_hash(bytes: &[u8]) -> String {
    let mut hasher = Sha256::new();
    hasher.update(bytes);
    hex::encode(hasher.finalize())
}

fn get_extension(filename: &str) -> String {
    if let Some(pos) = filename.rfind('.') {
        filename[pos + 1..].to_lowercase()
    } else {
        "mp3".to_string()
    }
}

fn parse_title_artist(filename: &str) -> (String, String) {
    let base_name = if let Some(pos) = filename.rfind('.') {
        &filename[..pos]
    } else {
        filename
    };

    if base_name.contains(" - ") {
        let parts: Vec<&str> = base_name.splitn(2, " - ").collect();
        (parts[0].trim().to_string(), parts[1].trim().to_string())
    } else {
        (base_name.trim().to_string(), "Unknown Artist".to_string())
    }
}

fn extract_user_id(headers: &HeaderMap) -> String {
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

    use base64::engine::general_purpose::URL_SAFE_NO_PAD;
    use base64::Engine;

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
