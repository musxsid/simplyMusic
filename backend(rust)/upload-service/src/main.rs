mod config;
mod db;
mod events;
mod minio;
mod upload;

use axum::{
    extract::DefaultBodyLimit,
    http::{header, Method},
    routing::{get, post},
    Router,
};
use config::Config;
use db::DbService;
use events::EventService;
use minio::MinioService;
use std::{net::SocketAddr, sync::Arc};
use tower_http::cors::{AllowOrigin, CorsLayer};
use tracing::{info, Level};
use tracing_subscriber::FmtSubscriber;
use upload::upload_handler;

#[derive(Clone)]
pub struct AppState {
    pub config: Config,
    pub minio_service: MinioService,
    pub db_service: DbService,
    pub event_service: EventService,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // 1. Initialize Logging Subscriber
    let subscriber = FmtSubscriber::builder()
        .with_max_level(Level::INFO)
        .finish();
    tracing::subscriber::set_global_default(subscriber)
        .expect("Setting default tracing subscriber failed");

    info!("Starting Rust Upload Service (simplyMusic)...");

    // 2. Load Configuration
    let config = Config::from_env();
    info!("Configuration loaded. Server listening port: {}", config.server_port);

    // 3. Initialize Services (MinIO, MongoDB, RabbitMQ)
    let minio_service = MinioService::new(&config).await;

    let db_service = DbService::new(&config)
        .await
        .expect("Failed to initialize MongoDB connection");

    let event_service = EventService::new(&config)
        .await
        .expect("Failed to initialize RabbitMQ connection");

    let app_state = Arc::new(AppState {
        config: config.clone(),
        minio_service,
        db_service,
        event_service,
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
        ])
        .allow_headers([
            header::AUTHORIZATION,
            header::CONTENT_TYPE,
            header::ACCEPT,
            header::ORIGIN,
        ])
        .allow_credentials(true);

    // 5. Build Axum Router (Setting body limit to 100MB to match Java upload limit)
    let app = Router::new()
        .route("/health", get(|| async { "OK" }))
        .route("/api/v1/music/upload", post(upload_handler))
        .layer(DefaultBodyLimit::max(100 * 1024 * 1024)) // 100MB
        .layer(cors)
        .with_state(app_state);

    // 6. Bind listener and start server
    let addr = SocketAddr::from(([0, 0, 0, 0], config.server_port));
    info!("Rust Upload Service running on http://{}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
