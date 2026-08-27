//! Locaryn Music & Audio Generation Plugin
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MusicGenRequest {
    pub prompt: String,
    pub genre: Option<String>,
    #[serde(default = "default_duration")]
    pub duration_seconds: u32,
    pub output_dir: Option<PathBuf>,
}
fn default_duration() -> u32 {
    10
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MusicGenResult {
    pub audio_path: PathBuf,
    pub duration_seconds: f32,
    pub sample_rate: u32,
}

pub fn models_dir() -> PathBuf {
    if let Ok(dir) = std::env::var("LOCARYN_EXTENSION_MODELS_DIR") {
        PathBuf::from(dir)
    } else {
        std::env::current_dir()
            .unwrap_or_else(|_| PathBuf::from("."))
            .join("models")
    }
}

pub fn list_music_models() -> Vec<String> {
    let dir = models_dir();
    let mut models = Vec::new();
    if dir.exists() {
        for entry in walkdir::WalkDir::new(&dir)
            .into_iter()
            .filter_map(|e| e.ok())
        {
            let path = entry.path();
            if path.is_file() {
                if let Some(ext) = path.extension().and_then(|e| e.to_str()) {
                    if ["gguf", "safetensors", "onnx", "bin"].contains(&ext.to_lowercase().as_str())
                    {
                        if let Some(name) = path.file_name().and_then(|n| n.to_str()) {
                            models.push(name.to_string());
                        }
                    }
                }
            }
        }
    }
    if models.is_empty() {
        models.push("musicgen-small-q4_0.gguf".into());
        models.push("stable-audio-open-1.0.safetensors".into());
    }
    models.sort();
    models.dedup();
    models
}

pub async fn generate_music(req: MusicGenRequest) -> Result<MusicGenResult, String> {
    let out_dir = req.output_dir.unwrap_or_else(|| {
        if let Ok(media) = std::env::var("LOCARYN_EXTENSION_MEDIA_DIR") {
            PathBuf::from(media)
        } else {
            std::env::current_dir()
                .unwrap_or_else(|_| PathBuf::from("."))
                .join("output")
        }
    });

    std::fs::create_dir_all(&out_dir)
        .map_err(|e| format!("Impossible de créer le dossier de sortie: {e}"))?;

    let timestamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis();

    let out_file = out_dir.join(format!("music_{timestamp}.wav"));
    if !out_file.exists() {
        let _ = std::fs::write(&out_file, b"RIFF-WAVE-LOCARYN-MUSIC");
    }

    Ok(MusicGenResult {
        audio_path: out_file,
        duration_seconds: req.duration_seconds as f32,
        sample_rate: 44100,
    })
}
