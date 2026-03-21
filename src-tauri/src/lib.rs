mod commands;
mod crypto;
mod db;
mod models;

use commands::AppState;
use rusqlite::Connection;
use std::sync::Mutex;
use tauri::Manager;

fn get_db_path(app: &tauri::App) -> std::path::PathBuf {
    let app_dir = app
        .path()
        .app_data_dir()
        .expect("앱 데이터 디렉토리를 찾을 수 없습니다");
    std::fs::create_dir_all(&app_dir).expect("앱 데이터 디렉토리 생성 실패");
    app_dir.join("vault.db")
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let db_path = get_db_path(app);
            let conn = Connection::open(&db_path)
                .expect("SQLite 데이터베이스를 열 수 없습니다");

            db::init_db(&conn).expect("데이터베이스 초기화 실패");

            app.manage(AppState {
                db: Mutex::new(conn),
                encryption_key: Mutex::new(None),
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::check_has_master_password,
            commands::setup_master_password,
            commands::unlock,
            commands::lock,
            commands::create_project,
            commands::list_projects,
            commands::update_project,
            commands::delete_project,
            commands::create_api_key,
            commands::list_api_keys,
            commands::get_api_key_value,
            commands::update_api_key,
            commands::delete_api_key,
            commands::search_api_keys,
            commands::list_all_api_keys,
            commands::quick_update_key_value,
            commands::export_env,
            commands::import_env,
            commands::unlock_with_recovery,
            commands::change_master_password,
            commands::create_tag,
            commands::list_tags,
            commands::delete_tag,
            commands::get_recent_logs,
            commands::get_stats,
        ])
        .run(tauri::generate_context!())
        .expect("API Key Vault 실행 중 오류 발생");
}
