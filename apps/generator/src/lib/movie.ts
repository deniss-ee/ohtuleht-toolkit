import JSZip from "jszip";
import { renderMovieBanner, type MovieBannerConfig, type VideoPosition } from "@ohtuleht/templates";
import { movieBanner as t } from "@/content";
import { readySignal } from "@/components/editor/SwapFrame";
import { download } from "@/lib/zip";

export interface Version {
  file: File | null;
  width: number; // read from the picture
  height: number;
  url: string; // object URL for the preview
  href: string;
}

export interface MovieDraft {
  video: File | null;
  videoUrl: string;
  videoHeight: number;
  position: VideoPosition;
  offset: number;
  a: Version; // first version (1250 px)
  b: Version; // second version (1280 px)
}

const emptyVersion = (): Version => ({ file: null, width: 1250, height: 400, url: "", href: "" });
export const newMovieDraft = (): MovieDraft => ({ video: null, videoUrl: "", videoHeight: 360, position: "left", offset: 20, a: emptyVersion(), b: emptyVersion() });

export const VERSIONS = [
  { key: "a", label: "1250 px" },
  { key: "b", label: "1280 px" },
] as const;
export type VersionKey = (typeof VERSIONS)[number]["key"];

const ext = (name: string, fallback: string) => (name.match(/\.([a-z0-9]+)$/i)?.[1] ?? fallback).toLowerCase();
const stem = (name: string) => name.replace(/\.[^.]+$/, "");
const videoName = (d: MovieDraft) => `video.${d.video ? ext(d.video.name, "mp4") : "mp4"}`;
const backgroundName = (v: Version) => `background.${v.file ? ext(v.file.name, "jpg") : "jpg"}`;

export function readPicture(file: File): Promise<{ width: number; height: number; url: string }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight, url });
    img.onerror = () => reject(new Error(t.pictureFailed));
    img.src = url;
  });
}

function config(d: MovieDraft, v: Version, background: string, video: string): MovieBannerConfig {
  return { title: "Video banner", width: v.width, height: v.height, background, video, videoHeight: d.videoHeight, position: d.position, offset: d.offset, href: v.href.trim() };
}

export interface MovieProblem {
  field: string; // id of the control to jump to
  message: string;
}

export function movieProblems(d: MovieDraft): MovieProblem[] {
  const out: MovieProblem[] = [];
  if (!d.video) out.push({ field: "mv-video", message: t.needVideo });
  for (const { key, label } of VERSIONS) {
    if (!d[key].file) out.push({ field: `mv-bg-${key}`, message: t.needBackground(label) });
    const href = d[key].href.trim();
    if (href && !/^https?:\/\/\S+$/i.test(href)) out.push({ field: `mv-link-${key}`, message: t.badLink(label) });
  }
  if (!(d.videoHeight >= 50 && d.videoHeight <= 1000)) out.push({ field: "mv-height", message: t.badHeight });
  return out;
}

// Preview html: the zip's file names are swapped for in-browser addresses.
export function renderMoviePreview(d: MovieDraft, key: VersionKey, id: number): string {
  const v = d[key];
  const html = renderMovieBanner(config(d, v, v.url, d.videoUrl));
  return html.replace("</body>", readySignal(id) + "</body>");
}

export async function buildMovieZip(d: MovieDraft, key: VersionKey): Promise<Blob> {
  const v = d[key];
  const bg = backgroundName(v);
  const vid = videoName(d);
  const zip = new JSZip();
  zip.file("index.html", renderMovieBanner(config(d, v, bg, vid)));
  zip.file(bg, v.file!);
  zip.file(vid, d.video!);
  // The picture and the video are already compressed, so only the html is deflated.
  return zip.generateAsync({ type: "blob", compression: "DEFLATE" });
}

// Name of a zip: the name of the background picture and its size, like the old tool.
export const movieZipName = (d: MovieDraft, key: VersionKey) => `${stem(d[key].file?.name ?? "banner")}_${key === "a" ? "1250" : "1280"}.zip`;

export async function downloadMovieZips(d: MovieDraft): Promise<[number, number]> {
  const sizes: number[] = [];
  for (const { key } of VERSIONS) {
    const blob = await buildMovieZip(d, key);
    sizes.push(blob.size);
    download(blob, movieZipName(d, key));
    await new Promise((r) => setTimeout(r, 500)); // browsers drop downloads fired in the same instant
  }
  return [sizes[0]!, sizes[1]!];
}
