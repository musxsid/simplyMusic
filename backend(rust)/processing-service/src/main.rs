mod config;
mod consumer;
mod db;
mod minio;
mod parser;

use axum::{
    http::{header, Method},
    routing::get,
    Router,
};
use config::Config;
use consumer::ConsumerService;
use db::DbService;
use minio::MinioService;
use std::{net::SocketAddr, sync::Arc};
use tower_http::cors::{AllowOrigin, CorsLayer};
use tracing::{info, Level};
use tracing_subscriber::FmtSubscriber;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // 1. Initialize Logging Subscriber
    let subscriber = FmtSubscriber::builder()
        .with_max_level(Level::INFO)
        .finish();
    tracing::subscriber::set_global_default(subscriber)
        .expect("Setting default tracing subscriber failed");

    info!("Starting Rust Processing Service (simplyMusic)...");

    // 2. Load Configuration
    let config = Config::from_env();
    info!("Configuration loaded. Server listening port: {}", config.server_port);

    // 3. Initialize Database and Object Storage Services
    let db_service = DbService::new(&config)
        .await
        .expect("Failed to initialize MongoDB connection");

    let minio_service = MinioService::new(&config).await;

    // 4. Start RabbitMQ Consumer Loop in Background Task
    let consumer_service = Arc::new(ConsumerService::new(
        config.clone(),
        db_service.clone(),
        minio_service.clone(),
    ));

    tokio::spawn(async move {
        consumer_service.start_consumer_loop().await;
    });

    // 5. Configure CORS
    let cors = CorsLayer::new()
        .allow_origin(AllowOrigin::predicate(|origin: &header::HeaderValue, _| {
            let s = origin.to_str().unwrap_or("");
            s.starts_with("http://localhost:") || s.starts_with("http://127.0.0.1:")
        }))
        .allow_methods([Method::GET, Method::POST, Method::OPTIONS])
        .allow_headers([header::AUTHORIZATION, header::CONTENT_TYPE])
        .allow_credentials(true);

    // 6. Build Axum Router with Health Endpoint
    let app = Router::new()
        .route("/health", get(|| async { "OK" }))
        .layer(cors);

    // 7. Bind Listener and start server
    let addr = SocketAddr::from(([0, 0, 0, 0], config.server_port));
    info!("Rust Processing Service running on http://{}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
