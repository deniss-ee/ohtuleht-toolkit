// The light half of the browser storage: reading, writing, and what the start pages need to know about unfinished work.
// It imports nothing heavy, so Home can show "Continue where you left off" without loading the banner code (see storage.ts for the rest).
// Everything is wrapped so a blocked or full storage never breaks the app (the app simply forgets).

export function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function write(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function remove(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    // nothing to do
  }
}

// ---- Unfinished work (one slot) ----

export const WORK_KEY = "ol-work";

export type WorkKind = "banner" | "header" | "slider" | "frames" | "responsive";

export interface SavedInfo {
  kind: WorkKind;
  name: string; // campaign name or bar text ("" when not written yet)
  savedAt: number;
}

// Only the fields the start pages show. The full shape of the saved work is in storage.ts.
interface StoredHead {
  kind: WorkKind;
  savedAt: number;
  config?: { label?: string; campaign?: string; background?: unknown; desktop?: unknown; mobile?: unknown };
}

// A saved slider from an older version of the tool has another shape: it is dropped instead of breaking the editor.
export const usable = (s: StoredHead | null): s is StoredHead => !!s && (s.kind !== "slider" || (typeof s.config?.background === "string" && !!s.config?.desktop && !!s.config?.mobile));

export function savedInfo(): SavedInfo | null {
  const s = read<StoredHead>(WORK_KEY);
  if (!usable(s)) return null;
  return { kind: s.kind, name: (s.kind === "header" ? s.config?.label : s.config?.campaign) ?? "", savedAt: s.savedAt };
}

export const clearWork = () => remove(WORK_KEY);
