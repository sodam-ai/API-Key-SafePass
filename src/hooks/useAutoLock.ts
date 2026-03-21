import { useEffect, useRef, useCallback } from "react";

const AUTO_LOCK_MS = 2 * 60 * 1000; // 2분 — 보안 강화

export function useAutoLock(onLock: () => void, enabled: boolean) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (enabled) {
      timerRef.current = setTimeout(onLock, AUTO_LOCK_MS);
    }
  }, [onLock, enabled]);

  useEffect(() => {
    if (!enabled) return;

    const events = ["mousedown", "keydown", "mousemove", "scroll", "touchstart"];
    events.forEach((e) => window.addEventListener(e, resetTimer));
    resetTimer();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach((e) => window.removeEventListener(e, resetTimer));
    };
  }, [resetTimer, enabled]);
}
