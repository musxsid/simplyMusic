use std::env;

#[derive(Clone, Debug)]
pub struct Config {
    pub server_port: u16,
    pub redis_url: String,
    pub keycloak_auth_uri: String,
    pub keycloak_token_uri: String,
    pub keycloak_certs_uri: String,
    pub keycloak_client_id: String,
    pub keycloak_client_secret: String,
    pub redirect_uri: String,
    pub session_secret: String,
    pub frontend_url: String,
    
    // Downstream microservices
    pub upload_service_url: String,
    pub processing_service_url: String,
    pub streaming_service_url: String,
    pub search_service_url: String,
    pub analytics_service_url: String,
    pub enrichment_service_url: String,
}

impl Config {
    pub fn from_env() -> Self {
        let redis_password = env::var("REDIS_PASSWORD").unwrap_or_else(|_| "password".to_string());
        let default_redis_url = format!("redis://:{}@redis:6379", redis_password);

        Self {
            server_port: env::var("SERVER_PORT")
                .ok()
                .and_then(|p| p.parse().ok())
                .unwrap_or(8080),
            redis_url: env::var("REDIS_URL").unwrap_or(default_redis_url),
            keycloak_auth_uri: env::var("KEYCLOAK_AUTH_URI").unwrap_or_else(|_| {
                "http://localhost:9090/realms/simplymusic/protocol/openid-connect/auth".to_string()
            }),
            keycloak_token_uri: env::var("KEYCLOAK_TOKEN_URI").unwrap_or_else(|_| {
                "http://keycloak:8080/realms/simplymusic/protocol/openid-connect/token".to_string()
            }),
            keycloak_certs_uri: env::var("KEYCLOAK_CERTS_URI").unwrap_or_else(|_| {
                "http://keycloak:8080/realms/simplymusic/protocol/openid-connect/certs".to_string()
            }),
            keycloak_client_id: env::var("KEYCLOAK_CLIENT_ID")
                .unwrap_or_else(|_| "simplymusic-frontend".to_string()),
            keycloak_client_secret: env::var("KEYCLOAK_CLIENT_SECRET").unwrap_or_default(),
            redirect_uri: env::var("REDIRECT_URI").unwrap_or_else(|_| {
                "http://localhost:8080/login/oauth2/code/keycloak".to_string()
            }),
            session_secret: env::var("SESSION_SECRET")
                .unwrap_or_else(|_| "simplymusic-super-secret-hmac-key-2026".to_string()),
            frontend_url: env::var("FRONTEND_URL")
                .unwrap_or_else(|_| "http://localhost:5173".to_string()),

            upload_service_url: env::var("UPLOAD_SERVICE_URL")
                .unwrap_or_else(|_| "http://upload-service:8081".to_string()),
            processing_service_url: env::var("PROCESSING_SERVICE_URL")
                .unwrap_or_else(|_| "http://processing-service:8084".to_string()),
            streaming_service_url: env::var("STREAMING_SERVICE_URL")
                .unwrap_or_else(|_| "http://streaming-service:8085".to_string()),
            search_service_url: env::var("SEARCH_SERVICE_URL")
                .unwrap_or_else(|_| "http://search-service:8086".to_string()),
            analytics_service_url: env::var("ANALYTICS_SERVICE_URL")
                .unwrap_or_else(|_| "http://analytics-service:8082".to_string()),
            enrichment_service_url: env::var("ENRICHMENT_SERVICE_URL")
                .unwrap_or_else(|_| "http://enrichment-service:8083".to_string()),
        }
    }
}
