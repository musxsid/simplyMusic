use aws_config::BehaviorVersion;
use aws_sdk_s3::{
    config::{Credentials, Region},
    Client,
};
use tracing::info;
use crate::config::Config;

#[derive(Clone)]
pub struct MinioService {
    client: Client,
    bucket: String,
}

impl MinioService {
    pub async fn new(config: &Config) -> Self {
        let creds = Credentials::new(
            &config.minio_root_user,
            &config.minio_root_password,
            None,
            None,
            "minio-provider",
        );

        let s3_config = aws_sdk_s3::config::Builder::new()
            .behavior_version(BehaviorVersion::latest())
            .endpoint_url(&config.minio_url)
            .region(Region::new("us-east-1"))
            .credentials_provider(creds)
            .force_path_style(true)
            .build();

        let client = Client::from_conf(s3_config);
        Self {
            client,
            bucket: config.minio_bucket.clone(),
        }
    }

    pub async fn get_object_bytes(&self, object_name: &str) -> Result<Vec<u8>, String> {
        info!("Fetching object '{}' from MinIO bucket '{}'", object_name, self.bucket);
        let res = self
            .client
            .get_object()
            .bucket(&self.bucket)
            .key(object_name)
            .send()
            .await
            .map_err(|e| format!("Failed to get object from MinIO: {}", e))?;

        let data = res
            .body
            .collect()
            .await
            .map_err(|e| format!("Failed to read object body bytes: {}", e))?;

        Ok(data.into_bytes().to_vec())
    }
}
