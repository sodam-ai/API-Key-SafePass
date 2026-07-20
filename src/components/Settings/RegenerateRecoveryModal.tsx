import { useState } from "react";
import * as api from "../../lib/tauri";

interface RegenerateRecoveryModalProps {
  onClose: () => void;
  onDone: () => void;
}

export default function RegenerateRecoveryModal({ onClose, onDone }: RegenerateRecoveryModalProps) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [newRecoveryKey, setNewRecoveryKey] = useState<string | null>(null);

  const handleRegenerate = async () => {
    if (!password) { setError("현재 비밀번호를 입력해주세요"); return; }
    setLoading(true); setError("");
    try {
      const recoveryKey = await api.regenerateRecoveryKey(password);
      setNewRecoveryKey(recoveryKey);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleRegenerate();
  };

  if (newRecoveryKey) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
        <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-sm mx-4 p-6 shadow-2xl animate-scale-in text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-green-950/50 border border-green-800/40 flex items-center justify-center">
            <svg className="w-7 h-7 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold mb-1">새 복구키 발급 완료</h2>
          <p className="text-sm text-zinc-400 mb-4 text-left">기존 복구키는 더 이상 사용할 수 없습니다.</p>
          <div className="text-left">
            <div className="bg-zinc-800/80 border border-zinc-700/50 rounded-xl p-4 mb-4 shadow-inner">
              <code className="text-xs text-green-400 break-all select-text leading-relaxed">{newRecoveryKey}</code>
            </div>
            <p className="text-[11px] text-zinc-500 mb-4">
              메모장, 비밀번호 관리자, 또는 종이에 적어서 보관하세요. 이 화면을 닫으면 다시 볼 수 없습니다.
            </p>
          </div>
          <button
            onClick={onDone}
            className="w-full py-2.5 bg-vault-600 hover:bg-vault-500 rounded-lg text-sm font-medium transition-colors"
          >
            확인, 보관했습니다
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-sm mx-4 p-6 shadow-2xl animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-vault-600/20 border border-vault-600/30 flex items-center justify-center">
            <svg className="w-5 h-5 text-vault-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM3.75 12h2.25m13.5 0h2.25M12 3.75v2.25m0 13.5v2.25M5.636 5.636l1.591 1.591m9.546 9.546l1.591 1.591M5.636 18.364l1.591-1.591m9.546-9.546l1.591-1.591" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-semibold">복구키 재발급</h2>
            <p className="text-[11px] text-zinc-500">기존 복구키를 폐기하고 새로 발급합니다</p>
          </div>
        </div>

        <p className="text-xs text-amber-400/90 bg-amber-950/30 border border-amber-900/40 rounded-lg px-3 py-2 mb-4">
          기존 복구키를 분실했거나 유출이 의심될 때 사용하세요. 재발급 즉시 기존 복구키는 무효화됩니다.
        </p>

        <div>
          <label className="block text-xs text-zinc-400 mb-1">현재 비밀번호</label>
          <input
            type="password"
            placeholder="현재 비밀번호 입력"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm
                       focus:outline-none focus:border-vault-500 focus:ring-1 focus:ring-vault-500/30 placeholder-zinc-600"
          />
        </div>

        {error && <p className="text-red-400 text-sm mt-3 animate-slide-down">{error}</p>}

        <div className="flex gap-3 mt-5">
          <button
            onClick={handleRegenerate}
            disabled={loading || !password}
            className="flex-1 py-2.5 bg-vault-600 hover:bg-vault-500 rounded-lg text-sm font-medium
                       disabled:opacity-40 transition-colors"
          >
            {loading ? "발급 중..." : "재발급"}
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
