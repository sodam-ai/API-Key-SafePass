import { useEffect, useState } from "react";

/** 앱이 포커스를 잃으면 민감 데이터를 숨김 (보안) */
export function useWindowBlur() {
  const [isBlurred, setIsBlurred] = useState(false);

  useEffect(() => {
    const handleBlur = () => setIsBlurred(true);
    const handleFocus = () => setIsBlurred(false);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  return isBlurred;
}
