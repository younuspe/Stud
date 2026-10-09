#![cfg_attr(not(debug_assertions), deny(unsafe_code))]

/// Starts the native Supru desktop shell.
/// The filesystem plugin's only global config option is requireLiteralLeadingDot;
/// path scopes and shell command scopes belong in Tauri v2 capability permissions.
///
/// The React/Vite UI is loaded by Tauri. Native capabilities are deliberately
/// registered here rather than relying on a browser page to access the OS.
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_opener::init())
        .run(tauri::generate_context!("tauri.conf.json"))
        .expect("failed to start Supru desktop application");
}
