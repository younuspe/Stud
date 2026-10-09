fn main() {
    let attributes = tauri_build::Attributes::new()
        .config_path("tauri.conf.json");

    tauri_build::try_build(attributes)
        .expect("failed to build Supru using the repository tauri.conf.json");
}
