use aws_config::BehaviorVersion;
use aws_sdk_s3::{
    config::{Credentials, Region},
    primitives::ByteStream,
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
        let service = Self {
            client,
            bucket: config.minio_bucket.clone(),
        };

        if let Err(e) = service.ensure_bucket_exists().await {
            error!("Warning checking/creating bucket {}: {}", config.minio_bucket, e);
        }

        service
    }

    pub async fn ensure_bucket_exists(&self) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let resp = self.client.head_bucket().bucket(&self.bucket).send().await;
        if resp.is_err() {
            info!("Bucket {} does not exist. Creating bucket...", self.bucket);
            self.client.create_bucket().bucket(&self.bucket).send().await?;
            info!("Bucket {} created successfully", self.bucket);
        }
        Ok(())
    }

    pub async fn put_object(
        &self,
        key: &str,
        bytes: Vec<u8>,
        content_type: &str,
    ) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let stream = ByteStream::from(bytes);
        self.client
            .put_object()
            .bucket(&self.bucket)
            .key(key)
            .body(stream)
            .content_type(content_type)
            .send()
            .await?;

        info!("Successfully uploaded object {} to bucket {}", key, self.bucket);
        Ok(())
    }
}
