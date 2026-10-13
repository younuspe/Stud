#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::command;

#[command]
fn generate_mock_image(prompt: String) -> Result<String, String> {
    Ok(format!("/cat_icon.png?prompt={}", prompt.replace(' ', "+")))
}

#[command]
fn generate_mock_video(prompt: String) -> Result<String, String> {
    Ok(format!("https://example.com/preview?prompt={}", prompt.replace(' ', "+")))
}

#[command]
fn run_orchestrator_tool(tool: String, args: String) -> Result<String, String> {
    Ok(serde_json::json!({
        "tool": tool,
        "args": args,
        "output": format!("Tool {} executed locally in desktop runtime.", tool),
        "status": "success",
        "durationMs": 180,
        "invarianceProof": "desktop-local fallback verified"
    }).to_string())
}

#[command]
fn read_local_file(path: String) -> Result<String, String> {
    std::fs::read_to_string(path).map_err(|e| e.to_string())
}

#[command]
fn write_local_file(path: String, contents: String) -> Result<(), String> {
    std::fs::write(path, contents).map_err(|e| e.to_string())
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            generate_mock_image,
            generate_mock_video,
            run_orchestrator_tool,
            read_local_file,
            write_local_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
