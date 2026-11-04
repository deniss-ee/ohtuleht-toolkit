// Responsive banner, always 200 px high. Its width follows its container between 320 and 700 px.
// Two versions of the content: the SMALL one is made 540x200 (shown while the banner is 540 px wide or less, safe zone 320 in the
// middle) and the LARGE one 700x200 (shown above 540, safe zone 540 in the middle). Each version is a video (muted, looping, no
// controls) or pictures (one = still, two or more = they fade into each other). The version is chosen by the banner's own width,
// so it also works in a narrow column or an iframe. Pictures are made at 1x or 2x (for example 1080x400 for the small one).
import { clickAttr, CLICKTAG_JS } from "./clicktag.ts";
import { escapeHtml, escapeJsInAttr, jsonForScript } from "./escape.ts";
import { effectiveHolds, FRAME_MIN_HOLD_MS, groupAnimationCss } from "./frame-banner.ts";
import { messages, type Lang } from "./messages.ts";
import type { Problem } from "./validate.ts";

export const RB = {
  height: 200,
  minWidth: 320,
  maxWidth: 700,
  breakpoint: 540, // the banner is "small" up to and including this width
  small: { width: 540, height: 200, safe: 320 },
  large: { width: 700, height: 200, safe: 540 },
} as const;

export type RbKind = "video" | "pictures";

export interface RbVersion {
  kind: RbKind;
  video: string; // file name inside the zip
  poster: string; // file name of the still shown until the video plays (made from the video's first frame)
  pictures: string[]; // file names inside the zip
}

export interface ResponsiveBannerConfig {
  v: 1;
  kind: "responsive-banner";
  format: "responsive-banner";
  campaign: string; // also the spoken label of the banner
  small: RbVersion;
  large: RbVersion;
  holdMs: number; // pictures: how long one stays fully shown
  fadeMs: number; // pictures: the soft change between two (0 = a plain cut)
  href: string; // optional; empty = the ad server's own click address
}

export const emptyVersion = (): RbVersion => ({ kind: "video", video: "", poster: "", pictures: [] });
export const hasContent = (v: RbVersion) => (v.kind === "video" ? !!v.video : v.pictures.length > 0);

const isUrl = (s: string) => /^https?:\/\//.test(s.trim());

function group(name: "small" | "large", v: RbVersion): string {
  if (!hasContent(v)) return "";
  if (v.kind === "video") {
    // The file is only fetched when this version is shown (the script sets src from data-src).
    const poster = v.poster ? ` poster="${escapeHtml(v.poster)}"` : "";
    return `<div class="rb-g" data-g="${name}"><video muted loop playsinline preload="auto" aria-hidden="true" tabindex="-1"${poster} data-src="${escapeHtml(v.video)}"></video></div>`;
  }
  const imgs = v.pictures.map((p, i) => `<img class="ol-fr${i === 0 ? " ol-first" : ""}" alt="" draggable="false" decoding="async" data-src="${escapeHtml(p)}">`).join("");
  return `<div class="rb-g" data-g="${name}">${imgs}</div>`;
}

export function renderResponsiveBanner(c: ResponsiveBannerConfig): string {
  const holds = (v: RbVersion) => effectiveHolds({ frames: v.pictures.map((image) => ({ image })), holdMs: c.holdMs, fadeMs: c.fadeMs });
  let anim = "";
  for (const name of ["small", "large"] as const) {
    const v = c[name];
    if (v.kind === "pictures" && v.pictures.length > 1) anim += groupAnimationCss({ scope: `.rb-g[data-g="${name}"]`, name: name[0]!, holds: holds(v), fadeMs: c.fadeMs, rounds: "infinite" }).css;
  }
  const single = (name: "small" | "large") => (c[name].kind === "pictures" && c[name].pictures.length === 1 ? `.rb-g[data-g="${name}"] .ol-fr{opacity:1;z-index:2}` : "");
  return `<!DOCTYPE html>
<html lang="et">
<head>
<meta charset="UTF-8">
<title>${escapeHtml(c.campaign)}</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<script>${CLICKTAG_JS}</script>
<style>
*{box-sizing:border-box}
html,body{margin:0;padding:0}
body{cursor:pointer}
.rb{position:relative;display:block;width:100%;min-width:${RB.minWidth}px;max-width:${RB.maxWidth}px;height:${RB.height}px;margin:0 auto;overflow:hidden;background:#000}
.rb-g{display:none;position:absolute;left:0;top:0;width:100%;height:100%}
.rb[data-v="small"] .rb-g[data-g="small"],.rb[data-v="large"] .rb-g[data-g="large"]{display:block}
.rb video,.rb img{position:absolute;left:0;top:0;width:100%;height:100%;display:block;object-fit:cover;object-position:center;pointer-events:none;user-select:none;-webkit-user-drag:none}
.rb img{opacity:0;z-index:0;will-change:opacity;backface-visibility:hidden;transform:translateZ(0)}
.ol-first{opacity:1;z-index:2}
${single("small")}${single("large")}
${anim}
</style>
</head>
<body onclick="${clickAttr(escapeJsInAttr(c.href))}">
<div class="rb" id="rb" role="img" aria-label="${escapeHtml(c.campaign)}">
${group("small", c.small)}
${group("large", c.large)}
</div>
<script>
(function(){var rb=document.getElementById('rb'),BP=${RB.breakpoint},cur='';
function g(n){return rb.querySelector('[data-g="'+n+'"]')}
function show(n){if(n===cur)return;var old=cur&&g(cur);if(old){var ov=old.querySelector('video');if(ov)ov.pause()}
cur=n;rb.setAttribute('data-v',n);var el=g(n),v=el.querySelector('video');
if(v){if(!v.getAttribute('src'))v.src=v.getAttribute('data-src');var p=v.play();if(p&&p.catch)p.catch(function(){})}
var im=el.querySelectorAll('img[data-src]');for(var i=0;i<im.length;i++){if(!im[i].getAttribute('src'))im[i].src=im[i].getAttribute('data-src')}}
function pick(w){var want=Math.round(w)<=BP?'small':'large';if(!g(want))want=want==='small'?'large':'small';if(g(want))show(want)}
pick(rb.getBoundingClientRect().width);
if(window.ResizeObserver)new ResizeObserver(function(e){pick(e[0].contentRect.width)}).observe(rb)})();
</script>
<script type="application/json" id="ol-banner">${jsonForScript(c)}</script>
</body>
</html>
`;
}

// A picture is right when it has the shape of the version (the size, or twice the size).
export function pictureFits(version: "small" | "large", width: number, height: number): boolean {
  const s = RB[version];
  return (width === s.width && height === s.height) || (width === s.width * 2 && height === s.height * 2);
}

// What is still missing before the banner can be downloaded.
export function validateResponsiveBanner(c: ResponsiveBannerConfig, lang: Lang = "en"): Problem[] {
  const m = messages(lang);
  const problems: Problem[] = [];
  if (!c.campaign.trim()) problems.push({ message: m.campaign, field: "campaign" });
  // One version may stay empty: the other one is then used at every width.
  if (!hasContent(c.small) && !hasContent(c.large)) problems.push({ message: m.rbNothing, field: "rb-small-add" });
  const multi = [c.small, c.large].some((v) => v.kind === "pictures" && v.pictures.length > 1);
  if (multi) {
    if (!Number.isFinite(c.holdMs) || c.holdMs < FRAME_MIN_HOLD_MS) problems.push({ message: m.frameHold(FRAME_MIN_HOLD_MS / 1000), field: "hold" });
    else if (!Number.isFinite(c.fadeMs) || c.fadeMs < 0 || c.fadeMs > c.holdMs) problems.push({ message: m.frameFade, field: "fade" });
  }
  if (c.href.trim() !== "" && !isUrl(c.href)) problems.push({ message: m.frameHref, field: "href" });
  return problems;
}

