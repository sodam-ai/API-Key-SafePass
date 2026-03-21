import { useState } from "react";
import type { ApiKeyWithTags, Project } from "../../types";
import * as api from "../../lib/tauri";
import { useClipboard } from "../../hooks/useClipboard";
import { daysUntilExpiry, expiryColor, expiryBg, expiryText, relativeDate } from "../../lib/utils";
import { getProviderColor } from "../../lib/providerColors";
import KeyFormModal from "../KeyForm/KeyFormModal";
import QuickUpdateModal from "./QuickUpdateModal";

interface KeyListProps {
  projectId: string | null;
  platformName: string | null;
  isAllView?: boolean;
  projects: Project[];
  keys: ApiKeyWithTags[];
  onKeysChanged: () => void;
  onAddKey?: () => void;
}

export default function KeyList({ projectId, platformName, isAllView, projects, keys, onKeysChanged, onAddKey }: KeyListProps) {
  const [showForm, setShowForm] = useState(false);
  const [editKey, setEditKey] = useState<ApiKeyWithTags | null>(null);
  const [quickUpdateKey, setQuickUpdateKey] = useState<ApiKeyWithTags | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const { copyWithAutoClear } = useClipboard();

  const handleCopy = async (keyId: string) => {
    try {
      const value = await api.getApiKeyValue(keyId);
      await copyWithAutoClear(value);
      setCopiedId(keyId);
      onKeysChanged();
      setTimeout(() => setCopiedId(null), 2000);
    } catch (e) {
      alert(String(e));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("이 키를 삭제할까요?")) return;
    try {
      await api.deleteApiKey(id);
      onKeysChanged();
    } catch (e) {
      alert(String(e));
    }
  };

  const handleExportEnv = async () => {
    if (!projectId) return;
    setExporting(true);
    try {
      const envContent = await api.exportEnv(projectId);
      await copyWithAutoClear(envContent);
      alert(".env 내용이 클립보드에 복사되었습니다!\n파일로 저장하려면 프로젝트 폴더에 .env 파일을 만들어 붙여넣기 하세요.");
    } catch (e) {
      alert(String(e));
    } finally {
      setExporting(false);
    }
  };

  const selectedProject = projects.find((p) => p.id === projectId);
  const viewTitle = isAllView ? "전체 키" : platformName ? platformName : selectedProject ? selectedProject.name : "전체 키";
  const isPlatformView = !!platformName;

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-zinc-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {selectedProject && !isPlatformView && !isAllView && (
            <span
              className="w-3 h-3 rounded-full ring-2 ring-offset-1 ring-offset-zinc-950"
              style={{ backgroundColor: selectedProject.color || "#868e96", boxShadow: `0 0 8px ${selectedProject.color || "#868e96"}40` }}
            />
          )}
          {isAllView && (
            <span className="w-3 h-3 rounded-full bg-vault-500 ring-2 ring-vault-500/30 ring-offset-1 ring-offset-zinc-950" />
          )}
          {isPlatformView && (
            <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: getProviderColor(platformName).dot }} />
          )}
          <h1 className="text-lg font-semibold tracking-tight">{viewTitle}</h1>
          <span className="text-sm text-zinc-500 tabular-nums">{keys.length}개</span>
        </div>
        <div className="flex items-center gap-2">
          {projectId && keys.length > 0 && (
            <button
              onClick={handleExportEnv}
              disabled={exporting}
              className="px-3 py-1.5 bg-zinc-800/80 hover:bg-zinc-700 rounded-lg text-xs transition-colors flex items-center gap-1.5 text-zinc-400 hover:text-zinc-200"
              title=".env 파일 내보내기"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              .env
            </button>
          )}
          <button
            onClick={() => {
              if (projectId) { setEditKey(null); setShowForm(true); }
              else if (onAddKey) onAddKey();
            }}
            className="px-3.5 py-1.5 bg-vault-600 hover:bg-vault-500 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            키 추가
          </button>
        </div>
      </div>

      {/* Key Cards */}
      <div className="flex-1 overflow-y-auto p-6">
        {keys.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full animate-fade-in">
            <div className="w-20 h-20 mb-5 rounded-2xl bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 border border-zinc-700/40 flex items-center justify-center shadow-lg">
              <svg className="w-9 h-9 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
              </svg>
            </div>
            <p className="text-base font-medium text-zinc-300 mb-1">
              {isAllView ? "아직 저장된 키가 없습니다" : projectId ? "이 프로젝트에 키가 없습니다" : "키를 추가해보세요"}
            </p>
            <p className="text-sm text-zinc-600 mb-6 text-center leading-relaxed">
              API 키를 안전하게 암호화하여 보관합니다<br />
              붙여넣기만 하면 제공자가 자동 감지됩니다
            </p>
            <button
              onClick={() => {
                if (onAddKey) onAddKey();
                else if (projectId) { setEditKey(null); setShowForm(true); }
              }}
              className="px-6 py-3 bg-vault-600 hover:bg-vault-500 rounded-xl text-sm font-medium transition-all hover:shadow-lg hover:shadow-vault-600/20 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              첫 번째 키 추가하기
            </button>
          </div>
        ) : (
          <div className="space-y-2 stagger-children">
            {keys.map((k) => {
              const days = daysUntilExpiry(k.expires_at);
              const pc = getProviderColor(k.provider);
              const isExpired = days !== null && days < 0;
              const isCopied = copiedId === k.id;

              return (
                <div
                  key={k.id}
                  className={`animate-card-in rounded-xl border transition-all duration-150 group hover-lift ${
                    isCopied
                      ? "bg-green-950/30 border-green-800/50"
                      : `${pc.bg} ${pc.border}`
                  }`}
                >
                  {/* Card content */}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      {/* Left: Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          {/* Provider dot */}
                          <span
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: pc.dot }}
                          />
                          <h3 className="font-medium text-[15px] text-zinc-100 truncate">{k.name}</h3>
                          {k.provider && (
                            <span className={`px-2 py-0.5 rounded-md text-[11px] font-medium ${pc.text} bg-black/20`}>
                              {k.provider}
                            </span>
                          )}
                          {k.env_var_name && (
                            <span className="px-1.5 py-0.5 rounded text-[11px] text-zinc-500 font-mono bg-black/20">
                              {k.env_var_name}
                            </span>
                          )}
                          {days !== null && (
                            <span className={`px-2 py-0.5 rounded-md border text-[11px] font-mono font-semibold ${expiryBg(days)} ${expiryColor(days)}`}>
                              {expiryText(days)}
                            </span>
                          )}
                        </div>

                        {k.memo && (
                          <p className="text-xs text-zinc-500 mb-2 pl-4">{k.memo}</p>
                        )}

                        <div className="flex items-center gap-3 pl-4 flex-wrap">
                          {(isPlatformView || isAllView) && (
                            <span className="text-[11px] text-zinc-600 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
                              {projects.find((p) => p.id === k.project_id)?.name || ""}
                            </span>
                          )}
                          {k.tags.map((tag) => (
                            <span
                              key={tag.id}
                              className="px-2 py-0.5 rounded-full text-[11px] text-zinc-500 bg-zinc-800/60"
                            >
                              #{tag.name}
                            </span>
                          ))}
                          {k.updated_at && k.updated_at !== k.created_at && (
                            <span className="text-[11px] text-zinc-600">변경 {relativeDate(k.updated_at)}</span>
                          )}
                          {k.last_used_at && (
                            <span className="text-[11px] text-zinc-600">사용 {relativeDate(k.last_used_at)}</span>
                          )}
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {/* Expired: reissue button */}
                        {isExpired && (
                          <button
                            onClick={() => setQuickUpdateKey(k)}
                            className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-red-900/40 hover:bg-red-900/60 text-red-400 border border-red-800/40 transition-colors"
                          >
                            재발급
                          </button>
                        )}

                        {/* Service URL */}
                        {k.service_url && (
                          <button
                            onClick={() => window.open(k.service_url!, "_blank")}
                            className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-600 hover:text-zinc-300 transition-colors"
                            title="키 관리 페이지"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                            </svg>
                          </button>
                        )}

                        {/* Copy */}
                        <button
                          onClick={() => handleCopy(k.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            isCopied
                              ? "bg-green-600/20 text-green-400 ring-1 ring-green-500/30"
                              : "bg-white/5 hover:bg-white/10 text-zinc-300"
                          }`}
                          title="키 복사 (30초 후 자동 삭제)"
                        >
                          {isCopied ? "✓ 복사됨" : "복사"}
                        </button>

                        {/* Quick update */}
                        <button
                          onClick={() => setQuickUpdateKey(k)}
                          className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-600 hover:text-vault-400 opacity-0 group-hover:opacity-100 transition-all"
                          title="키값 변경"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182M2.985 19.644l3.181-3.182" />
                          </svg>
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => { setEditKey(k); setShowForm(true); }}
                          className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-600 hover:text-zinc-300 opacity-0 group-hover:opacity-100 transition-all"
                          title="전체 수정"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487z" />
                          </svg>
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(k.id)}
                          className="p-1.5 rounded-lg hover:bg-red-950/50 text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                          title="삭제"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && projectId && (
        <KeyFormModal
          projectId={projectId}
          editKey={editKey}
          onClose={() => { setShowForm(false); setEditKey(null); }}
          onSaved={() => { setShowForm(false); setEditKey(null); onKeysChanged(); }}
        />
      )}

      {/* Quick Update Modal */}
      {quickUpdateKey && (
        <QuickUpdateModal
          keyId={quickUpdateKey.id}
          keyName={quickUpdateKey.name}
          provider={quickUpdateKey.provider}
          serviceUrl={quickUpdateKey.service_url}
          isExpired={(() => { const d = daysUntilExpiry(quickUpdateKey.expires_at); return d !== null && d < 0; })()}
          onClose={() => setQuickUpdateKey(null)}
          onSaved={() => { setQuickUpdateKey(null); onKeysChanged(); }}
        />
      )}
    </div>
  );
}
