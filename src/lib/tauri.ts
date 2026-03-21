import { invoke } from "@tauri-apps/api/core";
import type {
  Project, ApiKey, ApiKeyWithTags, Tag,
  CreateProjectInput, UpdateProjectInput,
  CreateApiKeyInput, UpdateApiKeyInput,
  CreateTagInput, Stats, UsageLogWithKeyName,
} from "../types";

// --- Auth ---
export const checkHasMasterPassword = () => invoke<boolean>("check_has_master_password");
export const setupMasterPassword = (password: string) => invoke<string>("setup_master_password", { password });
export const unlock = (password: string) => invoke<boolean>("unlock", { password });
export const unlockWithRecovery = (recoveryKey: string) => invoke<boolean>("unlock_with_recovery", { recoveryKey });
export const changeMasterPassword = (currentPassword: string, newPassword: string) =>
  invoke<void>("change_master_password", { currentPassword, newPassword });
export const lock = () => invoke<void>("lock");

// --- Projects ---
export const createProject = (input: CreateProjectInput) => invoke<Project>("create_project", { input });
export const listProjects = () => invoke<Project[]>("list_projects");
export const updateProject = (input: UpdateProjectInput) => invoke<void>("update_project", { input });
export const deleteProject = (id: string) => invoke<void>("delete_project", { id });

// --- API Keys ---
export const createApiKey = (input: CreateApiKeyInput) => invoke<ApiKey>("create_api_key", { input });
export const listApiKeys = (projectId: string) => invoke<ApiKeyWithTags[]>("list_api_keys", { projectId });
export const listAllApiKeys = () => invoke<ApiKeyWithTags[]>("list_all_api_keys");
export const getApiKeyValue = (keyId: string) => invoke<string>("get_api_key_value", { keyId });
export const updateApiKey = (input: UpdateApiKeyInput) => invoke<void>("update_api_key", { input });
export const deleteApiKey = (id: string) => invoke<void>("delete_api_key", { id });
export const searchApiKeys = (query: string) => invoke<ApiKeyWithTags[]>("search_api_keys", { query });

// --- Quick Update ---
export const quickUpdateKeyValue = (keyId: string, newValue: string) =>
  invoke<void>("quick_update_key_value", { keyId, newValue });

// --- .env ---
export const exportEnv = (projectId: string) => invoke<string>("export_env", { projectId });
export const importEnv = (projectId: string, content: string) => invoke<number>("import_env", { projectId, content });

// --- Tags ---
export const createTag = (input: CreateTagInput) => invoke<Tag>("create_tag", { input });
export const listTags = () => invoke<Tag[]>("list_tags");
export const deleteTag = (id: string) => invoke<void>("delete_tag", { id });

// --- Logs ---
export const getRecentLogs = (limit: number) => invoke<UsageLogWithKeyName[]>("get_recent_logs", { limit });

// --- Stats ---
export const getStats = () => invoke<Stats>("get_stats");
