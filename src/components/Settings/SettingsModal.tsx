import { useState, useEffect } from "react";
import { save } from "@tauri-apps/plugin-dialog";
import * as api from "../../lib/tauri";
import type { AppPreferences } from "../../types";

interface SettingsModalProps {
  prefs: AppPreferences;
  onClose: () => void;
  onSaved: (prefs: AppPreferences) => void;
  onChangePassword: () => void;
  onRegenerateRecovery: () => void;
  onRestoreVault: () => void;
}

const AUTO_LOCK_OPTIONS = [
  { value: 1, label: "1분" },
  { value: 2, label: "2분" },
  { value: 5, label: "5분" },
  { value: 10, label: "10분" },
  { value: 30, label: "30분" },
  { value: 0, label: "사용 안 함" },
];

const CLIPBOARD_OPTIONS = [
  { value: 5, label: "5초" },
  { value: 10, label: "10초" },
  { value: 15, label: "15초" },
  { value: 30, label: "30초" },
  { value: 60, label: "60초" },
];

const BLUR_DELAY_OPTIONS = [
  { value: 0, label: "즉시" },
  { value: 3, label: "3초 후" },
  { value: 5, label: "5초 후" },
  { value: 10, label: "10초 후" },
];

export default function SettingsModal({ prefs, onClose, onSaved, onChangePassword, onRegenerateRecovery, onRestoreVault }: SettingsModalProps) {
  const [autoLockMin, setAutoLockMin] = useState(prefs.autoLockMin);
  const [clipboardClearSec, setClipboardClearSec] = useState(prefs.clipboardClearSec);
  const [blurEnabled, setBlurEnabled] = useState(prefs.blurEnabled);
  const [blurDelaySec, setBlurDelaySec] = useState(prefs.blurDelaySec);
  const [saving, setSaving] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [pendingRestore, setPendingRestore] = useState(false);

  useEffect(() => {
    api.hasPendingRestore().then(setPendingRestore).catch(() => {});
  }, []);

  const handleBackup = async () => {
    setBackingUp(true);
    try {
      const path = await save({
        defaultPath: `api-key-safepass-backup-${new Date().toISOString().slice(0, 10)}.db`,
        filters: [{ name: "Vault Backup", extensions: ["db"] }],
      });
      if (path) {
        await api.backupVault(path);
        alert("백업 파일이 저장되었습니다. (이미 암호화된 상태로 저장되므로 그대로 안전하게 보관하세요)");
      }
    } catch (e) {
      alert(String(e));
    } finally {
      setBackingUp(false);
    }
  };

  const handleCancelPendingRestore = async () => {
    try {
      await api.cancelPendingRestore();
      setPendingRestore(false);
    } catch (e) {
      alert(String(e));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const newPrefs: AppPreferences = { autoLockMin, clipboardClearSec, blurEnabled, blurDelaySec };
      await api.setPreference("autoLockMin", String(autoLockMin));
      await api.setPreference("clipboardClearSec", String(clipboardClearSec));
      await api.setPreference("blurEnabled", blurEnabled ? "1" : "0");
      await api.setPreference("blurDelaySec", String(blurDelaySec));
      onSaved(newPrefs);
    } catch (e) {
      alert(String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-md mx-4 p-6 shadow-2xl animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700/50 flex items-center justify-center">
            <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h2 className="text-base font-semibold">설정</h2>
        </div>

        <div className="space-y-5">
          {/* Auto Lock */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-sm font-medium text-zinc-200">자동 잠금</h3>
                <p className="text-[11px] text-zinc-500">사용하지 않으면 자동으로 잠금</p>
              </div>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {AUTO_LOCK_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setAutoLockMin(opt.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                    autoLockMin === opt.value
                      ? "bg-vault-600 text-white"
                      : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Clipboard Clear */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-sm font-medium text-zinc-200">클립보드 자동 삭제</h3>
                <p className="text-[11px] text-zinc-500">키 복사 후 자동으로 클립보드 비우기</p>
              </div>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {CLIPBOARD_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setClipboardClearSec(opt.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                    clipboardClearSec === opt.value
                      ? "bg-vault-600 text-white"
                      : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Blur on unfocus */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-sm font-medium text-zinc-200">화면 흐림 보호</h3>
                <p className="text-[11px] text-zinc-500">다른 창으로 전환하면 화면을 흐리게 처리</p>
              </div>
              <button
                onClick={() => setBlurEnabled(!blurEnabled)}
                className={`w-10 h-5 rounded-full transition-colors relative ${
                  blurEnabled ? "bg-vault-600" : "bg-zinc-700"
                }`}
              >
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                  blurEnabled ? "left-[22px]" : "left-0.5"
                }`} />
              </button>
            </div>
            {blurEnabled && (
              <div className="flex gap-1.5 flex-wrap animate-slide-down">
                {BLUR_DELAY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setBlurDelaySec(opt.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                      blurDelaySec === opt.value
                        ? "bg-vault-600 text-white"
                        : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="h-px bg-zinc-800" />

          {/* Password change link */}
          <button
            onClick={() => { onClose(); setTimeout(onChangePassword, 100); }}
            className="w-full text-left px-3 py-2.5 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5">
              <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
              <span className="text-sm text-zinc-300">마스터 비밀번호 변경</span>
            </div>
            <svg className="w-4 h-4 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>

          {/* Regenerate recovery key */}
          <button
            onClick={() => { onClose(); setTimeout(onRegenerateRecovery, 100); }}
            className="w-full text-left px-3 py-2.5 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5">
              <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM3.75 12h2.25m13.5 0h2.25M12 3.75v2.25m0 13.5v2.25M5.636 5.636l1.591 1.591m9.546 9.546l1.591 1.591M5.636 18.364l1.591-1.591m9.546-9.546l1.591-1.591" />
              </svg>
              <span className="text-sm text-zinc-300">복구키 재발급</span>
            </div>
            <svg className="w-4 h-4 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>

          {/* Divider */}
          <div className="h-px bg-zinc-800" />

          {/* Backup / Restore */}
          <div>
            <h3 className="text-sm font-medium text-zinc-200 mb-1">백업 · 복원</h3>
            <p className="text-[11px] text-zinc-500 mb-2">전체 볼트를 암호화된 상태 그대로 파일로 저장하거나 되돌립니다.</p>

            {pendingRestore && (
              <div className="mb-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-between gap-2">
                <span className="text-[11px] text-amber-400">복원 대기 중 — 다음 재시작 시 적용됩니다</span>
                <button
                  onClick={handleCancelPendingRestore}
                  className="text-[11px] text-amber-300 hover:text-amber-200 underline flex-shrink-0"
                >
                  취소
                </button>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleBackup}
                disabled={backingUp}
                className="flex-1 px-3 py-2 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 text-xs text-zinc-300 transition-colors disabled:opacity-40"
              >
                {backingUp ? "백업 중..." : "지금 백업"}
              </button>
              <button
                onClick={() => { onClose(); setTimeout(onRestoreVault, 100); }}
                className="flex-1 px-3 py-2 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 text-xs text-zinc-300 transition-colors"
              >
                백업에서 복원
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 bg-vault-600 hover:bg-vault-500 rounded-lg text-sm font-medium disabled:opacity-40 transition-colors"
          >
            {saving ? "저장 중..." : "저장"}
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
