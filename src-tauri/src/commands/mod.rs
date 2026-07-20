use crate::crypto;
use crate::db;
use crate::models::*;
use base64::{engine::general_purpose::STANDARD as BASE64, Engine};
use rusqlite::Connection;
use std::sync::Mutex;
use tauri::State;

pub struct AppState {
    pub db: Mutex<Connection>,
    pub encryption_key: Mutex<Option<[u8; 32]>>,
    pub db_path: std::path::PathBuf,
}

fn err_to_string<E: std::fmt::Display>(_e: E) -> String {
    // Sanitize error messages — never expose internal details
    "내부 오류가 발생했습니다".to_string()
}

fn get_enc_key(state: &State<AppState>) -> Result<[u8; 32], String> {
    let key_guard = state.encryption_key.lock().map_err(|_| "잠금 상태 오류".to_string())?;
    key_guard.ok_or_else(|| "잠금이 해제되지 않았습니다".into())
}

// Allowed preference keys (H-3 fix: allowlist)
const ALLOWED_PREF_KEYS: &[&str] = &["autoLockMin", "clipboardClearSec", "blurEnabled", "blurDelaySec"];

// Validate URL scheme (H-1 fix)
fn is_safe_url(url: &str) -> bool {
    url.starts_with("https://") || url.starts_with("http://")
}

fn validate_accounts(accounts: &[AccountEntry]) -> Result<(), String> {
    if accounts.len() > 50 {
        return Err("계정은 최대 50개까지 저장할 수 있습니다".into());
    }
    for acc in accounts {
        if let Some(url) = &acc.site_url {
            if !url.is_empty() && !is_safe_url(url) {
                return Err("사이트 주소는 http:// 또는 https://로 시작해야 합니다".into());
            }
        }
    }
    Ok(())
}

fn validate_url_fields(service_url: &Option<String>, reference_urls: &Option<String>) -> Result<(), String> {
    if let Some(url) = service_url {
        if !url.is_empty() && !is_safe_url(url) {
            return Err("URL은 http:// 또는 https://로 시작해야 합니다".into());
        }
    }
    if let Some(refs) = reference_urls {
        if !refs.is_empty() {
            let parsed: Vec<serde_json::Value> = serde_json::from_str(refs)
                .map_err(|_| "참고 URL 형식이 올바르지 않습니다".to_string())?;
            for item in &parsed {
                if let Some(url) = item.get("url").and_then(|v| v.as_str()) {
                    if !is_safe_url(url) {
                        return Err("참고 URL은 http:// 또는 https://로 시작해야 합니다".into());
                    }
                }
            }
        }
    }
    Ok(())
}

// ========== Auth ==========

#[tauri::command]
pub fn check_has_master_password(state: State<AppState>) -> Result<bool, String> {
    let conn = state.db.lock().map_err(|_| "DB 잠금 오류".to_string())?;
    Ok(db::get_setting(&conn, "master_password_hash").map_err(err_to_string)?.is_some())
}

/// Generate fresh recovery-key material for `password` and persist it, returning
/// the base64 recovery key to show the user once. Shared by initial setup,
/// password change, and standalone recovery-key regeneration so all three paths
/// always leave the vault with a working recovery key (P0 fix — previously a
/// password change silently invalidated recovery with no way to reissue it).
fn generate_and_store_recovery_key(conn: &Connection, password: &str) -> Result<String, String> {
    let recovery_key = crypto::generate_salt();
    let mut full_recovery = vec![0u8; 32];
    full_recovery[..16].copy_from_slice(&recovery_key);
    let extra = crypto::generate_salt();
    full_recovery[16..].copy_from_slice(&extra);
    let recovery_b64 = BASE64.encode(&full_recovery);

    let recovery_hash = crypto::hash_password(&recovery_b64).map_err(err_to_string)?;
    db::set_setting(conn, "recovery_key_hash", &recovery_hash).map_err(err_to_string)?;

    let recovery_salt = crypto::generate_salt();
    let recovery_enc_key = crypto::derive_encryption_key(&recovery_b64, &recovery_salt).map_err(err_to_string)?;
    let encrypted_pw = crypto::encrypt_value(password, &recovery_enc_key).map_err(err_to_string)?;
    db::set_setting(conn, "recovery_encrypted_password", &encrypted_pw).map_err(err_to_string)?;
    db::set_setting(conn, "recovery_salt", &BASE64.encode(&recovery_salt)).map_err(err_to_string)?;
    db::set_setting(conn, "recovery_fail_count", "0").map_err(err_to_string)?;

    Ok(recovery_b64)
}

#[tauri::command]
pub fn setup_master_password(state: State<AppState>, password: String) -> Result<String, String> {
    if password.len() < 6 {
        return Err("비밀번호는 최소 6자 이상이어야 합니다".into());
    }

    let conn = state.db.lock().map_err(|_| "DB 잠금 오류".to_string())?;

    if db::get_setting(&conn, "master_password_hash").map_err(err_to_string)?.is_some() {
        return Err("마스터 비밀번호가 이미 설정되어 있습니다".into());
    }

    let hash = crypto::hash_password(&password).map_err(err_to_string)?;
    db::set_setting(&conn, "master_password_hash", &hash).map_err(err_to_string)?;

    let salt = crypto::generate_salt();
    let salt_b64 = BASE64.encode(&salt);
    db::set_setting(&conn, "encryption_salt", &salt_b64).map_err(err_to_string)?;

    let recovery_b64 = generate_and_store_recovery_key(&conn, &password)?;

    // Initialize unlock fail counter
    db::set_setting(&conn, "unlock_fail_count", "0").map_err(err_to_string)?;

    let enc_key = crypto::derive_encryption_key(&password, &salt).map_err(err_to_string)?;
    drop(conn); // Release DB lock before acquiring encryption_key lock
    let mut key_guard = state.encryption_key.lock().map_err(|_| "잠금 상태 오류".to_string())?;
    *key_guard = Some(enc_key);

    Ok(recovery_b64)
}

// C-4 fix: Backend-enforced rate limiting
fn check_rate_limit(conn: &Connection, counter_key: &str, max_attempts: i64, lockout_seconds: i64) -> Result<(), String> {
    let fail_count: i64 = db::get_setting(conn, counter_key)
        .map_err(err_to_string)?
        .and_then(|v| v.parse().ok())
        .unwrap_or(0);

    let locked_until = db::get_setting(conn, &format!("{}_locked_until", counter_key))
        .map_err(err_to_string)?
        .and_then(|v| v.parse::<i64>().ok())
        .unwrap_or(0);

    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs() as i64;

    if locked_until > now {
        let remaining = locked_until - now;
        return Err(format!("{}초 후에 다시 시도해주세요", remaining));
    }

    if fail_count >= max_attempts {
        let new_locked_until = now + lockout_seconds;
        db::set_setting(conn, &format!("{}_locked_until", counter_key), &new_locked_until.to_string()).map_err(err_to_string)?;
        db::set_setting(conn, counter_key, "0").map_err(err_to_string)?;
        return Err(format!("시도 횟수 초과! {}초 후에 다시 시도해주세요", lockout_seconds));
    }

    Ok(())
}

fn increment_fail_count(conn: &Connection, counter_key: &str) -> Result<(), String> {
    let count: i64 = db::get_setting(conn, counter_key)
        .map_err(err_to_string)?
        .and_then(|v| v.parse().ok())
        .unwrap_or(0);
    db::set_setting(conn, counter_key, &(count + 1).to_string()).map_err(err_to_string)?;
    Ok(())
}

fn reset_fail_count(conn: &Connection, counter_key: &str) -> Result<(), String> {
    db::set_setting(conn, counter_key, "0").map_err(err_to_string)?;
    Ok(())
}

#[tauri::command]
pub fn unlock(state: State<AppState>, password: String) -> Result<bool, String> {
    let conn = state.db.lock().map_err(|_| "DB 잠금 오류".to_string())?;

    // C-4 fix: Backend rate limiting (5 fails → 60s, persisted in DB)
    check_rate_limit(&conn, "unlock_fail_count", 5, 60)?;

    let hash = db::get_setting(&conn, "master_password_hash")
        .map_err(err_to_string)?
        .ok_or("마스터 비밀번호가 설정되지 않았습니다")?;

    let valid = crypto::verify_password(&password, &hash).map_err(err_to_string)?;
    if valid {
        let salt_b64 = db::get_setting(&conn, "encryption_salt").map_err(err_to_string)?.ok_or("설정 오류")?;
        let salt = BASE64.decode(&salt_b64).map_err(err_to_string)?;
        let enc_key = crypto::derive_encryption_key(&password, &salt).map_err(err_to_string)?;
        reset_fail_count(&conn, "unlock_fail_count")?;
        drop(conn); // Release DB lock before encryption_key lock (C-1 fix)
        let mut key_guard = state.encryption_key.lock().map_err(|_| "잠금 상태 오류".to_string())?;
        *key_guard = Some(enc_key);
    } else {
        increment_fail_count(&conn, "unlock_fail_count")?;
    }
    Ok(valid)
}

// C-3 fix: Rate limiting on recovery key unlock
#[tauri::command]
pub fn unlock_with_recovery(state: State<AppState>, recovery_key: String) -> Result<bool, String> {
    let conn = state.db.lock().map_err(|_| "DB 잠금 오류".to_string())?;

    check_rate_limit(&conn, "recovery_fail_count", 3, 300)?; // 3 fails → 5 min lockout

    let recovery_hash = db::get_setting(&conn, "recovery_key_hash")
        .map_err(err_to_string)?
        .ok_or("복구키가 설정되지 않았습니다")?;

    let valid = crypto::verify_password(&recovery_key, &recovery_hash).map_err(err_to_string)?;
    if !valid {
        increment_fail_count(&conn, "recovery_fail_count")?;
        return Ok(false);
    }

    reset_fail_count(&conn, "recovery_fail_count")?;

    let recovery_salt_b64 = db::get_setting(&conn, "recovery_salt").map_err(err_to_string)?.ok_or("복구 데이터 없음")?;
    let recovery_salt = BASE64.decode(&recovery_salt_b64).map_err(err_to_string)?;
    let recovery_enc_key = crypto::derive_encryption_key(&recovery_key, &recovery_salt).map_err(err_to_string)?;
    let encrypted_pw = db::get_setting(&conn, "recovery_encrypted_password").map_err(err_to_string)?.ok_or("복구 데이터 없음")?;
    let password = crypto::decrypt_value(&encrypted_pw, &recovery_enc_key).map_err(err_to_string)?;

    let salt_b64 = db::get_setting(&conn, "encryption_salt").map_err(err_to_string)?.ok_or("설정 오류")?;
    let salt = BASE64.decode(&salt_b64).map_err(err_to_string)?;
    let enc_key = crypto::derive_encryption_key(&password, &salt).map_err(err_to_string)?;
    drop(conn);
    let mut key_guard = state.encryption_key.lock().map_err(|_| "잠금 상태 오류".to_string())?;
    *key_guard = Some(enc_key);

    Ok(true)
}

// C-2 fix: Atomic password change with transaction + H-5/P0 fix: reissue recovery material
// instead of invalidating it (previously changing the password permanently killed recovery
// with no way to reissue it, since we never have the old recovery key in memory to
// re-encrypt under). Returns the new recovery key so the frontend can show a
// "save your new recovery key" screen right after a successful change.
#[tauri::command]
pub fn change_master_password(state: State<AppState>, current_password: String, new_password: String) -> Result<Option<String>, String> {
    if new_password.len() < 6 {
        return Err("새 비밀번호는 최소 6자 이상이어야 합니다".into());
    }

    // Step 1: Get current encryption key (lock encryption_key first, then db — consistent order)
    let old_enc_key = get_enc_key(&state)?;

    let conn = state.db.lock().map_err(|_| "DB 잠금 오류".to_string())?;

    // Verify current password
    let hash = db::get_setting(&conn, "master_password_hash").map_err(err_to_string)?.ok_or("비밀번호 미설정")?;
    if !crypto::verify_password(&current_password, &hash).map_err(err_to_string)? {
        return Err("현재 비밀번호가 올바르지 않습니다".into());
    }

    // Generate new credentials
    let new_hash = crypto::hash_password(&new_password).map_err(err_to_string)?;
    let new_salt = crypto::generate_salt();
    let new_enc_key = crypto::derive_encryption_key(&new_password, &new_salt).map_err(err_to_string)?;

    // C-2 fix: Use transaction for atomicity
    conn.execute("BEGIN EXCLUSIVE TRANSACTION", []).map_err(err_to_string)?;

    let result = (|| -> Result<Option<String>, String> {
        // Re-encrypt all keys (and any attached account credential sets — H-5/C-2 class fix:
        // skipping this would permanently strand accounts.password behind the old key)
        let all_keys = db::get_all_encrypted_keys(&conn).map_err(err_to_string)?;
        for (key_id, _name, encrypted, _p, _m, _s, _e, enc_accounts) in &all_keys {
            let plain = crypto::decrypt_value(encrypted, &old_enc_key).map_err(err_to_string)?;
            let re_encrypted = crypto::encrypt_value(&plain, &new_enc_key).map_err(err_to_string)?;
            conn.execute("UPDATE api_keys SET encrypted_value = ?1 WHERE id = ?2", rusqlite::params![re_encrypted, key_id]).map_err(err_to_string)?;

            if let Some(acc) = enc_accounts {
                if !acc.is_empty() {
                    let acc_plain = crypto::decrypt_value(acc, &old_enc_key).map_err(err_to_string)?;
                    let acc_re = crypto::encrypt_value(&acc_plain, &new_enc_key).map_err(err_to_string)?;
                    conn.execute("UPDATE api_keys SET encrypted_accounts = ?1 WHERE id = ?2", rusqlite::params![acc_re, key_id]).map_err(err_to_string)?;
                }
            }
        }

        // Update stored credentials
        db::set_setting(&conn, "master_password_hash", &new_hash).map_err(err_to_string)?;
        db::set_setting(&conn, "encryption_salt", &BASE64.encode(&new_salt)).map_err(err_to_string)?;

        // P0 fix: we cannot re-encrypt the OLD recovery material under the new password
        // (we never hold the recovery key itself in memory), so instead we mint an entirely
        // new recovery key tied to the new password — identical to initial setup — rather
        // than leaving the vault permanently without a working recovery path.
        let had_recovery = db::get_setting(&conn, "recovery_key_hash").map_err(err_to_string)?.is_some();
        let new_recovery_b64 = if had_recovery {
            Some(generate_and_store_recovery_key(&conn, &new_password)?)
        } else {
            None
        };

        Ok(new_recovery_b64)
    })();

    match result {
        Ok(new_recovery) => {
            conn.execute("COMMIT", []).map_err(err_to_string)?;
            drop(conn);
            let mut key_guard = state.encryption_key.lock().map_err(|_| "잠금 상태 오류".to_string())?;
            *key_guard = Some(new_enc_key);
            Ok(new_recovery)
        }
        Err(e) => {
            let _ = conn.execute("ROLLBACK", []);
            Err(e)
        }
    }
}

/// Reissue a fresh recovery key on demand (e.g. the user suspects their old one was
/// exposed, or they lost it) without requiring a full master-password change.
#[tauri::command]
pub fn regenerate_recovery_key(state: State<AppState>, current_password: String) -> Result<String, String> {
    // Vault must already be unlocked, and we re-verify the password for this
    // sensitive operation (same precondition as change_master_password).
    let _enc_key = get_enc_key(&state)?;
    let conn = state.db.lock().map_err(|_| "DB 잠금 오류".to_string())?;
    let hash = db::get_setting(&conn, "master_password_hash").map_err(err_to_string)?.ok_or("비밀번호 미설정")?;
    if !crypto::verify_password(&current_password, &hash).map_err(err_to_string)? {
        return Err("현재 비밀번호가 올바르지 않습니다".into());
    }
    generate_and_store_recovery_key(&conn, &current_password)
}

#[tauri::command]
pub fn lock(state: State<AppState>) -> Result<(), String> {
    let mut key_guard = state.encryption_key.lock().map_err(|_| "잠금 상태 오류".to_string())?;
    if let Some(ref mut key) = *key_guard {
        key.iter_mut().for_each(|b| *b = 0);
    }
    *key_guard = None;
    Ok(())
}

// ========== Projects ==========

#[tauri::command]
pub fn create_project(state: State<AppState>, input: CreateProjectInput) -> Result<Project, String> {
    let conn = state.db.lock().map_err(|_| "DB 잠금 오류".to_string())?;
    db::create_project(&conn, &input).map_err(err_to_string)
}

#[tauri::command]
pub fn list_projects(state: State<AppState>) -> Result<Vec<Project>, String> {
    let conn = state.db.lock().map_err(|_| "DB 잠금 오류".to_string())?;
    db::list_projects(&conn).map_err(err_to_string)
}

#[tauri::command]
pub fn update_project(state: State<AppState>, input: UpdateProjectInput) -> Result<(), String> {
    let conn = state.db.lock().map_err(|_| "DB 잠금 오류".to_string())?;
    db::update_project(&conn, &input).map_err(err_to_string)
}

#[tauri::command]
pub fn delete_project(state: State<AppState>, id: String) -> Result<(), String> {
    let conn = state.db.lock().map_err(|_| "DB 잠금 오류".to_string())?;
    db::delete_project(&conn, &id).map_err(err_to_string)
}

// ========== API Keys ==========

#[tauri::command]
pub fn create_api_key(state: State<AppState>, input: CreateApiKeyInput) -> Result<ApiKey, String> {
    validate_url_fields(&input.service_url, &input.reference_urls)?;
    let enc_key = get_enc_key(&state)?;
    let encrypted = crypto::encrypt_value(&input.value, &enc_key).map_err(err_to_string)?;
    let conn = state.db.lock().map_err(|_| "DB 잠금 오류".to_string())?;
    db::create_api_key(&conn, &input, &encrypted).map_err(err_to_string)
}

#[tauri::command]
pub fn list_api_keys(state: State<AppState>, project_id: String) -> Result<Vec<ApiKeyWithTags>, String> {
    let conn = state.db.lock().map_err(|_| "DB 잠금 오류".to_string())?;
    db::list_api_keys(&conn, &project_id).map_err(err_to_string)
}

#[tauri::command]
pub fn list_all_api_keys(state: State<AppState>) -> Result<Vec<ApiKeyWithTags>, String> {
    let conn = state.db.lock().map_err(|_| "DB 잠금 오류".to_string())?;
    db::list_all_api_keys(&conn).map_err(err_to_string)
}

#[tauri::command]
pub fn get_api_key_value(state: State<AppState>, key_id: String) -> Result<String, String> {
    let enc_key = get_enc_key(&state)?;
    let conn = state.db.lock().map_err(|_| "DB 잠금 오류".to_string())?;
    let encrypted = db::get_encrypted_value(&conn, &key_id).map_err(err_to_string)?;
    db::update_last_used(&conn, &key_id).map_err(err_to_string)?;
    db::add_usage_log(&conn, &key_id, "copied").map_err(err_to_string)?;
    crypto::decrypt_value(&encrypted, &enc_key).map_err(err_to_string)
}

#[tauri::command]
pub fn update_api_key(state: State<AppState>, input: UpdateApiKeyInput) -> Result<(), String> {
    validate_url_fields(&input.service_url, &input.reference_urls)?;
    let enc_key = get_enc_key(&state)?;
    let encrypted = match &input.value {
        Some(v) if !v.is_empty() => Some(crypto::encrypt_value(v, &enc_key).map_err(err_to_string)?),
        _ => None,
    };
    let conn = state.db.lock().map_err(|_| "DB 잠금 오류".to_string())?;
    db::update_api_key(&conn, &input, encrypted.as_deref()).map_err(err_to_string)
}

#[tauri::command]
pub fn delete_api_key(state: State<AppState>, id: String) -> Result<(), String> {
    let conn = state.db.lock().map_err(|_| "DB 잠금 오류".to_string())?;
    db::delete_api_key(&conn, &id).map_err(err_to_string)
}

#[tauri::command]
pub fn search_api_keys(state: State<AppState>, query: String) -> Result<Vec<ApiKeyWithTags>, String> {
    let conn = state.db.lock().map_err(|_| "DB 잠금 오류".to_string())?;
    db::search_api_keys(&conn, &query).map_err(err_to_string)
}

// ========== Accounts (username/password/site/extra key sets) ==========

#[tauri::command]
pub fn get_key_accounts(state: State<AppState>, key_id: String) -> Result<Vec<AccountEntry>, String> {
    let enc_key = get_enc_key(&state)?;
    let conn = state.db.lock().map_err(|_| "DB 잠금 오류".to_string())?;
    let encrypted = db::get_encrypted_accounts(&conn, &key_id).map_err(err_to_string)?;
    match encrypted {
        Some(enc) if !enc.is_empty() => {
            let plain = crypto::decrypt_value(&enc, &enc_key).map_err(err_to_string)?;
            serde_json::from_str(&plain).map_err(|_| "계정 데이터 형식 오류".to_string())
        }
        _ => Ok(vec![]),
    }
}

#[tauri::command]
pub fn set_key_accounts(state: State<AppState>, key_id: String, accounts: Vec<AccountEntry>) -> Result<(), String> {
    validate_accounts(&accounts)?;
    let enc_key = get_enc_key(&state)?;
    let encrypted = if accounts.is_empty() {
        None
    } else {
        let json = serde_json::to_string(&accounts).map_err(|_| "계정 데이터 직렬화 오류".to_string())?;
        Some(crypto::encrypt_value(&json, &enc_key).map_err(err_to_string)?)
    };
    let conn = state.db.lock().map_err(|_| "DB 잠금 오류".to_string())?;
    db::set_encrypted_accounts(&conn, &key_id, encrypted.as_deref()).map_err(err_to_string)
}

// ========== Quick Update Key Value ==========

#[tauri::command]
pub fn quick_update_key_value(state: State<AppState>, key_id: String, new_value: String) -> Result<(), String> {
    if new_value.trim().is_empty() {
        return Err("키값을 입력해주세요".into());
    }
    if key_id.trim().is_empty() || !key_id.starts_with("key-") {
        return Err("유효하지 않은 키 ID입니다".into());
    }
    let enc_key = get_enc_key(&state)?;
    let encrypted = crypto::encrypt_value(&new_value, &enc_key).map_err(err_to_string)?;
    let conn = state.db.lock().map_err(|_| "DB 잠금 오류".to_string())?;
    db::quick_update_encrypted_value(&conn, &key_id, &encrypted).map_err(err_to_string)?;
    db::add_usage_log(&conn, &key_id, "key_updated").map_err(err_to_string)?;
    Ok(())
}

// ========== .env Export/Import ==========

#[tauri::command]
pub fn export_env(state: State<AppState>, project_id: String) -> Result<String, String> {
    let enc_key = get_enc_key(&state)?;
    let conn = state.db.lock().map_err(|_| "DB 잠금 오류".to_string())?;
    let keys = db::list_api_keys(&conn, &project_id).map_err(err_to_string)?;

    let mut lines = vec!["# Generated by API Key SafePass".to_string(), String::new()];

    for k in &keys {
        let var_name = k.key.env_var_name.clone().unwrap_or_else(|| {
            let base = k.key.provider.as_deref().unwrap_or(&k.key.name);
            let name = base.to_uppercase().replace(|c: char| !c.is_alphanumeric(), "_");
            format!("{}_API_KEY", name.trim_end_matches('_'))
        });
        let encrypted = db::get_encrypted_value(&conn, &k.key.id).map_err(err_to_string)?;
        let value = crypto::decrypt_value(&encrypted, &enc_key).map_err(err_to_string)?;
        db::add_usage_log(&conn, &k.key.id, "exported").map_err(err_to_string)?;

        if let Some(memo) = &k.key.memo {
            lines.push(format!("# {}", memo));
        }
        lines.push(format!("{}={}", var_name, value));
    }

    Ok(lines.join("\n"))
}

/// Real-world .env files (not just ones this app exported) commonly quote values,
/// e.g. `API_KEY="sk-abc123"` — without stripping the matching quote pair, the
/// literal quote characters would be saved as part of the key, silently breaking it.
fn strip_matching_quotes(s: &str) -> &str {
    let bytes = s.as_bytes();
    if bytes.len() >= 2 {
        let first = bytes[0];
        let last = bytes[bytes.len() - 1];
        if (first == b'"' && last == b'"') || (first == b'\'' && last == b'\'') {
            return &s[1..s.len() - 1];
        }
    }
    s
}

#[tauri::command]
pub fn import_env(state: State<AppState>, project_id: String, content: String) -> Result<i64, String> {
    // M-3 fix: limit import size
    if content.len() > 1_000_000 {
        return Err("파일이 너무 큽니다 (최대 1MB)".into());
    }
    let enc_key = get_enc_key(&state)?;
    let conn = state.db.lock().map_err(|_| "DB 잠금 오류".to_string())?;

    // Wrapped in a transaction: without this, hitting the 500-key cap partway
    // through left everything imported so far silently committed while the user
    // only saw an error, with no way to tell how much actually landed.
    conn.execute("BEGIN TRANSACTION", []).map_err(err_to_string)?;
    let result = (|| -> Result<i64, String> {
        let mut count: i64 = 0;
        let max_keys = 500;

        for line in content.lines() {
            if count >= max_keys {
                return Err(format!("최대 {}개까지 가져올 수 있습니다. 파일을 나눠서 다시 시도해주세요", max_keys));
            }
            let trimmed = line.trim();
            if trimmed.is_empty() || trimmed.starts_with('#') {
                continue;
            }
            if let Some(eq_pos) = trimmed.find('=') {
                let var_name = trimmed[..eq_pos].trim().to_string();
                let raw_value = trimmed[eq_pos + 1..].trim();
                let value = strip_matching_quotes(raw_value).to_string();
                if var_name.is_empty() || value.is_empty() {
                    continue;
                }

                let encrypted = crypto::encrypt_value(&value, &enc_key).map_err(err_to_string)?;
                let input = CreateApiKeyInput {
                    project_id: project_id.clone(),
                    name: var_name.clone(),
                    value: String::new(),
                    provider: None,
                    memo: Some("Imported from .env".to_string()),
                    service_url: None,
                    env_var_name: Some(var_name),
                    expires_at: None,
                    reference_urls: None,
                    tag_ids: vec![],
                };
                db::create_api_key(&conn, &input, &encrypted).map_err(err_to_string)?;
                count += 1;
            }
        }

        Ok(count)
    })();

    match result {
        Ok(count) => {
            conn.execute("COMMIT", []).map_err(err_to_string)?;
            Ok(count)
        }
        Err(e) => {
            let _ = conn.execute("ROLLBACK", []);
            Err(e)
        }
    }
}

// ========== File I/O (real .env file save/load, replacing clipboard-only export) ==========

// Security note: these commands are reachable by any script running in the webview,
// not only via the trusted save/open-dialog flow that currently calls them — so they
// must not trust `path` at all. Scoped to `.env` files only and rejects `..` traversal,
// so even a direct/malicious invoke() can never touch vault.db, app binaries, or
// arbitrary system files; the blast radius is capped to "some .env file".
fn validate_env_path(path: &str) -> Result<&std::path::Path, String> {
    if path.trim().is_empty() {
        return Err("파일 경로가 올바르지 않습니다".into());
    }
    let p = std::path::Path::new(path);
    let has_env_ext = p
        .extension()
        .and_then(|e| e.to_str())
        .map(|e| e.eq_ignore_ascii_case("env"))
        .unwrap_or(false);
    if !has_env_ext {
        return Err("이 기능은 .env 파일에만 사용할 수 있습니다".into());
    }
    if p.components().any(|c| matches!(c, std::path::Component::ParentDir)) {
        return Err("파일 경로가 올바르지 않습니다".into());
    }
    Ok(p)
}

#[tauri::command]
pub fn write_text_file(path: String, content: String) -> Result<(), String> {
    if content.len() > 5_000_000 {
        return Err("파일이 너무 큽니다".into());
    }
    let p = validate_env_path(&path)?;
    std::fs::write(p, content).map_err(|e| format!("파일 저장 실패: {}", e))
}

/// Read a `.env` file's raw text so the frontend can preview/import it (P1: PRD
/// Phase 2 promises ".env 가져오기" — the backend `import_env` parser already
/// existed but had no way to get a picked file's *content* into it).
#[tauri::command]
pub fn read_text_file(path: String) -> Result<String, String> {
    let p = validate_env_path(&path)?;
    let content = std::fs::read_to_string(p).map_err(|_| "파일을 읽을 수 없습니다".to_string())?;
    if content.len() > 1_000_000 {
        return Err("파일이 너무 큽니다 (최대 1MB)".into());
    }
    Ok(content)
}

// ========== Backup / Restore (encrypted vault.db copy — PRD P2 promise) ==========

fn validate_db_backup_path(path: &str) -> Result<&std::path::Path, String> {
    if path.trim().is_empty() {
        return Err("경로가 올바르지 않습니다".into());
    }
    let p = std::path::Path::new(path);
    let has_db_ext = p
        .extension()
        .and_then(|e| e.to_str())
        .map(|e| e.eq_ignore_ascii_case("db"))
        .unwrap_or(false);
    if !has_db_ext {
        return Err("이 기능은 .db 백업 파일에만 사용할 수 있습니다".into());
    }
    if p.components().any(|c| matches!(c, std::path::Component::ParentDir)) {
        return Err("경로가 올바르지 않습니다".into());
    }
    Ok(p)
}

/// SQLite files always start with this exact 16-byte magic string. Cheap, strong
/// guardrail against staging a non-database (or wrong-format) file as a restore
/// source — combined with the pre-swap `.bak` snapshot in `lib.rs`, a bad file
/// can never destroy the user's current vault irrecoverably.
fn is_valid_sqlite_file(bytes: &[u8]) -> bool {
    bytes.len() >= 16 && &bytes[0..16] == b"SQLite format 3\0"
}

/// vault.db is already AES-256-GCM encrypted at rest, so a raw byte-for-byte file
/// copy IS an "encrypted backup" — no extra crypto needed. Holding `state.db`'s
/// mutex during the copy reuses the same lock every other command already
/// serializes through, guaranteeing no write (including change_master_password's
/// transaction) is in flight while we read the file.
#[tauri::command]
pub fn backup_vault(state: State<AppState>, dest_path: String) -> Result<(), String> {
    let p = validate_db_backup_path(&dest_path)?;
    if p == state.db_path.as_path() {
        return Err("백업 위치가 현재 볼트 파일과 같습니다. 다른 파일명을 선택해주세요".into());
    }
    let conn = state.db.lock().map_err(|_| "DB 잠금 오류".to_string())?;
    std::fs::copy(&state.db_path, p).map_err(|e| format!("백업 실패: {}", e))?;
    let count = db::get_total_key_count(&conn).unwrap_or(0);
    let _ = db::add_backup_history(&conn, "backup", &dest_path, count);
    Ok(())
}

/// Stages a validated backup file for restore — does NOT touch the live vault.db.
/// The actual swap only happens in `lib.rs` at the next app startup, the one
/// moment no SQLite connection is open, which avoids any risk of corrupting a
/// file that's in active use. Re-verifies the current master password first so a
/// compromised webview script can't silently stage a swap to an attacker-known
/// vault without already knowing the real password.
#[tauri::command]
pub fn stage_restore(state: State<AppState>, current_password: String, backup_path: String) -> Result<(), String> {
    let p = validate_db_backup_path(&backup_path)?;

    let conn = state.db.lock().map_err(|_| "DB 잠금 오류".to_string())?;
    let hash = db::get_setting(&conn, "master_password_hash").map_err(err_to_string)?.ok_or("비밀번호 미설정")?;
    if !crypto::verify_password(&current_password, &hash).map_err(err_to_string)? {
        return Err("현재 비밀번호가 올바르지 않습니다".into());
    }
    drop(conn);

    let bytes = std::fs::read(p).map_err(|_| "백업 파일을 읽을 수 없습니다".to_string())?;
    if bytes.len() > 200_000_000 {
        return Err("백업 파일이 너무 큽니다".into());
    }
    if !is_valid_sqlite_file(&bytes) {
        return Err("유효한 백업 파일이 아닙니다 (SQLite 데이터베이스 형식이 아님)".into());
    }

    let pending_path = state.db_path.with_file_name("vault.db.pending-restore");
    std::fs::write(&pending_path, &bytes).map_err(|e| format!("복원 준비 실패: {}", e))?;
    Ok(())
}

#[tauri::command]
pub fn has_pending_restore(state: State<AppState>) -> Result<bool, String> {
    Ok(state.db_path.with_file_name("vault.db.pending-restore").exists())
}

#[tauri::command]
pub fn cancel_pending_restore(state: State<AppState>) -> Result<(), String> {
    let pending_path = state.db_path.with_file_name("vault.db.pending-restore");
    if pending_path.exists() {
        std::fs::remove_file(&pending_path).map_err(|e| format!("취소 실패: {}", e))?;
    }
    Ok(())
}

// ========== Tags ==========

#[tauri::command]
pub fn create_tag(state: State<AppState>, input: CreateTagInput) -> Result<Tag, String> {
    let conn = state.db.lock().map_err(|_| "DB 잠금 오류".to_string())?;
    db::create_tag(&conn, &input).map_err(err_to_string)
}

#[tauri::command]
pub fn list_tags(state: State<AppState>) -> Result<Vec<Tag>, String> {
    let conn = state.db.lock().map_err(|_| "DB 잠금 오류".to_string())?;
    db::list_tags(&conn).map_err(err_to_string)
}

#[tauri::command]
pub fn delete_tag(state: State<AppState>, id: String) -> Result<(), String> {
    let conn = state.db.lock().map_err(|_| "DB 잠금 오류".to_string())?;
    db::delete_tag(&conn, &id).map_err(err_to_string)
}

// ========== Usage Logs ==========

#[tauri::command]
pub fn get_recent_logs(state: State<AppState>, limit: i64) -> Result<Vec<UsageLogWithKeyName>, String> {
    let conn = state.db.lock().map_err(|_| "DB 잠금 오류".to_string())?;
    db::get_recent_logs(&conn, limit).map_err(err_to_string)
}

// ========== User Preferences ==========

#[tauri::command]
pub fn get_preference(state: State<AppState>, key: String) -> Result<Option<String>, String> {
    // H-3 fix: allowlist
    if !ALLOWED_PREF_KEYS.contains(&key.as_str()) {
        return Err("유효하지 않은 설정 키입니다".into());
    }
    let conn = state.db.lock().map_err(|_| "DB 잠금 오류".to_string())?;
    db::get_setting(&conn, &format!("pref_{}", key)).map_err(err_to_string)
}

#[tauri::command]
pub fn set_preference(state: State<AppState>, key: String, value: String) -> Result<(), String> {
    if !ALLOWED_PREF_KEYS.contains(&key.as_str()) {
        return Err("유효하지 않은 설정 키입니다".into());
    }
    let conn = state.db.lock().map_err(|_| "DB 잠금 오류".to_string())?;
    db::set_setting(&conn, &format!("pref_{}", key), &value).map_err(err_to_string)
}

// ========== Stats ==========

#[tauri::command]
pub fn get_stats(state: State<AppState>) -> Result<serde_json::Value, String> {
    let conn = state.db.lock().map_err(|_| "DB 잠금 오류".to_string())?;
    let total_keys = db::get_total_key_count(&conn).map_err(err_to_string)?;
    let total_projects = db::get_total_project_count(&conn).map_err(err_to_string)?;
    let expiring_soon = db::get_expiring_soon_count(&conn, 30).map_err(err_to_string)?;
    let expired = db::get_expired_count(&conn).map_err(err_to_string)?;
    Ok(serde_json::json!({
        "total_keys": total_keys,
        "total_projects": total_projects,
        "expiring_soon": expiring_soon,
        "expired": expired,
    }))
}

#[cfg(test)]
mod tests {
    use super::*;

    fn account(site_url: Option<&str>) -> AccountEntry {
        AccountEntry {
            label: "테스트 계정".into(),
            username: Some("user@example.com".into()),
            password: Some("pw".into()),
            site_url: site_url.map(|s| s.to_string()),
            key_value: None,
            expires_at: None,
        }
    }

    #[test]
    fn validate_accounts_accepts_empty_list() {
        assert!(validate_accounts(&[]).is_ok());
    }

    #[test]
    fn validate_accounts_accepts_http_and_https() {
        assert!(validate_accounts(&[account(Some("https://example.com"))]).is_ok());
        assert!(validate_accounts(&[account(Some("http://example.com"))]).is_ok());
    }

    #[test]
    fn validate_accounts_accepts_empty_url() {
        assert!(validate_accounts(&[account(Some(""))]).is_ok());
        assert!(validate_accounts(&[account(None)]).is_ok());
    }

    #[test]
    fn validate_accounts_rejects_javascript_scheme() {
        let err = validate_accounts(&[account(Some("javascript:alert(1)"))]);
        assert!(err.is_err());
    }

    #[test]
    fn validate_accounts_rejects_over_50_entries() {
        let too_many: Vec<AccountEntry> = (0..51).map(|_| account(None)).collect();
        assert!(validate_accounts(&too_many).is_err());
    }

    #[test]
    fn validate_accounts_accepts_exactly_50_entries() {
        let fifty: Vec<AccountEntry> = (0..50).map(|_| account(None)).collect();
        assert!(validate_accounts(&fifty).is_ok());
    }

    #[test]
    fn is_safe_url_boundary_cases() {
        assert!(is_safe_url("https://a.com"));
        assert!(is_safe_url("http://a.com"));
        assert!(!is_safe_url("javascript:alert(1)"));
        assert!(!is_safe_url("data:text/html,x"));
        assert!(!is_safe_url("ftp://a.com"));
    }

    // P0 regression test: change_master_password used to invalidate recovery
    // permanently (no way to reissue it). This proves the shared helper it now
    // calls produces a recovery key that genuinely round-trips the password, and
    // that regenerating it (as both change_master_password and the new
    // regenerate_recovery_key command do) cleanly retires the old key while the
    // new one works end-to-end — not just "a hash changed somewhere".
    #[test]
    fn generate_and_store_recovery_key_produces_a_working_key_and_invalidates_the_previous_one() {
        let conn = Connection::open_in_memory().unwrap();
        db::init_db(&conn).unwrap();
        let password = "correct horse battery staple";

        let first_recovery = generate_and_store_recovery_key(&conn, password).unwrap();

        // First key must actually decrypt back to the real password.
        let hash1 = db::get_setting(&conn, "recovery_key_hash").unwrap().unwrap();
        assert!(crypto::verify_password(&first_recovery, &hash1).unwrap());
        let salt1 = BASE64.decode(&db::get_setting(&conn, "recovery_salt").unwrap().unwrap()).unwrap();
        let enc_key1 = crypto::derive_encryption_key(&first_recovery, &salt1).unwrap();
        let encrypted_pw1 = db::get_setting(&conn, "recovery_encrypted_password").unwrap().unwrap();
        assert_eq!(crypto::decrypt_value(&encrypted_pw1, &enc_key1).unwrap(), password);

        // Regenerate (simulates a password change or an explicit "재발급").
        let second_recovery = generate_and_store_recovery_key(&conn, password).unwrap();
        assert_ne!(first_recovery, second_recovery);

        // Old key must be rejected now; new key must work end-to-end.
        let hash2 = db::get_setting(&conn, "recovery_key_hash").unwrap().unwrap();
        assert!(!crypto::verify_password(&first_recovery, &hash2).unwrap());
        assert!(crypto::verify_password(&second_recovery, &hash2).unwrap());
        let salt2 = BASE64.decode(&db::get_setting(&conn, "recovery_salt").unwrap().unwrap()).unwrap();
        let enc_key2 = crypto::derive_encryption_key(&second_recovery, &salt2).unwrap();
        let encrypted_pw2 = db::get_setting(&conn, "recovery_encrypted_password").unwrap().unwrap();
        assert_eq!(crypto::decrypt_value(&encrypted_pw2, &enc_key2).unwrap(), password);
    }

    // Security-review fix: write_text_file must never be able to touch vault.db,
    // an app binary, or any other non-.env file — even if called directly with a
    // crafted path instead of via the trusted save-dialog flow.
    #[test]
    fn write_text_file_rejects_non_env_extension() {
        let err = write_text_file(
            "C:\\Users\\PC\\AppData\\Roaming\\com.apikeyvault.app\\vault.db".into(),
            "malicious".into(),
        );
        assert!(err.is_err());
    }

    #[test]
    fn write_text_file_rejects_parent_dir_traversal() {
        let err = write_text_file("..\\..\\evil.env".into(), "x=1".into());
        assert!(err.is_err());
    }

    #[test]
    fn write_text_file_accepts_env_extension_and_writes_content() {
        let path = std::env::temp_dir().join(format!("safepass_test_{}.env", std::process::id()));
        let path_str = path.to_string_lossy().to_string();

        let result = write_text_file(path_str, "FOO=bar".into());
        assert!(result.is_ok());
        assert_eq!(std::fs::read_to_string(&path).unwrap(), "FOO=bar");

        let _ = std::fs::remove_file(&path);
    }

    #[test]
    fn read_text_file_round_trips_what_write_text_file_wrote() {
        let path = std::env::temp_dir().join(format!("safepass_test_read_{}.env", std::process::id()));
        let path_str = path.to_string_lossy().to_string();

        write_text_file(path_str.clone(), "API_KEY=sk-test-123".into()).unwrap();
        let content = read_text_file(path_str).unwrap();
        assert_eq!(content, "API_KEY=sk-test-123");

        let _ = std::fs::remove_file(&path);
    }

    #[test]
    fn read_text_file_rejects_non_env_extension() {
        let err = read_text_file("C:\\Users\\PC\\AppData\\Roaming\\com.apikeyvault.app\\vault.db".into());
        assert!(err.is_err());
    }

    #[test]
    fn read_text_file_rejects_missing_file() {
        let path = std::env::temp_dir().join(format!("safepass_missing_{}.env", std::process::id()));
        let err = read_text_file(path.to_string_lossy().to_string());
        assert!(err.is_err());
    }

    // Backup/restore path validation — same defense-in-depth as write_text_file,
    // but scoped to .db instead of .env.
    #[test]
    fn validate_db_backup_path_rejects_non_db_extension() {
        assert!(validate_db_backup_path("C:\\Users\\PC\\backup.env").is_err());
        assert!(validate_db_backup_path("C:\\Users\\PC\\backup.txt").is_err());
    }

    #[test]
    fn validate_db_backup_path_rejects_parent_dir_traversal() {
        assert!(validate_db_backup_path("..\\..\\evil.db").is_err());
    }

    #[test]
    fn validate_db_backup_path_accepts_db_extension() {
        assert!(validate_db_backup_path("C:\\Users\\PC\\Backups\\vault-2026-03-20.db").is_ok());
    }

    // A garbage/wrong-format file staged as a restore source must never pass —
    // this is the guardrail standing between a bad pick and a destroyed vault.
    #[test]
    fn is_valid_sqlite_file_accepts_real_sqlite_header() {
        let mut bytes = b"SQLite format 3\0".to_vec();
        bytes.extend_from_slice(&[0u8; 100]); // rest of a real header/page would follow
        assert!(is_valid_sqlite_file(&bytes));
    }

    #[test]
    fn is_valid_sqlite_file_rejects_garbage_bytes() {
        assert!(!is_valid_sqlite_file(b"not a database at all"));
        assert!(!is_valid_sqlite_file(b""));
        assert!(!is_valid_sqlite_file(b"short"));
    }

    #[test]
    fn is_valid_sqlite_file_rejects_env_file_content() {
        assert!(!is_valid_sqlite_file(b"API_KEY=sk-test-1234567890abcdef"));
    }

    // Regression tests for the quote-stripping fix found while verifying the
    // newly-wired-up .env import feature — real-world .env files (not just ones
    // this app exported) commonly quote values.
    #[test]
    fn strip_matching_quotes_removes_double_quotes() {
        assert_eq!(strip_matching_quotes("\"sk-abc123\""), "sk-abc123");
    }

    #[test]
    fn strip_matching_quotes_removes_single_quotes() {
        assert_eq!(strip_matching_quotes("'sk-abc123'"), "sk-abc123");
    }

    #[test]
    fn strip_matching_quotes_leaves_unquoted_value_untouched() {
        assert_eq!(strip_matching_quotes("sk-abc123"), "sk-abc123");
    }

    #[test]
    fn strip_matching_quotes_leaves_mismatched_quotes_untouched() {
        // Only a genuinely matching pair should be stripped — a stray quote is
        // part of the actual value, not delimiter syntax.
        assert_eq!(strip_matching_quotes("\"sk-abc123'"), "\"sk-abc123'");
    }

    #[test]
    fn strip_matching_quotes_handles_short_and_empty_strings() {
        assert_eq!(strip_matching_quotes(""), "");
        assert_eq!(strip_matching_quotes("\""), "\"");
    }

    #[test]
    fn strip_matching_quotes_of_empty_quoted_string_yields_empty() {
        // Boundary case: `FOO=""` in a real .env file. After stripping, the value
        // becomes empty — import_env's existing `value.is_empty()` check then
        // correctly skips it, same as `FOO=` (no value) already did before this fix.
        assert_eq!(strip_matching_quotes("\"\""), "");
    }

    // Proves the exact BEGIN/COMMIT/ROLLBACK pattern import_env now uses actually
    // removes partial inserts at the real SQLite level — not just "looks correct"
    // in the Rust control flow. Before this fix, hitting the 500-key cap partway
    // through left everything imported so far silently committed.
    #[test]
    fn transaction_rollback_pattern_removes_all_partial_inserts() {
        let conn = Connection::open_in_memory().unwrap();
        db::init_db(&conn).unwrap();
        let project = db::create_project(
            &conn,
            &CreateProjectInput { name: "테스트 프로젝트".into(), description: None, color: None },
        ).unwrap();

        conn.execute("BEGIN TRANSACTION", []).unwrap();
        let result: Result<(), String> = (|| {
            for i in 0..3 {
                let input = CreateApiKeyInput {
                    project_id: project.id.clone(),
                    name: format!("IMPORTED_KEY_{}", i),
                    value: String::new(),
                    provider: None,
                    memo: None,
                    service_url: None,
                    env_var_name: None,
                    expires_at: None,
                    reference_urls: None,
                    tag_ids: vec![],
                };
                db::create_api_key(&conn, &input, "encrypted-placeholder").map_err(|e| e.to_string())?;
            }
            Err("시뮬레이션: 한도 초과로 실패".to_string())
        })();

        match result {
            Ok(_) => unreachable!("this closure is designed to fail after 3 inserts"),
            Err(_) => { conn.execute("ROLLBACK", []).unwrap(); }
        }

        let count = db::get_total_key_count(&conn).unwrap();
        assert_eq!(count, 0, "rollback must remove ALL partial inserts, found {}", count);
    }
}
