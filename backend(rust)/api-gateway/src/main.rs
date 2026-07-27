mod auth;
mod config;
mod proxy;
mod rate_limiter;
mod session;

use axum::{
    http::{header, Method},
    middleware,
    routing::{any, get},
    Router,
};
use config::Config;
use rate_limiter::RateLimiter;
use session::SessionManager;
use std::{net::SocketAddr, sync::Arc};
use tower_http::cors::{AllowOrigin, CorsLayer};
use tracing::{info, Level};
use tracing_subscriber::FmtSubscriber;

use auth::{callback_handler, login_handler, logout_handler, me_handler, user_handler, AppState};
use proxy::proxy_handler;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // 1. Initialize logging subscriber
    let subscriber = FmtSubscriber::builder()
        .with_max_level(Level::INFO)
        .finish();
    tracing::subscriber::set_global_default(subscriber)
        .expect("Setting default tracing subscriber failed");

    info!("Starting Rust API Gateway (simplyMusic)...");

    // 2. Load Configuration
    let config = Config::from_env();
    info!("Configuration loaded. Listening port: {}", config.server_port);
    info!("Redis connection endpoint: {}", config.redis_url);

    // 3. Initialize Session Manager (Redis connection) & Token Bucket Rate Limiter
    let session_manager = SessionManager::new(&config.redis_url, &config.session_secret)
        .expect("Failed to initialize Redis Session Manager");

    let http_client = reqwest::Client::builder()
        .redirect(reqwest::redirect::Policy::none())
        .build()
        .expect("Failed to create HTTP client");

    // Token Bucket Rate Limiter matching Java Spring Cloud Gateway RequestRateLimiter
    // Burst Capacity: 20 tokens, Replenish Rate: 10 tokens/sec
    let rate_limiter = RateLimiter::new(20.0, 10.0);

    let app_state = Arc::new(AppState {
        config: config.clone(),
        session_manager,
        http_client,
        rate_limiter,
    });

    // 4. Configure CORS
    let cors = CorsLayer::new()
        .allow_origin(AllowOrigin::predicate(|origin: &header::HeaderValue, _| {
            let s = origin.to_str().unwrap_or("");
            s.starts_with("http://localhost:") || s.starts_with("http://127.0.0.1:")
        }))
        .allow_methods([
            Method::GET,
            Method::POST,
            Method::PUT,
            Method::DELETE,
            Method::OPTIONS,
            Method::PATCH,
        ])
        .allow_headers([
            header::AUTHORIZATION,
            header::CONTENT_TYPE,
            header::ACCEPT,
            header::ORIGIN,
            header::COOKIE,
        ])
        .allow_credentials(true);

    // 5. Build Axum Router matching exact Java Spring Cloud Gateway & Security paths
    let app = Router::new()
        .route("/health", get(|| async { "OK" }))
        // OAuth2 Security & Login Endpoints (matching Spring Security OAuth2 Client)
        .route("/oauth2/authorization/keycloak", get(login_handler))
        .route("/api/auth/login", get(login_handler))
        // OAuth2 Callback / Redirect Endpoint
        .route("/login/oauth2/code/keycloak", get(callback_handler))
        .route("/api/auth/callback", get(callback_handler))
        // User Info Endpoints matching Java UserController (@RequestMapping("/api/v1/user"))
        .route("/api/v1/user", get(user_handler))
        .route("/user", get(user_handler))
        .route("/api/user", get(user_handler))
        .route("/api/auth/me", get(me_handler))
        // Logout Endpoints
        .route("/logout", get(logout_handler).post(logout_handler))
        .route("/api/auth/logout", get(logout_handler).post(logout_handler))
        // Downstream Reverse Proxy Fallback for API Microservices
        .route("/api/*path", any(proxy_handler))
        .layer(middleware::from_fn_with_state(
            app_state.clone(),
            rate_limiter::rate_limit_middleware,
        ))
        .layer(cors)
        .with_state(app_state);

    // 6. Bind listener and start server
    let addr = SocketAddr::from(([0, 0, 0, 0], config.server_port));
    info!("Rust API Gateway running on http://{}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
