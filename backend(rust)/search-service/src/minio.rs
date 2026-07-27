use aws_config::BehaviorVersion;
use aws_sdk_s3::{
    config::{Credentials, Region},
    Client,
};
use tracing::{error, info};
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

    pub async fn delete_file(&self, file_url: &str) {
        let res = self
            .client
            .delete_object()
            .bucket(&self.bucket)
            .key(file_url)
            .send()
            .await;

        if let Err(e) = res {
            error!("Failed to delete MinIO object {}: {}", file_url, e);
        } else {
            info!("Deleted object {} from MinIO bucket {}", file_url, self.bucket);
        }
    }
}
