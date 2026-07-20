import { useState, useEffect } from "react";
import type { ApiKeyWithTags, CreateApiKeyInput, UpdateApiKeyInput, ReferenceUrl, Tag, AccountEntry } from "../../types";
import * as api from "../../lib/tauri";
import { PROVIDER_PRESETS, detectProvider, getProvidersByCategory, matchProvider } from "../../lib/providers";
import AccountEntryList from "./AccountEntryList";

const TAG_COLORS = ["#4c6ef5", "#7950f2", "#e64980", "#f76707", "#12b886", "#15aabf", "#fab005", "#868e96"];

interface KeyFormModalProps {
  projectId: string;
  editKey?: ApiKeyWithTags | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function KeyFormModal({ projectId, editKey, onClose, onSaved }: KeyFormModalProps) {
  const [name, setName] = useState("");
  const [value, setValue] = useState("");
  const [provider, setProvider] = useState("");
  const [memo, setMemo] = useState("");
  const [serviceUrl, setServiceUrl] = useState("");
  const [envVarName, setEnvVarName] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [referenceUrls, setReferenceUrls] = useState<ReferenceUrl[]>([]);
  const [newRefLabel, setNewRefLabel] = useState("");
  const [newRefUrl, setNewRefUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [providerSearch, setProviderSearch] = useState("");
  const [showProviderPicker, setShowProviderPicker] = useState(false);
  const [autoDetected, setAutoDetected] = useState(false);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [newTagName, setNewTagName] = useState("");
  const [creatingTag, setCreatingTag] = useState(false);
  const [accounts, setAccounts] = useState<AccountEntry[]>([]);
  // True when an existing key's accounts blob failed to load (decrypt/parse/IPC error).
  // Guards handleSave from overwriting real saved accounts with an empty array just
  // because the fetch that was supposed to populate them didn't succeed.
  const [accountsLoadFailed, setAccountsLoadFailed] = useState(false);

  useEffect(() => {
    api.listTags().then(setAvailableTags).catch(() => { /* tag list is optional; form still works without it */ });
  }, []);

  useEffect(() => {
    setAccountsLoadFailed(false);
    if (editKey?.has_accounts) {
      api.getKeyAccounts(editKey.id).then(setAccounts).catch(() => {
        setAccounts([]);
        setAccountsLoadFailed(true);
      });
    } else {
      setAccounts([]);
    }
  }, [editKey]);

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((prev) => (prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]));
  };

  const handleCreateTag = async () => {
    const trimmed = newTagName.trim();
    if (!trimmed) return;
    setCreatingTag(true);
    try {
      const tag = await api.createTag({ name: trimmed, color: TAG_COLORS[availableTags.length % TAG_COLORS.length] });
      setAvailableTags((prev) => [...prev, tag]);
      setSelectedTagIds((prev) => [...prev, tag.id]);
      setNewTagName("");
    } catch (e) {
      setError(String(e));
    } finally {
      setCreatingTag(false);
    }
  };

  useEffect(() => {
    if (editKey) {
      setName(editKey.name);
      setProvider(editKey.provider || "");
      setMemo(editKey.memo || "");
      setServiceUrl(editKey.service_url || "");
      setEnvVarName(editKey.env_var_name || "");
      setExpiresAt(editKey.expires_at?.split("T")[0] || "");
      setSelectedTagIds(editKey.tags?.map((t) => t.id) || []);
      if (editKey.reference_urls) {
        try { setReferenceUrls(JSON.parse(editKey.reference_urls)); } catch { /* ignore */ }
      }
    }
  }, [editKey]);

  // Auto-detect provider when key value is pasted
  const handleValueChange = (newVal: string) => {
    setValue(newVal);
    if (!editKey && !provider && newVal.length >= 3) {
      const detected = detectProvider(newVal);
      if (detected) {
        setProvider(detected.name);
        if (!name) setName(`${detected.name} API Key`);
        if (!envVarName) setEnvVarName(detected.envVarName);
        if (!serviceUrl) setServiceUrl(detected.serviceUrl);
        setAutoDetected(true);
      }
    }
  };

  const applyPreset = (preset: typeof PROVIDER_PRESETS[0]) => {
    setProvider(preset.name);
    if (!name) setName(`${preset.name} API Key`);
    if (!envVarName) setEnvVarName(preset.envVarName);
    if (!serviceUrl) setServiceUrl(preset.serviceUrl);
    setShowProviderPicker(false);
    setProviderSearch("");
  };

  const filteredPresets = PROVIDER_PRESETS.filter((p) => matchProvider(p, providerSearch));

  const handleSave = async () => {
    // Auto-generate name if empty
    const finalName = name.trim() || (provider ? `${provider} API Key` : `API Key ${new Date().toLocaleDateString("ko-KR")}`);

    setLoading(true);
    setError("");
    try {
      const refUrlsJson = referenceUrls.length > 0 ? JSON.stringify(referenceUrls) : undefined;
      let savedKeyId: string;
      if (editKey) {
        const input: UpdateApiKeyInput = {
          id: editKey.id,
          name: finalName,
          value: value.trim() || undefined,
          provider: provider.trim() || undefined,
          memo: memo.trim() || undefined,
          service_url: serviceUrl.trim() || undefined,
          env_var_name: envVarName.trim() || undefined,
          expires_at: expiresAt || undefined,
          reference_urls: refUrlsJson,
          tag_ids: selectedTagIds,
        };
        await api.updateApiKey(input);
        savedKeyId = editKey.id;
      } else {
        const input: CreateApiKeyInput = {
          project_id: projectId,
          name: finalName,
          value: value.trim() || "",
          provider: provider.trim() || undefined,
          memo: memo.trim() || undefined,
          service_url: serviceUrl.trim() || undefined,
          env_var_name: envVarName.trim() || undefined,
          expires_at: expiresAt || undefined,
          reference_urls: refUrlsJson,
          tag_ids: selectedTagIds,
        };
        const created = await api.createApiKey(input);
        savedKeyId = created.id;
      }
      // Only touch the accounts blob when there's something to save or clear —
      // avoids a needless encrypt/write for the common case of a key with no accounts.
      // If loading the existing accounts failed, we don't know their real contents,
      // so skip writing rather than risk overwriting saved data with an empty array.
      if (accountsLoadFailed && editKey?.has_accounts) {
        // no-op: preserve whatever is already stored
      } else if (accounts.length > 0 || editKey?.has_accounts) {
        await api.setKeyAccounts(savedKeyId, accounts);
      }
      onSaved();
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-lg mx-4 p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold mb-4">
          {editKey ? "키 수정" : "새 API 키 추가"}
        </h2>

        <div className="space-y-3">
          {/* Provider Preset (new key only) */}
          {!editKey && (
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">제공자 선택</label>
              <div className="relative">
                <button
                  onClick={() => setShowProviderPicker(!showProviderPicker)}
                  className={`w-full px-3 py-2.5 bg-zinc-800 border rounded-lg text-sm text-left transition-colors flex items-center justify-between ${
                    showProviderPicker ? "border-vault-500" : "border-zinc-700"
                  }`}
                >
                  <span className={provider ? "text-zinc-200" : "text-zinc-500"}>
                    {provider || "제공자를 선택하거나 키를 먼저 붙여넣기..."}
                  </span>
                  <svg className={`w-4 h-4 text-zinc-500 transition-transform ${showProviderPicker ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>

                {showProviderPicker && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-10 max-h-56 overflow-hidden flex flex-col">
                    <div className="p-2 border-b border-zinc-700">
                      <input
                        type="text"
                        placeholder="검색... (한글, 영문, 초성 ㅇㅍ)"
                        value={providerSearch}
                        onChange={(e) => setProviderSearch(e.target.value)}
                        autoFocus
                        className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-700 rounded text-xs
                                   focus:outline-none focus:border-vault-500 placeholder-zinc-500"
                      />
                    </div>
                    <div className="overflow-y-auto max-h-64">
                      {(() => {
                        const { grouped, labels } = getProvidersByCategory();
                        const categories = ["ai", "cloud", "dev", "payment", "comm"];
                        const hasResults = filteredPresets.length > 0;

                        return (
                          <>
                            {categories.map((cat) => {
                              const items = (grouped.get(cat) || []).filter((p) => matchProvider(p, providerSearch));
                              if (items.length === 0) return null;
                              return (
                                <div key={cat}>
                                  <div className="px-3 py-1.5 text-[10px] font-semibold text-zinc-500 uppercase tracking-widest bg-zinc-900/50 sticky top-0">
                                    {labels[cat]}
                                  </div>
                                  {items.map((preset) => (
                                    <button
                                      key={preset.name}
                                      onClick={() => applyPreset(preset)}
                                      className="w-full text-left px-3 py-1.5 text-sm hover:bg-zinc-700 transition-colors flex items-center justify-between"
                                    >
                                      <div>
                                        <span className="text-zinc-200 text-xs">{preset.name}</span>
                                        <span className="text-[11px] text-zinc-600 ml-1.5">{preset.nameKo}</span>
                                      </div>
                                      <span className="text-[11px] text-zinc-600 font-mono">{preset.envVarName}</span>
                                    </button>
                                  ))}
                                </div>
                              );
                            })}

                            {/* 직접 추가 */}
                            <div className="border-t border-zinc-700/50">
                              <button
                                onClick={() => {
                                  const customName = providerSearch.trim() || "";
                                  if (customName) {
                                    setProvider(customName);
                                    if (!name) setName(`${customName} API Key`);
                                  }
                                  setShowProviderPicker(false);
                                  setProviderSearch("");
                                }}
                                className="w-full text-left px-3 py-2.5 text-sm hover:bg-zinc-700 transition-colors flex items-center gap-2"
                              >
                                <svg className="w-4 h-4 text-vault-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                </svg>
                                <span className="text-vault-400 text-xs font-medium">
                                  {providerSearch.trim()
                                    ? `"${providerSearch.trim()}" 직접 추가`
                                    : "제공자 직접 입력하기"}
                                </span>
                              </button>
                            </div>

                            {!hasResults && providerSearch.trim() && (
                              <p className="px-3 py-2 text-[11px] text-zinc-600 text-center">
                                목록에 없는 제공자는 위 "직접 추가"를 눌러주세요
                              </p>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>

              {autoDetected && (
                <p className="text-xs text-vault-400 mt-1 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                  키 접두사로 {provider} 자동 감지됨
                </p>
              )}
            </div>
          )}

          {/* Key Value — moved up for paste-first flow */}
          <div>
            <label className="block text-xs text-zinc-400 mb-1">
              키값 <span className="text-zinc-600">(나중에 추가해도 됩니다)</span>
            </label>
            <textarea
              placeholder={editKey ? "변경하지 않으려면 비워두세요" : "키를 붙여넣기... (자동으로 제공자를 감지합니다)"}
              value={value}
              onChange={(e) => handleValueChange(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm font-mono
                         focus:outline-none focus:border-vault-500 placeholder-zinc-500 resize-none"
            />
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs text-zinc-400 mb-1">이름 <span className="text-zinc-600">(비워두면 자동 생성)</span></label>
            <input
              type="text"
              placeholder={provider ? `${provider} API Key` : "비워두면 자동으로 이름이 만들어집니다"}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm
                         focus:outline-none focus:border-vault-500 placeholder-zinc-500"
            />
          </div>

          {/* Provider (manual input when editing) */}
          {editKey && (
            <div>
              <label className="block text-xs text-zinc-400 mb-1">제공자</label>
              <input
                type="text"
                placeholder="OpenAI, Claude, ..."
                value={provider}
                onChange={(e) => { setProvider(e.target.value); setAutoDetected(false); }}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm
                           focus:outline-none focus:border-vault-500 placeholder-zinc-500"
              />
            </div>
          )}

          {/* .env variable name */}
          <div>
            <label className="block text-xs text-zinc-400 mb-1">.env 변수명</label>
            <input
              type="text"
              placeholder="OPENAI_API_KEY"
              value={envVarName}
              onChange={(e) => setEnvVarName(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm font-mono
                         focus:outline-none focus:border-vault-500 placeholder-zinc-500"
            />
          </div>

          {/* Service URL — always visible */}
          <div>
            <label className="block text-xs text-zinc-400 mb-1">키 관리 페이지 URL</label>
            <input
              type="url"
              placeholder="https://platform.openai.com/api-keys"
              value={serviceUrl}
              onChange={(e) => setServiceUrl(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm
                         focus:outline-none focus:border-vault-500 placeholder-zinc-500"
            />
            <p className="text-xs text-zinc-600 mt-1">키 재발급이 필요할 때 바로 열 수 있습니다</p>
          </div>

          {/* Reference URLs */}
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5">참고 URL</label>
            {referenceUrls.length > 0 && (
              <div className="space-y-1.5 mb-2">
                {referenceUrls.map((ref, i) => (
                  <div key={i} className="flex items-center gap-2 bg-zinc-800/60 rounded-lg px-3 py-1.5">
                    <span className="text-xs text-zinc-300 font-medium truncate w-20">{ref.label}</span>
                    <span className="text-xs text-zinc-500 truncate flex-1">{ref.url}</span>
                    <button
                      onClick={() => setReferenceUrls(referenceUrls.filter((_, j) => j !== i))}
                      className="p-0.5 rounded hover:bg-red-900/40 text-zinc-600 hover:text-red-400 flex-shrink-0 transition-colors"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="라벨 (예: 문서)"
                value={newRefLabel}
                onChange={(e) => setNewRefLabel(e.target.value)}
                className="w-24 px-2.5 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-xs
                           focus:outline-none focus:border-vault-500 placeholder-zinc-600"
              />
              <input
                type="url"
                placeholder="https://..."
                value={newRefUrl}
                onChange={(e) => setNewRefUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newRefUrl.trim()) {
                    e.preventDefault();
                    setReferenceUrls([...referenceUrls, { label: newRefLabel.trim() || "링크", url: newRefUrl.trim() }]);
                    setNewRefLabel("");
                    setNewRefUrl("");
                  }
                }}
                className="flex-1 px-2.5 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-xs
                           focus:outline-none focus:border-vault-500 placeholder-zinc-600"
              />
              <button
                onClick={() => {
                  if (!newRefUrl.trim()) return;
                  setReferenceUrls([...referenceUrls, { label: newRefLabel.trim() || "링크", url: newRefUrl.trim() }]);
                  setNewRefLabel("");
                  setNewRefUrl("");
                }}
                disabled={!newRefUrl.trim()}
                className="px-2.5 py-1.5 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-xs disabled:opacity-40 transition-colors flex-shrink-0"
              >
                추가
              </button>
            </div>
            <p className="text-[11px] text-zinc-600 mt-1">문서, 요금 페이지, 대시보드 등 참고할 URL</p>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5">태그</label>
            {availableTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {availableTags.map((tag) => {
                  const active = selectedTagIds.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                        active ? "text-white border-transparent" : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700"
                      }`}
                      style={active ? { backgroundColor: tag.color || "#4c6ef5" } : undefined}
                    >
                      #{tag.name}
                    </button>
                  );
                })}
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="새 태그 이름 (예: 무료, 테스트)"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); handleCreateTag(); }
                }}
                className="flex-1 px-2.5 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-xs
                           focus:outline-none focus:border-vault-500 placeholder-zinc-600"
              />
              <button
                type="button"
                onClick={handleCreateTag}
                disabled={!newTagName.trim() || creatingTag}
                className="px-2.5 py-1.5 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-xs disabled:opacity-40 transition-colors flex-shrink-0"
              >
                추가
              </button>
            </div>
          </div>

          {/* Additional fields — always visible */}
          <div className="space-y-3 pt-1 border-t border-zinc-800/50">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">만료일</label>
                <input
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm
                             focus:outline-none focus:border-vault-500 [color-scheme:dark]"
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1">메모</label>
                <input
                  type="text"
                  placeholder="월 $20 플랜 키, 무료 tier, ..."
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm
                             focus:outline-none focus:border-vault-500 placeholder-zinc-500"
                />
              </div>

          </div>

          {accountsLoadFailed && (
            <p className="text-xs text-yellow-400 -mb-1">
              저장된 계정 정보를 불러오지 못했습니다. 이 화면에서 수정해도 기존 계정은 그대로 유지됩니다.
            </p>
          )}
          <AccountEntryList accounts={accounts} onChange={setAccounts} defaultExpanded={!!editKey?.has_accounts} />
        </div>

        {error && <p className="text-red-400 text-sm mt-3">{error}</p>}

        <div className="flex gap-3 mt-6">
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 py-2.5 bg-vault-600 hover:bg-vault-700 rounded-lg text-sm font-medium
                       disabled:opacity-50 transition-colors"
          >
            {loading ? "저장 중..." : editKey ? "수정" : "저장"}
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-sm font-medium transition-colors"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
}
