import { useEffect, useRef } from "react";

// Ctrl+S (Cmd+S on Mac) runs `onSave` instead of the browser's "save page" dialog.
// `enabled` false = nothing to save yet (the page dialog is still blocked, so nothing odd opens).
export function useSaveShortcut(onSave: () => void, enabled: boolean) {
  const ref = useRef({ onSave, enabled });
  ref.current = { onSave, enabled };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (ref.current.enabled) ref.current.onSave();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}
