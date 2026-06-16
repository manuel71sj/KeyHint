#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct AppStatus {
    app_name: &'static str,
    local_only: bool,
    input_monitoring: &'static str,
    mock_hud_available: bool,
}

#[tauri::command]
fn app_status() -> AppStatus {
    AppStatus {
        app_name: "KeyHint for Mac",
        local_only: true,
        input_monitoring: "not_determined",
        mock_hud_available: true,
    }
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![app_status])
        .run(tauri::generate_context!())
        .expect("error while running KeyHint");
}
