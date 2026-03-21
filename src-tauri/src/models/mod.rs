use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Project {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub color: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ApiKey {
    pub id: String,
    pub project_id: String,
    pub name: String,
    pub provider: Option<String>,
    pub memo: Option<String>,
    pub service_url: Option<String>,
    pub env_var_name: Option<String>,
    pub expires_at: Option<String>,
    pub last_used_at: Option<String>,
    pub reference_urls: Option<String>, // JSON: [{"label":"문서","url":"https://..."}]
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Tag {
    pub id: String,
    pub name: String,
    pub color: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ApiKeyWithTags {
    #[serde(flatten)]
    pub key: ApiKey,
    pub tags: Vec<Tag>,
}

// --- Input DTOs ---

#[derive(Debug, Deserialize)]
pub struct CreateProjectInput {
    pub name: String,
    pub description: Option<String>,
    pub color: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateProjectInput {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub color: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateApiKeyInput {
    pub project_id: String,
    pub name: String,
    pub value: String,
    pub provider: Option<String>,
    pub memo: Option<String>,
    pub service_url: Option<String>,
    pub env_var_name: Option<String>,
    pub expires_at: Option<String>,
    pub reference_urls: Option<String>,
    pub tag_ids: Vec<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateApiKeyInput {
    pub id: String,
    pub name: String,
    pub value: Option<String>,
    pub provider: Option<String>,
    pub memo: Option<String>,
    pub service_url: Option<String>,
    pub env_var_name: Option<String>,
    pub expires_at: Option<String>,
    pub reference_urls: Option<String>,
    pub tag_ids: Vec<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateTagInput {
    pub name: String,
    pub color: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct UsageLog {
    pub id: i64,
    pub api_key_id: String,
    pub action: String,
    pub timestamp: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct UsageLogWithKeyName {
    pub id: i64,
    pub api_key_id: String,
    pub action: String,
    pub timestamp: String,
    pub key_name: String,
    pub provider: Option<String>,
}
