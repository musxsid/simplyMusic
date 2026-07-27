use axum::{
    body::Body,
    extract::{Request, State},
    http::{header, StatusCode},
    response::{IntoResponse, Response},
};
use std::sync::Arc;
use tracing::{error, info};

use crate::auth::{extract_signed_session, AppState};

/// Routes incoming HTTP requests to downstream microservices, attaching Bearer token from Redis session.
pub async fn proxy_handler(
    State(state): State<Arc<AppState>>,
    req: Request,
) -> Response {
    let path = req.uri().path().to_string();
    let query = req.uri().query().map(|q| format!("?{}", q)).unwrap_or_default();

    // 1. Authenticate via Session Cookie & Redis
    let raw_session_id = match extract_signed_session(req.headers(), &state.session_manager) {
        Some(id) => id,
        None => {
            info!("Unauthorized proxy request to path: {}", path);
            return (
                StatusCode::UNAUTHORIZED,
                "Authentication required. No valid session cookie found.",
            )
                .into_response();
        }
    };

    let session = match state.session_manager.get_session(&raw_session_id).await {
        Some(s) => s,
        None => {
            info!("Session expired or not found in Redis for ID: {}", raw_session_id);
            return (
                StatusCode::UNAUTHORIZED,
                "Session expired or invalid.",
            )
                .into_response();
        }
    };

    // 2. Determine target microservice downstream URL based on path pattern
    let target_base_url = resolve_downstream_url(&path, &state.config);
    let target_url = format!("{}{}{}", target_base_url, path, query);

    info!("Proxying request: {} -> {}", path, target_url);

    // 3. Build HTTP request to downstream service with Bearer Token Relay
    let method = req.method().clone();
    let mut client_req = state.http_client.request(method, &target_url);

    // Forward original request headers (excluding Host and Cookie for downstream isolation)
    for (key, val) in req.headers() {
        if key != header::HOST && key != header::COOKIE {
            client_req = client_req.header(key, val);
        }
    }

    // Attach Bearer JWT Token downstream
    let bearer_value = format!("Bearer {}", session.access_token);
    client_req = client_req.header(header::AUTHORIZATION, bearer_value);

    // Convert request body to stream and attach
    let body_stream = req.into_body().into_data_stream();
    let body = reqwest::Body::wrap_stream(body_stream);
    client_req = client_req.body(body);

    // 4. Send request to downstream microservice
    let downstream_res = match client_req.send().await {
        Ok(res) => res,
        Err(e) => {
            error!("Error communicating with downstream service at {}: {}", target_url, e);
            return (
                StatusCode::BAD_GATEWAY,
                format!("Downstream service unavailable: {}", e),
            )
                .into_response();
        }
    };

    // 5. Transform reqwest response into Axum Response with streaming body
    let status = downstream_res.status();
    let mut response_builder = Response::builder().status(status);

    // Copy response headers back to client
    if let Some(headers_mut) = response_builder.headers_mut() {
        for (key, val) in downstream_res.headers() {
            headers_mut.insert(key.clone(), val.clone());
        }
    }

    let stream = downstream_res.bytes_stream();
    let body = Body::from_stream(stream);

    match response_builder.body(body) {
        Ok(res) => res,
        Err(e) => {
            error!("Failed to construct proxy response: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, "Proxy response error").into_response()
        }
    }
}

/// Resolves path pattern to target microservice base URL
fn resolve_downstream_url<'a>(path: &str, config: &'a crate::config::Config) -> &'a str {
    if path.starts_with("/api/v1/music/upload") {
        &config.upload_service_url
    } else if path.starts_with("/api/v1/music/stream") {
        &config.streaming_service_url
    } else if path.starts_with("/api/v1/analytics") {
        &config.analytics_service_url
    } else if path.starts_with("/api/v1/enrichment") {
        &config.enrichment_service_url
    } else if path.starts_with("/api/v1/processing") {
        &config.processing_service_url
    } else if path.starts_with("/api/v1/music") {
        &config.search_service_url
    } else {
        // Default search/core service
        &config.search_service_url
    }
}
