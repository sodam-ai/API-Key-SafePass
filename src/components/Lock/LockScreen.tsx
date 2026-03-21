import { useState } from "react";
import * as api from "../../lib/tauri";

interface LockScreenProps {
  isFirstTime: boolean;
  onUnlocked: () => void;
  onRecoveryKey?: (key: string) => void;
}

export default function LockScreen({ isFirstTime, onUnlocked, onRecoveryKey }: LockScreenProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [failCount, setFailCount] = useState(0);
  const [locked, setLocked] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryInput, setRecoveryInput] = useState("");
  const [recoveryKeyDisplay, setRecoveryKeyDisplay] = useState<string | null>(null);

  const handleSetup = async () => {
    if (password.length < 4) {
      setError("비밀번호는 최소 4자 이상이어야 합니다");
      return;
    }
    if (password !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const recoveryKey = await api.setupMasterPassword(password);
      setRecoveryKeyDisplay(recoveryKey);
      onRecoveryKey?.(recoveryKey);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = async () => {
    if (locked) return;
    setLoading(true);
    setError("");
    try {
      const success = await api.unlock(password);
      if (success) {
        setFailCount(0);
        onUnlocked();
      } else {
        const newCount = failCount + 1;
        setFailCount(newCount);
        if (newCount >= 5) {
          setLocked(true);
          setError("5회 실패! 30초 후 다시 시도해주세요");
          setTimeout(() => { setLocked(false); setFailCount(0); setError(""); }, 30_000);
        } else {
          setError(`비밀번호가 틀렸습니다 (${newCount}/5)`);
        }
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  const handleRecoveryUnlock = async () => {
    setLoading(true);
    setError("");
    try {
      const success = await api.unlockWithRecovery(recoveryInput.trim());
      if (success) {
        onUnlocked();
      } else {
        setError("복구키가 올바르지 않습니다");
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (showRecovery) handleRecoveryUnlock();
      else if (isFirstTime) handleSetup();
      else handleUnlock();
    }
  };

  // Recovery key display after setup
  if (recoveryKeyDisplay) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-950">
        <div className="w-full max-w-md mx-auto p-8">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-green-900/30 border border-green-800/50 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
          </div>
          <h1 className="text-xl font-semibold text-center mb-2">복구키를 안전하게 보관하세요</h1>
          <p className="text-sm text-zinc-400 text-center mb-6">
            비밀번호를 잊었을 때 이 키로 잠금을 해제할 수 있습니다.<br />
            이 키는 다시 표시되지 않습니다!
          </p>

          <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-4 mb-6">
            <code className="text-xs text-green-400 break-all select-text">{recoveryKeyDisplay}</code>
          </div>

          <p className="text-xs text-red-400 text-center mb-4">
            이 복구키를 메모장, 비밀번호 관리자, 또는 종이에 적어서 보관하세요
          </p>

          <button
            onClick={onUnlocked}
            className="w-full py-3 bg-vault-600 hover:bg-vault-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            확인, 보관했습니다
          </button>
        </div>
      </div>
    );
  }

  // Recovery input
  if (showRecovery) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-950">
        <div className="w-full max-w-sm mx-auto p-8">
          <h1 className="text-xl font-semibold text-center mb-2">복구키로 잠금 해제</h1>
          <p className="text-sm text-zinc-400 text-center mb-6">설정 시 받은 복구키를 입력하세요</p>

          <textarea
            placeholder="복구키를 붙여넣기..."
            value={recoveryInput}
            onChange={(e) => setRecoveryInput(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-xs font-mono
                       focus:outline-none focus:border-vault-500 placeholder-zinc-500 mb-4 resize-none"
          />

          {error && <p className="text-red-400 text-sm text-center mb-4">{error}</p>}

          <button
            onClick={handleRecoveryUnlock}
            disabled={loading || !recoveryInput.trim()}
            className="w-full py-3 bg-vault-600 hover:bg-vault-700 text-white rounded-lg text-sm font-medium
                       disabled:opacity-50 transition-colors mb-3"
          >
            {loading ? "확인 중..." : "잠금 해제"}
          </button>
          <button
            onClick={() => { setShowRecovery(false); setError(""); }}
            className="w-full py-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            비밀번호로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-zinc-950">
      <div className="w-full max-w-sm mx-auto p-8">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-vault-600/20 border border-vault-600/30 flex items-center justify-center">
            <svg className="w-8 h-8 text-vault-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
        </div>

        <h1 className="text-xl font-semibold text-center mb-1">API Key Vault</h1>
        <p className="text-sm text-zinc-400 text-center mb-8">
          {isFirstTime ? "마스터 비밀번호를 설정해주세요" : "비밀번호를 입력하여 잠금을 해제하세요"}
        </p>

        <div className="space-y-4">
          <input
            type="password"
            placeholder="마스터 비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading || locked}
            autoFocus
            className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-sm
                       focus:outline-none focus:border-vault-500 focus:ring-1 focus:ring-vault-500
                       disabled:opacity-50 placeholder-zinc-500"
          />

          {isFirstTime && (
            <input
              type="password"
              placeholder="비밀번호 확인"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-sm
                         focus:outline-none focus:border-vault-500 focus:ring-1 focus:ring-vault-500
                         disabled:opacity-50 placeholder-zinc-500"
            />
          )}

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          <button
            onClick={isFirstTime ? handleSetup : handleUnlock}
            disabled={loading || locked || !password}
            className="w-full py-3 bg-vault-600 hover:bg-vault-700 text-white rounded-lg text-sm font-medium
                       disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "처리 중..." : isFirstTime ? "설정 완료" : "잠금 해제"}
          </button>
        </div>

        {!isFirstTime && (
          <button
            onClick={() => setShowRecovery(true)}
            className="w-full mt-4 py-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            비밀번호를 잊으셨나요? (복구키 사용)
          </button>
        )}

        {isFirstTime && (
          <p className="text-xs text-zinc-500 text-center mt-4">
            설정 후 복구키가 생성됩니다. 안전하게 보관하세요.
          </p>
        )}
      </div>
    </div>
  );
}
