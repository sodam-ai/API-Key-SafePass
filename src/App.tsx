import { useState, useEffect, useCallback } from "react";
import type { Project, ApiKeyWithTags } from "./types";
import * as api from "./lib/tauri";
import LockScreen from "./components/Lock/LockScreen";
import ProjectSidebar from "./components/ProjectSidebar/ProjectSidebar";
import type { SidebarSelection } from "./components/ProjectSidebar/ProjectSidebar";
import KeyList from "./components/KeyList/KeyList";
import Dashboard from "./components/Dashboard/Dashboard";
import SearchModal from "./components/Search/SearchModal";
import KeyFormModal from "./components/KeyForm/KeyFormModal";
import ChangePasswordModal from "./components/Settings/ChangePasswordModal";
import { useAutoLock } from "./hooks/useAutoLock";
import { useWindowBlur } from "./hooks/useWindowBlur";

type AppScreen = "loading" | "lock" | "main";

export default function App() {
  const [screen, setScreen] = useState<AppScreen>("loading");
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [allKeys, setAllKeys] = useState<ApiKeyWithTags[]>([]);
  const [selection, setSelection] = useState<SidebarSelection>({ type: "all", id: null });
  const [keys, setKeys] = useState<ApiKeyWithTags[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [showGlobalAdd, setShowGlobalAdd] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [inlineSearch, setInlineSearch] = useState("");
  const isBlurred = useWindowBlur();

  useEffect(() => {
    (async () => {
      try {
        const hasPw = await api.checkHasMasterPassword();
        setIsFirstTime(!hasPw);
        setScreen("lock");
      } catch {
        setScreen("lock");
      }
    })();
  }, []);

  const loadProjects = useCallback(async () => {
    try { setProjects(await api.listProjects()); } catch (e) { console.error(e); }
  }, []);

  const loadAllKeys = useCallback(async () => {
    try { setAllKeys(await api.listAllApiKeys()); } catch (e) { console.error(e); }
  }, []);

  const loadKeys = useCallback(async () => {
    if (selection.type === "dashboard") { setKeys([]); return; }
    if (selection.type === "all") { setKeys(allKeys); return; }
    if (selection.type === "project" && selection.id) {
      try { setKeys(await api.listApiKeys(selection.id)); } catch (e) { console.error(e); }
    }
    if (selection.type === "platform" && selection.id) {
      setKeys(allKeys.filter((k) => (k.provider || "기타") === selection.id));
    }
  }, [selection, allKeys]);

  useEffect(() => {
    if (screen === "main") { loadProjects(); loadAllKeys(); }
  }, [screen, loadProjects, loadAllKeys]);

  useEffect(() => {
    if (screen === "main") loadKeys();
  }, [screen, selection, loadKeys]);

  const handleRefresh = useCallback(async () => {
    await loadAllKeys();
    await loadProjects();
    await loadKeys();
  }, [loadAllKeys, loadProjects, loadKeys]);

  const handleLock = useCallback(async () => {
    try {
      await api.lock();
      setScreen("lock");
      setIsFirstTime(false);
      setSelection({ type: "all", id: null });
      setKeys([]); setAllKeys([]); setProjects([]);
      setInlineSearch("");
    } catch (e) { console.error(e); }
  }, []);

  useAutoLock(handleLock, screen === "main");

  const ensureDefaultProject = useCallback(async (): Promise<string> => {
    if (projects.length > 0) return projects[0].id;
    const p = await api.createProject({ name: "기본", color: "#4c6ef5" });
    await loadProjects();
    return p.id;
  }, [projects, loadProjects]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        if (screen === "main") setShowSearch(true);
      }
      if (e.key === "Escape") setShowSearch(false);
      // Ctrl+L to lock
      if ((e.ctrlKey || e.metaKey) && e.key === "l") {
        e.preventDefault();
        if (screen === "main") handleLock();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [screen, handleLock]);

  const handleUnlocked = () => setScreen("main");

  const handleGlobalAdd = async () => {
    await ensureDefaultProject();
    setShowGlobalAdd(true);
  };

  // Filter keys by inline search
  const filteredKeys = inlineSearch.trim()
    ? keys.filter((k) => {
        const q = inlineSearch.toLowerCase();
        return (
          k.name.toLowerCase().includes(q) ||
          (k.provider || "").toLowerCase().includes(q) ||
          (k.env_var_name || "").toLowerCase().includes(q) ||
          (k.memo || "").toLowerCase().includes(q)
        );
      })
    : keys;

  const activeProjectId =
    selection.type === "project" && selection.id
      ? selection.id
      : projects.length > 0 ? projects[0].id : null;

  if (screen === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-6 h-6 border-2 border-vault-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (screen === "lock") {
    return <LockScreen isFirstTime={isFirstTime} onUnlocked={handleUnlocked} />;
  }

  return (
    <div className={`flex h-screen transition-all duration-200 ${isBlurred ? "blur-lg pointer-events-none" : ""}`}>
      <ProjectSidebar
        projects={projects}
        allKeys={allKeys}
        selection={selection}
        onSelect={(s) => { setSelection(s); setInlineSearch(""); }}
        onProjectsChanged={() => { loadProjects(); loadAllKeys(); }}
        onLock={handleLock}
        onChangePassword={() => setShowChangePassword(true)}
      />

      <div className="flex-1 flex flex-col h-full">
        {selection.type === "dashboard" ? (
          <Dashboard
            projects={projects}
            onSelectProject={(id) => setSelection({ type: "project", id })}
          />
        ) : (
          <>
            {/* Inline search bar */}
            <div className="px-6 pt-4 pb-2">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
                <input
                  type="text"
                  placeholder="키 검색... (이름, 제공자, 변수명, 메모)"
                  value={inlineSearch}
                  onChange={(e) => setInlineSearch(e.target.value)}
                  className="w-full pl-10 pr-20 py-2.5 bg-zinc-900/60 border border-zinc-800/60 rounded-xl text-sm
                             focus:outline-none focus:border-vault-500/50 focus:bg-zinc-900 placeholder-zinc-600 transition-colors"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  {inlineSearch && (
                    <span className="text-[11px] text-zinc-500 tabular-nums">
                      {filteredKeys.length}/{keys.length}
                    </span>
                  )}
                  <kbd className="px-1.5 py-0.5 bg-zinc-800/60 rounded text-[10px] text-zinc-600 border border-zinc-700/50">
                    Ctrl+K
                  </kbd>
                </div>
              </div>
            </div>

            <KeyList
              projectId={selection.type === "project" ? selection.id : null}
              platformName={selection.type === "platform" ? selection.id : null}
              isAllView={selection.type === "all"}
              projects={projects}
              keys={filteredKeys}
              onKeysChanged={handleRefresh}
              onAddKey={handleGlobalAdd}
            />
          </>
        )}
      </div>

      {/* Floating add button */}
      {selection.type !== "dashboard" && !showGlobalAdd && !showSearch && !showChangePassword && (
        <button
          onClick={handleGlobalAdd}
          className="fixed bottom-6 right-6 w-14 h-14 bg-vault-600 hover:bg-vault-500 rounded-full shadow-lg shadow-vault-600/30
                     flex items-center justify-center transition-all hover:scale-105 active:scale-95 z-40"
          title="키 추가"
        >
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </button>
      )}

      {/* Global Add Modal */}
      {showGlobalAdd && activeProjectId && (
        <KeyFormModal
          projectId={activeProjectId}
          onClose={() => setShowGlobalAdd(false)}
          onSaved={() => { setShowGlobalAdd(false); handleRefresh(); }}
        />
      )}

      {/* Change Password Modal */}
      {showChangePassword && (
        <ChangePasswordModal
          onClose={() => setShowChangePassword(false)}
          onChanged={() => setShowChangePassword(false)}
        />
      )}

      {/* Ctrl+K Search Modal */}
      {showSearch && (
        <SearchModal
          projects={projects}
          onClose={() => setShowSearch(false)}
        />
      )}
    </div>
  );
}
