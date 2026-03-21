import { useEffect, useRef, useCallback } from "react";

export function useAutoLock(onLock: () => void, enabled: boolean, timeoutMs: number = 2 * 60 * 1000) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (enabled && timeoutMs > 0) {
      timerRef.current = setTimeout(onLock, timeoutMs);
    }
  }, [onLock, enabled, timeoutMs]);

  useEffect(() => {
    if (!enabled || timeoutMs <= 0) return;

    const events = ["mousedown", "keydown", "mousemove", "scroll", "touchstart"];
    events.forEach((e) => window.addEventListener(e, resetTimer));
    resetTimer();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach((e) => window.removeEventListener(e, resetTimer));
    };
  }, [resetTimer, enabled, timeoutMs]);
}
