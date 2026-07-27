use std::env;

#[derive(Clone, Debug)]
pub struct Config {
    pub server_port: u16,
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

        Self {
            server_port: env::var("SERVER_PORT")
                .or_else(|_| env::var("PORT"))
                .ok()
                .and_then(|p| p.parse().ok())
                .unwrap_or(8082),
            mongodb_uri: env::var("SPRING_DATA_MONGODB_URI")
                .or_else(|_| env::var("MONGODB_URI"))
                .unwrap_or(default_mongo_uri),
            rabbitmq_url: env::var("RABBITMQ_URL").unwrap_or(default_rabbit_url),
        }
    }
}
