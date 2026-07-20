export interface Project {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApiKey {
  id: string;
  project_id: string;
  name: string;
  provider: string | null;
  memo: string | null;
  service_url: string | null;
  env_var_name: string | null;
  expires_at: string | null;
  last_used_at: string | null;
  reference_urls: string | null; // JSON: [{"label":"문서","url":"https://..."}]
  created_at: string;
  updated_at: string;
  has_accounts: boolean;
}

export interface ReferenceUrl {
  label: string;
  url: string;
}

export interface AccountEntry {
  label: string;
  username?: string;
  password?: string;
  site_url?: string;
  key_value?: string;
  expires_at?: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string | null;
}

export interface ApiKeyWithTags extends ApiKey {
  tags: Tag[];
}

export interface CreateProjectInput {
  name: string;
  description?: string;
  color?: string;
}

export interface UpdateProjectInput {
  id: string;
  name: string;
  description?: string;
  color?: string;
}

export interface CreateApiKeyInput {
  project_id: string;
  name: string;
  value: string;
  provider?: string;
  memo?: string;
  service_url?: string;
  env_var_name?: string;
  expires_at?: string;
  reference_urls?: string;
  tag_ids: string[];
}

export interface UpdateApiKeyInput {
  id: string;
  name: string;
  value?: string;
  provider?: string;
  memo?: string;
  service_url?: string;
  env_var_name?: string;
  expires_at?: string;
  reference_urls?: string;
  tag_ids: string[];
}

export interface CreateTagInput {
  name: string;
  color?: string;
}

export interface AppPreferences {
  autoLockMin: number;        // 0 = disabled
  clipboardClearSec: number;
  blurEnabled: boolean;
  blurDelaySec: number;
}

export const DEFAULT_PREFS: AppPreferences = {
  autoLockMin: 5,
  clipboardClearSec: 10,
  blurEnabled: true,
  blurDelaySec: 3,
};

export interface Stats {
  total_keys: number;
  total_projects: number;
  expiring_soon: number;
  expired: number;
}

export interface UsageLogWithKeyName {
  id: number;
  api_key_id: string;
  action: string;
  timestamp: string;
  key_name: string;
  provider: string | null;
}
