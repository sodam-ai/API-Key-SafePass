import { useEffect, useState, useRef } from "react";

export function useWindowBlur(enabled: boolean = true, delayMs: number = 3000) {
  const [isBlurred, setIsBlurred] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled) { setIsBlurred(false); return; }

    const handleBlur = () => {
      if (delayMs <= 0) {
        setIsBlurred(true);
      } else {
        timerRef.current = setTimeout(() => setIsBlurred(true), delayMs);
      }
    };
    const handleFocus = () => {
      if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
      setIsBlurred(false);
    };
    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
    };
  }, [enabled, delayMs]);

  return isBlurred;
}
