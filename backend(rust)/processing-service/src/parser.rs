use id3::{Tag, TagLike};
use std::{fs::File, path::Path};
use tracing::{info, warn};

#[derive(Debug, Default)]
pub struct ParsedMetadata {
    pub title: Option<String>,
    pub artist: Option<String>,
    pub album: Option<String>,
    pub release_year: Option<i32>,
    pub duration: Option<f64>,
}

pub fn parse_audio_metadata<P: AsRef<Path>>(file_path: P, original_filename: &str) -> ParsedMetadata {
    let mut parsed = ParsedMetadata::default();

    if let Ok(tag) = Tag::read_from_path(file_path.as_ref()) {
        parsed.title = tag.title().map(|s| s.to_string());
        parsed.artist = tag.artist().map(|s| s.to_string());
        parsed.album = tag.album().map(|s| s.to_string());
        parsed.release_year = tag.year();
        if let Some(dur_ms) = tag.duration() {
            parsed.duration = Some(dur_ms as f64 / 1000.0);
        }
    } else {
        warn!("No ID3 tag found or failed to parse tag for file: {}", original_filename);
    }

    // Fallbacks
    if parsed.title.as_deref().unwrap_or("").trim().is_empty() {
        parsed.title = Some(clean_title_from_filename(original_filename));
    }

    if parsed.artist.as_deref().unwrap_or("").trim().is_empty() {
        parsed.artist = Some(parse_artist_from_filename(original_filename));
    }

    if parsed.duration.is_none() {
        // Estimate duration based on file size for MP3 (average 128-192kbps)
        if let Ok(metadata) = File::open(file_path.as_ref()).and_then(|f| f.metadata()) {
            let bytes = metadata.len() as f64;
            // ~160kbps = 20,000 bytes per second
            let estimated_sec = (bytes / 20000.0).round().max(5.0);
            parsed.duration = Some(estimated_sec);
        }
    }

    info!(
        "Parsed metadata for '{}': title={:?}, artist={:?}, album={:?}, duration={:?}, year={:?}",
        original_filename, parsed.title, parsed.artist, parsed.album, parsed.duration, parsed.release_year
    );

    parsed
}

fn clean_title_from_filename(filename: &str) -> String {
    let base = if let Some(pos) = filename.rfind('.') {
        &filename[..pos]
    } else {
        filename
    };

    if base.contains(" - ") {
        let parts: Vec<&str> = base.splitn(2, " - ").collect();
        parts[0].trim().to_string()
    } else {
        base.trim().to_string()
    }
}

fn parse_artist_from_filename(filename: &str) -> String {
    let base = if let Some(pos) = filename.rfind('.') {
        &filename[..pos]
    } else {
        filename
    };

    if base.contains(" - ") {
        let parts: Vec<&str> = base.splitn(2, " - ").collect();
        parts[1].trim().to_string()
    } else {
        "Unknown Artist".to_string()
    }
}
