// Picture loop banner: a few pictures (PNG, JPG, WebP) that fade into each other, in place of an animated GIF.
// Pure HTML and CSS: the pictures are stacked and a CSS animation per picture fades it in and out, so it needs no script
// (the script only passes the click to the ad server). Optionally a background (colour or picture) lies under transparent pictures.
import { clickAttr, CLICKTAG_JS } from "./clicktag.ts";
import { escapeCssUrlInAttr, escapeHtml, escapeJsInAttr, jsonForScript } from "./escape.ts";
import { messages, type Lang } from "./messages.ts";
import type { Problem } from "./validate.ts";

export type FrameFit = "cover" | "contain" | "fill";

export interface FrameBannerConfig {
  v: 1;
  kind: "frame-banner";
  format: "frame-banner";
  campaign: string;
  width: number; // design size in px; the picture ratio when responsive
  height: number;
  responsive: boolean; // true: as wide as the slot (100%), the height follows the ratio
  fit: FrameFit; // how a picture fills the banner: cover = fills and crops, contain = whole picture, fill = stretched
  backgroundColor: string; // "" or #rrggbb, lies under the pictures
  backgroundImage: string; // "" or a file name, lies under the pictures
  frames: { image: string; holdMs?: number }[]; // file names inside the zip; holdMs overrides the common time
  holdMs: number; // how long a picture stays fully shown
  fadeMs: number; // 0 = a plain cut
  loop: { forever: boolean; times: number }; // times: how many rounds when not forever (it ends on the first picture)
  pauseOnHover: boolean;
  respectMotion: boolean; // true: people who asked their system for less motion see the first picture only
  href: string; // optional; empty = the ad server's own click address
}

export const FRAME_MIN_HOLD_MS = 300;
export const FRAME_SIZE_MIN = 20;
export const FRAME_SIZE_MAX = 4000;

const isUrl = (s: string) => /^https?:\/\//.test(s.trim());

// How long each picture really stays: never shorter than the fade (so two fades never overlap).
export const effectiveHolds = (c: Pick<FrameBannerConfig, "frames" | "holdMs" | "fadeMs">): number[] => c.frames.map((fr) => Math.max(fr.holdMs ?? c.holdMs, c.fadeMs, FRAME_MIN_HOLD_MS));

// ---- The timeline -------------------------------------------------------------------------------------------------
// Picture i is "settled" (fully shown, on its own) from v[i]. The next picture fades in over it during `fade` and the old
// one stays solid under it, so the background is never seen between two pictures. Only after the new picture is solid does the
// old one fade out (that matters only for transparent pictures, where it avoids a jump). The last picture fades into the first
// one at the end of the round, so the round repeats without a seam.
//   v[0] = 0,  v[i+1] = v[i] + hold[i] + fade,  total = v[n]
export function frameTimeline(holds: number[], fade: number) {
  const f = Math.max(0, fade);
  const h = holds.map((x) => Math.max(x, f, 1));
  const v: number[] = [];
  let t = 0;
  for (const x of h) {
    v.push(t);
    t += x + f;
  }
  return { v, total: t, f };
}

type Stops = [number, number][]; // [time in ms, value]

// The length of one change. A plain cut (fade 0) still uses a 2 ms overlap: the new picture is solid before the old one goes,
// so even the instant of a cut cannot show the background.
export const fadeRamp = (fade: number) => (fade > 0 ? fade : 2);

// opacity and stacking order (z) of picture i, as lists of [time, value] stops
export function frameStops(i: number, n: number, v: number[], total: number, fade: number): { opacity: Stops; z: Stops } {
  const f = fadeRamp(fade);
  const vNext = i < n - 1 ? v[i + 1]! : total;
  if (i === 0)
    return {
      opacity: [[0, 1], [vNext, 1], [vNext + f, 0], [total - f, 0], [total, 1]],
      z: [[0, 2], [vNext, 1], [vNext + f, 0], [total - f, 3]],
    };
  const start = v[i]! - f; // the fade-in begins
  if (i === n - 1)
    return {
      opacity: [[0, 1], [f, 0], [start, 0], [v[i]!, 1], [total, 1]],
      z: [[0, 1], [f, 0], [start, 3], [v[i]!, 2]],
    };
  return {
    opacity: [[0, 0], [start, 0], [v[i]!, 1], [vNext, 1], [vNext + f, 0], [total, 0]],
    z: [[0, 0], [start, 3], [v[i]!, 2], [vNext, 1], [vNext + f, 0]],
  };
}

// One @keyframes block. Times become percents; two stops at the same moment are pulled 0.0001 % apart (an instant change).
function keyframes(name: string, prop: string, stops: Stops, total: number): string {
  const out: string[] = [];
  let last = -1;
  for (const [t, value] of stops) {
    let p = +((t / total) * 100).toFixed(4);
    if (p <= last) p = +(last + 0.0001).toFixed(4);
    if (p > 100) continue;
    last = p;
    out.push(`${p}%{${prop}:${value}}`);
  }
  if (!out[0]?.startsWith("0%")) out.unshift(`0%{${prop}:${stops[0]![1]}}`);
  if (last < 100) out.push(`100%{${prop}:${stops[stops.length - 1]![1]}}`);
  return `@keyframes ${name}{${out.join("")}}`;
}

// The CSS that fades a group of stacked pictures into each other (empty for a single picture).
// `scope` is a selector of the element that holds the pictures (they are its `img.ol-fr` children); `name` keeps the keyframe
// names of several groups on one page apart.
export function groupAnimationCss(opts: { scope: string; name?: string; holds: number[]; fadeMs: number; rounds: string }): { css: string; total: number } {
  const n = opts.holds.length;
  if (n < 2) return { css: "", total: 0 };
  const { v, total, f } = frameTimeline(opts.holds, opts.fadeMs);
  const delay = `${-Math.round(fadeRamp(f))}ms`; // the first round starts after the fade that closes a round, so picture 1 is solid at once
  const prefix = opts.name ?? "";
  let css = "";
  let rules = "";
  for (let i = 0; i < n; i++) {
    const st = frameStops(i, n, v, total, f);
    css += keyframes(`${prefix}o${i}`, "opacity", st.opacity, total) + keyframes(`${prefix}z${i}`, "z-index", st.z, total);
    rules += `${opts.scope} .ol-fr:nth-of-type(${i + 1}){animation:${prefix}o${i} ${Math.round(total)}ms linear ${delay} ${opts.rounds} both,${prefix}z${i} ${Math.round(total)}ms step-end ${delay} ${opts.rounds} both}`;
  }
  return { css: css + rules, total };
}

// Everything the picture loop banner needs in CSS for the animation.
export function frameAnimationCss(c: FrameBannerConfig): { css: string; total: number } {
  const rounds = c.loop.forever ? "infinite" : String(Math.max(1, Math.round(c.loop.times)));
  return groupAnimationCss({ scope: ".ol-frames", holds: effectiveHolds(c), fadeMs: c.fadeMs, rounds });
}

export function renderFrameBanner(c: FrameBannerConfig): string {
  const { css: anim } = frameAnimationCss(c);
  const size = c.responsive ? "width:100%;aspect-ratio:" + c.width + "/" + c.height : `width:${c.width}px;height:${c.height}px`;
  const bg = c.backgroundColor ? `background:${c.backgroundColor};` : "";
  const bgImg = c.backgroundImage ? `<div class="ol-bg" style="background:url('${escapeCssUrlInAttr(c.backgroundImage)}') center center/cover no-repeat"></div>\n` : "";
  // The pictures are the `img.ol-fr` elements, in order. (The background is a different element type: a div would break nth-of-type.)
  const imgs = c.frames.map((f, i) => `<img class="ol-fr${i === 0 ? " ol-first" : ""}" src="${escapeHtml(f.image)}" alt="" draggable="false" decoding="async">`).join("\n");
  const motion = c.respectMotion ? "@media (prefers-reduced-motion:reduce){.ol-fr{animation:none!important}.ol-fr:not(.ol-first){opacity:0!important}.ol-first{opacity:1!important;z-index:2!important}}" : "";
  const hover = c.pauseOnHover ? ".ol-frames:hover .ol-fr{animation-play-state:paused}" : "";
  return `<!DOCTYPE html>
<html lang="et">
<head>
<meta charset="UTF-8">
<title>${escapeHtml(c.campaign)}</title>
<meta name="viewport" content="${c.responsive ? "width=device-width,initial-scale=1" : `width=${c.width},user-scalable=no`}">
<script>${CLICKTAG_JS}</script>
<style>
html,body{margin:0;padding:0${c.responsive ? ";width:100%" : ""}}
body{cursor:pointer}
.ol-frames{position:relative;overflow:hidden;${size};${bg}}
.ol-bg,.ol-fr{position:absolute;left:0;top:0;width:100%;height:100%;display:block;user-select:none;-webkit-user-drag:none}
.ol-bg{z-index:0}
.ol-fr{object-fit:${c.fit === "fill" ? "fill" : c.fit};opacity:0;z-index:0;will-change:opacity;backface-visibility:hidden;transform:translateZ(0)}
.ol-first{opacity:1;z-index:2}
${anim}${hover}${motion}
</style>
</head>
<body onclick="${clickAttr(escapeJsInAttr(c.href))}">
<div class="ol-frames" role="img" aria-label="${escapeHtml(c.campaign)}">
${bgImg}${imgs}
</div>
<script type="application/json" id="ol-banner">${jsonForScript(c)}</script>
</body>
</html>
`;
}

// What is still missing before the banner can be downloaded.
export function validateFrameBanner(c: FrameBannerConfig, lang: Lang = "en"): Problem[] {
  const m = messages(lang);
  const problems: Problem[] = [];
  if (!c.campaign.trim()) problems.push({ message: m.campaign, field: "campaign" });
  if (c.frames.length < 2) problems.push({ message: m.frameMin(2, c.frames.length), field: "frames-add" });
  const bad = (n: number) => !Number.isFinite(n) || n < FRAME_SIZE_MIN || n > FRAME_SIZE_MAX;
  if (bad(c.width) || bad(c.height)) problems.push({ message: m.frameSize(FRAME_SIZE_MIN, FRAME_SIZE_MAX), field: "size-width" });
  const holds = c.frames.map((f) => f.holdMs ?? c.holdMs);
  if (holds.some((x) => !Number.isFinite(x) || x < FRAME_MIN_HOLD_MS)) problems.push({ message: m.frameHold(FRAME_MIN_HOLD_MS / 1000), field: "hold" });
  else if (!Number.isFinite(c.fadeMs) || c.fadeMs < 0 || c.fadeMs > Math.min(...holds)) problems.push({ message: m.frameFade, field: "fade" });
  if (!c.loop.forever && !(c.loop.times >= 1)) problems.push({ message: m.frameLoop, field: "loop-times" });
  if (c.href.trim() !== "" && !isUrl(c.href)) problems.push({ message: m.frameHref, field: "href" });
  if (c.backgroundColor && !/^#[0-9a-fA-F]{6}$/.test(c.backgroundColor)) problems.push({ message: m.frameBgColor, field: "bg-color" });
  return problems;
}
