use std::env;

#[derive(Clone, Debug)]
pub struct Config {
    pub server_port: u16,
    pub minio_url: String,
    pub minio_root_user: String,
    pub minio_root_password: String,
    pub minio_bucket: String,
    pub mongodb_uri: String,
    pub rabbitmq_url: String,
}

impl Config {
    pub fn from_env() -> Self {
        let mongo_pass = env::var("MONGO_INITDB_ROOT_PASSWORD").unwrap_or_else(|_| "mongopass".to_string());
        let default_mongo_uri = format!(
            "mongodb://admin:{}@mongodb:27017/simplymusic?authSource=admin",
            mongo_pass
        );

        let rabbit_host = env::var("SPRING_RABBITMQ_HOST").unwrap_or_else(|_| "rabbitmq".to_string());
        let default_rabbit_url = format!("amqp://guest:guest@{}:5672", rabbit_host);

        let minio_url = env::var("MINIO_URL")
            .or_else(|_| env::var("MINIO_ENDPOINT"))
            .unwrap_or_else(|_| "http://minio:9000".to_string());

        Self {
            server_port: env::var("SERVER_PORT")
                .or_else(|_| env::var("PORT"))
                .ok()
                .and_then(|p| p.parse().ok())
                .unwrap_or(8081),
            minio_url,
            minio_root_user: env::var("MINIO_ROOT_USER").unwrap_or_else(|_| "admin".to_string()),
            minio_root_password: env::var("MINIO_ROOT_PASSWORD")
                .unwrap_or_else(|_| "password123".to_string()),
            minio_bucket: env::var("MINIO_BUCKET").unwrap_or_else(|_| "music".to_string()),
            mongodb_uri: env::var("SPRING_DATA_MONGODB_URI")
                .or_else(|_| env::var("MONGODB_URI"))
                .unwrap_or(default_mongo_uri),
            rabbitmq_url: env::var("RABBITMQ_URL").unwrap_or(default_rabbit_url),
        }
    }
}
