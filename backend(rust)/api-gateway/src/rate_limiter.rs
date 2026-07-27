use axum::{
    extract::{Request, State},
    http::{header, StatusCode},
    middleware::Next,
    response::{IntoResponse, Response},
};
use std::{
    collections::HashMap,
    sync::Arc,
    time::{Duration, Instant},
};
use tokio::sync::Mutex;
use tracing::warn;

use crate::auth::{extract_signed_session, AppState};

/// Token Bucket State for a single key (User ID / Session ID / Client IP)
struct TokenBucket {
    tokens: f64,
    last_updated: Instant,
}

/// Token Bucket Rate Limiter matching Java Spring Cloud Gateway RequestRateLimiter
/// - Replenish Rate: 10 tokens / sec
/// - Burst Capacity: 20 tokens (max bucket size)
#[derive(Clone)]
pub struct RateLimiter {
    buckets: Arc<Mutex<HashMap<String, TokenBucket>>>,
    burst_capacity: f64,
    replenish_rate: f64, // tokens per second
}

impl RateLimiter {
    pub fn new(burst_capacity: f64, replenish_rate: f64) -> Self {
        Self {
            buckets: Arc::new(Mutex::new(HashMap::new())),
            burst_capacity,
            replenish_rate,
        }
    }

    /// Attempts to consume 1 token for the specified key.
    /// Returns (allowed: bool, remaining_tokens: i64)
    pub async fn check_rate_limit(&self, key: &str) -> (bool, i64) {
        let mut buckets = self.buckets.lock().await;
        let now = Instant::now();

        // Cleanup stale buckets older than 60 seconds to prevent unbounded memory growth
        buckets.retain(|_, b| now.duration_since(b.last_updated) < Duration::from_secs(60));

        let burst_capacity = self.burst_capacity;
        let bucket = buckets.entry(key.to_string()).or_insert_with(|| TokenBucket {
            tokens: burst_capacity,
            last_updated: now,
        });

        // Calculate elapsed time in seconds and replenish tokens
        let elapsed = now.duration_since(bucket.last_updated).as_secs_f64();
        bucket.tokens = (bucket.tokens + elapsed * self.replenish_rate).min(self.burst_capacity);
        bucket.last_updated = now;

        if bucket.tokens >= 1.0 {
            bucket.tokens -= 1.0;
            let remaining = bucket.tokens.floor() as i64;
            (true, remaining)
        } else {
            let remaining = bucket.tokens.floor() as i64;
            (false, remaining)
        }
    }
}

/// Axum Middleware to enforce Rate Limiting per User / Session / IP key
pub async fn rate_limit_middleware(
    State(state): State<Arc<AppState>>,
    req: Request,
    next: Next,
) -> Response {
    // 1. Resolve rate limiter key matching Java userKeyResolver logic
    let key = if let Some(session_id) = extract_signed_session(req.headers(), &state.session_manager) {
        if let Some(session) = state.session_manager.get_session(&session_id).await {
            let user_name = session
                .user_info
                .as_ref()
                .and_then(|info| info.get("preferred_username").or_else(|| info.get("sub")))
                .and_then(|v| v.as_str())
                .unwrap_or("User");
            format!("user:{}", user_name)
        } else {
            format!("session:{}", session_id)
        }
    } else if let Some(ip) = req
        .headers()
        .get("x-forwarded-for")
        .or_else(|| req.headers().get("x-real-ip"))
        .and_then(|h| h.to_str().ok())
    {
        format!("ip:{}", ip.split(',').next().unwrap_or(ip).trim())
    } else {
        "anonymous".to_string()
    };

    // 2. Check rate limit against token bucket
    let (allowed, remaining) = state.rate_limiter.check_rate_limit(&key).await;

    if !allowed {
        warn!("Rate limit exceeded (HTTP 429) for key '{}'", key);
        return (
            StatusCode::TOO_MANY_REQUESTS,
            [
                (header::CONTENT_TYPE, header::HeaderValue::from_static("application/json")),
                (header::HeaderName::from_static("x-ratelimit-limit"), header::HeaderValue::from_static("20")),
                (header::HeaderName::from_static("x-ratelimit-remaining"), header::HeaderValue::from_static("0")),
            ],
            r#"{"error":"Too Many Requests","message":"Rate limit exceeded. Bucket size is 20 tokens, replenishing at 10 tokens/sec."}"#,
        )
            .into_response();
    }

    // 3. Process request and attach standard X-RateLimit headers
    let mut response = next.run(req).await;
    let headers = response.headers_mut();
    headers.insert("X-RateLimit-Limit", "20".parse().unwrap());
    headers.insert("X-RateLimit-Remaining", remaining.to_string().parse().unwrap());
    response
}
