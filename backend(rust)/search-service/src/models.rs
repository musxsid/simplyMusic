use mongodb::bson::DateTime;
use serde::{de, ser::SerializeStruct, Deserialize, Deserializer, Serialize, Serializer};

pub fn deserialize_id<'de, D>(deserializer: D) -> Result<String, D::Error>
where
    D: Deserializer<'de>,
{
    struct IdVisitor;

    impl<'de> de::Visitor<'de> for IdVisitor {
        type Value = String;

        fn expecting(&self, formatter: &mut std::fmt::Formatter) -> std::fmt::Result {
            formatter.write_str("a string, object id, or map with $oid")
        }

        fn visit_str<E>(self, v: &str) -> Result<Self::Value, E>
        where
            E: de::Error,
        {
            Ok(v.to_string())
        }

        fn visit_string<E>(self, v: String) -> Result<Self::Value, E>
        where
            E: de::Error,
        {
            Ok(v)
        }

        fn visit_map<M>(self, mut access: M) -> Result<Self::Value, M::Error>
        where
            M: de::MapAccess<'de>,
        {
            let mut oid_val = None;
            while let Some((key, val)) = access.next_entry::<String, serde_json::Value>()? {
                if key == "$oid" || key == "_id" || key == "id" {
                    if let Some(s) = val.as_str() {
                        oid_val = Some(s.to_string());
                    } else {
                        oid_val = Some(val.to_string());
                    }
                }
            }
            oid_val.ok_or_else(|| de::Error::custom("missing $oid field in id object"))
        }
    }

    deserializer.deserialize_any(IdVisitor)
}

pub fn deserialize_id_opt<'de, D>(deserializer: D) -> Result<Option<String>, D::Error>
where
    D: Deserializer<'de>,
{
    match deserialize_id(deserializer) {
        Ok(s) => Ok(Some(s)),
        Err(_) => Ok(None),
    }
}

pub fn deserialize_date_flexible<'de, D>(deserializer: D) -> Result<DateTime, D::Error>
where
    D: Deserializer<'de>,
{
    struct DateVisitor;

    impl<'de> de::Visitor<'de> for DateVisitor {
        type Value = DateTime;

        fn expecting(&self, formatter: &mut std::fmt::Formatter) -> std::fmt::Result {
            formatter.write_str("a date string, timestamp, BSON DateTime, or $date object")
        }

        fn visit_str<E>(self, v: &str) -> Result<Self::Value, E>
        where
            E: de::Error,
        {
            DateTime::parse_rfc3339_str(v)
                .or_else(|_| {
                    chrono::DateTime::parse_from_rfc3339(v)
                        .map(|dt| DateTime::from_millis(dt.timestamp_millis()))
                        .map_err(|e| de::Error::custom(format!("failed to parse date string: {}", e)))
                })
        }

        fn visit_string<E>(self, v: String) -> Result<Self::Value, E>
        where
            E: de::Error,
        {
            self.visit_str(&v)
        }

        fn visit_i64<E>(self, v: i64) -> Result<Self::Value, E>
        where
            E: de::Error,
        {
            Ok(DateTime::from_millis(v))
        }

        fn visit_u64<E>(self, v: u64) -> Result<Self::Value, E>
        where
            E: de::Error,
        {
            Ok(DateTime::from_millis(v as i64))
        }

        fn visit_map<M>(self, mut access: M) -> Result<Self::Value, M::Error>
        where
            M: de::MapAccess<'de>,
        {
            let mut date_val = None;
            while let Some((key, val)) = access.next_entry::<String, serde_json::Value>()? {
                if key == "$date" {
                    if let Some(s) = val.as_str() {
                        if let Ok(dt) = DateTime::parse_rfc3339_str(s) {
                            date_val = Some(dt);
                        }
                    } else if let Some(m) = val.as_i64() {
                        date_val = Some(DateTime::from_millis(m));
                    }
                }
            }
            Ok(date_val.unwrap_or_else(DateTime::now))
        }
    }

    deserializer.deserialize_any(DateVisitor)
}

pub fn deserialize_date_flexible_opt<'de, D>(deserializer: D) -> Result<DateTime, D::Error>
where
    D: Deserializer<'de>,
{
    match deserialize_date_flexible(deserializer) {
        Ok(dt) => Ok(dt),
        Err(_) => Ok(DateTime::now()),
    }
}

#[derive(Debug, Clone)]
pub struct MusicMetadataDoc {
    pub id: String,
    pub title: String,
    pub artist: String,
    pub album: String,
    pub release_year: Option<i32>,
    pub duration: Option<f64>,
    pub file_url: String,
    pub file_hash: String,
    pub uploaded_by: String,
    pub created_at: DateTime,
}

impl Serialize for MusicMetadataDoc {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut state = serializer.serialize_struct("MusicMetadataDoc", 11)?;
        state.serialize_field("id", &self.id)?;
        state.serialize_field("_id", &self.id)?;
        state.serialize_field("title", &self.title)?;
        state.serialize_field("artist", &self.artist)?;
        state.serialize_field("album", &self.album)?;
        state.serialize_field("releaseYear", &self.release_year)?;
        state.serialize_field("duration", &self.duration)?;
        state.serialize_field("fileUrl", &self.file_url)?;
        state.serialize_field("fileHash", &self.file_hash)?;
        state.serialize_field("uploadedBy", &self.uploaded_by)?;

        let created_at_str = self
            .created_at
            .try_to_rfc3339_string()
            .unwrap_or_else(|_| "2026-01-01T00:00:00Z".to_string());
        state.serialize_field("createdAt", &created_at_str)?;

        state.end()
    }
}

impl<'de> Deserialize<'de> for MusicMetadataDoc {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        #[derive(Deserialize)]
        struct RawDoc {
            #[serde(rename = "_id", default, deserialize_with = "deserialize_id_opt")]
            _id: Option<String>,
            #[serde(rename = "id", default, deserialize_with = "deserialize_id_opt")]
            id: Option<String>,
            #[serde(default)]
            title: String,
            #[serde(default)]
            artist: String,
            #[serde(default)]
            album: String,
            #[serde(rename = "releaseYear", default)]
            release_year: Option<i32>,
            #[serde(default)]
            duration: Option<f64>,
            #[serde(rename = "fileUrl", default)]
            file_url: String,
            #[serde(rename = "fileHash", default)]
            file_hash: String,
            #[serde(rename = "uploadedBy", default)]
            uploaded_by: String,
            #[serde(rename = "createdAt", default = "DateTime::now", deserialize_with = "deserialize_date_flexible_opt")]
            created_at: DateTime,
        }

        let raw = RawDoc::deserialize(deserializer)?;
        let final_id = raw.id.or(raw._id).unwrap_or_default();

        Ok(MusicMetadataDoc {
            id: final_id,
            title: raw.title,
            artist: raw.artist,
            album: raw.album,
            release_year: raw.release_year,
            duration: raw.duration,
            file_url: raw.file_url,
            file_hash: raw.file_hash,
            uploaded_by: raw.uploaded_by,
            created_at: raw.created_at,
        })
    }
}

#[derive(Debug, Clone)]
pub struct PlaylistDoc {
    pub id: String,
    pub name: String,
    pub user_id: String,
    pub track_ids: Vec<String>,
    pub created_at: DateTime,
}

impl Serialize for PlaylistDoc {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut state = serializer.serialize_struct("PlaylistDoc", 6)?;
        state.serialize_field("id", &self.id)?;
        state.serialize_field("_id", &self.id)?;
        state.serialize_field("name", &self.name)?;
        state.serialize_field("userId", &self.user_id)?;
        state.serialize_field("trackIds", &self.track_ids)?;

        let created_at_str = self
            .created_at
            .try_to_rfc3339_string()
            .unwrap_or_else(|_| "2026-01-01T00:00:00Z".to_string());
        state.serialize_field("createdAt", &created_at_str)?;

        state.end()
    }
}

impl<'de> Deserialize<'de> for PlaylistDoc {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        #[derive(Deserialize)]
        struct RawDoc {
            #[serde(rename = "_id", default, deserialize_with = "deserialize_id_opt")]
            _id: Option<String>,
            #[serde(rename = "id", default, deserialize_with = "deserialize_id_opt")]
            id: Option<String>,
            #[serde(default)]
            name: String,
            #[serde(rename = "userId", default)]
            user_id: String,
            #[serde(rename = "trackIds", default)]
            track_ids: Vec<String>,
            #[serde(rename = "createdAt", default = "DateTime::now", deserialize_with = "deserialize_date_flexible_opt")]
            created_at: DateTime,
        }

        let raw = RawDoc::deserialize(deserializer)?;
        let final_id = raw.id.or(raw._id).unwrap_or_default();

        Ok(PlaylistDoc {
            id: final_id,
            name: raw.name,
            user_id: raw.user_id,
            track_ids: raw.track_ids,
            created_at: raw.created_at,
        })
    }
}

#[derive(Debug, Clone)]
pub struct FavouriteDoc {
    pub id: String,
    pub user_id: String,
    pub track_id: String,
    pub created_at: DateTime,
}

impl Serialize for FavouriteDoc {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut state = serializer.serialize_struct("FavouriteDoc", 5)?;
        state.serialize_field("id", &self.id)?;
        state.serialize_field("_id", &self.id)?;
        state.serialize_field("userId", &self.user_id)?;
        state.serialize_field("trackId", &self.track_id)?;

        let created_at_str = self
            .created_at
            .try_to_rfc3339_string()
            .unwrap_or_else(|_| "2026-01-01T00:00:00Z".to_string());
        state.serialize_field("createdAt", &created_at_str)?;

        state.end()
    }
}

impl<'de> Deserialize<'de> for FavouriteDoc {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        #[derive(Deserialize)]
        struct RawDoc {
            #[serde(rename = "_id", default, deserialize_with = "deserialize_id_opt")]
            _id: Option<String>,
            #[serde(rename = "id", default, deserialize_with = "deserialize_id_opt")]
            id: Option<String>,
            #[serde(rename = "userId", default)]
            user_id: String,
            #[serde(rename = "trackId", default)]
            track_id: String,
            #[serde(rename = "createdAt", default = "DateTime::now", deserialize_with = "deserialize_date_flexible_opt")]
            created_at: DateTime,
        }

        let raw = RawDoc::deserialize(deserializer)?;
        let final_id = raw.id.or(raw._id).unwrap_or_default();

        Ok(FavouriteDoc {
            id: final_id,
            user_id: raw.user_id,
            track_id: raw.track_id,
            created_at: raw.created_at,
        })
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct PlaylistResponse {
    pub id: String,
    pub name: String,
    pub user_id: String,
    pub created_at: DateTime,
    pub tracks: Vec<MusicMetadataDoc>,
}

#[derive(Debug, Deserialize)]
pub struct CreatePlaylistPayload {
    pub name: String,
}

#[derive(Debug, Deserialize)]
pub struct SearchQuery {
    pub query: Option<String>,
}
