import { useState } from "react";
import * as api from "../../lib/tauri";

interface QuickUpdateModalProps {
  keyId: string;
  keyName: string;
  provider: string | null;
  serviceUrl: string | null;
  isExpired: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export default function QuickUpdateModal({
  keyId,
  keyName,
  provider,
  serviceUrl,
  isExpired,
  onClose,
  onSaved,
}: QuickUpdateModalProps) {
  const [newValue, setNewValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"guide" | "input">(
    isExpired && serviceUrl ? "guide" : "input"
  );

  const handleOpenServiceUrl = () => {
    if (serviceUrl) window.open(serviceUrl, "_blank");
    setStep("input");
  };

  const handleSave = async () => {
    if (!newValue.trim()) {
      setError("새 키값을 입력해주세요");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await api.quickUpdateKeyValue(keyId, newValue.trim());
      onSaved();
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-md mx-4 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-vault-600/20 border border-vault-600/30 flex items-center justify-center">
            <svg
              className="w-4 h-4 text-vault-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182M2.985 19.644l3.181-3.182"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-semibold">
              {isExpired ? "키 재발급" : "키값 변경"}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-4 ml-10">
          <span className="text-sm text-zinc-300">{keyName}</span>
          {provider && (
            <span className="px-2 py-0.5 bg-zinc-800 rounded text-xs text-zinc-400">
              {provider}
            </span>
          )}
        </div>

        {/* Step 1: Guide to service page (for expired keys) */}
        {step === "guide" && (
          <div className="space-y-4">
            <div className="bg-yellow-900/20 border border-yellow-800/30 rounded-lg p-3">
              <p className="text-sm text-yellow-300 mb-1 font-medium">
                이 키가 만료되었습니다
              </p>
              <p className="text-xs text-zinc-400">
                아래 버튼으로 키 관리 페이지에서 새 키를 발급받은 후, 여기에
                입력하세요.
              </p>
            </div>

            <button
              onClick={handleOpenServiceUrl}
              className="w-full py-3 bg-vault-600 hover:bg-vault-700 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                />
              </svg>
              키 관리 페이지 열기
            </button>

            <button
              onClick={() => setStep("input")}
              className="w-full py-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              이미 새 키가 있어요 → 바로 입력
            </button>
          </div>
        )}

        {/* Step 2: Input new key value */}
        {step === "input" && (
          <div className="space-y-4">
            {isExpired && serviceUrl && (
              <button
                onClick={() => window.open(serviceUrl, "_blank")}
                className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs text-zinc-400 transition-colors flex items-center justify-center gap-1.5"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                  />
                </svg>
                키 관리 페이지 다시 열기
              </button>
            )}

            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">
                새 키값
              </label>
              <textarea
                placeholder="새로 발급받은 키를 붙여넣기..."
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSave();
                  }
                }}
                rows={3}
                autoFocus
                className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm font-mono
                           focus:outline-none focus:border-vault-500 placeholder-zinc-500 resize-none"
              />
              <p className="text-xs text-zinc-600 mt-1">
                기존 키값은 새 값으로 덮어씌워집니다
              </p>
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={loading || !newValue.trim()}
                className="flex-1 py-2.5 bg-vault-600 hover:bg-vault-700 rounded-lg text-sm font-medium
                           disabled:opacity-50 transition-colors"
              >
                {loading ? "저장 중..." : "키값 변경"}
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-2.5 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-sm font-medium transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
