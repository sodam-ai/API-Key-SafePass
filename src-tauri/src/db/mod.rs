use crate::models::*;
use rusqlite::{params, Connection, Result as SqlResult};

pub fn init_db(conn: &Connection) -> SqlResult<()> {
    conn.execute_batch(
        "
        PRAGMA foreign_keys = ON;

        CREATE TABLE IF NOT EXISTS app_settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            key TEXT NOT NULL UNIQUE,
            value TEXT NOT NULL,
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS projects (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            color TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS api_keys (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            name TEXT NOT NULL,
            encrypted_value TEXT NOT NULL,
            provider TEXT,
            memo TEXT,
            service_url TEXT,
            env_var_name TEXT,
            expires_at TEXT,
            last_used_at TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS tags (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            color TEXT
        );

        CREATE TABLE IF NOT EXISTS api_key_tags (
            api_key_id TEXT NOT NULL,
            tag_id TEXT NOT NULL,
            PRIMARY KEY (api_key_id, tag_id),
            FOREIGN KEY (api_key_id) REFERENCES api_keys(id) ON DELETE CASCADE,
            FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS usage_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            api_key_id TEXT NOT NULL,
            action TEXT NOT NULL,
            timestamp TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (api_key_id) REFERENCES api_keys(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS backup_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            action TEXT NOT NULL,
            file_path TEXT NOT NULL,
            key_count INTEGER NOT NULL,
            timestamp TEXT NOT NULL DEFAULT (datetime('now'))
        );
        ",
    )?;

    // Migrations for older schemas
    let _ = conn.execute("ALTER TABLE api_keys ADD COLUMN service_url TEXT", []);
    let _ = conn.execute("ALTER TABLE api_keys ADD COLUMN env_var_name TEXT", []);
    let _ = conn.execute("ALTER TABLE api_keys ADD COLUMN reference_urls TEXT", []);

    Ok(())
}

// --- AppSetting ---

pub fn get_setting(conn: &Connection, key: &str) -> SqlResult<Option<String>> {
    let mut stmt = conn.prepare("SELECT value FROM app_settings WHERE key = ?1")?;
    let result = stmt.query_row(params![key], |row| row.get::<_, String>(0));
    match result {
        Ok(val) => Ok(Some(val)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e),
    }
}

pub fn set_setting(conn: &Connection, key: &str, value: &str) -> SqlResult<()> {
    conn.execute(
        "INSERT INTO app_settings (key, value, updated_at) VALUES (?1, ?2, datetime('now'))
         ON CONFLICT(key) DO UPDATE SET value = ?2, updated_at = datetime('now')",
        params![key, value],
    )?;
    Ok(())
}

// --- Project ---

pub fn create_project(conn: &Connection, input: &CreateProjectInput) -> SqlResult<Project> {
    let id = format!("proj-{}", uuid::Uuid::new_v4());
    let now = chrono::Utc::now().to_rfc3339();
    conn.execute(
        "INSERT INTO projects (id, name, description, color, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?5)",
        params![id, input.name, input.description, input.color, now],
    )?;
    Ok(Project { id, name: input.name.clone(), description: input.description.clone(), color: input.color.clone(), created_at: now.clone(), updated_at: now })
}

pub fn list_projects(conn: &Connection) -> SqlResult<Vec<Project>> {
    let mut stmt = conn.prepare("SELECT id, name, description, color, created_at, updated_at FROM projects ORDER BY name")?;
    let rows = stmt.query_map([], |row| {
        Ok(Project { id: row.get(0)?, name: row.get(1)?, description: row.get(2)?, color: row.get(3)?, created_at: row.get(4)?, updated_at: row.get(5)? })
    })?;
    rows.collect()
}

pub fn update_project(conn: &Connection, input: &UpdateProjectInput) -> SqlResult<()> {
    let now = chrono::Utc::now().to_rfc3339();
    conn.execute(
        "UPDATE projects SET name = ?1, description = ?2, color = ?3, updated_at = ?4 WHERE id = ?5",
        params![input.name, input.description, input.color, now, input.id],
    )?;
    Ok(())
}

pub fn delete_project(conn: &Connection, id: &str) -> SqlResult<()> {
    conn.execute("DELETE FROM projects WHERE id = ?1", params![id])?;
    Ok(())
}

// --- ApiKey ---

const API_KEY_COLS: &str = "id, project_id, name, provider, memo, service_url, env_var_name, expires_at, last_used_at, created_at, updated_at, reference_urls";

fn row_to_api_key(row: &rusqlite::Row) -> rusqlite::Result<ApiKey> {
    Ok(ApiKey {
        id: row.get(0)?, project_id: row.get(1)?, name: row.get(2)?,
        provider: row.get(3)?, memo: row.get(4)?, service_url: row.get(5)?,
        env_var_name: row.get(6)?, expires_at: row.get(7)?, last_used_at: row.get(8)?,
        created_at: row.get(9)?, updated_at: row.get(10)?, reference_urls: row.get(11)?,
    })
}

fn attach_tags(conn: &Connection, keys: Vec<ApiKey>) -> SqlResult<Vec<ApiKeyWithTags>> {
    let mut result = Vec::new();
    for key in keys {
        let tags = get_tags_for_key(conn, &key.id)?;
        result.push(ApiKeyWithTags { key, tags });
    }
    Ok(result)
}

pub fn create_api_key(conn: &Connection, input: &CreateApiKeyInput, encrypted_value: &str) -> SqlResult<ApiKey> {
    let id = format!("key-{}", uuid::Uuid::new_v4());
    let now = chrono::Utc::now().to_rfc3339();
    conn.execute(
        "INSERT INTO api_keys (id, project_id, name, encrypted_value, provider, memo, service_url, env_var_name, expires_at, reference_urls, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?11)",
        params![id, input.project_id, input.name, encrypted_value, input.provider, input.memo, input.service_url, input.env_var_name, input.expires_at, input.reference_urls, now],
    )?;
    for tag_id in &input.tag_ids {
        conn.execute("INSERT OR IGNORE INTO api_key_tags (api_key_id, tag_id) VALUES (?1, ?2)", params![id, tag_id])?;
    }
    Ok(ApiKey { id, project_id: input.project_id.clone(), name: input.name.clone(), provider: input.provider.clone(), memo: input.memo.clone(), service_url: input.service_url.clone(), env_var_name: input.env_var_name.clone(), expires_at: input.expires_at.clone(), last_used_at: None, reference_urls: input.reference_urls.clone(), created_at: now.clone(), updated_at: now })
}

pub fn list_api_keys(conn: &Connection, project_id: &str) -> SqlResult<Vec<ApiKeyWithTags>> {
    let sql = format!("SELECT {} FROM api_keys WHERE project_id = ?1 ORDER BY name", API_KEY_COLS);
    let mut stmt = conn.prepare(&sql)?;
    let keys: Vec<ApiKey> = stmt.query_map(params![project_id], |row| row_to_api_key(row))?.collect::<SqlResult<Vec<_>>>()?;
    attach_tags(conn, keys)
}

pub fn list_all_api_keys(conn: &Connection) -> SqlResult<Vec<ApiKeyWithTags>> {
    let sql = format!("SELECT {} FROM api_keys ORDER BY name", API_KEY_COLS);
    let mut stmt = conn.prepare(&sql)?;
    let keys: Vec<ApiKey> = stmt.query_map([], |row| row_to_api_key(row))?.collect::<SqlResult<Vec<_>>>()?;
    attach_tags(conn, keys)
}

pub fn search_api_keys(conn: &Connection, query: &str) -> SqlResult<Vec<ApiKeyWithTags>> {
    let pattern = format!("%{}%", query);
    let mut stmt = conn.prepare(
        "SELECT DISTINCT k.id, k.project_id, k.name, k.provider, k.memo, k.service_url, k.env_var_name, k.expires_at, k.last_used_at, k.created_at, k.updated_at
         FROM api_keys k LEFT JOIN api_key_tags akt ON k.id = akt.api_key_id LEFT JOIN tags t ON akt.tag_id = t.id
         WHERE k.name LIKE ?1 OR k.provider LIKE ?1 OR t.name LIKE ?1 OR k.env_var_name LIKE ?1 ORDER BY k.name",
    )?;
    let keys: Vec<ApiKey> = stmt.query_map(params![pattern], |row| row_to_api_key(row))?.collect::<SqlResult<Vec<_>>>()?;
    attach_tags(conn, keys)
}

pub fn get_encrypted_value(conn: &Connection, key_id: &str) -> SqlResult<String> {
    conn.query_row("SELECT encrypted_value FROM api_keys WHERE id = ?1", params![key_id], |row| row.get(0))
}

pub fn update_api_key(conn: &Connection, input: &UpdateApiKeyInput, encrypted_value: Option<&str>) -> SqlResult<()> {
    let now = chrono::Utc::now().to_rfc3339();
    if let Some(ev) = encrypted_value {
        conn.execute(
            "UPDATE api_keys SET name=?1, encrypted_value=?2, provider=?3, memo=?4, service_url=?5, env_var_name=?6, expires_at=?7, reference_urls=?8, updated_at=?9 WHERE id=?10",
            params![input.name, ev, input.provider, input.memo, input.service_url, input.env_var_name, input.expires_at, input.reference_urls, now, input.id],
        )?;
    } else {
        conn.execute(
            "UPDATE api_keys SET name=?1, provider=?2, memo=?3, service_url=?4, env_var_name=?5, expires_at=?6, reference_urls=?7, updated_at=?8 WHERE id=?9",
            params![input.name, input.provider, input.memo, input.service_url, input.env_var_name, input.expires_at, input.reference_urls, now, input.id],
        )?;
    }
    conn.execute("DELETE FROM api_key_tags WHERE api_key_id = ?1", params![input.id])?;
    for tag_id in &input.tag_ids {
        conn.execute("INSERT OR IGNORE INTO api_key_tags (api_key_id, tag_id) VALUES (?1, ?2)", params![input.id, tag_id])?;
    }
    Ok(())
}

pub fn delete_api_key(conn: &Connection, id: &str) -> SqlResult<()> {
    conn.execute("DELETE FROM api_keys WHERE id = ?1", params![id])?;
    Ok(())
}

pub fn quick_update_encrypted_value(conn: &Connection, key_id: &str, encrypted_value: &str) -> SqlResult<()> {
    let now = chrono::Utc::now().to_rfc3339();
    conn.execute(
        "UPDATE api_keys SET encrypted_value = ?1, updated_at = ?2 WHERE id = ?3",
        params![encrypted_value, now, key_id],
    )?;
    Ok(())
}

pub fn update_last_used(conn: &Connection, key_id: &str) -> SqlResult<()> {
    let now = chrono::Utc::now().to_rfc3339();
    conn.execute("UPDATE api_keys SET last_used_at = ?1 WHERE id = ?2", params![now, key_id])?;
    Ok(())
}

// --- Tag ---

pub fn create_tag(conn: &Connection, input: &CreateTagInput) -> SqlResult<Tag> {
    let id = format!("tag-{}", uuid::Uuid::new_v4());
    conn.execute("INSERT INTO tags (id, name, color) VALUES (?1, ?2, ?3)", params![id, input.name, input.color])?;
    Ok(Tag { id, name: input.name.clone(), color: input.color.clone() })
}

pub fn list_tags(conn: &Connection) -> SqlResult<Vec<Tag>> {
    let mut stmt = conn.prepare("SELECT id, name, color FROM tags ORDER BY name")?;
    let rows = stmt.query_map([], |row| Ok(Tag { id: row.get(0)?, name: row.get(1)?, color: row.get(2)? }))?;
    rows.collect()
}

pub fn delete_tag(conn: &Connection, id: &str) -> SqlResult<()> {
    conn.execute("DELETE FROM tags WHERE id = ?1", params![id])?;
    Ok(())
}

fn get_tags_for_key(conn: &Connection, key_id: &str) -> SqlResult<Vec<Tag>> {
    let mut stmt = conn.prepare(
        "SELECT t.id, t.name, t.color FROM tags t INNER JOIN api_key_tags akt ON t.id = akt.tag_id WHERE akt.api_key_id = ?1 ORDER BY t.name",
    )?;
    let rows = stmt.query_map(params![key_id], |row| Ok(Tag { id: row.get(0)?, name: row.get(1)?, color: row.get(2)? }))?;
    rows.collect()
}

// --- Usage Log ---

pub fn add_usage_log(conn: &Connection, api_key_id: &str, action: &str) -> SqlResult<()> {
    conn.execute(
        "INSERT INTO usage_logs (api_key_id, action) VALUES (?1, ?2)",
        params![api_key_id, action],
    )?;
    Ok(())
}

pub fn get_usage_logs(conn: &Connection, api_key_id: &str, limit: i64) -> SqlResult<Vec<UsageLog>> {
    let mut stmt = conn.prepare(
        "SELECT id, api_key_id, action, timestamp FROM usage_logs WHERE api_key_id = ?1 ORDER BY timestamp DESC LIMIT ?2",
    )?;
    let rows = stmt.query_map(params![api_key_id, limit], |row| {
        Ok(UsageLog { id: row.get(0)?, api_key_id: row.get(1)?, action: row.get(2)?, timestamp: row.get(3)? })
    })?;
    rows.collect()
}

pub fn get_recent_logs(conn: &Connection, limit: i64) -> SqlResult<Vec<UsageLogWithKeyName>> {
    let mut stmt = conn.prepare(
        "SELECT l.id, l.api_key_id, l.action, l.timestamp, k.name, k.provider
         FROM usage_logs l JOIN api_keys k ON l.api_key_id = k.id
         ORDER BY l.timestamp DESC LIMIT ?1",
    )?;
    let rows = stmt.query_map(params![limit], |row| {
        Ok(UsageLogWithKeyName {
            id: row.get(0)?, api_key_id: row.get(1)?, action: row.get(2)?,
            timestamp: row.get(3)?, key_name: row.get(4)?, provider: row.get(5)?,
        })
    })?;
    rows.collect()
}

// --- Backup ---

pub fn add_backup_history(conn: &Connection, action: &str, file_path: &str, key_count: i64) -> SqlResult<()> {
    conn.execute(
        "INSERT INTO backup_history (action, file_path, key_count) VALUES (?1, ?2, ?3)",
        params![action, file_path, key_count],
    )?;
    Ok(())
}

// --- Stats ---

pub fn get_total_key_count(conn: &Connection) -> SqlResult<i64> {
    conn.query_row("SELECT COUNT(*) FROM api_keys", [], |row| row.get(0))
}

pub fn get_total_project_count(conn: &Connection) -> SqlResult<i64> {
    conn.query_row("SELECT COUNT(*) FROM projects", [], |row| row.get(0))
}

pub fn get_expiring_soon_count(conn: &Connection, days: i64) -> SqlResult<i64> {
    conn.query_row(
        "SELECT COUNT(*) FROM api_keys WHERE expires_at IS NOT NULL AND expires_at <= date('now', ?1) AND expires_at >= date('now')",
        params![format!("+{} days", days)],
        |row| row.get(0),
    )
}

pub fn get_expired_count(conn: &Connection) -> SqlResult<i64> {
    conn.query_row("SELECT COUNT(*) FROM api_keys WHERE expires_at IS NOT NULL AND expires_at < date('now')", [], |row| row.get(0))
}

// --- Export all for backup ---

pub fn get_all_encrypted_keys(conn: &Connection) -> SqlResult<Vec<(String, String, String, Option<String>, Option<String>, Option<String>, Option<String>)>> {
    let mut stmt = conn.prepare("SELECT id, name, encrypted_value, provider, memo, service_url, env_var_name FROM api_keys")?;
    let rows = stmt.query_map([], |row| {
        Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?, row.get(4)?, row.get(5)?, row.get(6)?))
    })?;
    rows.collect()
}
