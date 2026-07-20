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

/// If a validated restore was staged (see `commands::stage_restore`), apply it now.
/// This is the ONLY safe moment to swap the file: no SQLite connection is open yet,
/// so there's no risk of replacing a file out from under a live handle. The current
/// vault is renamed aside (never deleted) first, so even a last-second surprise
/// never destroys the user's prior data.
/// `stage_restore` already validates the file before writing it out, but the write
/// itself could still be interrupted (disk full, power loss) between then and this
/// next launch, leaving a truncated/corrupt pending file. Re-checking the SQLite
/// header here — reading only the first 16 bytes, not the whole file — means a
/// corrupt pending file is quietly discarded instead of being swapped in, which
/// would otherwise leave the user's vault unable to open.
fn has_valid_sqlite_header(path: &std::path::Path) -> bool {
    use std::io::Read;
    let mut buf = [0u8; 16];
    match std::fs::File::open(path) {
        Ok(mut f) => f.read_exact(&mut buf).is_ok() && &buf == b"SQLite format 3\0",
        Err(_) => false,
    }
}

fn apply_pending_restore_if_any(db_path: &std::path::Path) {
    let pending_path = db_path.with_file_name("vault.db.pending-restore");
    if !pending_path.exists() {
        return;
    }
    if !has_valid_sqlite_header(&pending_path) {
        let _ = std::fs::remove_file(&pending_path);
        return;
    }
    if db_path.exists() {
        let stamp = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|d| d.as_secs())
            .unwrap_or(0);
        let backup_name = format!("vault.db.bak-{}", stamp);
        let _ = std::fs::rename(db_path, db_path.with_file_name(backup_name));
    }
    let _ = std::fs::rename(&pending_path, db_path);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let db_path = get_db_path(app);
            apply_pending_restore_if_any(&db_path);

            let conn = Connection::open(&db_path)
                .expect("SQLite 데이터베이스를 열 수 없습니다");

            db::init_db(&conn).expect("데이터베이스 초기화 실패");

            app.manage(AppState {
                db: Mutex::new(conn),
                encryption_key: Mutex::new(None),
                db_path,
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
            commands::get_key_accounts,
            commands::set_key_accounts,
            commands::quick_update_key_value,
            commands::export_env,
            commands::import_env,
            commands::unlock_with_recovery,
            commands::change_master_password,
            commands::regenerate_recovery_key,
            commands::write_text_file,
            commands::read_text_file,
            commands::backup_vault,
            commands::stage_restore,
            commands::has_pending_restore,
            commands::cancel_pending_restore,
            commands::create_tag,
            commands::list_tags,
            commands::delete_tag,
            commands::get_recent_logs,
            commands::get_stats,
            commands::get_preference,
            commands::set_preference,
        ])
        .run(tauri::generate_context!())
        .expect("API Key SafePass 실행 중 오류 발생");
}

#[cfg(test)]
mod tests {
    use super::*;

    fn temp_path(name: &str) -> std::path::PathBuf {
        std::env::temp_dir().join(format!("safepass_lib_test_{}_{}", std::process::id(), name))
    }

    /// A per-test, isolated directory containing a file literally named "vault.db" —
    /// mirrors production layout (app_dir/vault.db) so `with_file_name("vault.db.pending-restore")`
    /// resolves the same way the code under test resolves it, and keeps parallel
    /// tests from colliding on a shared pending-restore path.
    fn temp_vault_dir(name: &str) -> std::path::PathBuf {
        let dir = std::env::temp_dir().join(format!("safepass_lib_test_{}_{}", std::process::id(), name));
        std::fs::create_dir_all(&dir).unwrap();
        dir
    }

    #[test]
    fn has_valid_sqlite_header_accepts_real_header() {
        let path = temp_path("valid.db");
        let mut bytes = b"SQLite format 3\0".to_vec();
        bytes.extend_from_slice(&[0u8; 32]);
        std::fs::write(&path, &bytes).unwrap();

        assert!(has_valid_sqlite_header(&path));

        let _ = std::fs::remove_file(&path);
    }

    #[test]
    fn has_valid_sqlite_header_rejects_truncated_or_corrupt_file() {
        let path = temp_path("corrupt.db");
        std::fs::write(&path, b"not a real database").unwrap();

        assert!(!has_valid_sqlite_header(&path));

        let _ = std::fs::remove_file(&path);
    }

    #[test]
    fn has_valid_sqlite_header_rejects_missing_file() {
        let path = temp_path("missing.db");
        assert!(!has_valid_sqlite_header(&path));
    }

    // Regression test for the interrupted-write scenario: a corrupt pending file
    // must be discarded, and the current vault must be left completely untouched.
    #[test]
    fn apply_pending_restore_discards_corrupt_pending_file_and_keeps_current_vault() {
        let dir = temp_vault_dir("discard_corrupt");
        let db_path = dir.join("vault.db");
        let pending_path = db_path.with_file_name("vault.db.pending-restore");
        std::fs::write(&db_path, b"SQLite format 3\0ORIGINAL-DATA").unwrap();
        std::fs::write(&pending_path, b"garbage, not sqlite").unwrap();

        apply_pending_restore_if_any(&db_path);

        assert!(!pending_path.exists(), "corrupt pending file should be removed");
        assert_eq!(std::fs::read(&db_path).unwrap(), b"SQLite format 3\0ORIGINAL-DATA");

        let _ = std::fs::remove_dir_all(&dir);
    }

    #[test]
    fn apply_pending_restore_swaps_in_valid_pending_file_and_preserves_old_as_backup() {
        let dir = temp_vault_dir("swap_valid");
        let db_path = dir.join("vault.db");
        let pending_path = db_path.with_file_name("vault.db.pending-restore");
        std::fs::write(&db_path, b"SQLite format 3\0OLD-DATA").unwrap();
        std::fs::write(&pending_path, b"SQLite format 3\0NEW-DATA").unwrap();

        apply_pending_restore_if_any(&db_path);

        assert!(!pending_path.exists());
        assert_eq!(std::fs::read(&db_path).unwrap(), b"SQLite format 3\0NEW-DATA");

        // The old vault must still exist somewhere as a .bak — never silently lost.
        let has_backup = std::fs::read_dir(&dir).unwrap().filter_map(|e| e.ok()).any(|e| {
            e.file_name().to_string_lossy().starts_with("vault.db.bak-")
        });
        assert!(has_backup, "expected a vault.db.bak-<timestamp> file to be created");

        let _ = std::fs::remove_dir_all(&dir);
    }
}
