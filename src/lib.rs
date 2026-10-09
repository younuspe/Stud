#![cfg_attr(not(debug_assertions), deny(unsafe_code))]

use tauri::Manager;
use std::{path::PathBuf, sync::Mutex};

#[cfg(not(debug_assertions))]
use std::{
    net::{SocketAddr, TcpStream},
    process::{Child, Command, Stdio},
    thread,
    time::{Duration, Instant},
};

#[cfg(not(debug_assertions))]
struct BackendProcess(Mutex<Child>);

#[cfg(not(debug_assertions))]
fn start_backend(app: &mut tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    use tauri::path::BaseDirectory;

    const API_PORT: u16 = 43127;

    let resource_dir = app.path().resource_dir()?;
    let node = app.path().resolve("node", BaseDirectory::Resource)?;
    let server = app.path().resolve("server.mjs", BaseDirectory::Resource)?;

    if !node.is_file() {
        return Err(format!("Bundled Node runtime is missing: {}", node.display()).into());
    }
    if !server.is_file() {
        return Err(format!("Bundled API server is missing: {}", server.display()).into());
    }

    let address = SocketAddr::from(([127, 0, 0, 1], API_PORT));
    if TcpStream::connect_timeout(&address, Duration::from_millis(100)).is_ok() {
        return Err(format!("Supru API port {API_PORT} is already in use; close the conflicting process and restart Supru.").into());
    }

    let mut child = Command::new(&node)
        .arg(&server)
        .current_dir(&resource_dir)
        .env("NODE_ENV", "production")
        .env("PORT", API_PORT.to_string())
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .spawn()?;

    // Do not show a window whose API layer never started. This catches missing
    // resources, a bad runtime, and port conflicts at startup instead of letting
    // every feature fail later with an opaque fetch error.
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
            return Err("Supru API server did not start within 12 seconds".into());
        }
        thread::sleep(Duration::from_millis(100));
    }

    app.manage(BackendProcess(Mutex::new(child)));
    Ok(())
}


#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct WorkspaceEntry {
    path: String,
    name: String,
    is_dir: bool,
    size: u64,
}

struct SelectedWorkspace(Mutex<Option<PathBuf>>);

fn selected_workspace_root(workspace: &SelectedWorkspace) -> Result<PathBuf, String> {
    workspace.0
        .lock()
        .map_err(|_| "Workspace state is unavailable.".to_string())?
        .as_ref()
        .cloned()
        .ok_or_else(|| "Open a workspace folder first.".to_string())
}

#[tauri::command]
fn restore_workspace(
    app: tauri::AppHandle,
    workspace: tauri::State<'_, SelectedWorkspace>,
) -> Result<Option<String>, String> {
    let data_dir = app.path().app_data_dir().map_err(|error| error.to_string())?;
    let saved_path = data_dir.join("workspace-root.txt");
    if !saved_path.is_file() {
        return Ok(None);
    }
    let saved = std::fs::read_to_string(&saved_path).map_err(|error| error.to_string())?;
    let root = match canonical_workspace_root(saved.trim()) {
        Ok(root) => root,
        Err(_) => return Ok(None),
    };
    *workspace.0.lock().map_err(|_| "Workspace state is unavailable.".to_string())? = Some(root.clone());
    Ok(Some(root.to_string_lossy().into_owned()))
}

fn canonical_workspace_root(root: &str) -> Result<std::path::PathBuf, String> {
    let canonical = std::path::Path::new(root)
        .canonicalize()
        .map_err(|error| format!("Cannot open workspace folder: {error}"))?;
    if !canonical.is_dir() {
        return Err("The selected workspace is not a directory.".into());
    }
    Ok(canonical)
}

fn safe_relative_path(relative_path: &str) -> Result<std::path::PathBuf, String> {
    use std::path::{Component, Path};
    let relative = Path::new(relative_path);
    if relative.is_absolute()
        || relative.components().any(|component| {
            !matches!(component, Component::Normal(_))
        })
    {
        return Err("The path must be relative to the selected workspace and cannot contain '..'.".into());
    }
    Ok(relative.to_path_buf())
}

#[tauri::command]
fn select_workspace(
    app: tauri::AppHandle,
    workspace: tauri::State<'_, SelectedWorkspace>,
) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::DialogExt;
    let Some(selected) = app.dialog().file().blocking_pick_folder() else {
        return Ok(None);
    };
    let selected_path = selected.into_path().map_err(|error| error.to_string())?;
    let root = canonical_workspace_root(&selected_path.to_string_lossy())?;
    let data_dir = app.path().app_data_dir().map_err(|error| error.to_string())?;
    std::fs::create_dir_all(&data_dir).map_err(|error| error.to_string())?;
    std::fs::write(data_dir.join("workspace-root.txt"), root.to_string_lossy().as_bytes())
        .map_err(|error| format!("Could not persist workspace selection: {error}"))?;
    *workspace.0.lock().map_err(|_| "Workspace state is unavailable.".to_string())? = Some(root.clone());
    Ok(Some(root.to_string_lossy().into_owned()))
}

#[tauri::command]
fn workspace_list(workspace: tauri::State<'_, SelectedWorkspace>) -> Result<Vec<WorkspaceEntry>, String> {
    use std::path::Path;
    let root = selected_workspace_root(&workspace)?;
    let ignored = [".git", "node_modules", "target", "dist", ".next", ".venv", "venv"];
    let mut entries = Vec::new();

    for entry in walkdir::WalkDir::new(&root)
        .max_depth(8)
        .follow_links(false)
        .into_iter()
        .filter_map(Result::ok)
    {
        if entry.depth() == 0 {
            continue;
        }
        let path = entry.path();
        let relative = path.strip_prefix(&root).map_err(|error| error.to_string())?;
        if relative.components().any(|component| {
            let part = component.as_os_str().to_string_lossy();
            ignored.iter().any(|ignored_part| part == *ignored_part)
        }) {
            continue;
        }
        if entry.file_type().is_symlink() {
            continue;
        }
        let is_dir = entry.file_type().is_dir();
        if !is_dir && !entry.file_type().is_file() {
            continue;
        }
        let metadata = entry.metadata().map_err(|error| error.to_string())?;
        entries.push(WorkspaceEntry {
            path: relative.to_string_lossy().replace('\\', "/"),
            name: Path::new(path).file_name().unwrap_or_default().to_string_lossy().into_owned(),
            is_dir,
            size: metadata.len(),
        });
        if entries.len() >= 1500 {
            break;
        }
    }

    entries.sort_by(|a, b| {
        b.is_dir.cmp(&a.is_dir).then_with(|| a.path.to_lowercase().cmp(&b.path.to_lowercase()))
    });
    Ok(entries)
}

#[tauri::command]
fn workspace_read_file(workspace: tauri::State<'_, SelectedWorkspace>, relative_path: String) -> Result<String, String> {
    use std::fs;
    let root = selected_workspace_root(&workspace)?;
    let relative = safe_relative_path(&relative_path)?;
    let target = root.join(relative);
    let canonical_target = target
        .canonicalize()
        .map_err(|error| format!("Cannot open file: {error}"))?;
    if !canonical_target.starts_with(&root) {
        return Err("The requested file is outside the selected workspace.".into());
    }
    let metadata = fs::metadata(&canonical_target).map_err(|error| error.to_string())?;
    if !metadata.is_file() {
        return Err("Only files can be opened in the editor.".into());
    }
    if metadata.len() > 5 * 1024 * 1024 {
        return Err("Files larger than 5 MB cannot be opened in the editor.".into());
    }
    fs::read_to_string(canonical_target)
        .map_err(|error| format!("File is not readable UTF-8 text: {error}"))
}

#[tauri::command]
fn workspace_write_file(workspace: tauri::State<'_, SelectedWorkspace>, relative_path: String, content: String) -> Result<(), String> {
    use std::fs::{self, OpenOptions};
    use std::io::Write;
    if content.len() > 5 * 1024 * 1024 {
        return Err("Files larger than 5 MB cannot be saved from the editor.".into());
    }

    let root = selected_workspace_root(&workspace)?;
    let relative = safe_relative_path(&relative_path)?;
    if relative.as_os_str().is_empty() || relative.file_name().is_none() {
        return Err("A file name is required.".into());
    }
    let target = root.join(&relative);
    let parent = target.parent().ok_or("The file path has no parent directory.")?;
    let canonical_parent = parent
        .canonicalize()
        .map_err(|error| format!("Parent folder does not exist: {error}"))?;
    if !canonical_parent.starts_with(&root) {
        return Err("The requested file is outside the selected workspace.".into());
    }

    if let Ok(metadata) = fs::symlink_metadata(&target) {
        if metadata.file_type().is_symlink() || !metadata.is_file() {
            return Err("Refusing to overwrite a symlink or non-file path.".into());
        }
    }

    let temporary = canonical_parent.join(format!(".supru-tmp-{}", uuid::Uuid::new_v4()));
    let mut file = OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(&temporary)
        .map_err(|error| format!("Cannot create temporary save file: {error}"))?;
    if let Err(error) = file.write_all(content.as_bytes()).and_then(|_| file.sync_all()) {
        let _ = fs::remove_file(&temporary);
        return Err(format!("Cannot write file: {error}"));
    }
    drop(file);
    if let Err(error) = fs::rename(&temporary, &target) {
        let _ = fs::remove_file(&temporary);
        return Err(format!("Cannot replace target file: {error}"));
    }
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
        .manage(SelectedWorkspace(Mutex::new(None)))
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            select_workspace,
            restore_workspace,
            workspace_list,
            workspace_read_file,
            workspace_write_file
        ]);

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
