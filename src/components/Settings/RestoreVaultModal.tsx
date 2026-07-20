import { useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import * as api from "../../lib/tauri";

interface RestoreVaultModalProps {
  onClose: () => void;
  onStaged: () => void;
}

export default function RestoreVaultModal({ onClose, onStaged }: RestoreVaultModalProps) {
  const [filePath, setFilePath] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [staged, setStaged] = useState(false);

  const handlePickFile = async () => {
    const picked = await open({
      filters: [{ name: "Vault Backup", extensions: ["db"] }],
      multiple: false,
    });
    if (picked && !Array.isArray(picked)) setFilePath(picked);
  };

  const handleRestore = async () => {
    if (!filePath) { setError("복원할 백업 파일을 먼저 선택해주세요"); return; }
    if (!password) { setError("현재 마스터 비밀번호를 입력해주세요"); return; }
    setError("");
    setLoading(true);
    try {
      await api.stageRestore(password, filePath);
      setStaged(true);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60]" onClick={staged ? undefined : onClose}>
      <div
        className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-md mx-4 p-6 shadow-2xl animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {staged ? (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-green-600/10 border border-green-600/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <h2 className="text-base font-semibold">복원 준비 완료</h2>
            </div>
            <p className="text-sm text-zinc-400 leading-relaxed mb-2">
              백업 파일이 확인되었습니다. <strong className="text-zinc-200">앱을 완전히 종료했다가 다시 실행하면</strong> 이 백업으로 교체됩니다.
              현재 데이터는 삭제되지 않고 자동으로 보존됩니다.
            </p>
            <p className="text-xs text-amber-400/90 leading-relaxed mb-6">
              복원된 볼트는 그 백업을 만들 당시의 마스터 비밀번호로 잠금 해제해야 합니다. 지금 이 비밀번호와 다를 수 있습니다.
            </p>
            <button
              onClick={onStaged}
              className="w-full py-2.5 bg-vault-600 hover:bg-vault-500 rounded-lg text-sm font-medium transition-colors"
            >
              확인했습니다
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-8.99 3.75h.008v.008h-.008v-.008z" />
                </svg>
              </div>
              <h2 className="text-base font-semibold">백업에서 복원</h2>
            </div>
            <p className="text-xs text-zinc-500 mb-4 leading-relaxed">
              선택한 백업 파일로 현재 볼트 전체를 교체합니다. 지금 저장된 데이터는 자동으로 보존되지만,
              신중하게 진행해주세요.
            </p>

            <div className="space-y-3">
              <button
                type="button"
                onClick={handlePickFile}
                className="w-full text-left px-3 py-2.5 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 transition-colors text-xs"
              >
                {filePath ? (
                  <span className="text-zinc-300 font-mono truncate block">{filePath}</span>
                ) : (
                  <span className="text-zinc-500">백업 파일(.db) 선택...</span>
                )}
              </button>

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="현재 마스터 비밀번호"
                className="w-full px-3 py-2.5 bg-zinc-800/60 border border-zinc-700 rounded-lg text-sm
                           focus:outline-none focus:border-vault-500 placeholder-zinc-600"
              />

              {error && <p className="text-xs text-red-400">{error}</p>}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleRestore}
                disabled={loading}
                className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-500 rounded-lg text-sm font-medium disabled:opacity-40 transition-colors"
              >
                {loading ? "확인 중..." : "복원 준비"}
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-2.5 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-sm font-medium transition-colors"
              >
                취소
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
