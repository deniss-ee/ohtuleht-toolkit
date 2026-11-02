import JSZip from "jszip";
import { emptyVersion, renderResponsiveBanner, validateResponsiveBanner } from "@ohtuleht/templates";
import type { Problem, RbVersion, ResponsiveBannerConfig } from "@ohtuleht/templates";
import { getLang, ui } from "@/content";
import { readySignal } from "@/components/editor/SwapFrame";
import { bytesOf, slug, type HeaderFile } from "@/lib/banner";
import { stampedName } from "@/lib/format";
import { imageSize, toDataUrl } from "@/lib/image";
import { openZip } from "@/lib/openzip";
import { download } from "@/lib/zip";

export type VersionName = "small" | "large";
export const VERSIONS: VersionName[] = ["small", "large"];
// The width of the picture or video of each version (the file name starts with it, like the old banners: 540-1.jpg, 700.mp4).
export const VERSION_WIDTH: Record<VersionName, number> = { small: 540, large: 700 };

// Pictures and videos are kept under a short random key while the person edits; real file names are made when the zip is written.
export interface ResponsiveDraft {
  config: ResponsiveBannerConfig;
  files: Record<string, HeaderFile>;
}

export function newResponsiveDraft(): ResponsiveDraft {
  return {
    files: {},
    config: { v: 1, kind: "responsive-banner", format: "responsive-banner", campaign: "", small: emptyVersion(), large: emptyVersion(), holdMs: 3000, fadeMs: 800, href: "" },
  };
}

export const responsiveProblems = (d: ResponsiveDraft): Problem[] => validateResponsiveBanner(d.config, getLang());

export const newKey = () => Math.random().toString(36).slice(2, 10);
export const extOf = (name: string) => {
  const ext = name.split(".").pop()?.toLowerCase() ?? "jpg";
  return ext === "jpeg" ? "jpg" : ext;
};
export const isVideoName = (name: string) => /\.(mp4|webm|m4v)$/i.test(name);

// A picture the person chose, kept as it is.
export async function fileToPicture(file: File): Promise<{ key: string; file: HeaderFile; width: number; height: number }> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const name = `picture.${extOf(file.name)}`;
  const dataUrl = toDataUrl(bytes, name);
  const size = await imageSize(dataUrl);
  return { key: newKey(), file: { name, bytes, dataUrl }, width: size?.width ?? 0, height: size?.height ?? 0 };
}

// A video the person chose. Its first frame becomes the still that is shown until the video plays (or when autoplay is blocked).
export async function fileToVideo(file: File): Promise<{ key: string; file: HeaderFile; width: number; height: number; poster: { key: string; file: HeaderFile } | null }> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const url = URL.createObjectURL(file);
  let width = 0;
  let height = 0;
  let posterBytes: Uint8Array | null = null;
  try {
    const v = document.createElement("video");
    v.muted = true;
    v.playsInline = true;
    v.preload = "auto";
    v.src = url;
    await new Promise<void>((resolve, reject) => {
      v.onloadeddata = () => resolve();
      v.onerror = () => reject(new Error("video"));
      setTimeout(() => reject(new Error("timeout")), 8000);
    });
    width = v.videoWidth;
    height = v.videoHeight;
    v.currentTime = Math.min(0.1, (v.duration || 1) / 2);
    await new Promise<void>((resolve) => {
      v.onseeked = () => resolve();
      setTimeout(resolve, 1500);
    });
    const canvas = document.createElement("canvas");
    canvas.width = width || 700;
    canvas.height = height || 200;
    canvas.getContext("2d")!.drawImage(v, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/webp", 0.8));
    if (blob) posterBytes = new Uint8Array(await blob.arrayBuffer());
  } catch {
    /* no still: the banner works without it */
  } finally {
    URL.revokeObjectURL(url);
  }
  const key = newKey();
  const poster = posterBytes ? { key: newKey(), file: { name: "poster.webp", bytes: posterBytes, dataUrl: toDataUrl(posterBytes, "poster.webp") } } : null;
  return { key, file: { name: `video.${extOf(file.name)}`, bytes, dataUrl: "" }, width, height, poster };
}

// Files of unused keys are dropped so they never end up in the zip or in storage.
export function tidy(d: ResponsiveDraft): ResponsiveDraft {
  const used = new Set<string>();
  for (const n of VERSIONS) {
    const v = d.config[n];
    [v.video, v.poster, ...v.pictures].forEach((k) => k && used.add(k)); // both kinds are kept, so switching back does not lose them
  }
  const files = Object.fromEntries(Object.entries(d.files).filter(([k]) => used.has(k)));
  return Object.keys(files).length === Object.keys(d.files).length ? d : { ...d, files };
}

// Object addresses for videos in the preview (a video is too big to carry as text). Made once per key.
const videoUrls = new Map<string, string>();
const videoUrl = (key: string, f: HeaderFile) => {
  let u = videoUrls.get(key);
  if (!u) {
    u = URL.createObjectURL(new Blob([f.bytes as BlobPart], { type: f.name.endsWith("webm") ? "video/webm" : "video/mp4" }));
    videoUrls.set(key, u);
  }
  return u;
};

interface Resolved {
  config: ResponsiveBannerConfig;
  out: Record<VersionName, { name: string; bytes: Uint8Array }[]>; // the files of each version
}

// Preview: pictures as data addresses, videos as object addresses. Export: 540-1.jpg, 540.mp4, 540-poster.webp, 700-1.jpg ... next to index.html.
function resolve(d: ResponsiveDraft, mode: "preview" | "export"): Resolved {
  const out: Resolved["out"] = { small: [], large: [] };
  const config = { ...d.config } as ResponsiveBannerConfig;
  for (const n of VERSIONS) {
    const v = d.config[n];
    const prefix = String(VERSION_WIDTH[n]);
    const take = (key: string, base: string, isVideo = false): string => {
      const f = d.files[key];
      if (!f) return "";
      const name = `${base}.${extOf(f.name)}`;
      out[n].push({ name, bytes: f.bytes });
      return mode === "export" ? name : isVideo ? videoUrl(key, f) : f.dataUrl;
    };
    const next: RbVersion =
      v.kind === "video"
        ? { kind: "video", video: take(v.video, prefix, true), poster: take(v.poster, `${prefix}-poster`), pictures: [] }
        : { kind: "pictures", video: "", poster: "", pictures: v.pictures.map((k, i) => take(k, `${prefix}-${i + 1}`)).filter(Boolean) };
    config[n] = next;
  }
  return { config, out };
}

export const renderResponsivePreview = (d: ResponsiveDraft, id: number): string => renderResponsiveBanner(resolve(d, "preview").config).replace("</body>", readySignal(id) + "</body>");

export function renderResponsiveExport(d: ResponsiveDraft) {
  const { config, out } = resolve(d, "export");
  return { html: renderResponsiveBanner(config), out };
}

// What one viewer downloads: the page plus the files of the version he sees, in KB.
export function versionWeightKb(d: ResponsiveDraft, n: VersionName): number {
  const { html, out } = renderResponsiveExport(d);
  return (bytesOf(html) + out[n].reduce((s, f) => s + f.bytes.length, 0)) / 1024;
}

export async function buildResponsiveZip(d: ResponsiveDraft): Promise<Blob> {
  const { html, out } = renderResponsiveExport(d);
  const zip = new JSZip();
  zip.file("index.html", html);
  [...out.small, ...out.large].forEach((f) => zip.file(f.name, f.bytes));
  // Pictures and videos are already compressed, so only the page is worth deflating.
  return zip.generateAsync({ type: "blob", compression: "DEFLATE" });
}

export const responsiveZipName = (d: ResponsiveDraft) => stampedName(`${slug(d.config.campaign)}-700x200`, "zip");
export const downloadResponsiveZip = async (d: ResponsiveDraft) => download(await buildResponsiveZip(d), responsiveZipName(d));

// Reads a banner made by this tool (the config is embedded in index.html). Returns null when the zip is something else.
export async function importResponsiveZip(file: File): Promise<ResponsiveDraft | null> {
  const zip = await openZip(file);
  const index = zip?.file("index.html");
  if (!zip || !index) return null;
  const json = new DOMParser().parseFromString(await index.async("string"), "text/html").getElementById("ol-banner")?.textContent;
  if (!json) return null;
  const parsed = JSON.parse(json) as Partial<ResponsiveBannerConfig>;
  if (parsed.kind !== "responsive-banner") return null;
  if (parsed.v !== 1) throw new Error(ui.errBannerVersion);
  const config = parsed as ResponsiveBannerConfig;
  const files: ResponsiveDraft["files"] = {};
  const read = async (src: string, isVideo = false): Promise<string> => {
    const entry = src ? zip.file(src) : null;
    if (!entry) return "";
    const bytes = await entry.async("uint8array");
    const key = newKey();
    files[key] = { name: src, bytes, dataUrl: isVideo ? "" : toDataUrl(bytes, src) };
    return key;
  };
  for (const n of VERSIONS) {
    const v = config[n] ?? emptyVersion();
    config[n] = v.kind === "video" ? { kind: "video", video: await read(v.video, true), poster: await read(v.poster), pictures: [] } : { kind: "pictures", video: "", poster: "", pictures: (await Promise.all(v.pictures.map((p) => read(p)))).filter(Boolean) };
  }
  return { config: { ...newResponsiveDraft().config, ...config }, files };
}


// Pictures drawn on the spot, so the form can be tried without collecting anything first.
// Small version: two 1080x400 pictures that fade into each other. Large version: one 1400x400 picture. The safe zone is marked.
export async function exampleResponsiveDraft(): Promise<ResponsiveDraft> {
  const d = newResponsiveDraft();
  d.config.campaign = "Example banner";
  const make = async (w: number, h: number, color: string, label: string, safe: number) => {
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const x = canvas.getContext("2d")!;
    x.fillStyle = color;
    x.fillRect(0, 0, w, h);
    // the middle part that is always visible (safe zone, at twice the size)
    x.fillStyle = "rgba(255,255,255,.14)";
    x.fillRect((w - safe * 2) / 2, 0, safe * 2, h);
    x.fillStyle = "#fff";
    x.font = "bold 150px sans-serif";
    x.textAlign = "center";
    x.fillText(label, w / 2, h / 2 + 50);
    const blob = await new Promise<Blob>((r) => canvas.toBlob((b) => r(b!), "image/jpeg", 0.88));
    return fileToPicture(new File([blob], "x.jpg", { type: "image/jpeg" }));
  };
  const small = await Promise.all([make(1080, 400, "#f50000", "540 / 1", 320), make(1080, 400, "#0b72e7", "540 / 2", 320)]);
  const large = await make(1400, 400, "#12a150", "700", 540);
  [...small, large].forEach((p) => (d.files[p.key] = p.file));
  d.config.small = { kind: "pictures", video: "", poster: "", pictures: small.map((p) => p.key) };
  d.config.large = { kind: "pictures", video: "", poster: "", pictures: [large.key] };
  return d;
}
