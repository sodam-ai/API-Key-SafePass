import { useEffect, useState, useRef } from "react";

const BLUR_DELAY_MS = 3000; // 3초 후에 blur 처리

/** 앱이 포커스를 잃고 3초 이상 지나면 민감 데이터를 숨김 */
export function useWindowBlur() {
  const [isBlurred, setIsBlurred] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleBlur = () => {
      timerRef.current = setTimeout(() => setIsBlurred(true), BLUR_DELAY_MS);
    };
    const handleFocus = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setIsBlurred(false);
    };
    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  return isBlurred;
}
