mod config;
mod db;
mod events;
mod handlers;
mod minio;
mod models;

use axum::{
    http::{header, Method},
    routing::{delete, get, post},
    Router,
};
use config::Config;
use db::DbService;
use events::EventService;
use handlers::{
    add_favourite_handler, add_track_to_playlist_handler, create_playlist_handler,
    delete_playlist_handler, delete_track_handler, featured_track_handler,
    get_favourites_handler, get_playlist_handler, get_user_playlists_handler,
    recent_tracks_handler, remove_favourite_handler, remove_track_from_playlist_handler,
    search_music_handler,
};
use minio::MinioService;
use std::{net::SocketAddr, sync::Arc};
use tower_http::cors::{AllowOrigin, CorsLayer};
use tracing::{info, Level};
use tracing_subscriber::FmtSubscriber;

#[derive(Clone)]
pub struct AppState {
    pub config: Config,
    pub db_service: DbService,
    pub minio_service: MinioService,
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

    info!("Starting Rust Search & Catalog Service (simplyMusic)...");

    // 2. Load Configuration
    let config = Config::from_env();
    info!("Configuration loaded. Server listening port: {}", config.server_port);

    // 3. Initialize Database, Object Storage & Event Publisher Services
    let db_service = DbService::new(&config)
        .await
        .expect("Failed to initialize MongoDB connection");

    let minio_service = MinioService::new(&config).await;

    let event_service = EventService::new(&config)
        .await
        .expect("Failed to initialize RabbitMQ connection");

    let app_state = Arc::new(AppState {
        config: config.clone(),
        db_service,
        minio_service,
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

    // 5. Build Axum Router matching exact Java MusicController & PlaylistController routes
    let app = Router::new()
        .route("/health", get(|| async { "OK" }))
        // Track Search & Catalog Routes
        .route("/api/v1/music/search", get(search_music_handler))
        .route("/api/v1/music", get(search_music_handler))
        .route("/api/v1/music/recent", get(recent_tracks_handler))
        .route("/api/v1/music/featured", get(featured_track_handler))
        .route("/api/v1/music/:id", delete(delete_track_handler))
        // Favourites Routes
        .route("/api/v1/music/favourites", get(get_favourites_handler))
        .route(
            "/api/v1/music/:id/favourite",
            post(add_favourite_handler).delete(remove_favourite_handler),
        )
        // Playlist Routes
        .route(
            "/api/v1/music/playlists",
            get(get_user_playlists_handler).post(create_playlist_handler),
        )
        .route(
            "/api/v1/music/playlists/:id",
            get(get_playlist_handler).delete(delete_playlist_handler),
        )
        .route(
            "/api/v1/music/playlists/:id/tracks/:trackId",
            post(add_track_to_playlist_handler).delete(remove_track_from_playlist_handler),
        )
        .layer(cors)
        .with_state(app_state);

    // 6. Bind listener and start server
    let addr = SocketAddr::from(([0, 0, 0, 0], config.server_port));
    info!("Rust Search Service running on http://{}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
