import { useState } from "react";
import * as api from "../../lib/tauri";

interface ChangePasswordModalProps {
  onClose: () => void;
  onChanged: () => void;
}

export default function ChangePasswordModal({ onClose, onChanged }: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Password strength check
  const getStrength = (pw: string): { level: number; label: string; color: string } => {
    if (pw.length === 0) return { level: 0, label: "", color: "" };
    let score = 0;
    if (pw.length >= 6) score++;
    if (pw.length >= 10) score++;
    if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;

    if (score <= 1) return { level: 1, label: "약함", color: "bg-red-500" };
    if (score <= 2) return { level: 2, label: "보통", color: "bg-yellow-500" };
    if (score <= 3) return { level: 3, label: "강함", color: "bg-blue-500" };
    return { level: 4, label: "매우 강함", color: "bg-green-500" };
  };

  const strength = getStrength(newPassword);

  const handleChange = async () => {
    // Validation
    if (!currentPassword) {
      setError("현재 비밀번호를 입력해주세요");
      return;
    }
    if (newPassword.length < 6) {
      setError("새 비밀번호는 최소 6자 이상이어야 합니다");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("새 비밀번호가 일치하지 않습니다");
      return;
    }
    if (currentPassword === newPassword) {
      setError("현재 비밀번호와 다른 비밀번호를 사용해주세요");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await api.changeMasterPassword(currentPassword, newPassword);
      setSuccess(true);
      setTimeout(() => {
        onChanged();
      }, 1500);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleChange();
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
        <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-sm mx-4 p-6 shadow-2xl animate-scale-in text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-green-950/50 border border-green-800/40 flex items-center justify-center">
            <svg className="w-7 h-7 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold mb-1">비밀번호 변경 완료</h2>
          <p className="text-sm text-zinc-400">모든 키가 새 비밀번호로 재암호화되었습니다</p>
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
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-semibold">마스터 비밀번호 변경</h2>
            <p className="text-[11px] text-zinc-500">모든 키가 새 비밀번호로 재암호화됩니다</p>
          </div>
        </div>

        <div className="space-y-3">
          {/* Current password */}
          <div>
            <label className="block text-xs text-zinc-400 mb-1">현재 비밀번호</label>
            <input
              type="password"
              placeholder="현재 비밀번호 입력"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
              className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm
                         focus:outline-none focus:border-vault-500 focus:ring-1 focus:ring-vault-500/30 placeholder-zinc-600"
            />
          </div>

          <div className="h-px bg-zinc-800/60" />

          {/* New password */}
          <div>
            <label className="block text-xs text-zinc-400 mb-1">새 비밀번호</label>
            <input
              type="password"
              placeholder="새 비밀번호 (6자 이상)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm
                         focus:outline-none focus:border-vault-500 focus:ring-1 focus:ring-vault-500/30 placeholder-zinc-600"
            />
            {/* Strength indicator */}
            {newPassword.length > 0 && (
              <div className="mt-2">
                <div className="flex gap-1 mb-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        i <= strength.level ? strength.color : "bg-zinc-700"
                      }`}
                    />
                  ))}
                </div>
                <p className={`text-[11px] ${
                  strength.level <= 1 ? "text-red-400" :
                  strength.level <= 2 ? "text-yellow-400" :
                  strength.level <= 3 ? "text-blue-400" : "text-green-400"
                }`}>
                  {strength.label}
                  {strength.level <= 2 && " — 영문 대소문자, 숫자, 특수문자를 섞어주세요"}
                </p>
              </div>
            )}
          </div>

          {/* Confirm new password */}
          <div>
            <label className="block text-xs text-zinc-400 mb-1">새 비밀번호 확인</label>
            <input
              type="password"
              placeholder="새 비밀번호 다시 입력"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              className={`w-full px-3 py-2.5 bg-zinc-800 border rounded-lg text-sm
                         focus:outline-none focus:border-vault-500 focus:ring-1 focus:ring-vault-500/30 placeholder-zinc-600 transition-colors ${
                           confirmPassword && confirmPassword !== newPassword
                             ? "border-red-700"
                             : confirmPassword && confirmPassword === newPassword
                             ? "border-green-700"
                             : "border-zinc-700"
                         }`}
            />
            {confirmPassword && confirmPassword !== newPassword && (
              <p className="text-[11px] text-red-400 mt-1">비밀번호가 일치하지 않습니다</p>
            )}
          </div>
        </div>

        {error && <p className="text-red-400 text-sm mt-3 animate-slide-down">{error}</p>}

        <div className="flex gap-3 mt-5">
          <button
            onClick={handleChange}
            disabled={loading || !currentPassword || !newPassword || !confirmPassword}
            className="flex-1 py-2.5 bg-vault-600 hover:bg-vault-500 rounded-lg text-sm font-medium
                       disabled:opacity-40 transition-colors"
          >
            {loading ? "변경 중... (키 재암호화)" : "비밀번호 변경"}
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
