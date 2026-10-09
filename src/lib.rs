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
    let output = timeout(
        Duration::from_secs(30),
        Command::new("/bin/zsh")
            .arg("-lc")
            .arg(&command)
            .current_dir(&working_dir)
            .output()
    ).await.map_err(|_| "Command timed out after 30 seconds.".to_string())?
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

/// Starts the native Supru desktop shell.
/// The filesystem plugin's only global config option is requireLiteralLeadingDot;
/// path scopes and shell command scopes belong in Tauri v2 capability permissions.
///
/// The React/Vite UI is loaded by Tauri. Native capabilities are deliberately
/// registered here rather than relying on a browser page to access the OS.
/// The macOS workflow validates this configuration and smoke-tests the packaged executable.
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![execute_terminal_command])
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_opener::init())
        .run(tauri::generate_context!("tauri.conf.json"))
        .expect("failed to start Supru desktop application");
}
