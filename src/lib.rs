#![cfg_attr(not(debug_assertions), deny(unsafe_code))]

use serde::Serialize;
use std::path::PathBuf;
use std::time::Instant;
use tokio::process::Command;
use tokio::time::{timeout, Duration};

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct TerminalExecutionResult {
    command: String,
    output: String,
    exit_code: i32,
    duration_ms: u128,
}

#[tauri::command]
async fn execute_terminal_command(command: String, cwd: Option<String>) -> Result<TerminalExecutionResult, String> {
    let command = command.trim().to_string();
    if command.is_empty() {
        return Err("Command cannot be empty.".to_string());
    }
    if command.len() > 8192 {
        return Err("Command exceeds the 8192-character limit.".to_string());
    }

    let working_dir: PathBuf = match cwd {
        Some(value) if !value.trim().is_empty() => PathBuf::from(value),
        _ => dirs::home_dir().ok_or_else(|| "Could not resolve the user's home directory.".to_string())?,
    };
    let working_dir = working_dir.canonicalize()
        .map_err(|e| format!("Working directory is unavailable: {e}"))?;
    if !working_dir.is_dir() {
        return Err("Working directory must be a directory.".to_string());
    }

    let started = Instant::now();
    let mut process = Command::new("/bin/zsh");
    process
        .kill_on_drop(true)
        .arg("-lc")
        .arg(&command)
        .current_dir(&working_dir);
    let output = timeout(Duration::from_secs(120), process.output())
        .await
        .map_err(|_| "Command timed out after 120 seconds.".to_string())?
        .map_err(|e| format!("Failed to start command: {e}"))?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    let stderr = String::from_utf8_lossy(&output.stderr);
    let combined = match (stdout.is_empty(), stderr.is_empty()) {
        (true, true) => "(Command completed with no output)".to_string(),
        (false, true) => stdout.into_owned(),
        (true, false) => stderr.into_owned(),
        (false, false) => format!("{stdout}{stderr}"),
    };

    Ok(TerminalExecutionResult {
        command,
        output: combined,
        exit_code: output.status.code().unwrap_or(1),
        duration_ms: started.elapsed().as_millis(),
    })
}


/// Run a project command under the macOS Seatbelt sandbox. This is intentionally
/// fail-closed: if the OS sandbox is unavailable, autonomous checks do not fall
/// back to the unrestricted terminal command.
#[tauri::command]
async fn execute_sandboxed_command(command: String, cwd: String) -> Result<TerminalExecutionResult, String> {
    let command = command.trim().to_string();
    if command.is_empty() {
        return Err("Sandboxed command cannot be empty.".to_string());
    }
    if command.len() > 8192 {
        return Err("Command exceeds the 8192-character limit.".to_string());
    }
    #[cfg(not(target_os = "macos"))]
    {
        let _ = (command, cwd);
        return Err("OS-enforced project sandbox is currently supported only on macOS. No command was run.".to_string());
    }
    #[cfg(target_os = "macos")]
    {
        use std::fs;
        use std::path::Path;
        let workspace = PathBuf::from(cwd).canonicalize()
            .map_err(|e| format!("Sandbox workspace is unavailable: {e}"))?;
        if !workspace.is_dir() {
            return Err("Sandbox workspace must be a directory.".to_string());
        }
        if workspace.to_string_lossy().chars().any(|ch| ch == '\n' || ch == '\r') {
            return Err("Sandbox workspace path cannot contain newline characters.".to_string());
        }
        let sandbox_exec = Path::new("/usr/bin/sandbox-exec");
        if !sandbox_exec.is_file() {
            return Err("macOS sandbox-exec is unavailable. Refusing to run the command without isolation.".to_string());
        }

        let work_state = std::env::temp_dir().join(format!("supru-sandbox-{}", uuid::Uuid::new_v4()));
        let temp_dir = work_state.join("tmp");
        let npm_cache = work_state.join("npm-cache");
        let home_dir = work_state.join("home");
        fs::create_dir_all(&temp_dir).map_err(|e| format!("Could not create sandbox temp directory: {e}"))?;
        fs::create_dir_all(&npm_cache).map_err(|e| format!("Could not create sandbox npm cache: {e}"))?;
        fs::create_dir_all(&home_dir).map_err(|e| format!("Could not create sandbox home directory: {e}"))?;
        let work_state = work_state.canonicalize().map_err(|e| format!("Could not resolve sandbox temp directory: {e}"))?;
        let temp_dir = work_state.join("tmp");
        let npm_cache = work_state.join("npm-cache");
        let home_dir = work_state.join("home");

        fn profile_path(path: &Path) -> String {
            path.to_string_lossy().replace('\\', "\\\\").replace('"', "\\\"")
        }
        let workspace_path = profile_path(&workspace);
        let work_state_path = profile_path(&work_state);
        let profile = format!(r#"(version 1)
(deny default)
(allow process*)
(allow sysctl-read)
(allow file-read* (subpath "/System"))
(allow file-read* (subpath "/usr"))
(allow file-read* (subpath "/etc"))
(allow file-read* (subpath "/private/etc"))
(allow file-read* (subpath "/opt/homebrew"))
(allow file-read* (subpath "/usr/local"))
(allow file-read* (subpath "/bin"))
(allow file-read* (subpath "/sbin"))
(allow file-read* (subpath "/Library"))
(allow file-read* (subpath "/Applications"))
(allow file-read* (subpath "/private/var/db"))
(allow file-read* (subpath "/dev"))
(allow file-write* (subpath "/dev"))
(allow file-read* (subpath "{workspace_path}"))
(allow file-write* (subpath "{workspace_path}"))
(allow file-read* (subpath "{work_state_path}"))
(allow file-write* (subpath "{work_state_path}"))
"#);
        let profile_file = std::env::temp_dir().join(format!("supru-seatbelt-{}.sb", uuid::Uuid::new_v4()));
        fs::write(&profile_file, profile).map_err(|e| format!("Could not create sandbox policy: {e}"))?;

        let started = Instant::now();
        let mut process = Command::new(sandbox_exec);
        process
            .kill_on_drop(true)
            .env_clear()
            .arg("-f")
            .arg(&profile_file)
            .arg("/bin/zsh")
            .arg("-c")
            .arg(&command)
            .current_dir(&workspace)
            .env("HOME", &home_dir)
            .env("PATH", "/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin")
            .env("TMPDIR", &temp_dir)
            .env("npm_config_cache", &npm_cache)
            .env("LANG", "en_US.UTF-8");
        let execution = timeout(Duration::from_secs(120), process.output()).await;
        let _ = fs::remove_file(&profile_file);
        let output = match execution {
            Ok(Ok(output)) => output,
            Ok(Err(e)) => {
                let _ = fs::remove_dir_all(&work_state);
                return Err(format!("Failed to start macOS sandbox: {e}"));
            }
            Err(_) => {
                let _ = fs::remove_dir_all(&work_state);
                return Err("Sandboxed command timed out after 120 seconds.".to_string());
            }
        };
        let _ = fs::remove_dir_all(&work_state);

        let stdout = String::from_utf8_lossy(&output.stdout);
        let stderr = String::from_utf8_lossy(&output.stderr);
        let combined = match (stdout.is_empty(), stderr.is_empty()) {
            (true, true) => "(Sandboxed command completed with no output)".to_string(),
            (false, true) => stdout.into_owned(),
            (true, false) => stderr.into_owned(),
            (false, false) => format!("{stdout}{stderr}"),
        };
        Ok(TerminalExecutionResult {
            command,
            output: combined,
            exit_code: output.status.code().unwrap_or(1),
            duration_ms: started.elapsed().as_millis(),
        })
    }
}


#[tauri::command]
async fn list_workspace_files(workspace_root: String, relative_dir: Option<String>) -> Result<Vec<String>, String> {
    let root = PathBuf::from(workspace_root).canonicalize()
        .map_err(|e| format!("Workspace root is unavailable: {e}"))?;
    if !root.is_dir() { return Err("Workspace root must be a directory.".into()); }
    let target = match relative_dir {
        Some(value) if !value.trim().is_empty() => {
            let relative = PathBuf::from(value.trim());
            if relative.is_absolute() || relative.components().any(|c| matches!(c, std::path::Component::ParentDir | std::path::Component::RootDir | std::path::Component::Prefix(_))) {
                return Err("Directory must be a safe relative path inside the workspace.".into());
            }
            root.join(relative).canonicalize().map_err(|e| format!("Directory is unavailable: {e}"))?
        }
        _ => root.clone(),
    };
    if !target.starts_with(&root) || !target.is_dir() {
        return Err("Directory escapes the selected workspace or is not a directory.".into());
    }
    let mut files = Vec::new();
    for entry in walkdir::WalkDir::new(&target)
        .follow_links(false)
        .max_depth(5)
        .into_iter()
        .filter_entry(|entry| {
            let name = entry.file_name().to_string_lossy();
            !matches!(name.as_ref(), ".git" | "node_modules" | "target" | "dist" | ".next" | "vendor" | ".supru-sandbox")
        })
    {
        let entry = entry.map_err(|e| format!("Could not inspect workspace: {e}"))?;
        if !entry.file_type().is_file() { continue; }
        let canonical = entry.path().canonicalize().map_err(|e| format!("Could not resolve file path: {e}"))?;
        if !canonical.starts_with(&root) { continue; }
        if let Ok(relative) = canonical.strip_prefix(&root) {
            files.push(relative.to_string_lossy().replace('\\', "/"));
            if files.len() >= 300 { break; }
        }
    }
    files.sort();
    Ok(files)
}

#[tauri::command]
async fn read_workspace_file(workspace_root: String, relative_path: String) -> Result<String, String> {
    let root = PathBuf::from(workspace_root).canonicalize()
        .map_err(|e| format!("Workspace root is unavailable: {e}"))?;
    if !root.is_dir() { return Err("Workspace root must be a directory.".into()); }
    let relative = PathBuf::from(relative_path.trim());
    if relative.as_os_str().is_empty() || relative.is_absolute()
        || relative.components().any(|c| matches!(c, std::path::Component::ParentDir | std::path::Component::RootDir | std::path::Component::Prefix(_))) {
        return Err("File path must be a safe relative path inside the workspace.".into());
    }
    let target = root.join(relative).canonicalize().map_err(|e| format!("File is unavailable: {e}"))?;
    if !target.starts_with(&root) || !target.is_file() {
        return Err("File escapes the selected workspace or is not a regular file.".into());
    }
    let metadata = std::fs::metadata(&target).map_err(|e| format!("Could not inspect file: {e}"))?;
    if metadata.len() > 512 * 1024 { return Err("File exceeds the 512 KiB read limit.".into()); }
    std::fs::read_to_string(&target).map_err(|e| format!("Could not read UTF-8 file: {e}"))
}


#[tauri::command]
async fn create_workspace_directory(workspace_root: String, relative_path: String) -> Result<String, String> {
    let root = PathBuf::from(workspace_root).canonicalize()
        .map_err(|e| format!("Workspace root is unavailable: {e}"))?;
    if !root.is_dir() { return Err("Workspace root must be a directory.".into()); }
    let relative = PathBuf::from(relative_path.trim());
    if relative.as_os_str().is_empty() || relative.is_absolute()
        || relative.components().any(|c| !matches!(c, std::path::Component::Normal(_))) {
        return Err("Directory path must be a safe relative path inside the workspace.".into());
    }
    let parts: Vec<_> = relative.components().filter_map(|c| match c {
        std::path::Component::Normal(name) => Some(name.to_os_string()),
        _ => None,
    }).collect();
    if parts.iter().any(|name| matches!(name.to_string_lossy().as_ref(), ".git" | "node_modules" | "target")) {
        return Err("Creating directories inside .git, node_modules, and target is blocked.".into());
    }
    let mut current = root.clone();
    for part in parts {
        current.push(part);
        if !current.exists() {
            std::fs::create_dir(&current).map_err(|e| format!("Could not create workspace directory: {e}"))?;
        }
        let canonical = current.canonicalize().map_err(|e| format!("Could not resolve workspace directory: {e}"))?;
        if !canonical.starts_with(&root) || !canonical.is_dir() {
            return Err("Directory escapes the selected workspace or is not a directory.".into());
        }
        current = canonical;
    }
    Ok(format!("Created directory {}", current.strip_prefix(&root).unwrap_or(&current).display()))
}

#[tauri::command]
async fn write_workspace_file(workspace_root: String, relative_path: String, content: String) -> Result<String, String> {
    let root = PathBuf::from(workspace_root).canonicalize()
        .map_err(|e| format!("Workspace root is unavailable: {e}"))?;
    if !root.is_dir() { return Err("Workspace root must be a directory.".into()); }
    if content.len() > 1024 * 1024 { return Err("File content exceeds the 1 MiB write limit.".into()); }
    let relative = PathBuf::from(relative_path.trim());
    if relative.as_os_str().is_empty() || relative.is_absolute()
        || relative.components().any(|c| matches!(c, std::path::Component::ParentDir | std::path::Component::RootDir | std::path::Component::Prefix(_))) {
        return Err("File path must be a safe relative path inside the workspace.".into());
    }
    if relative.components().any(|c| matches!(c, std::path::Component::Normal(name) if matches!(name.to_string_lossy().as_ref(), ".git" | "node_modules" | "target"))) {
        return Err("Writes inside .git, node_modules, and target are blocked.".into());
    }
    let file_name = relative.file_name().ok_or_else(|| "File path must include a filename.".to_string())?;
    let parent = root.join(relative.parent().unwrap_or_else(|| std::path::Path::new(""))).canonicalize()
        .map_err(|e| format!("Parent directory must already exist: {e}"))?;
    if !parent.starts_with(&root) { return Err("Parent directory escapes the selected workspace.".into()); }
    let target = parent.join(file_name);
    if target.exists() {
        let canonical_target = target.canonicalize().map_err(|e| format!("Could not resolve target file: {e}"))?;
        if !canonical_target.starts_with(&root) || !canonical_target.is_file() {
            return Err("Target escapes the selected workspace or is not a regular file.".into());
        }
    }
    let temp = parent.join(format!(".supru-write-{}-{}.tmp", std::process::id(), std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap_or_default().as_nanos()));
    std::fs::write(&temp, &content).map_err(|e| format!("Could not stage file content: {e}"))?;
    if let Err(error) = std::fs::rename(&temp, &target) {
        let _ = std::fs::remove_file(&temp);
        return Err(format!("Could not commit file atomically: {error}"));
    }
    Ok(format!("Wrote {} bytes to {}", content.len(), target.strip_prefix(&root).unwrap_or(&target).display()))
}


#[tauri::command]
async fn choose_workspace_folder(app: tauri::AppHandle) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::DialogExt;
    let Some(selected) = app.dialog().file().blocking_pick_folder() else {
        return Ok(None);
    };
    let path = selected
        .into_path()
        .map_err(|error| format!("Could not resolve selected folder: {error}"))?;
    let canonical = path
        .canonicalize()
        .map_err(|error| format!("Selected folder is unavailable: {error}"))?;
    if !canonical.is_dir() {
        return Err("Selected workspace is not a directory.".into());
    }
    Ok(Some(canonical.to_string_lossy().into_owned()))
}

#[tauri::command]
async fn generate_image(prompt: String, aspect_ratio: String, api_key: Option<String>) -> Result<String, String> {
    let prompt = prompt.trim();
    let key = api_key.as_deref().unwrap_or("").trim();
    if prompt.is_empty() { return Err("Image prompt cannot be empty.".into()); }
    if key.is_empty() { return Err("Image generation requires a Gemini API key in Provider Settings.".into()); }
    if prompt.len() > 12000 { return Err("Image prompt exceeds the 12000-character limit.".into()); }
    let ratio = match aspect_ratio.as_str() {
        "1:1" | "16:9" | "9:16" | "4:3" | "3:4" => aspect_ratio.as_str(),
        "21:9" => "16:9",
        _ => "1:1",
    };
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(120))
        .build()
        .map_err(|e| format!("Could not initialize image provider client: {e}"))?;
    let response = client
        .post("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent")
        .query(&[("key", key)])
        .json(&serde_json::json!({
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "responseModalities": ["TEXT", "IMAGE"],
                "imageConfig": {"aspectRatio": ratio}
            }
        }))
        .send().await.map_err(|e| format!("Image provider request failed: {e}"))?;
    let status = response.status();
    let body = response.text().await.map_err(|e| format!("Could not read image provider response: {e}"))?;
    if !status.is_success() {
        let detail = serde_json::from_str::<serde_json::Value>(&body).ok()
            .and_then(|v| v.pointer("/error/message").and_then(|v| v.as_str()).map(str::to_string))
            .unwrap_or_else(|| body.chars().take(600).collect());
        return Err(format!("Image provider returned HTTP {status}: {detail}"));
    }
    let value: serde_json::Value = serde_json::from_str(&body)
        .map_err(|e| format!("Image provider returned invalid JSON: {e}"))?;
    let parts = value.pointer("/candidates/0/content/parts").and_then(|v| v.as_array())
        .ok_or_else(|| "Image provider returned no candidate content.".to_string())?;
    for part in parts {
        if let Some(data) = part.pointer("/inlineData/data").and_then(|v| v.as_str()) {
            let mime = part.pointer("/inlineData/mimeType").and_then(|v| v.as_str()).unwrap_or("image/png");
            return Ok(format!("data:{mime};base64,{data}"));
        }
    }
    let explanation = parts.iter().filter_map(|p| p.get("text").and_then(|v| v.as_str())).collect::<Vec<_>>().join(" ");
    Err(if explanation.is_empty() {
        "Image provider returned no image data. No placeholder image was substituted.".into()
    } else {
        format!("Image provider did not return image data: {}", explanation.chars().take(500).collect::<String>())
    })
}

// Normalize endpoint URLs for providers that implement the OpenAI-compatible API.
// Users may paste a base URL, a /v1 URL, a model-list URL, or the full chat endpoint.
fn openai_compatible_chat_url(endpoint: &str) -> String {
    let mut base = endpoint.trim().trim_end_matches('/').to_string();
    if base.ends_with("/chat/completions") {
        return base;
    }
    if base.ends_with("/models") {
        base.truncate(base.len() - "/models".len());
    }
    if base.ends_with("/v1") {
        format!("{base}/chat/completions")
    } else {
        format!("{base}/v1/chat/completions")
    }
}

fn openai_compatible_models_url(endpoint: &str) -> String {
    let mut base = endpoint.trim().trim_end_matches('/').to_string();
    if base.ends_with("/chat/completions") {
        base.truncate(base.len() - "/chat/completions".len());
    }
    if base.ends_with("/models") {
        return base;
    }
    if base.ends_with("/v1") {
        return format!("{base}/models");
    }
    format!("{base}/v1/models")
}

fn anthropic_messages_url(endpoint: &str) -> String {
    let base = endpoint.trim().trim_end_matches('/');
    if base.ends_with("/v1/messages") {
        base.to_string()
    } else if base.ends_with("/v1") {
        format!("{base}/messages")
    } else {
        format!("{base}/v1/messages")
    }
}

fn gemini_generate_url(endpoint: &str, model: &str) -> String {
    let base = endpoint.trim().trim_end_matches('/');
    if base.ends_with(":generateContent") {
        return base.to_string();
    }
    if base.contains("/v1beta/models/") {
        return format!("{base}:generateContent");
    }
    if base.ends_with("/v1beta") {
        format!("{base}/models/{model}:generateContent")
    } else {
        format!("{base}/v1beta/models/{model}:generateContent")
    }
}

#[derive(serde::Deserialize)]
struct ChatMessageInput {
    role: String,
    content: String,
}

#[tauri::command]
async fn chat_completion(
    provider: String,
    endpoint_url: String,
    model_name: String,
    api_key: Option<String>,
    messages: Vec<ChatMessageInput>,
    temperature: Option<f32>,
) -> Result<String, String> {
    if messages.is_empty() {
        return Err("At least one chat message is required.".to_string());
    }
    if messages.len() > 200 {
        return Err("Conversation exceeds the 200-message limit.".to_string());
    }
    let model = model_name.trim();
    if model.is_empty() {
        return Err("Select a model before sending a message.".to_string());
    }

    let endpoint = endpoint_url.trim().trim_end_matches('/');
    let key = api_key.as_deref().unwrap_or("").trim();
    let temp = temperature.unwrap_or(0.7).clamp(0.0, 2.0);
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(120))
        .build()
        .map_err(|e| format!("Could not initialize provider client: {e}"))?;

    let provider_lower = provider.to_lowercase();
    if (provider_lower == "custom_local" || provider_lower == "custom") && endpoint.is_empty() {
        return Err("Custom compatible providers require an explicit base URL or full /chat/completions URL.".to_string());
    }
    let (url, body, auth_mode) = if provider_lower == "ollama_local" || provider_lower == "ollama" {
        let base = if endpoint.is_empty() { "http://127.0.0.1:11434" } else { endpoint };
        let chat_url = if base.ends_with("/api/chat") {
            base.to_string()
        } else if base.ends_with("/api/tags") {
            format!("{}/api/chat", base.trim_end_matches("/api/tags"))
        } else {
            format!("{}/api/chat", base.trim_end_matches('/'))
        };
        (
            chat_url,
            serde_json::json!({
                "model": model,
                "messages": messages.iter().map(|m| serde_json::json!({"role": m.role, "content": m.content})).collect::<Vec<_>>(),
                "stream": false,
                "options": {"temperature": temp}
            }),
            "none"
        )
    } else if provider_lower == "gemini_cloud" || provider_lower == "gemini" {
        if key.is_empty() {
            return Err("Gemini API key is missing. Add it in provider settings.".to_string());
        }
        let base = if endpoint.is_empty() || endpoint == "local://builtin" {
            "https://generativelanguage.googleapis.com"
        } else {
            endpoint
        };
        let system = messages.iter().filter(|m| m.role == "system").map(|m| m.content.as_str()).collect::<Vec<_>>().join("\n\n");
        let contents = messages.iter().filter(|m| m.role != "system").map(|m| {
            serde_json::json!({
                "role": if m.role == "assistant" { "model" } else { "user" },
                "parts": [{"text": m.content}]
            })
        }).collect::<Vec<_>>();
        (
            gemini_generate_url(base, model),
            serde_json::json!({
                "contents": contents,
                "systemInstruction": if system.is_empty() { serde_json::Value::Null } else { serde_json::json!({"parts":[{"text":system}]}) },
                "generationConfig": {"temperature": temp}
            }),
            "gemini"
        )
    } else if provider_lower == "anthropic" {
        if key.is_empty() {
            return Err("Anthropic API key is missing. Add it in provider settings.".to_string());
        }
        let base = if endpoint.is_empty() { "https://api.anthropic.com" } else { endpoint };
        let system = messages.iter().filter(|m| m.role == "system").map(|m| m.content.as_str()).collect::<Vec<_>>().join("\n\n");
        let history = messages.iter().filter(|m| m.role != "system").map(|m| {
            serde_json::json!({"role": if m.role == "assistant" { "assistant" } else { "user" }, "content": m.content})
        }).collect::<Vec<_>>();
        (
            anthropic_messages_url(base),
            serde_json::json!({"model": model, "max_tokens": 4096, "temperature": temp, "system": system, "messages": history}),
            "anthropic"
        )
    } else {
        if matches!(provider_lower.as_str(), "custom" | "custom_local") && endpoint.is_empty() {
            return Err("Custom compatible providers require an explicit base URL or full /chat/completions URL.".to_string());
        }
        let base = if endpoint.is_empty() {
            match provider_lower.as_str() {
                "openai" => "https://api.openai.com/v1",
                "deepseek" => "https://api.deepseek.com/v1",
                "groq" => "https://api.groq.com/openai/v1",
                "lmstudio" | "lmstudio_local" => "http://127.0.0.1:1234/v1",
                _ => return Err(format!("Provider '{provider}' requires an explicit compatible API endpoint.")),
            }
        } else {
            endpoint
        };
        let url = openai_compatible_chat_url(base);
        if key.is_empty() && (provider_lower == "openai" || provider_lower == "deepseek" || provider_lower == "groq") {
            return Err(format!("{} API key is missing. Add it in provider settings.", provider));
        }
        (
            url,
            serde_json::json!({
                "model": model,
                "messages": messages.iter().map(|m| serde_json::json!({"role": m.role, "content": m.content})).collect::<Vec<_>>(),
                "temperature": temp,
                "stream": false
            }),
            "bearer"
        )
    };

    let mut request = client.post(&url).json(&body);
    match auth_mode {
        "bearer" if !key.is_empty() => { request = request.bearer_auth(key); }
        "anthropic" => {
            request = request.header("x-api-key", key).header("anthropic-version", "2023-06-01");
        }
        "gemini" => {
            request = request.query(&[("key", key)]);
        }
        _ => {}
    }
    let response = request.send().await.map_err(|e| format!("Provider request failed: {e}"))?;
    let status = response.status();
    let response_text = response.text().await.map_err(|e| format!("Could not read provider response: {e}"))?;
    if !status.is_success() {
        let detail = serde_json::from_str::<serde_json::Value>(&response_text)
            .ok()
            .and_then(|v| v.get("error").and_then(|e| e.get("message").or_else(|| e.get("type"))).and_then(|v| v.as_str()).map(str::to_string))
            .unwrap_or_else(|| response_text.chars().take(700).collect());
        return Err(format!("Provider returned HTTP {status}: {detail}"));
    }
    let value: serde_json::Value = serde_json::from_str(&response_text)
        .map_err(|e| format!("Provider returned invalid JSON: {e}"))?;
    let reply = if provider_lower == "ollama_local" || provider_lower == "ollama" {
        value.pointer("/message/content").and_then(|v| v.as_str()).map(str::to_string)
    } else if provider_lower == "gemini_cloud" || provider_lower == "gemini" {
        value.pointer("/candidates/0/content/parts").and_then(|v| v.as_array()).map(|parts| {
            parts.iter().filter_map(|p| p.get("text").and_then(|t| t.as_str())).collect::<Vec<_>>().join("")
        })
    } else if provider_lower == "anthropic" {
        value.get("content").and_then(|v| v.as_array()).map(|parts| {
            parts.iter().filter_map(|p| p.get("text").and_then(|t| t.as_str())).collect::<Vec<_>>().join("")
        })
    } else {
        value.pointer("/choices/0/message/content").and_then(|v| v.as_str()).map(str::to_string)
            .or_else(|| value.pointer("/choices/0/message/content/0/text").and_then(|v| v.as_str()).map(str::to_string))
    };
    reply.filter(|s| !s.trim().is_empty()).ok_or_else(|| "Provider returned no text content. Check the selected model and provider response format.".to_string())
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct ProviderTestResult {
    status: String,
    message: String,
    models: Vec<String>,
}

#[tauri::command]
async fn test_provider_connection(
    provider: String,
    endpoint_url: String,
    model_name: String,
    api_key: Option<String>,
) -> ProviderTestResult {
    let kind = provider.to_lowercase();
    let endpoint = endpoint_url.trim().trim_end_matches('/');
    let key = api_key.as_deref().unwrap_or("").trim();
    let failed = |message: String| ProviderTestResult {
        status: "offline".into(),
        message,
        models: vec![],
    };

    if kind == "offline_core" {
        return failed("The built-in offline model engine is not implemented. Select Ollama or another real provider.".into());
    }
    if model_name.trim().is_empty() {
        return failed("Select a model before testing the connection.".into());
    }
    if matches!(kind.as_str(), "gemini_cloud" | "gemini" | "openai" | "anthropic" | "deepseek" | "groq") && key.is_empty() {
        return failed("API key is missing. Add the provider key before testing the connection.".into());
    }
    if matches!(kind.as_str(), "custom_local" | "custom") && endpoint.is_empty() {
        return failed("Custom compatible providers require an explicit base URL or full /chat/completions URL.".into());
    }

    let base = if endpoint.is_empty() {
        match kind.as_str() {
            "gemini_cloud" | "gemini" => "https://generativelanguage.googleapis.com",
            "ollama_local" | "ollama" => "http://127.0.0.1:11434",
            "lmstudio_local" | "lmstudio" => "http://127.0.0.1:1234/v1",
            "anthropic" => "https://api.anthropic.com",
            "deepseek" => "https://api.deepseek.com/v1",
            "groq" => "https://api.groq.com/openai/v1",
            _ => "https://api.openai.com/v1",
        }
    } else {
        endpoint
    };

    let client = match reqwest::Client::builder().timeout(Duration::from_secs(20)).build() {
        Ok(client) => client,
        Err(e) => return failed(format!("Could not initialize network client: {e}")),
    };

    let model = model_name.trim();
    let (url, body, auth) = if kind == "ollama_local" || kind == "ollama" {
        let url = if base.ends_with("/api/chat") {
            base.to_string()
        } else if base.ends_with("/api/tags") {
            format!("{}/api/chat", base.trim_end_matches("/api/tags"))
        } else {
            format!("{base}/api/chat")
        };
        (
            url,
            serde_json::json!({
                "model": model,
                "messages": [{"role": "user", "content": "Reply with OK."}],
                "stream": false,
                "options": {"temperature": 0}
            }),
            "none"
        )
    } else if kind == "gemini_cloud" || kind == "gemini" {
        (
            gemini_generate_url(base, model),
            serde_json::json!({
                "contents": [{"parts": [{"text": "Reply with OK."}]}],
                "generationConfig": {"temperature": 0, "maxOutputTokens": 8}
            }),
            "gemini"
        )
    } else if kind == "anthropic" {
        let url = anthropic_messages_url(base);
        (
            url,
            serde_json::json!({
                "model": model,
                "max_tokens": 8,
                "temperature": 0,
                "messages": [{"role": "user", "content": "Reply with OK."}]
            }),
            "anthropic"
        )
    } else {
        (
            openai_compatible_chat_url(base),
            serde_json::json!({
                "model": model,
                "messages": [{"role": "user", "content": "Reply with OK."}],
                "temperature": 0,
                "max_tokens": 8,
                "stream": false
            }),
            "bearer"
        )
    };

    let mut request = client.post(&url).json(&body);
    match auth {
        "bearer" if !key.is_empty() => { request = request.bearer_auth(key); }
        "anthropic" => {
            request = request.header("x-api-key", key).header("anthropic-version", "2023-06-01");
        }
        "gemini" => { request = request.query(&[("key", key)]); }
        _ => {}
    }

    match request.send().await {
        Ok(response) => {
            let status = response.status();
            let response_text = match response.text().await {
                Ok(text) => text,
                Err(e) => return failed(format!("Could not read provider response: {e}")),
            };
            if !status.is_success() {
                let detail = serde_json::from_str::<serde_json::Value>(&response_text)
                    .ok()
                    .and_then(|v| {
                        v.pointer("/error/message")
                            .or_else(|| v.pointer("/error"))
                            .or_else(|| v.pointer("/message"))
                            .and_then(|value| value.as_str().map(str::to_string).or_else(|| Some(value.to_string())))
                    })
                    .unwrap_or_else(|| response_text.chars().take(600).collect());
                return failed(format!("Provider returned HTTP {status}: {detail}"));
            }

            let value = match serde_json::from_str::<serde_json::Value>(&response_text) {
                Ok(value) => value,
                Err(e) => return failed(format!("Provider returned invalid JSON: {e}")),
            };
            let generated_text = if kind == "ollama_local" || kind == "ollama" {
                value.pointer("/message/content").and_then(|v| v.as_str())
            } else if kind == "gemini_cloud" || kind == "gemini" {
                value.pointer("/candidates/0/content/parts/0/text").and_then(|v| v.as_str())
            } else if kind == "anthropic" {
                value.pointer("/content/0/text").and_then(|v| v.as_str())
            } else {
                value.pointer("/choices/0/message/content").and_then(|v| v.as_str())
            };

            match generated_text {
                Some(text) if !text.trim().is_empty() => ProviderTestResult {
                    status: "online".into(),
                    message: format!("Live test succeeded: '{}' generated a response.", model),
                    models: vec![model.to_string()],
                },
                _ => failed("The endpoint responded successfully but returned no readable text for the test prompt. Check the model and response format.".into()),
            }
        }
        Err(e) => failed(format!("Connection failed: {e}")),
    }
}

/// Starts the native Supru desktop shell.
/// The filesystem plugin's only global config option is requireLiteralLeadingDot;
/// path scopes and shell command scopes belong in Tauri v2 capability permissions.
///
/// The React/Vite UI is loaded by Tauri. Native capabilities are deliberately
/// registered here rather than relying on a browser page to access the OS.
/// The macOS workflow validates this configuration and smoke-tests the packaged executable.

#[tauri::command]
fn store_secret(secret_id: String, secret_value: String) -> Result<(), String> {
    let id = secret_id.trim();
    if id.is_empty() || id.len() > 240 || secret_value.is_empty() {
        return Err("A valid secret ID and non-empty secret are required.".to_string());
    }
    #[cfg(target_os = "macos")]
    {
        security_framework::passwords::set_generic_password("com.supru.ai", id, secret_value.as_bytes())
            .map_err(|e| format!("Could not store credential in macOS Keychain: {e}"))
    }
    #[cfg(not(target_os = "macos"))]
    {
        let _ = secret_value;
        Err("Secure credential storage is currently implemented for macOS only.".to_string())
    }
}

#[tauri::command]
fn get_secret(secret_id: String) -> Result<Option<String>, String> {
    let id = secret_id.trim();
    if id.is_empty() || id.len() > 240 {
        return Err("A valid secret ID is required.".to_string());
    }
    #[cfg(target_os = "macos")]
    {
        match security_framework::passwords::get_generic_password("com.supru.ai", id) {
            Ok(bytes) => String::from_utf8(bytes).map(Some).map_err(|_| "Stored credential is not valid UTF-8.".to_string()),
            Err(error) if error.code() == -25300 => Ok(None),
            Err(error) => Err(format!("Could not read credential from macOS Keychain: {error}")),
        }
    }
    #[cfg(not(target_os = "macos"))]
    {
        Ok(None)
    }
}

#[tauri::command]
fn delete_secret(secret_id: String) -> Result<(), String> {
    let id = secret_id.trim();
    if id.is_empty() || id.len() > 240 {
        return Err("A valid secret ID is required.".to_string());
    }
    #[cfg(target_os = "macos")]
    {
        match security_framework::passwords::delete_generic_password("com.supru.ai", id) {
            Ok(()) => Ok(()),
            Err(error) if error.code() == -25300 => Ok(()),
            Err(error) => Err(format!("Could not delete credential from macOS Keychain: {error}")),
        }
    }
    #[cfg(not(target_os = "macos"))]
    {
        Ok(())
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![execute_terminal_command, execute_sandboxed_command, chat_completion, test_provider_connection, store_secret, get_secret, delete_secret, generate_image, choose_workspace_folder, list_workspace_files, read_workspace_file, create_workspace_directory, write_workspace_file])
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_opener::init())
        .run(tauri::generate_context!("tauri.conf.json"))
        .expect("failed to start Supru desktop application");
}

#[cfg(test)]
mod provider_url_tests {
    use super::{anthropic_messages_url, gemini_generate_url, openai_compatible_chat_url, openai_compatible_models_url};

    #[test]
    fn compatible_chat_urls_accept_base_and_full_endpoint() {
        assert_eq!(openai_compatible_chat_url("https://openrouter.ai/api/v1"), "https://openrouter.ai/api/v1/chat/completions");
        assert_eq!(openai_compatible_chat_url("https://openrouter.ai/api/v1/chat/completions"), "https://openrouter.ai/api/v1/chat/completions");
        assert_eq!(openai_compatible_chat_url("https://integrate.api.nvidia.com/v1/models"), "https://integrate.api.nvidia.com/v1/chat/completions");
    }

    #[test]
    fn compatible_model_urls_accept_base_and_full_endpoint() {
        assert_eq!(openai_compatible_models_url("https://openrouter.ai/api/v1"), "https://openrouter.ai/api/v1/models");
        assert_eq!(openai_compatible_models_url("https://openrouter.ai/api/v1/chat/completions"), "https://openrouter.ai/api/v1/models");
        assert_eq!(openai_compatible_models_url("https://integrate.api.nvidia.com/v1/models"), "https://integrate.api.nvidia.com/v1/models");
    }

    #[test]
    fn anthropic_urls_do_not_duplicate_v1_or_messages() {
        assert_eq!(anthropic_messages_url("https://api.anthropic.com"), "https://api.anthropic.com/v1/messages");
        assert_eq!(anthropic_messages_url("https://api.anthropic.com/v1"), "https://api.anthropic.com/v1/messages");
        assert_eq!(anthropic_messages_url("https://api.anthropic.com/v1/messages"), "https://api.anthropic.com/v1/messages");
    }

    #[test]
    fn gemini_urls_accept_base_and_full_endpoint() {
        assert_eq!(gemini_generate_url("https://generativelanguage.googleapis.com", "gemini-2.5-flash"), "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent");
        assert_eq!(gemini_generate_url("https://generativelanguage.googleapis.com/v1beta", "gemini-2.5-flash"), "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent");
        assert_eq!(gemini_generate_url("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash", "ignored"), "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent");
    }
}
