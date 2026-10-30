// Small things the app remembers in this browser: the unfinished banner or header bar, the last section, tool settings.
// Everything is wrapped so a blocked or full storage never breaks the app (the app simply forgets).
import type { Draft, HeaderFile } from "@/lib/banner";
import { newDraft } from "@/lib/banner";
import { newHeaderDraft, type HeaderDraft } from "@/lib/header";
import { newSliderDraft, tidy, type SliderDraft } from "@/lib/slider";

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

export type Work = { kind: "banner"; draft: Draft } | { kind: "header"; draft: HeaderDraft } | { kind: "slider"; draft: SliderDraft } | null;

const WORK_KEY = "ol-work";

// Picture bytes are kept as the data URL only (the bytes are rebuilt from it).
interface StoredFile {
  name: string;
  dataUrl: string;
  avg?: string;
}
type Stored =
  | { kind: "banner"; config: Draft["config"]; file: StoredFile | null; adFile?: StoredFile | null; savedAt: number }
  | { kind: "header"; config: HeaderDraft["config"]; file: StoredFile | null; embedUrl: string; savedAt: number }
  | { kind: "slider"; config: SliderDraft["config"]; files: Record<string, StoredFile>; savedAt: number };

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
  if (work.kind === "slider") return JSON.stringify(work.draft.config) === JSON.stringify(newSliderDraft(work.draft.config.format).config) && Object.keys(work.draft.files).length === 0;
  const fresh = work.kind === "banner" ? newDraft(work.draft.config.format) : newHeaderDraft();
  return JSON.stringify(work.draft.config) === JSON.stringify(fresh.config) && !(work.kind === "banner" ? work.draft.headerFile || work.draft.adFile : work.draft.picture);
}

export function saveWork(work: Work) {
  if (!work || isPristine(work)) return;
  if (work.kind === "slider") {
    const draft = tidy(work.draft);
    const files = Object.fromEntries(Object.entries(draft.files).map(([k, f]) => [k, pack(f)!]));
    const stored: Stored = { kind: "slider", config: draft.config, files, savedAt: Date.now() };
    // Many pictures can fill the storage: keep the text work without them rather than losing everything.
    if (!write(WORK_KEY, stored)) write(WORK_KEY, { ...stored, files: {} });
    return;
  }
  const file = work.kind === "banner" ? work.draft.headerFile : work.draft.picture;
  const base = work.kind === "banner" ? { kind: "banner" as const, config: work.draft.config, adFile: pack(work.draft.adFile ?? null) } : { kind: "header" as const, config: work.draft.config, embedUrl: work.draft.embedUrl };
  const stored = { ...base, file: pack(file), savedAt: Date.now() } as Stored;
  // A big picture can fill the storage: keep the text work without it rather than losing everything.
  if (!write(WORK_KEY, stored)) write(WORK_KEY, { ...stored, file: null, ...(stored.kind === "banner" ? { adFile: null } : {}) });
}

export const clearWork = () => remove(WORK_KEY);

export interface SavedInfo {
  kind: "banner" | "header" | "slider";
  name: string; // campaign name or bar text ("" when not written yet)
  savedAt: number;
}

// A saved slider from an older version of the tool has another shape: it is dropped instead of breaking the editor.
const usable = (s: Stored | null): s is Stored => !!s && (s.kind !== "slider" || (typeof s.config?.background === "string" && !!s.config?.desktop && !!s.config?.mobile));

export function savedInfo(): SavedInfo | null {
  const s = read<Stored>(WORK_KEY);
  if (!usable(s)) return null;
  return { kind: s.kind, name: s.kind === "header" ? s.config.label : s.config.campaign, savedAt: s.savedAt };
}

export function loadWork(): Work {
  const s = read<Stored>(WORK_KEY);
  if (!usable(s)) return null;
  if (s.kind === "slider") {
    const files: SliderDraft["files"] = {};
    for (const [k, f] of Object.entries(s.files)) {
      const u = unpack(f);
      if (u) files[k] = u;
    }
    return { kind: "slider", draft: { config: s.config, files } };
  }
  if (s.kind === "banner") return { kind: "banner", draft: { config: s.config, headerFile: unpack(s.file), adFile: unpack(s.adFile ?? null) } };
  return { kind: "header", draft: { config: s.config, picture: unpack(s.file), embedUrl: s.embedUrl ?? "" } };
}
