import { useState } from "react";
import type { AccountEntry } from "../../types";
import { useClipboard } from "../../hooks/useClipboard";

interface AccountEntryListProps {
  accounts: AccountEntry[];
  onChange: (accounts: AccountEntry[]) => void;
  defaultExpanded?: boolean;
}

const emptyEntry = (index: number): AccountEntry => ({
  label: `계정 ${index}`,
  username: "",
  password: "",
  site_url: "",
  key_value: "",
  expires_at: "",
});

export default function AccountEntryList({ accounts, onChange, defaultExpanded = false }: AccountEntryListProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [visiblePasswords, setVisiblePasswords] = useState<Set<number>>(new Set());
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const { copyWithAutoClear } = useClipboard(15_000);

  const handleCopy = async (i: number, field: "username" | "password", value: string) => {
    if (!value) return;
    await copyWithAutoClear(value);
    const key = `${i}-${field}`;
    setCopiedField(key);
    setTimeout(() => setCopiedField((cur) => (cur === key ? null : cur)), 1500);
  };

  const update = (i: number, patch: Partial<AccountEntry>) => {
    onChange(accounts.map((a, idx) => (idx === i ? { ...a, ...patch } : a)));
  };

  const addEntry = () => {
    onChange([...accounts, emptyEntry(accounts.length + 1)]);
    setExpanded(true);
  };

  const removeEntry = (i: number) => {
    onChange(accounts.filter((_, idx) => idx !== i));
    // Indices shift after removal — clear visibility state rather than risk it
    // pointing at the wrong (now-shifted) entry.
    setVisiblePasswords(new Set());
  };

  const togglePasswordVisible = (i: number) => {
    setVisiblePasswords((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  return (
    <div className="border-t border-zinc-800/50 pt-3">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
      >
        <span className="flex items-center gap-1.5">
          추가 계정 정보 (아이디·비밀번호·사이트)
          {accounts.length > 0 && (
            <span className="px-1.5 py-0.5 bg-zinc-800 rounded text-[10px] text-zinc-500">{accounts.length}</span>
          )}
        </span>
        <svg
          className={`w-3.5 h-3.5 transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {expanded && (
        <div className="mt-3 space-y-3 animate-slide-down">
          {accounts.map((acc, i) => (
            <div key={i} className="p-3 bg-zinc-800/40 border border-zinc-700/50 rounded-lg space-y-2">
              <div className="flex items-center justify-between gap-2">
                <input
                  type="text"
                  value={acc.label}
                  onChange={(e) => update(i, { label: e.target.value })}
                  placeholder="라벨 (예: 메인 계정)"
                  className="flex-1 px-2 py-1 bg-zinc-900 border border-zinc-700 rounded text-xs font-medium
                             focus:outline-none focus:border-vault-500 placeholder-zinc-600"
                />
                <button
                  type="button"
                  onClick={() => removeEntry(i)}
                  className="p-1 rounded hover:bg-red-900/40 text-zinc-600 hover:text-red-400 flex-shrink-0 transition-colors"
                  title="이 계정 삭제"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <input
                    type="text"
                    value={acc.username || ""}
                    onChange={(e) => update(i, { username: e.target.value })}
                    placeholder="아이디"
                    className="w-full px-2 py-1.5 pr-7 bg-zinc-900 border border-zinc-700 rounded text-xs
                               focus:outline-none focus:border-vault-500 placeholder-zinc-600"
                  />
                  {acc.username && (
                    <button
                      type="button"
                      onClick={() => handleCopy(i, "username", acc.username || "")}
                      className={`absolute right-1.5 top-1/2 -translate-y-1/2 transition-colors ${
                        copiedField === `${i}-username` ? "text-green-400" : "text-zinc-600 hover:text-zinc-300"
                      }`}
                      title="아이디 복사"
                    >
                      {copiedField === `${i}-username` ? (
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      ) : (
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                        </svg>
                      )}
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={visiblePasswords.has(i) ? "text" : "password"}
                    value={acc.password || ""}
                    onChange={(e) => update(i, { password: e.target.value })}
                    placeholder="비밀번호"
                    className="w-full px-2 py-1.5 pr-12 bg-zinc-900 border border-zinc-700 rounded text-xs
                               focus:outline-none focus:border-vault-500 placeholder-zinc-600"
                  />
                  {acc.password && (
                    <button
                      type="button"
                      onClick={() => handleCopy(i, "password", acc.password || "")}
                      className={`absolute right-7 top-1/2 -translate-y-1/2 transition-colors ${
                        copiedField === `${i}-password` ? "text-green-400" : "text-zinc-600 hover:text-zinc-300"
                      }`}
                      title="비밀번호 복사"
                    >
                      {copiedField === `${i}-password` ? (
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      ) : (
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                        </svg>
                      )}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => togglePasswordVisible(i)}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-300"
                    title={visiblePasswords.has(i) ? "비밀번호 숨기기" : "비밀번호 보기"}
                  >
                    {visiblePasswords.has(i) ? (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                <input
                  type="url"
                  value={acc.site_url || ""}
                  onChange={(e) => update(i, { site_url: e.target.value })}
                  placeholder="https://example.com/login"
                  className="flex-1 px-2 py-1.5 bg-zinc-900 border border-zinc-700 rounded text-xs text-vault-400
                             focus:outline-none focus:border-vault-500 focus:text-zinc-200 placeholder-zinc-600"
                />
                {acc.site_url && (
                  <button
                    type="button"
                    onClick={() => window.open(acc.site_url!, "_blank")}
                    className="p-1.5 rounded hover:bg-white/5 text-zinc-500 hover:text-vault-400 flex-shrink-0 transition-colors"
                    title="사이트 열기"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                    </svg>
                  </button>
                )}
              </div>

              <textarea
                value={acc.key_value || ""}
                onChange={(e) => update(i, { key_value: e.target.value })}
                placeholder="추가 API 키/토큰 (선택)"
                rows={1}
                className="w-full px-2 py-1.5 bg-zinc-900 border border-zinc-700 rounded text-xs font-mono resize-none
                           focus:outline-none focus:border-vault-500 placeholder-zinc-600"
              />

              <input
                type="date"
                value={acc.expires_at?.split("T")[0] || ""}
                onChange={(e) => update(i, { expires_at: e.target.value })}
                className="px-2 py-1.5 bg-zinc-900 border border-zinc-700 rounded text-xs [color-scheme:dark]
                           focus:outline-none focus:border-vault-500"
              />
            </div>
          ))}

          <button
            type="button"
            onClick={addEntry}
            className="w-full py-2 border border-dashed border-zinc-700 hover:border-vault-600/50 rounded-lg text-xs
                       text-zinc-500 hover:text-vault-400 transition-colors"
          >
            + 계정 추가
          </button>
        </div>
      )}
    </div>
  );
}
