#![cfg_attr(not(debug_assertions), deny(unsafe_code))]

use tauri::Manager;

#[cfg(not(debug_assertions))]
use std::{
    net::{SocketAddr, TcpStream},
    process::{Child, Command, Stdio},
    sync::Mutex,
    thread,
    time::{Duration, Instant},
};

#[cfg(not(debug_assertions))]
struct BackendProcess(Mutex<Child>);

#[cfg(not(debug_assertions))]
fn start_backend(app: &mut tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    use tauri::path::BaseDirectory;

    let resource_dir = app.path().resource_dir()?;
    let node = app.path().resolve("node", BaseDirectory::Resource)?;
    let server = app.path().resolve("server.mjs", BaseDirectory::Resource)?;

    if !node.is_file() {
        return Err(format!("Bundled Node runtime is missing: {}", node.display()).into());
    }
    if !server.is_file() {
        return Err(format!("Bundled API server is missing: {}", server.display()).into());
    }

    let mut child = Command::new(&node)
        .arg(&server)
        .current_dir(&resource_dir)
        .env("NODE_ENV", "production")
        .env("PORT", "3000")
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .spawn()?;

    // Do not show a window whose API layer never started. This catches missing
    // resources, a bad runtime, and port conflicts at startup instead of letting
    // every feature fail later with an opaque fetch error.
    let address = SocketAddr::from(([127, 0, 0, 1], 3000));
    let deadline = Instant::now() + Duration::from_secs(12);
    loop {
        if let Some(status) = child.try_wait()? {
            return Err(format!("Supru API server exited during startup: {status}").into());
        }
        if TcpStream::connect_timeout(&address, Duration::from_millis(200)).is_ok() {
            break;
        }
        if Instant::now() >= deadline {
            let _ = child.kill();
            let _ = child.wait();
            return Err("Supru API server did not start on 127.0.0.1:3000 within 12 seconds".into());
        }
        thread::sleep(Duration::from_millis(100));
    }

    app.manage(BackendProcess(Mutex::new(child)));
    Ok(())
}

/// Starts the native Supru desktop shell.
///
/// Development runs the API/Vite server through `npm run dev`. Packaged builds
/// start the bundled Node runtime and API server before displaying the frontend.
/// Native capabilities remain registered through Tauri rather than the browser.
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_opener::init());

    #[cfg(not(debug_assertions))]
    let builder = builder.setup(|app| start_backend(app));

    let app = builder
        .build(tauri::generate_context!("tauri.conf.json"))
        .expect("failed to start Supru desktop application");

    app.run(|app_handle, event| {
        #[cfg(not(debug_assertions))]
        if matches!(event, tauri::RunEvent::Exit) {
            if let Some(backend) = app_handle.try_state::<BackendProcess>() {
                if let Ok(mut child) = backend.0.lock() {
                    let _ = child.kill();
                    let _ = child.wait();
                }
            }
        }
    });
}
