// Small things the app remembers in this browser: the unfinished banner or header bar, the last section, tool settings.
// Everything is wrapped so a blocked or full storage never breaks the app (the app simply forgets).
import type { Draft, HeaderFile } from "@/lib/banner";
import { newDraft } from "@/lib/banner";
import { newHeaderDraft, type HeaderDraft } from "@/lib/header";

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

export type Work = { kind: "banner"; draft: Draft } | { kind: "header"; draft: HeaderDraft } | null;

const WORK_KEY = "ol-work";

// Picture bytes are kept as the data URL only (the bytes are rebuilt from it).
interface StoredFile {
  name: string;
  dataUrl: string;
  avg?: string;
}
type Stored =
  | { kind: "banner"; config: Draft["config"]; file: StoredFile | null; savedAt: number }
  | { kind: "header"; config: HeaderDraft["config"]; file: StoredFile | null; embedUrl: string; savedAt: number };

const pack = (f: HeaderFile | null): StoredFile | null => (f ? { name: f.name, dataUrl: f.dataUrl, avg: f.avg } : null);

function unpack(f: StoredFile | null): HeaderFile | null {
  if (!f) return null;
  try {
    const binary = atob(f.dataUrl.split(",")[1] ?? "");
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return { name: f.name, bytes, dataUrl: f.dataUrl, avg: f.avg };
  } catch {
    return null;
  }
}

// A draft that still equals a brand-new one is not worth keeping.
function isPristine(work: NonNullable<Work>): boolean {
  const fresh = work.kind === "banner" ? newDraft(work.draft.config.format) : newHeaderDraft();
  return JSON.stringify(work.draft.config) === JSON.stringify(fresh.config) && !(work.kind === "banner" ? work.draft.headerFile : work.draft.picture);
}

export function saveWork(work: Work) {
  if (!work || isPristine(work)) return;
  const file = work.kind === "banner" ? work.draft.headerFile : work.draft.picture;
  const base = work.kind === "banner" ? { kind: "banner" as const, config: work.draft.config } : { kind: "header" as const, config: work.draft.config, embedUrl: work.draft.embedUrl };
  const stored = { ...base, file: pack(file), savedAt: Date.now() } as Stored;
  // A big picture can fill the storage: keep the text work without it rather than losing everything.
  if (!write(WORK_KEY, stored)) write(WORK_KEY, { ...stored, file: null });
}

export const clearWork = () => remove(WORK_KEY);

export interface SavedInfo {
  kind: "banner" | "header";
  name: string; // campaign name or bar text ("" when not written yet)
  savedAt: number;
}

export function savedInfo(): SavedInfo | null {
  const s = read<Stored>(WORK_KEY);
  if (!s) return null;
  return { kind: s.kind, name: s.kind === "banner" ? s.config.campaign : s.config.label, savedAt: s.savedAt };
}

export function loadWork(): Work {
  const s = read<Stored>(WORK_KEY);
  if (!s) return null;
  if (s.kind === "banner") return { kind: "banner", draft: { config: s.config, headerFile: unpack(s.file) } };
  return { kind: "header", draft: { config: s.config, picture: unpack(s.file), embedUrl: s.embedUrl ?? "" } };
}
