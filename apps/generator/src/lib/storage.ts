// The unfinished banner kept in this browser: saving and loading it. This half knows every draft shape, so it is loaded
// together with the editors; the start pages use the light half (saved.ts).
import type { Draft, HeaderFile } from "@/lib/banner";
import { newDraft } from "@/lib/banner";
import { newHeaderDraft, type HeaderDraft } from "@/lib/header";
import { newFrameDraft, tidy as tidyFrames, type FrameDraft } from "@/lib/frames";
import { isVideoName, newResponsiveDraft, tidy as tidyResponsive, type ResponsiveDraft } from "@/lib/responsive";
import { newSliderDraft, tidy, type SliderDraft } from "@/lib/slider";
import { read, usable, WORK_KEY, write } from "@/lib/saved";

// ---- Unfinished work (one slot) ----

export type Work = { kind: "banner"; draft: Draft } | { kind: "header"; draft: HeaderDraft } | { kind: "slider"; draft: SliderDraft } | { kind: "frames"; draft: FrameDraft } | { kind: "responsive"; draft: ResponsiveDraft } | null;


// Picture bytes are kept as the data URL only (the bytes are rebuilt from it).
interface StoredFile {
  name: string;
  dataUrl: string;
  avg?: string;
}
type Stored =
  | { kind: "banner"; config: Draft["config"]; file: StoredFile | null; adFile?: StoredFile | null; logoFile?: StoredFile | null; articleFiles?: Record<string, StoredFile>; savedAt: number }
  | { kind: "header"; config: HeaderDraft["config"]; file: StoredFile | null; logo?: StoredFile | null; embedUrl: string; savedAt: number }
  | { kind: "slider"; config: SliderDraft["config"]; files: Record<string, StoredFile>; savedAt: number }
  | { kind: "frames"; config: FrameDraft["config"]; files: Record<string, StoredFile>; savedAt: number }
  | { kind: "responsive"; config: ResponsiveDraft["config"]; files: Record<string, StoredFile>; savedAt: number };

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
  if (work.kind === "responsive") return JSON.stringify(work.draft.config) === JSON.stringify(newResponsiveDraft().config) && Object.keys(work.draft.files).length === 0;
  if (work.kind === "frames") return JSON.stringify(work.draft.config) === JSON.stringify(newFrameDraft().config) && Object.keys(work.draft.files).length === 0;
  if (work.kind === "slider") return JSON.stringify(work.draft.config) === JSON.stringify(newSliderDraft(work.draft.config.format).config) && Object.keys(work.draft.files).length === 0;
  const fresh = work.kind === "banner" ? newDraft(work.draft.config.format) : newHeaderDraft();
  return JSON.stringify(work.draft.config) === JSON.stringify(fresh.config) && !(work.kind === "banner" ? work.draft.headerFile || work.draft.adFile || work.draft.logoFile : work.draft.picture || ("logo" in work.draft && work.draft.logo));
}

export function saveWork(work: Work) {
  if (!work || isPristine(work)) return;
  if (work.kind === "responsive") {
    const draft = tidyResponsive(work.draft);
    // A video is too big for the browser storage: it is not kept (its still picture is), and the version asks for it again.
    const kept = Object.entries(draft.files).filter(([, f]) => !isVideoName(f.name));
    const files = Object.fromEntries(kept.map(([k, f]) => [k, pack(f)!]));
    const config = { ...draft.config, small: { ...draft.config.small, video: draft.files[draft.config.small.video] && !isVideoName(draft.files[draft.config.small.video]!.name) ? draft.config.small.video : "" }, large: { ...draft.config.large, video: draft.files[draft.config.large.video] && !isVideoName(draft.files[draft.config.large.video]!.name) ? draft.config.large.video : "" } };
    const stored: Stored = { kind: "responsive", config, files, savedAt: Date.now() };
    if (!write(WORK_KEY, stored)) write(WORK_KEY, { ...stored, files: {} });
    return;
  }
  if (work.kind === "frames") {
    const draft = tidyFrames(work.draft);
    const files = Object.fromEntries(Object.entries(draft.files).map(([k, f]) => [k, pack(f)!]));
    const stored: Stored = { kind: "frames", config: draft.config, files, savedAt: Date.now() };
    // Many pictures can fill the storage: keep the text work without them rather than losing everything.
    if (!write(WORK_KEY, stored)) write(WORK_KEY, { ...stored, files: {} });
    return;
  }
  if (work.kind === "slider") {
    const draft = tidy(work.draft);
    const files = Object.fromEntries(Object.entries(draft.files).map(([k, f]) => [k, pack(f)!]));
    const stored: Stored = { kind: "slider", config: draft.config, files, savedAt: Date.now() };
    // Many pictures can fill the storage: keep the text work without them rather than losing everything.
    if (!write(WORK_KEY, stored)) write(WORK_KEY, { ...stored, files: {} });
    return;
  }
  const file = work.kind === "banner" ? work.draft.headerFile : work.draft.picture;
  const base = work.kind === "banner" ? { kind: "banner" as const, config: work.draft.config, adFile: pack(work.draft.adFile ?? null), logoFile: pack(work.draft.logoFile ?? null), articleFiles: Object.fromEntries(Object.entries(work.draft.articleFiles ?? {}).map(([k, f]) => [k, pack(f)!])) } : { kind: "header" as const, config: work.draft.config, logo: pack(work.draft.logo), embedUrl: work.draft.embedUrl };
  const stored = { ...base, file: pack(file), savedAt: Date.now() } as Stored;
  // A big picture can fill the storage: keep the text work without it rather than losing everything.
  if (!write(WORK_KEY, stored)) write(WORK_KEY, { ...stored, file: null, ...(stored.kind === "banner" ? { adFile: null, logoFile: null, articleFiles: {} } : { logo: null }) });
}

export function loadWork(): Work {
  const s = read<Stored>(WORK_KEY);
  if (!usable(s)) return null;
  if (s.kind === "responsive") {
    const files: ResponsiveDraft["files"] = {};
    for (const [k, f] of Object.entries(s.files)) {
      const u = unpack(f);
      if (u) files[k] = u;
    }
    return { kind: "responsive", draft: { config: s.config, files } };
  }
  if (s.kind === "frames") {
    const files: FrameDraft["files"] = {};
    for (const [k, f] of Object.entries(s.files)) {
      const u = unpack(f);
      if (u) files[k] = u;
    }
    return { kind: "frames", draft: { config: s.config, files } };
  }
  if (s.kind === "slider") {
    const files: SliderDraft["files"] = {};
    for (const [k, f] of Object.entries(s.files)) {
      const u = unpack(f);
      if (u) files[k] = u;
    }
    return { kind: "slider", draft: { config: s.config, files } };
  }
  if (s.kind === "banner") {
    const articleFiles: Record<string, HeaderFile> = {};
    for (const [k, f] of Object.entries(s.articleFiles ?? {})) {
      const u = unpack(f);
      if (u) articleFiles[k] = u;
    }
    return { kind: "banner", draft: { config: s.config, headerFile: unpack(s.file), adFile: unpack(s.adFile ?? null), logoFile: unpack(s.logoFile ?? null), articleFiles } };
  }
  return { kind: "header", draft: { config: s.config, picture: unpack(s.file), logo: unpack(s.logo ?? null), embedUrl: s.embedUrl ?? "" } };
}
