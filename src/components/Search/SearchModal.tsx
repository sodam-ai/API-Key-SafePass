import { useState, useEffect, useRef, useCallback } from "react";
import type { ApiKeyWithTags, Project } from "../../types";
import * as api from "../../lib/tauri";
import { useClipboard } from "../../hooks/useClipboard";
import { smartMatchAny } from "../../lib/search";

interface SearchModalProps {
  projects: Project[];
  onClose: () => void;
}

export default function SearchModal({ projects, onClose }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ApiKeyWithTags[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { copyWithAutoClear } = useClipboard();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        // 서버 검색 (SQL LIKE) + 전체 목록에서 초성/한글 매치
        const [serverResults, allKeys] = await Promise.all([
          api.searchApiKeys(query.trim()),
          api.listAllApiKeys(),
        ]);
        // 초성/한글 클라이언트 필터링
        const clientResults = allKeys.filter((k) =>
          smartMatchAny(query, k.name, k.provider, k.env_var_name, k.memo)
        );
        // 합치기 (중복 제거)
        const seen = new Set<string>();
        const merged: ApiKeyWithTags[] = [];
        for (const k of [...serverResults, ...clientResults]) {
          if (!seen.has(k.id)) { seen.add(k.id); merged.push(k); }
        }
        setResults(merged);
        setSelectedIndex(0);
      } catch {
        setResults([]);
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [query]);

  const handleCopy = useCallback(async (keyId: string) => {
    try {
      const value = await api.getApiKeyValue(keyId);
      await copyWithAutoClear(value);
      setCopiedId(keyId);
      setTimeout(() => {
        setCopiedId(null);
        onClose();
      }, 800);
    } catch (e) {
      alert(String(e));
    }
  }, [copyWithAutoClear, onClose]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[selectedIndex]) {
      handleCopy(results[selectedIndex].id);
    }
  };

  const getProjectName = (projectId: string) =>
    projects.find((p) => p.id === projectId)?.name || "";

  return (
    <div className="fixed inset-0 bg-black/60 flex items-start justify-center z-50 pt-[15vh]" onClick={onClose}>
      <div
        className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-xl mx-4 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800">
          <svg className="w-5 h-5 text-zinc-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            placeholder="검색... (한글, 영문, 초성 ㅇㅍ, 변수명)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-sm focus:outline-none placeholder-zinc-500"
          />
          <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-xs text-zinc-500 border border-zinc-700">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto">
          {query.trim() && results.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-zinc-500">
              검색 결과가 없습니다
            </div>
          )}
          {results.map((k, i) => (
            <button
              key={k.id}
              onClick={() => handleCopy(k.id)}
              className={`w-full text-left px-4 py-3 flex items-center justify-between transition-colors ${
                i === selectedIndex ? "bg-zinc-800" : "hover:bg-zinc-800/50"
              } ${copiedId === k.id ? "bg-green-900/30" : ""}`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">{k.name}</span>
                  {k.provider && (
                    <span className="px-1.5 py-0.5 bg-zinc-800 rounded text-xs text-zinc-400">
                      {k.provider}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-zinc-600">{getProjectName(k.project_id)}</span>
                  {k.tags.map((tag) => (
                    <span key={tag.id} className="text-xs text-zinc-500">#{tag.name}</span>
                  ))}
                </div>
              </div>
              <span className="text-xs text-zinc-600 flex-shrink-0 ml-2">
                {copiedId === k.id ? "복사됨!" : "Enter로 복사"}
              </span>
            </button>
          ))}
        </div>

        {/* Footer */}
        {!query.trim() && (
          <div className="px-4 py-3 border-t border-zinc-800 text-xs text-zinc-600 text-center">
            한글, 영문, 초성(ㅇㅍ), 변수명으로 검색하세요
          </div>
        )}
      </div>
    </div>
  );
}
