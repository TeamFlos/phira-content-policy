use std::collections::HashMap;
use std::fs;
use std::path::Path;

use anyhow::{Context, Result};
use phira_content_policy_types::*;
use serde::Deserialize;

#[derive(Deserialize)]
struct TrackFile {
    track: Vec<TrackEntry>,
}

fn parse_toml_file<T: for<'de> Deserialize<'de>>(path: &Path) -> Result<T> {
    let content =
        fs::read_to_string(path).with_context(|| format!("Cannot read {}", path.display()))?;
    toml::from_str(&content).with_context(|| format!("Invalid TOML in {}", path.display()))
}

fn load_rights_holder(dir: &Path) -> Result<ResolvedRightsHolder> {
    let policy_path = dir.join("_policy.toml");
    let policy: RightsHolderPolicy = parse_toml_file(&policy_path)
        .with_context(|| format!("Missing or invalid _policy.toml in {}", dir.display()))?;

    let mut tracks = Vec::new();
    for entry in fs::read_dir(dir)? {
        let entry = entry?;
        if !entry.file_type()?.is_file() {
            continue;
        }
        let name = entry.file_name();
        let name = name.to_str().unwrap_or("");
        if !name.ends_with(".toml") || name == "_policy.toml" || name.starts_with('.') {
            continue;
        }
        let track_file: TrackFile = parse_toml_file(&entry.path())?;
        tracks.extend(track_file.track);
    }

    Ok(ResolvedRightsHolder { policy, tracks })
}

fn load_rights_holders(dir: &Path) -> Result<HashMap<String, ResolvedRightsHolder>> {
    if !dir.exists() {
        return Ok(HashMap::new());
    }
    let mut map = HashMap::new();
    for entry in fs::read_dir(dir)? {
        let entry = entry?;
        if !entry.file_type()?.is_dir() {
            continue;
        }
        let name = entry.file_name();
        let name = name.to_str().unwrap_or("");
        if name.starts_with('.') {
            continue;
        }
        let rh = load_rights_holder(&entry.path())?;
        map.insert(name.to_string(), rh);
    }
    Ok(map)
}

fn load_artists(dir: &Path) -> Result<HashMap<String, Artist>> {
    if !dir.exists() {
        return Ok(HashMap::new());
    }
    let mut map = HashMap::new();
    for entry in fs::read_dir(dir)? {
        let entry = entry?;
        if !entry.file_type()?.is_file() {
            continue;
        }
        let name = entry.file_name();
        let name = name.to_str().unwrap_or("");
        if !name.ends_with(".toml") || name.starts_with('.') {
            continue;
        }
        let artist: Artist = parse_toml_file(&entry.path())?;
        let key = name.strip_suffix(".toml").unwrap_or(name);
        map.insert(key.to_string(), artist);
    }
    Ok(map)
}

fn load_independent_tracks(dir: &Path) -> Result<Vec<TrackEntry>> {
    if !dir.exists() {
        return Ok(Vec::new());
    }
    let mut tracks = Vec::new();
    for entry in fs::read_dir(dir)? {
        let entry = entry?;
        if !entry.file_type()?.is_file() {
            continue;
        }
        let name = entry.file_name();
        let name = name.to_str().unwrap_or("");
        if !name.ends_with(".toml") || name.starts_with('.') {
            continue;
        }
        let track_file: TrackFile = parse_toml_file(&entry.path())?;
        tracks.extend(track_file.track);
    }
    Ok(tracks)
}

pub fn load_content_policy(data_dir: &Path) -> Result<ContentPolicy> {
    let rights_holders = load_rights_holders(&data_dir.join("rights_holders"))?;
    let artists = load_artists(&data_dir.join("artists"))?;
    let independent_tracks = load_independent_tracks(&data_dir.join("independent"))?;

    Ok(ContentPolicy {
        rights_holders,
        artists,
        independent_tracks,
    })
}
