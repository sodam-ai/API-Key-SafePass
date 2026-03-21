import { useCallback, useRef } from "react";
import { writeText, readText, clear } from "@tauri-apps/plugin-clipboard-manager";

const CLEAR_DELAY_MS = 30_000;

export function useClipboard() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const copyWithAutoClear = useCallback(async (text: string) => {
    // Clear any previous timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    await writeText(text);

    // Schedule clipboard clear after 30 seconds
    timerRef.current = setTimeout(async () => {
      try {
        const current = await readText();
        // Only clear if clipboard still contains the same value
        if (current === text) {
          await clear();
        }
      } catch {
        // Clipboard may already be cleared or inaccessible
      }
      timerRef.current = null;
    }, CLEAR_DELAY_MS);
  }, []);

  return { copyWithAutoClear };
}
