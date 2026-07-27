use hmac::{Hmac, Mac};
use redis::AsyncCommands;
use serde::{Deserialize, Serialize};
use sha2::Sha256;
use tracing::{error, info};
use uuid::Uuid;

type HmacSha256 = Hmac<Sha256>;

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct SessionData {
    pub access_token: String,
    pub refresh_token: Option<String>,
    pub token_type: String,
    pub expires_in: u64,
    pub user_info: Option<serde_json::Value>,
}

#[derive(Clone)]
pub struct SessionManager {
    redis_client: redis::Client,
    secret: String,
}

impl SessionManager {
    pub fn new(redis_url: &str, secret: &str) -> Result<Self, redis::RedisError> {
        let redis_client = redis::Client::open(redis_url)?;
        Ok(Self {
            redis_client,
            secret: secret.to_string(),
        })
    }

    /// Generates a new UUID session ID, cryptographically signs it with HMAC-SHA256.
    /// Returns (raw_session_id, signed_cookie_value)
    pub fn create_signed_session_id(&self) -> (String, String) {
        let raw_id = Uuid::new_v4().to_string();
        let signature = self.sign_string(&raw_id);
        let signed_value = format!("{}.{}", raw_id, signature);
        (raw_id, signed_value)
    }

    /// Verifies the HMAC-SHA256 signature of a signed cookie value.
    /// Returns Some(raw_session_id) if valid, None if invalid/tampered.
    pub fn verify_signed_session_id(&self, signed_value: &str) -> Option<String> {
        let parts: Vec<&str> = signed_value.split('.').collect();
        if parts.len() != 2 {
            return None;
        }

        let raw_id = parts[0];
        let signature = parts[1];
        let expected_signature = self.sign_string(raw_id);

        if signature == expected_signature {
            Some(raw_id.to_string())
        } else {
            error!("Session ID signature mismatch for candidate ID: {}", raw_id);
            None
        }
    }

    fn sign_string(&self, data: &str) -> String {
        let mut mac = HmacSha256::new_from_slice(self.secret.as_bytes())
            .expect("HMAC initialization with secret failed");
        mac.update(data.as_bytes());
        let result = mac.finalize();
        hex::encode(result.into_bytes())
    }

    /// Saves session data into Redis with a 24-hour TTL.
    pub async fn save_session(
        &self,
        raw_session_id: &str,
        session_data: &SessionData,
    ) -> Result<(), redis::RedisError> {
        let mut conn = self.redis_client.get_multiplexed_tokio_connection().await?;
        let redis_key = format!("session:{}", raw_session_id);
        let json_payload = serde_json::to_string(session_data).map_err(|e| {
            redis::RedisError::from((
                redis::ErrorKind::TypeError,
                "Serialization failed",
                e.to_string(),
            ))
        })?;

        let ttl_seconds: u64 = 86400; // 24 hours
        conn.set_ex::<_, _, ()>(&redis_key, json_payload, ttl_seconds).await?;
        info!("Saved session {} to Redis (TTL: {}s)", raw_session_id, ttl_seconds);
        Ok(())
    }

    /// Fetches session data from Redis.
    pub async fn get_session(&self, raw_session_id: &str) -> Option<SessionData> {
        let mut conn = match self.redis_client.get_multiplexed_tokio_connection().await {
            Ok(c) => c,
            Err(e) => {
                error!("Redis connection error: {}", e);
                return None;
            }
        };

        let redis_key = format!("session:{}", raw_session_id);
        let result: Result<Option<String>, _> = conn.get(&redis_key).await;

        match result {
            Ok(Some(json_str)) => match serde_json::from_str::<SessionData>(&json_str) {
                Ok(data) => Some(data),
                Err(e) => {
                    error!("Failed to parse session JSON: {}", e);
                    None
                }
            },
            Ok(None) => None,
            Err(e) => {
                error!("Error reading session from Redis: {}", e);
                None
            }
        }
    }

    /// Deletes a session from Redis.
    pub async fn delete_session(&self, raw_session_id: &str) -> Result<(), redis::RedisError> {
        let mut conn = self.redis_client.get_multiplexed_tokio_connection().await?;
        let redis_key = format!("session:{}", raw_session_id);
        conn.del::<_, ()>(&redis_key).await?;
        info!("Deleted session {} from Redis", raw_session_id);
        Ok(())
    }
}
