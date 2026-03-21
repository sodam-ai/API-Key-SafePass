import { useState, useMemo } from "react";
import type { Project, ApiKeyWithTags } from "../../types";
import * as api from "../../lib/tauri";
import { getProviderColor } from "../../lib/providerColors";

const PROJECT_COLORS = [
  "#4c6ef5", "#7950f2", "#e64980", "#f76707",
  "#12b886", "#15aabf", "#fab005", "#868e96",
];

interface SidebarSelection {
  type: "dashboard" | "all" | "project" | "platform";
  id: string | null;
}

interface ProjectSidebarProps {
  projects: Project[];
  allKeys: ApiKeyWithTags[];
  selection: SidebarSelection;
  onSelect: (sel: SidebarSelection) => void;
  onProjectsChanged: () => void;
  onLock: () => void;
}

export default function ProjectSidebar({
  projects,
  allKeys,
  selection,
  onSelect,
  onProjectsChanged,
  onLock,
}: ProjectSidebarProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(PROJECT_COLORS[0]);

  const platforms = useMemo(() => {
    const map = new Map<string, number>();
    for (const k of allKeys) {
      const provider = k.provider || "기타";
      map.set(provider, (map.get(provider) || 0) + 1);
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [allKeys]);

  const resetForm = () => {
    setShowForm(false);
    setEditingProject(null);
    setName("");
    setDescription("");
    setColor(PROJECT_COLORS[0]);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    try {
      if (editingProject) {
        await api.updateProject({ id: editingProject.id, name: name.trim(), description: description.trim() || undefined, color });
      } else {
        await api.createProject({ name: name.trim(), description: description.trim() || undefined, color });
      }
      resetForm();
      onProjectsChanged();
    } catch (e) {
      alert(String(e));
    }
  };

  const handleEdit = (p: Project) => {
    setEditingProject(p);
    setName(p.name);
    setDescription(p.description || "");
    setColor(p.color || PROJECT_COLORS[0]);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("이 프로젝트와 포함된 모든 키를 삭제할까요?")) return;
    try {
      await api.deleteProject(id);
      if (selection.type === "project" && selection.id === id) onSelect({ type: "all", id: null });
      onProjectsChanged();
    } catch (e) {
      alert(String(e));
    }
  };

  const projectKeyCount = (projectId: string) => allKeys.filter((k) => k.project_id === projectId).length;

  const navItem = (
    active: boolean,
    onClick: () => void,
    icon: React.ReactNode,
    label: string,
    count?: number,
    dotColor?: string,
  ) => (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2 rounded-lg text-[13px] transition-all duration-100 flex items-center gap-2.5 ${
        active
          ? "bg-zinc-800/80 text-white shadow-sm"
          : "text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200"
      }`}
    >
      {dotColor ? (
        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: dotColor }} />
      ) : (
        <span className="w-4 h-4 flex-shrink-0 flex items-center justify-center">{icon}</span>
      )}
      <span className="truncate flex-1">{label}</span>
      {count !== undefined && count > 0 && (
        <span className="text-[11px] text-zinc-600 tabular-nums">{count}</span>
      )}
    </button>
  );

  return (
    <aside className="w-60 bg-zinc-900/40 border-r border-zinc-800/60 flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-zinc-800/60">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-vault-600/20 border border-vault-600/30 flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-vault-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-zinc-200 tracking-tight">API Key Vault</span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {/* All Keys */}
        {navItem(
          selection.type === "all",
          () => onSelect({ type: "all", id: null }),
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
          </svg>,
          "전체 키",
          allKeys.length,
        )}

        {/* Dashboard */}
        {navItem(
          selection.type === "dashboard",
          () => onSelect({ type: "dashboard", id: null }),
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
          </svg>,
          "대시보드",
        )}

        {/* Projects */}
        <div className="pt-4">
          <div className="flex items-center justify-between px-3 mb-1.5">
            <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">프로젝트</span>
            <button
              onClick={() => { resetForm(); setShowForm(true); }}
              className="w-4 h-4 flex items-center justify-center rounded text-zinc-600 hover:text-zinc-300 hover:bg-zinc-700 transition-colors"
              title="프로젝트 추가"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </button>
          </div>

          {showForm && (
            <div className="mx-1 p-2.5 mb-1 border border-zinc-700/50 bg-zinc-900/80 rounded-lg space-y-2 animate-slide-down">
              <input
                type="text" placeholder="프로젝트 이름" value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
                autoFocus
                className="w-full px-2.5 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-xs focus:outline-none focus:border-vault-500 placeholder-zinc-500"
              />
              <input
                type="text" placeholder="설명 (선택)" value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-xs focus:outline-none focus:border-vault-500 placeholder-zinc-500"
              />
              <div className="flex gap-1">
                {PROJECT_COLORS.map((c) => (
                  <button key={c} onClick={() => setColor(c)}
                    className={`w-4 h-4 rounded-full border-2 transition-all ${color === c ? "border-white scale-125" : "border-transparent hover:scale-110"}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <div className="flex gap-1.5">
                <button onClick={handleSave} disabled={!name.trim()}
                  className="flex-1 py-1.5 bg-vault-600 hover:bg-vault-500 rounded text-[11px] font-medium disabled:opacity-40 transition-colors">
                  {editingProject ? "수정" : "추가"}
                </button>
                <button onClick={resetForm}
                  className="flex-1 py-1.5 bg-zinc-700 hover:bg-zinc-600 rounded text-[11px] font-medium transition-colors">
                  취소
                </button>
              </div>
            </div>
          )}

          {projects.map((p) => (
            <div key={p.id} className="group relative">
              {navItem(
                selection.type === "project" && selection.id === p.id,
                () => onSelect({ type: "project", id: p.id }),
                null, p.name, projectKeyCount(p.id), p.color || "#868e96",
              )}
              <div className="absolute right-1.5 top-1/2 -translate-y-1/2 hidden group-hover:flex gap-0.5">
                <button onClick={() => handleEdit(p)}
                  className="w-5 h-5 flex items-center justify-center rounded hover:bg-zinc-700 text-zinc-600 hover:text-zinc-300 transition-colors" title="수정">
                  <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487z" />
                  </svg>
                </button>
                <button onClick={() => handleDelete(p.id)}
                  className="w-5 h-5 flex items-center justify-center rounded hover:bg-red-900/50 text-zinc-600 hover:text-red-400 transition-colors" title="삭제">
                  <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          ))}

          {projects.length === 0 && !showForm && (
            <p className="px-3 py-2 text-[11px] text-zinc-600 text-center">+로 프로젝트 추가</p>
          )}
        </div>

        {/* Platforms */}
        {platforms.length > 0 && (
          <div className="pt-4">
            <div className="px-3 mb-1.5">
              <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">플랫폼</span>
            </div>
            {platforms.map(([provider, count]) => {
              const pc = getProviderColor(provider);
              return navItem(
                selection.type === "platform" && selection.id === provider,
                () => onSelect({ type: "platform", id: provider }),
                null, provider, count, pc.dot,
              );
            })}
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="p-2 border-t border-zinc-800/60">
        <button onClick={onLock}
          className="w-full py-2 text-[11px] text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60 rounded-lg transition-colors flex items-center justify-center gap-1.5">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
          잠금
        </button>
      </div>
    </aside>
  );
}

export type { SidebarSelection };
