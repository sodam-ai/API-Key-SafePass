import { useCallback, useRef } from "react";
import { writeText, readText, clear } from "@tauri-apps/plugin-clipboard-manager";

export function useClipboard(clearDelayMs: number = 10_000) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const copyWithAutoClear = useCallback(async (text: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);

    await writeText(text);

    timerRef.current = setTimeout(async () => {
      try {
        const current = await readText();
        if (current === text) await clear();
      } catch { /* ignore */ }
      timerRef.current = null;
    }, clearDelayMs);
  }, [clearDelayMs]);

  return { copyWithAutoClear };
}
