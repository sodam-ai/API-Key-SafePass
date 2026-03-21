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
import { useAutoLock } from "./hooks/useAutoLock";

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
    try {
      const p = await api.listProjects();
      setProjects(p);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const loadAllKeys = useCallback(async () => {
    try {
      const k = await api.listAllApiKeys();
      setAllKeys(k);
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Load visible keys based on selection
  const loadKeys = useCallback(async () => {
    if (selection.type === "dashboard") {
      setKeys([]);
      return;
    }
    if (selection.type === "all") {
      setKeys(allKeys);
      return;
    }
    if (selection.type === "project" && selection.id) {
      try {
        const k = await api.listApiKeys(selection.id);
        setKeys(k);
      } catch (e) {
        console.error(e);
      }
    }
    if (selection.type === "platform" && selection.id) {
      setKeys(allKeys.filter((k) => (k.provider || "기타") === selection.id));
    }
  }, [selection, allKeys]);

  useEffect(() => {
    if (screen === "main") {
      loadProjects();
      loadAllKeys();
    }
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
      setKeys([]);
      setAllKeys([]);
      setProjects([]);
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Auto-lock after 5 minutes of inactivity
  useAutoLock(handleLock, screen === "main");

  // Ensure default project exists, return its ID
  const ensureDefaultProject = useCallback(async (): Promise<string> => {
    if (projects.length > 0) return projects[0].id;
    const p = await api.createProject({ name: "기본", color: "#4c6ef5" });
    await loadProjects();
    return p.id;
  }, [projects, loadProjects]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        if (screen === "main") setShowSearch(true);
      }
      if (e.key === "Escape") {
        setShowSearch(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [screen]);

  const handleUnlocked = () => {
    setScreen("main");
  };

  // Handle global add — ensure project exists first
  const handleGlobalAdd = async () => {
    await ensureDefaultProject();
    setShowGlobalAdd(true);
  };

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

  // Determine which project to use for the add form
  const activeProjectId =
    selection.type === "project" && selection.id
      ? selection.id
      : projects.length > 0
      ? projects[0].id
      : null;

  return (
    <div className="flex h-screen">
      <ProjectSidebar
        projects={projects}
        allKeys={allKeys}
        selection={selection}
        onSelect={setSelection}
        onProjectsChanged={() => { loadProjects(); loadAllKeys(); }}
        onLock={handleLock}
      />

      {selection.type === "dashboard" ? (
        <Dashboard
          projects={projects}
          onSelectProject={(id) => setSelection({ type: "project", id })}
        />
      ) : (
        <KeyList
          projectId={selection.type === "project" ? selection.id : null}
          platformName={selection.type === "platform" ? selection.id : null}
          isAllView={selection.type === "all"}
          projects={projects}
          keys={keys}
          onKeysChanged={handleRefresh}
          onAddKey={handleGlobalAdd}
        />
      )}

      {/* Global floating add button */}
      {selection.type !== "dashboard" && !showGlobalAdd && !showSearch && (
        <button
          onClick={handleGlobalAdd}
          className="fixed bottom-6 right-6 w-14 h-14 bg-vault-600 hover:bg-vault-700 rounded-full shadow-lg shadow-vault-600/30
                     flex items-center justify-center transition-all hover:scale-105 active:scale-95 z-40"
          title="키 추가 (어디서든)"
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

      {showSearch && (
        <SearchModal
          projects={projects}
          onClose={() => setShowSearch(false)}
        />
      )}

      {!showSearch && !showGlobalAdd && (
        <div className="fixed bottom-4 right-24">
          <kbd className="px-2 py-1 bg-zinc-800/80 border border-zinc-700 rounded text-xs text-zinc-500">
            Ctrl+K 검색
          </kbd>
        </div>
      )}
    </div>
  );
}
