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
    external_url: String,
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
            external_url: config.minio_external_url.clone(),
        }
    }

    pub fn get_external_stream_url(&self, file_url: &str) -> String {
        format!("{}/{}/{}", self.external_url, self.bucket, file_url)
    }

    pub async fn get_object_range(
        &self,
        object_name: &str,
        range_header: Option<&str>,
    ) -> Result<(axum::body::Body, reqwest::header::HeaderMap, axum::http::StatusCode), String> {
        info!("Fetching object stream '{}' from bucket '{}', range={:?}", object_name, self.bucket, range_header);

        let mut req = self.client.get_object().bucket(&self.bucket).key(object_name);
        if let Some(r) = range_header {
            req = req.range(r);
        }

        let res = req
            .send()
            .await
            .map_err(|e| format!("Failed to get object from MinIO S3: {}", e))?;

        let mut headers = reqwest::header::HeaderMap::new();

        let content_type = res
            .content_type()
            .unwrap_or("audio/mpeg")
            .to_string();
        headers.insert(
            axum::http::header::CONTENT_TYPE,
            axum::http::HeaderValue::from_str(&content_type).unwrap(),
        );

        headers.insert(
            axum::http::header::ACCEPT_RANGES,
            axum::http::HeaderValue::from_static("bytes"),
        );

        let status = if range_header.is_some() && res.content_range().is_some() {
            if let Some(cr) = res.content_range() {
                headers.insert(
                    axum::http::header::CONTENT_RANGE,
                    axum::http::HeaderValue::from_str(cr).unwrap(),
                );
            }
            axum::http::StatusCode::PARTIAL_CONTENT
        } else {
            axum::http::StatusCode::OK
        };

        if let Some(cl) = res.content_length() {
            headers.insert(
                axum::http::header::CONTENT_LENGTH,
                axum::http::HeaderValue::from_str(&cl.to_string()).unwrap(),
            );
        }

        let stream = res.body.into_async_read();
        let body_stream = tokio_util::io::ReaderStream::new(stream);
        let body = axum::body::Body::from_stream(body_stream);

        Ok((body, headers, status))
    }
}
