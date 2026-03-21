import { useEffect, useState } from "react";
import type { Stats, ApiKeyWithTags, Project } from "../../types";
import * as api from "../../lib/tauri";
import { daysUntilExpiry, expiryColor, expiryText, relativeDate } from "../../lib/utils";

interface DashboardProps {
  projects: Project[];
  onSelectProject: (id: string) => void;
}

export default function Dashboard({ projects, onSelectProject }: DashboardProps) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [allKeys, setAllKeys] = useState<ApiKeyWithTags[]>([]);

  useEffect(() => {
    api.getStats().then(setStats).catch(console.error);
    api.listAllApiKeys().then(setAllKeys).catch(console.error);
  }, []);

  const expiringKeys = allKeys
    .filter((k) => {
      const d = daysUntilExpiry(k.expires_at);
      return d !== null && d <= 30;
    })
    .sort((a, b) => {
      const da = daysUntilExpiry(a.expires_at) ?? 999;
      const db = daysUntilExpiry(b.expires_at) ?? 999;
      return da - db;
    });

  const recentlyUsed = allKeys
    .filter((k) => k.last_used_at)
    .sort((a, b) => (b.last_used_at || "").localeCompare(a.last_used_at || ""))
    .slice(0, 5);

  const getProjectName = (id: string) => projects.find((p) => p.id === id)?.name || "";

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <h1 className="text-xl font-semibold mb-6">대시보드</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <div className="text-2xl font-bold text-vault-400">{stats?.total_keys ?? 0}</div>
          <div className="text-xs text-zinc-500 mt-1">전체 키</div>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <div className="text-2xl font-bold text-zinc-300">{stats?.total_projects ?? 0}</div>
          <div className="text-xs text-zinc-500 mt-1">프로젝트</div>
        </div>
        <div className="bg-zinc-900/50 border border-yellow-900/30 rounded-xl p-4">
          <div className="text-2xl font-bold text-yellow-400">{stats?.expiring_soon ?? 0}</div>
          <div className="text-xs text-zinc-500 mt-1">30일 내 만료</div>
        </div>
        <div className="bg-zinc-900/50 border border-red-900/30 rounded-xl p-4">
          <div className="text-2xl font-bold text-red-400">{stats?.expired ?? 0}</div>
          <div className="text-xs text-zinc-500 mt-1">만료됨</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Expiring Soon */}
        <div>
          <h2 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-yellow-400" />
            만료 임박 키
          </h2>
          {expiringKeys.length === 0 ? (
            <div className="bg-zinc-900/30 border border-zinc-800 rounded-lg p-4 text-sm text-zinc-600">
              만료 임박한 키가 없습니다
            </div>
          ) : (
            <div className="space-y-2">
              {expiringKeys.map((k) => {
                const days = daysUntilExpiry(k.expires_at);
                return (
                  <button
                    key={k.id}
                    onClick={() => onSelectProject(k.project_id)}
                    className="w-full text-left bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 hover:border-zinc-700 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{k.name}</div>
                        <div className="text-xs text-zinc-600">{getProjectName(k.project_id)}</div>
                      </div>
                      <span className={`text-xs font-mono font-bold ${expiryColor(days)}`}>
                        {expiryText(days)}
                      </span>
                    </div>
                    {k.service_url && (
                      <div className="text-xs text-vault-500 mt-1 truncate">
                        재발급: {k.service_url}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Recently Used */}
        <div>
          <h2 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-vault-400" />
            최근 사용한 키
          </h2>
          {recentlyUsed.length === 0 ? (
            <div className="bg-zinc-900/30 border border-zinc-800 rounded-lg p-4 text-sm text-zinc-600">
              아직 사용한 키가 없습니다
            </div>
          ) : (
            <div className="space-y-2">
              {recentlyUsed.map((k) => (
                <button
                  key={k.id}
                  onClick={() => onSelectProject(k.project_id)}
                  className="w-full text-left bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 hover:border-zinc-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{k.name}</div>
                      <div className="text-xs text-zinc-600">{getProjectName(k.project_id)}</div>
                    </div>
                    <span className="text-xs text-zinc-500">{relativeDate(k.last_used_at)}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
