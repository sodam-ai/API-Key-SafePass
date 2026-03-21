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
}

fn err_to_string<E: std::fmt::Display>(e: E) -> String {
    e.to_string()
}

fn get_enc_key(state: &State<AppState>) -> Result<[u8; 32], String> {
    let key_guard = state.encryption_key.lock().map_err(err_to_string)?;
    key_guard.ok_or_else(|| "잠금이 해제되지 않았습니다".into())
}

// ========== Auth ==========

#[tauri::command]
pub fn check_has_master_password(state: State<AppState>) -> Result<bool, String> {
    let conn = state.db.lock().map_err(err_to_string)?;
    Ok(db::get_setting(&conn, "master_password_hash").map_err(err_to_string)?.is_some())
}

#[tauri::command]
pub fn setup_master_password(state: State<AppState>, password: String) -> Result<String, String> {
    let conn = state.db.lock().map_err(err_to_string)?;

    if db::get_setting(&conn, "master_password_hash").map_err(err_to_string)?.is_some() {
        return Err("마스터 비밀번호가 이미 설정되어 있습니다".into());
    }
    if password.len() < 6 {
        return Err("비밀번호는 최소 6자 이상이어야 합니다".into());
    }

    let hash = crypto::hash_password(&password).map_err(err_to_string)?;
    db::set_setting(&conn, "master_password_hash", &hash).map_err(err_to_string)?;

    let salt = crypto::generate_salt();
    let salt_b64 = BASE64.encode(&salt);
    db::set_setting(&conn, "encryption_salt", &salt_b64).map_err(err_to_string)?;

    // Generate recovery key (random 32 bytes, base64 encoded)
    let recovery_key = crypto::generate_salt(); // reuse 16 bytes
    let mut full_recovery = vec![0u8; 32];
    full_recovery[..16].copy_from_slice(&recovery_key);
    let extra = crypto::generate_salt();
    full_recovery[16..].copy_from_slice(&extra);
    let recovery_b64 = BASE64.encode(&full_recovery);

    // Store hash of recovery key
    let recovery_hash = crypto::hash_password(&recovery_b64).map_err(err_to_string)?;
    db::set_setting(&conn, "recovery_key_hash", &recovery_hash).map_err(err_to_string)?;

    // Also store encrypted master password via recovery key for actual recovery
    let recovery_salt = crypto::generate_salt();
    let recovery_enc_key = crypto::derive_encryption_key(&recovery_b64, &recovery_salt).map_err(err_to_string)?;
    let encrypted_pw = crypto::encrypt_value(&password, &recovery_enc_key).map_err(err_to_string)?;
    db::set_setting(&conn, "recovery_encrypted_password", &encrypted_pw).map_err(err_to_string)?;
    db::set_setting(&conn, "recovery_salt", &BASE64.encode(&recovery_salt)).map_err(err_to_string)?;

    // Derive encryption key
    let enc_key = crypto::derive_encryption_key(&password, &salt).map_err(err_to_string)?;
    let mut key_guard = state.encryption_key.lock().map_err(err_to_string)?;
    *key_guard = Some(enc_key);

    // Return recovery key to show to user (one time only)
    Ok(recovery_b64)
}

#[tauri::command]
pub fn unlock(state: State<AppState>, password: String) -> Result<bool, String> {
    let conn = state.db.lock().map_err(err_to_string)?;
    let hash = db::get_setting(&conn, "master_password_hash")
        .map_err(err_to_string)?
        .ok_or("마스터 비밀번호가 설정되지 않았습니다")?;

    let valid = crypto::verify_password(&password, &hash).map_err(err_to_string)?;
    if valid {
        let salt_b64 = db::get_setting(&conn, "encryption_salt").map_err(err_to_string)?.ok_or("솔트 없음")?;
        let salt = BASE64.decode(&salt_b64).map_err(err_to_string)?;
        let enc_key = crypto::derive_encryption_key(&password, &salt).map_err(err_to_string)?;
        let mut key_guard = state.encryption_key.lock().map_err(err_to_string)?;
        *key_guard = Some(enc_key);
    }
    Ok(valid)
}

#[tauri::command]
pub fn unlock_with_recovery(state: State<AppState>, recovery_key: String) -> Result<bool, String> {
    let conn = state.db.lock().map_err(err_to_string)?;

    let recovery_hash = db::get_setting(&conn, "recovery_key_hash")
        .map_err(err_to_string)?
        .ok_or("복구키가 설정되지 않았습니다")?;

    let valid = crypto::verify_password(&recovery_key, &recovery_hash).map_err(err_to_string)?;
    if !valid {
        return Ok(false);
    }

    // Decrypt the master password using recovery key
    let recovery_salt_b64 = db::get_setting(&conn, "recovery_salt").map_err(err_to_string)?.ok_or("복구 솔트 없음")?;
    let recovery_salt = BASE64.decode(&recovery_salt_b64).map_err(err_to_string)?;
    let recovery_enc_key = crypto::derive_encryption_key(&recovery_key, &recovery_salt).map_err(err_to_string)?;
    let encrypted_pw = db::get_setting(&conn, "recovery_encrypted_password").map_err(err_to_string)?.ok_or("복구 데이터 없음")?;
    let password = crypto::decrypt_value(&encrypted_pw, &recovery_enc_key).map_err(err_to_string)?;

    // Now derive the actual encryption key
    let salt_b64 = db::get_setting(&conn, "encryption_salt").map_err(err_to_string)?.ok_or("솔트 없음")?;
    let salt = BASE64.decode(&salt_b64).map_err(err_to_string)?;
    let enc_key = crypto::derive_encryption_key(&password, &salt).map_err(err_to_string)?;
    let mut key_guard = state.encryption_key.lock().map_err(err_to_string)?;
    *key_guard = Some(enc_key);

    Ok(true)
}

#[tauri::command]
pub fn change_master_password(state: State<AppState>, current_password: String, new_password: String) -> Result<(), String> {
    if new_password.len() < 6 {
        return Err("새 비밀번호는 최소 6자 이상이어야 합니다".into());
    }

    let conn = state.db.lock().map_err(err_to_string)?;

    // Verify current password
    let hash = db::get_setting(&conn, "master_password_hash").map_err(err_to_string)?.ok_or("비밀번호 미설정")?;
    if !crypto::verify_password(&current_password, &hash).map_err(err_to_string)? {
        return Err("현재 비밀번호가 올바르지 않습니다".into());
    }

    // Get current encryption key
    let old_salt_b64 = db::get_setting(&conn, "encryption_salt").map_err(err_to_string)?.ok_or("솔트 없음")?;
    let old_salt = BASE64.decode(&old_salt_b64).map_err(err_to_string)?;
    let old_enc_key = crypto::derive_encryption_key(&current_password, &old_salt).map_err(err_to_string)?;

    // Generate new credentials
    let new_hash = crypto::hash_password(&new_password).map_err(err_to_string)?;
    let new_salt = crypto::generate_salt();
    let new_enc_key = crypto::derive_encryption_key(&new_password, &new_salt).map_err(err_to_string)?;

    // Re-encrypt all keys
    let all_keys = db::get_all_encrypted_keys(&conn).map_err(err_to_string)?;
    for (key_id, _name, encrypted, _p, _m, _s, _e) in &all_keys {
        let plain = crypto::decrypt_value(encrypted, &old_enc_key).map_err(err_to_string)?;
        let re_encrypted = crypto::encrypt_value(&plain, &new_enc_key).map_err(err_to_string)?;
        conn.execute("UPDATE api_keys SET encrypted_value = ?1 WHERE id = ?2", rusqlite::params![re_encrypted, key_id]).map_err(err_to_string)?;
    }

    // Update stored credentials
    db::set_setting(&conn, "master_password_hash", &new_hash).map_err(err_to_string)?;
    db::set_setting(&conn, "encryption_salt", &BASE64.encode(&new_salt)).map_err(err_to_string)?;

    // Update in-memory key
    let mut key_guard = state.encryption_key.lock().map_err(err_to_string)?;
    *key_guard = Some(new_enc_key);

    Ok(())
}

#[tauri::command]
pub fn lock(state: State<AppState>) -> Result<(), String> {
    let mut key_guard = state.encryption_key.lock().map_err(err_to_string)?;
    // Zero out the encryption key from memory before dropping
    if let Some(ref mut key) = *key_guard {
        key.iter_mut().for_each(|b| *b = 0);
    }
    *key_guard = None;
    Ok(())
}

// ========== Projects ==========

#[tauri::command]
pub fn create_project(state: State<AppState>, input: CreateProjectInput) -> Result<Project, String> {
    let conn = state.db.lock().map_err(err_to_string)?;
    db::create_project(&conn, &input).map_err(err_to_string)
}

#[tauri::command]
pub fn list_projects(state: State<AppState>) -> Result<Vec<Project>, String> {
    let conn = state.db.lock().map_err(err_to_string)?;
    db::list_projects(&conn).map_err(err_to_string)
}

#[tauri::command]
pub fn update_project(state: State<AppState>, input: UpdateProjectInput) -> Result<(), String> {
    let conn = state.db.lock().map_err(err_to_string)?;
    db::update_project(&conn, &input).map_err(err_to_string)
}

#[tauri::command]
pub fn delete_project(state: State<AppState>, id: String) -> Result<(), String> {
    let conn = state.db.lock().map_err(err_to_string)?;
    db::delete_project(&conn, &id).map_err(err_to_string)
}

// ========== API Keys ==========

#[tauri::command]
pub fn create_api_key(state: State<AppState>, input: CreateApiKeyInput) -> Result<ApiKey, String> {
    let enc_key = get_enc_key(&state)?;
    let encrypted = crypto::encrypt_value(&input.value, &enc_key).map_err(err_to_string)?;
    let conn = state.db.lock().map_err(err_to_string)?;
    db::create_api_key(&conn, &input, &encrypted).map_err(err_to_string)
}

#[tauri::command]
pub fn list_api_keys(state: State<AppState>, project_id: String) -> Result<Vec<ApiKeyWithTags>, String> {
    let conn = state.db.lock().map_err(err_to_string)?;
    db::list_api_keys(&conn, &project_id).map_err(err_to_string)
}

#[tauri::command]
pub fn list_all_api_keys(state: State<AppState>) -> Result<Vec<ApiKeyWithTags>, String> {
    let conn = state.db.lock().map_err(err_to_string)?;
    db::list_all_api_keys(&conn).map_err(err_to_string)
}

#[tauri::command]
pub fn get_api_key_value(state: State<AppState>, key_id: String) -> Result<String, String> {
    let enc_key = get_enc_key(&state)?;
    let conn = state.db.lock().map_err(err_to_string)?;
    let encrypted = db::get_encrypted_value(&conn, &key_id).map_err(err_to_string)?;
    db::update_last_used(&conn, &key_id).map_err(err_to_string)?;
    db::add_usage_log(&conn, &key_id, "copied").map_err(err_to_string)?;
    crypto::decrypt_value(&encrypted, &enc_key).map_err(err_to_string)
}

#[tauri::command]
pub fn update_api_key(state: State<AppState>, input: UpdateApiKeyInput) -> Result<(), String> {
    let enc_key = get_enc_key(&state)?;
    let encrypted = match &input.value {
        Some(v) if !v.is_empty() => Some(crypto::encrypt_value(v, &enc_key).map_err(err_to_string)?),
        _ => None,
    };
    let conn = state.db.lock().map_err(err_to_string)?;
    db::update_api_key(&conn, &input, encrypted.as_deref()).map_err(err_to_string)
}

#[tauri::command]
pub fn delete_api_key(state: State<AppState>, id: String) -> Result<(), String> {
    let conn = state.db.lock().map_err(err_to_string)?;
    db::delete_api_key(&conn, &id).map_err(err_to_string)
}

#[tauri::command]
pub fn search_api_keys(state: State<AppState>, query: String) -> Result<Vec<ApiKeyWithTags>, String> {
    let conn = state.db.lock().map_err(err_to_string)?;
    db::search_api_keys(&conn, &query).map_err(err_to_string)
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
    let conn = state.db.lock().map_err(err_to_string)?;
    db::quick_update_encrypted_value(&conn, &key_id, &encrypted).map_err(err_to_string)?;
    db::add_usage_log(&conn, &key_id, "key_updated").map_err(err_to_string)?;
    Ok(())
}

// ========== .env Export/Import ==========

#[tauri::command]
pub fn export_env(state: State<AppState>, project_id: String) -> Result<String, String> {
    let enc_key = get_enc_key(&state)?;
    let conn = state.db.lock().map_err(err_to_string)?;
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

#[tauri::command]
pub fn import_env(state: State<AppState>, project_id: String, content: String) -> Result<i64, String> {
    let enc_key = get_enc_key(&state)?;
    let conn = state.db.lock().map_err(err_to_string)?;
    let mut count: i64 = 0;

    for line in content.lines() {
        let trimmed = line.trim();
        if trimmed.is_empty() || trimmed.starts_with('#') {
            continue;
        }
        if let Some(eq_pos) = trimmed.find('=') {
            let var_name = trimmed[..eq_pos].trim().to_string();
            let value = trimmed[eq_pos + 1..].trim().to_string();
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
}

// ========== Tags ==========

#[tauri::command]
pub fn create_tag(state: State<AppState>, input: CreateTagInput) -> Result<Tag, String> {
    let conn = state.db.lock().map_err(err_to_string)?;
    db::create_tag(&conn, &input).map_err(err_to_string)
}

#[tauri::command]
pub fn list_tags(state: State<AppState>) -> Result<Vec<Tag>, String> {
    let conn = state.db.lock().map_err(err_to_string)?;
    db::list_tags(&conn).map_err(err_to_string)
}

#[tauri::command]
pub fn delete_tag(state: State<AppState>, id: String) -> Result<(), String> {
    let conn = state.db.lock().map_err(err_to_string)?;
    db::delete_tag(&conn, &id).map_err(err_to_string)
}

// ========== Usage Logs ==========

#[tauri::command]
pub fn get_recent_logs(state: State<AppState>, limit: i64) -> Result<Vec<UsageLogWithKeyName>, String> {
    let conn = state.db.lock().map_err(err_to_string)?;
    db::get_recent_logs(&conn, limit).map_err(err_to_string)
}

// ========== Stats ==========

#[tauri::command]
pub fn get_stats(state: State<AppState>) -> Result<serde_json::Value, String> {
    let conn = state.db.lock().map_err(err_to_string)?;
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
