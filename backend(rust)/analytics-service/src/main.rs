mod config;
mod consumer;
mod db;
mod handlers;
mod models;

use axum::{
    http::{header, Method},
    routing::get,
    Router,
};
use config::Config;
use consumer::ConsumerService;
use db::DbService;
use handlers::{get_history_handler, get_stats_handler, get_top_tracks_handler};
use std::{net::SocketAddr, sync::Arc};
use tower_http::cors::{AllowOrigin, CorsLayer};
use tracing::{info, Level};
use tracing_subscriber::FmtSubscriber;

#[derive(Clone)]
pub struct AppState {
    pub config: Config,
    pub db_service: DbService,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // 1. Initialize Logging Subscriber
    let subscriber = FmtSubscriber::builder()
        .with_max_level(Level::INFO)
        .finish();
    tracing::subscriber::set_global_default(subscriber)
        .expect("Setting default tracing subscriber failed");

    info!("Starting Rust Analytics Service (simplyMusic)...");

    // 2. Load Configuration
    let config = Config::from_env();
    info!("Configuration loaded. Server listening port: {}", config.server_port);

    // 3. Initialize Database Service
    let db_service = DbService::new(&config)
        .await
        .expect("Failed to initialize MongoDB connection");

    let app_state = Arc::new(AppState {
        config: config.clone(),
        db_service: db_service.clone(),
    });

    // 4. Start RabbitMQ Consumer Loop in Background Task
    let consumer_service = Arc::new(ConsumerService::new(config.clone(), db_service));
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
        .allow_headers([
            header::AUTHORIZATION,
            header::CONTENT_TYPE,
            header::ACCEPT,
            header::ORIGIN,
        ])
        .allow_credentials(true);

    // 6. Build Axum Router matching Java AnalyticsController routes
    let app = Router::new()
        .route("/health", get(|| async { "OK" }))
        .route("/api/v1/analytics/stats", get(get_stats_handler))
        .route("/api/v1/analytics/history", get(get_history_handler))
        .route("/api/v1/analytics/top-tracks", get(get_top_tracks_handler))
        .layer(cors)
        .with_state(app_state);

    // 7. Bind listener and start server
    let addr = SocketAddr::from(([0, 0, 0, 0], config.server_port));
    info!("Rust Analytics Service running on http://{}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
