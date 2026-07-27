use axum::{
    extract::{Query, State},
    http::{header, HeaderMap, StatusCode},
    response::{IntoResponse, Redirect, Response},
    Json,
};
use base64::engine::general_purpose::URL_SAFE_NO_PAD;
use base64::Engine;
use cookie::Cookie;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use time::Duration;
use tracing::{error, info};

use crate::{
    config::Config,
    session::{SessionData, SessionManager},
};

#[derive(Clone)]
pub struct AppState {
    pub config: Config,
    pub session_manager: SessionManager,
    pub http_client: reqwest::Client,
    pub rate_limiter: crate::rate_limiter::RateLimiter,
}

#[derive(Deserialize)]
pub struct CallbackQuery {
    pub code: Option<String>,
    pub error: Option<String>,
    pub error_description: Option<String>,
}

#[derive(Deserialize, Debug)]
pub struct KeycloakTokenResponse {
    pub access_token: String,
    pub refresh_token: Option<String>,
    pub expires_in: u64,
    pub token_type: String,
}

#[derive(Serialize)]
pub struct UserMeResponse {
    pub authenticated: bool,
    pub user: Option<serde_json::Value>,
}

/// Initiates OAuth2 flow by redirecting the client to Keycloak authorization endpoint
pub async fn login_handler(State(state): State<Arc<AppState>>) -> impl IntoResponse {
    let auth_url = format!(
        "{}?client_id={}&response_type=code&scope=openid%20profile%20email&redirect_uri={}",
        state.config.keycloak_auth_uri,
        state.config.keycloak_client_id,
        urlencoding::encode(&state.config.redirect_uri)
    );

    info!("Redirecting login request to Keycloak: {}", auth_url);
    Redirect::to(&auth_url)
}

/// Handles OAuth2 callback from Keycloak, exchanges auth code for JWT, stores in Redis, sets HttpOnly cookie
pub async fn callback_handler(
    State(state): State<Arc<AppState>>,
    Query(query): Query<CallbackQuery>,
) -> Response {
    if let Some(err) = query.error {
        let desc = query.error_description.unwrap_or_default();
        error!("OAuth2 callback error: {} - {}", err, desc);
        return (
            StatusCode::BAD_REQUEST,
            format!("OAuth2 Authentication Error: {}", err),
        )
            .into_response();
    }

    let code = match query.code {
        Some(c) => c,
        None => {
            return (
                StatusCode::BAD_REQUEST,
                "Missing authorization code in callback",
            )
                .into_response();
        }
    };

    info!("Received authorization code from Keycloak, exchanging for tokens...");

    // Exchange authorization code for token with Keycloak
    let params = [
        ("grant_type", "authorization_code"),
        ("client_id", &state.config.keycloak_client_id),
        ("code", &code),
        ("redirect_uri", &state.config.redirect_uri),
    ];

    let req = if !state.config.keycloak_client_secret.is_empty() {
        state
            .http_client
            .post(&state.config.keycloak_token_uri)
            .form(&params)
            .basic_auth(
                &state.config.keycloak_client_id,
                Some(&state.config.keycloak_client_secret),
            )
    } else {
        state
            .http_client
            .post(&state.config.keycloak_token_uri)
            .form(&params)
    };

    let token_res = match req.send().await {
        Ok(res) => res,
        Err(e) => {
            error!("Failed to contact Keycloak token endpoint: {}", e);
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                "Failed to contact identity provider",
            )
                .into_response();
        }
    };

    if !token_res.status().is_success() {
        let status = token_res.status();
        let body = token_res.text().await.unwrap_or_default();
        error!(
            "Keycloak token endpoint error. Status: {}, Body: {}",
            status, body
        );
        return (
            StatusCode::UNAUTHORIZED,
            format!("Token exchange failed: {}", body),
        )
            .into_response();
    }

    let token_data: KeycloakTokenResponse = match token_res.json().await {
        Ok(t) => t,
        Err(e) => {
            error!("Failed to parse token response JSON: {}", e);
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                "Invalid response from identity provider",
            )
                .into_response();
        }
    };

    // Parse user claims from JWT payload
    let user_info = parse_jwt_claims(&token_data.access_token);

    // Store in Redis & Issue signed Session Cookie
    let (raw_session_id, signed_cookie_val) = state.session_manager.create_signed_session_id();

    let session_data = SessionData {
        access_token: token_data.access_token,
        refresh_token: token_data.refresh_token,
        token_type: token_data.token_type,
        expires_in: token_data.expires_in,
        user_info,
    };

    if let Err(e) = state
        .session_manager
        .save_session(&raw_session_id, &session_data)
        .await
    {
        error!("Failed to persist session to Redis: {}", e);
        return (
            StatusCode::INTERNAL_SERVER_ERROR,
            "Failed to save session state",
        )
            .into_response();
    }

    // Build HttpOnly, Secure Session Cookie
    let cookie = Cookie::build(("SESSION_ID", signed_cookie_val))
        .path("/")
        .http_only(true)
        .same_site(cookie::SameSite::Lax)
        .max_age(Duration::seconds(86400))
        .build();

    let mut response = Redirect::to(&state.config.frontend_url).into_response();
    response.headers_mut().insert(
        header::SET_COOKIE,
        header::HeaderValue::from_str(&cookie.to_string()).unwrap(),
    );

    info!("Session created successfully for ID: {}. Redirecting to frontend.", raw_session_id);
    response
}

/// User details endpoint matching exact Java Spring Cloud Gateway /api/v1/user payload
pub async fn user_handler(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
) -> Response {
    let raw_session_id = match extract_signed_session(&headers, &state.session_manager) {
        Some(id) => id,
        None => {
            return (
                StatusCode::UNAUTHORIZED,
                Json(serde_json::json!({})),
            )
                .into_response();
        }
    };

    match state.session_manager.get_session(&raw_session_id).await {
        Some(session) => {
            let info = session.user_info.unwrap_or_else(|| {
                parse_jwt_claims(&session.access_token)
                    .unwrap_or_else(|| serde_json::json!({"preferred_username": "User"}))
            });
            (StatusCode::OK, Json(info)).into_response()
        }
        None => (
            StatusCode::UNAUTHORIZED,
            Json(serde_json::json!({})),
        )
            .into_response(),
    }
}

/// Returns current session status & user details if authenticated
pub async fn me_handler(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let raw_session_id = match extract_signed_session(&headers, &state.session_manager) {
        Some(id) => id,
        None => {
            return (
                StatusCode::UNAUTHORIZED,
                Json(UserMeResponse {
                    authenticated: false,
                    user: None,
                }),
            )
                .into_response();
        }
    };

    match state.session_manager.get_session(&raw_session_id).await {
        Some(session) => (
            StatusCode::OK,
            Json(UserMeResponse {
                authenticated: true,
                user: session.user_info.or_else(|| parse_jwt_claims(&session.access_token)),
            }),
        )
            .into_response(),
        None => (
            StatusCode::UNAUTHORIZED,
            Json(UserMeResponse {
                authenticated: false,
                user: None,
            }),
        )
            .into_response(),
    }
}

/// Destroys session in Redis and clears HttpOnly session cookie
pub async fn logout_handler(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
) -> impl IntoResponse {
    if let Some(raw_session_id) = extract_signed_session(&headers, &state.session_manager) {
        let _ = state.session_manager.delete_session(&raw_session_id).await;
    }

    let cookie = Cookie::build(("SESSION_ID", ""))
        .path("/")
        .http_only(true)
        .max_age(Duration::seconds(0))
        .build();

    let mut response = Redirect::to(&state.config.frontend_url).into_response();
    response.headers_mut().insert(
        header::SET_COOKIE,
        header::HeaderValue::from_str(&cookie.to_string()).unwrap(),
    );

    response
}

/// Utility function to extract and verify session cookie header
pub fn extract_signed_session(headers: &HeaderMap, session_manager: &SessionManager) -> Option<String> {
    let cookie_header = headers.get(header::COOKIE)?.to_str().ok()?;
    for c in Cookie::split_parse(cookie_header) {
        if let Ok(cookie) = c {
            if cookie.name() == "SESSION_ID" {
                return session_manager.verify_signed_session_id(cookie.value());
            }
        }
    }
    None
}

/// Decodes base64 JWT payload to extract Keycloak user profile attributes (name, preferred_username, email, sub)
pub fn parse_jwt_claims(access_token: &str) -> Option<serde_json::Value> {
    let parts: Vec<&str> = access_token.split('.').collect();
    if parts.len() < 2 {
        return None;
    }
    let payload = parts[1];
    let padded = match payload.len() % 4 {
        2 => format!("{}==", payload),
        3 => format!("{}=", payload),
        _ => payload.to_string(),
    };

    let decoded = URL_SAFE_NO_PAD
        .decode(&padded)
        .or_else(|_| URL_SAFE_NO_PAD.decode(payload))
        .ok()?;

    let claims: serde_json::Value = serde_json::from_slice(&decoded).ok()?;

    let mut user_map = serde_json::Map::new();
    let name = claims.get("name").cloned().unwrap_or(serde_json::Value::Null);
    let preferred_username = claims
        .get("preferred_username")
        .cloned()
        .or_else(|| claims.get("name").cloned())
        .or_else(|| claims.get("sub").cloned())
        .unwrap_or(serde_json::Value::Null);
    let email = claims.get("email").cloned().unwrap_or(serde_json::Value::Null);
    let sub = claims.get("sub").cloned().unwrap_or(serde_json::Value::Null);

    user_map.insert("name".to_string(), name);
    user_map.insert("preferred_username".to_string(), preferred_username);
    user_map.insert("email".to_string(), email);
    user_map.insert("sub".to_string(), sub);

    Some(serde_json::Value::Object(user_map))
}
