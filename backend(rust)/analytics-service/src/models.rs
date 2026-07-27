use mongodb::bson::DateTime;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
#[allow(dead_code)]
pub struct ActivityLogDoc {
    pub event_type: String,
    pub track_id: Option<String>,
    pub user_id: String,
    #[serde(rename = "timestamp", default = "DateTime::now")]
    pub timestamp: DateTime,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct StatsResponse {
    pub total_uploads: i64,
    pub total_plays: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct TrackHistoryDoc {
    pub track_id: String,
    pub play_count: i64,
    pub last_played: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EventMessage {
    pub event_type: String,
    pub track_id: Option<String>,
    pub user_id: Option<String>,
}
