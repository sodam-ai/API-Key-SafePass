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
    if (password.length < 4) { setError("비밀번호는 최소 4자 이상이어야 합니다"); return; }
    if (password !== confirmPassword) { setError("비밀번호가 일치하지 않습니다"); return; }
    setLoading(true); setError("");
    try {
      const recoveryKey = await api.setupMasterPassword(password);
      setRecoveryKeyDisplay(recoveryKey);
      onRecoveryKey?.(recoveryKey);
    } catch (e) { setError(String(e)); }
    finally { setLoading(false); }
  };

  const handleUnlock = async () => {
    if (locked) return;
    setLoading(true); setError("");
    try {
      const success = await api.unlock(password);
      if (success) { setFailCount(0); onUnlocked(); }
      else {
        const c = failCount + 1;
        setFailCount(c);
        if (c >= 5) {
          setLocked(true);
          setError("5회 실패! 30초 후 다시 시도해주세요");
          setTimeout(() => { setLocked(false); setFailCount(0); setError(""); }, 30_000);
        } else { setError(`비밀번호가 틀렸습니다 (${c}/5)`); }
      }
    } catch (e) { setError(String(e)); }
    finally { setLoading(false); }
  };

  const handleRecoveryUnlock = async () => {
    setLoading(true); setError("");
    try {
      const success = await api.unlockWithRecovery(recoveryInput.trim());
      if (success) onUnlocked();
      else setError("복구키가 올바르지 않습니다");
    } catch (e) { setError(String(e)); }
    finally { setLoading(false); }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (showRecovery) handleRecoveryUnlock();
      else if (isFirstTime) handleSetup();
      else handleUnlock();
    }
  };

  // Recovery key display
  if (recoveryKeyDisplay) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-950">
        <div className="w-full max-w-md mx-auto p-8 animate-scale-in">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-green-950/50 border border-green-800/40 flex items-center justify-center shadow-lg shadow-green-900/20">
              <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
          </div>
          <h1 className="text-xl font-semibold text-center mb-2 tracking-tight">복구키를 안전하게 보관하세요</h1>
          <p className="text-sm text-zinc-400 text-center mb-6 leading-relaxed">
            비밀번호를 잊었을 때 이 키로 잠금을 해제할 수 있습니다.<br />
            <span className="text-red-400 font-medium">이 키는 다시 표시되지 않습니다!</span>
          </p>
          <div className="bg-zinc-900/80 border border-zinc-700/50 rounded-xl p-4 mb-6 shadow-inner">
            <code className="text-xs text-green-400 break-all select-text leading-relaxed">{recoveryKeyDisplay}</code>
          </div>
          <p className="text-xs text-zinc-500 text-center mb-5">
            메모장, 비밀번호 관리자, 또는 종이에 적어서 보관하세요
          </p>
          <button onClick={onUnlocked}
            className="w-full py-3 bg-vault-600 hover:bg-vault-500 text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-vault-600/20">
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
        <div className="w-full max-w-sm mx-auto p-8 animate-scale-in">
          <h1 className="text-xl font-semibold text-center mb-2 tracking-tight">복구키로 잠금 해제</h1>
          <p className="text-sm text-zinc-400 text-center mb-6">설정 시 받은 복구키를 입력하세요</p>
          <textarea placeholder="복구키를 붙여넣기..." value={recoveryInput}
            onChange={(e) => setRecoveryInput(e.target.value)} rows={3}
            className="w-full px-4 py-3 bg-zinc-900/80 border border-zinc-700/50 rounded-xl text-xs font-mono focus:outline-none focus:border-vault-500 focus:ring-1 focus:ring-vault-500/30 placeholder-zinc-600 mb-4 resize-none" />
          {error && <p className="text-red-400 text-sm text-center mb-4 animate-slide-down">{error}</p>}
          <button onClick={handleRecoveryUnlock} disabled={loading || !recoveryInput.trim()}
            className="w-full py-3 bg-vault-600 hover:bg-vault-500 text-white rounded-xl text-sm font-medium disabled:opacity-40 transition-colors mb-3">
            {loading ? "확인 중..." : "잠금 해제"}
          </button>
          <button onClick={() => { setShowRecovery(false); setError(""); }}
            className="w-full py-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
            비밀번호로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-zinc-950">
      <div className="w-full max-w-sm mx-auto p-8 animate-scale-in">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="w-[72px] h-[72px] rounded-2xl bg-gradient-to-br from-vault-600/30 to-vault-800/20 border border-vault-500/20 flex items-center justify-center shadow-xl shadow-vault-600/10">
              <svg className="w-9 h-9 text-vault-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-vault-600 flex items-center justify-center shadow-lg">
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
              </svg>
            </div>
          </div>
        </div>

        <h1 className="text-[22px] font-semibold text-center mb-1 tracking-tight">API Key Vault</h1>
        <p className="text-sm text-zinc-500 text-center mb-8">
          {isFirstTime ? "마스터 비밀번호를 설정해주세요" : "비밀번호를 입력하여 잠금을 해제하세요"}
        </p>

        <div className="space-y-3">
          <input type="password" placeholder="마스터 비밀번호" value={password}
            onChange={(e) => setPassword(e.target.value)} onKeyDown={handleKeyDown}
            disabled={loading || locked} autoFocus
            className="w-full px-4 py-3 bg-zinc-900/80 border border-zinc-700/50 rounded-xl text-sm
                       focus:outline-none focus:border-vault-500 focus:ring-1 focus:ring-vault-500/30
                       disabled:opacity-40 placeholder-zinc-600 transition-colors" />

          {isFirstTime && (
            <input type="password" placeholder="비밀번호 확인" value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)} onKeyDown={handleKeyDown} disabled={loading}
              className="w-full px-4 py-3 bg-zinc-900/80 border border-zinc-700/50 rounded-xl text-sm
                         focus:outline-none focus:border-vault-500 focus:ring-1 focus:ring-vault-500/30
                         disabled:opacity-40 placeholder-zinc-600 transition-colors animate-slide-down" />
          )}

          {error && <p className="text-red-400 text-sm text-center animate-slide-down">{error}</p>}

          <button onClick={isFirstTime ? handleSetup : handleUnlock}
            disabled={loading || locked || !password}
            className="w-full py-3 bg-vault-600 hover:bg-vault-500 text-white rounded-xl text-sm font-medium
                       disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-vault-600/20 hover:shadow-vault-500/30">
            {loading ? "처리 중..." : isFirstTime ? "설정 완료" : "잠금 해제"}
          </button>
        </div>

        {!isFirstTime && (
          <button onClick={() => setShowRecovery(true)}
            className="w-full mt-5 py-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
            비밀번호를 잊으셨나요?
          </button>
        )}

        {isFirstTime && (
          <p className="text-[11px] text-zinc-600 text-center mt-5 leading-relaxed">
            설정 후 복구키가 생성됩니다<br />안전하게 보관하세요
          </p>
        )}
      </div>
    </div>
  );
}
