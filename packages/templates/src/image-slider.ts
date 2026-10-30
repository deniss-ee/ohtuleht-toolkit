// Template: image slider 1250x400. A background picture (clickable) with a slider of pictures on it, no libraries.
// Built after the Dacia/Renault banners: slides 300x250, three visible, arrows outside the slider.
import { clickAttr, CLICKTAG_JS } from "./clicktag.ts";
import { escapeCssUrlInAttr, escapeHtml, escapeJsInAttr, jsonForScript } from "./escape.ts";
import type { ImageSliderConfig, RuntimeAssets } from "./types.ts";

export const SLIDER_CANVAS = { width: 1250, height: 400 };
const ARROW = 36;
const ARROW_OUT = 46; // arrows sit this far outside the slider when there is room

// Semi-transparent dark square with a white chevron (same look as the old banners).
const arrow = (path: string) => `data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 42 42'><path fill='#000' fill-opacity='.333' d='M38 42H4a4 4 0 0 1-4-4V4a4 4 0 0 1 4-4h34a4 4 0 0 1 4 4v34a4 4 0 0 1-4 4z'/><path fill='#fff' d='${path}'/></svg>`)}`;
const ARROW_LEFT = arrow("M17.2 21l9.2 9.2-2.8 2.8-12-12 12-12 2.8 2.8z");
const ARROW_RIGHT = arrow("M24.8 21l-9.2-9.2 2.8-2.8 12 12-12 12-2.8-2.8z");

// Link of one slide: its own, or the shared one. Empty means "the link set in the ad system".
export const slideHref = (config: ImageSliderConfig, i: number) => (config.linkMode === "shared" ? config.sharedHref : (config.slides[i]?.href ?? "")).trim();

function css(config: ImageSliderConfig): string {
  const { x, y, width, height } = config.layout;
  // Arrows go outside the slider when there is room on both sides, otherwise on top of its edges.
  const outside = x >= ARROW_OUT && SLIDER_CANVAS.width - (x + width) >= ARROW_OUT;
  const left = outside ? -ARROW_OUT : 6;
  return (
    "*{box-sizing:border-box;margin:0;padding:0}" +
    "html,body{overflow:hidden;background:#000}" +
    `.banner{position:relative;width:${SLIDER_CANVAS.width}px;height:${SLIDER_CANVAS.height}px;overflow:hidden;background-position:center;background-size:cover;cursor:${config.background.clickable ? "pointer" : "default"}}` +
    `.ol-slider{position:absolute;left:${x}px;top:${y}px;width:${width}px;height:${height}px;cursor:default}` +
    ".ol-viewport,.ol-track{height:100%}" +
    ".ol-slide{height:100%;cursor:pointer}" +
    ".ol-slide img{display:block;width:100%;height:100%;object-fit:cover;border-radius:4px;pointer-events:none;-webkit-user-drag:none}" +
    `.ol-prev,.ol-next{position:absolute;top:50%;z-index:2;width:${ARROW}px;height:${ARROW}px;margin-top:-${ARROW / 2}px;padding:0;border:0;border-radius:4px;background:center/cover no-repeat;cursor:pointer;opacity:.6;transition:opacity .15s}` +
    ".ol-prev:hover,.ol-next:hover{opacity:1}" +
    ".ol-prev:disabled,.ol-next:disabled{opacity:.2;cursor:default}" +
    ".ol-prev:focus-visible,.ol-next:focus-visible,.ol-slide:focus-visible,.banner:focus-visible{outline:2px solid #fff;outline-offset:2px}" +
    `.ol-prev{left:${left}px;background-image:url("${ARROW_LEFT}")}` +
    `.ol-next{right:${left}px;background-image:url("${ARROW_RIGHT}")}`
  );
}

export function renderImageSlider(config: ImageSliderConfig, assets: RuntimeAssets): string {
  const b = config.behavior;
  const delay = b.autoplay ? b.delayMs : 0;
  const slides = config.slides
    .map((s, i) => `<div class="ol-slide" role="link" tabindex="0" onclick="${clickAttr(escapeJsInAttr(slideHref(config, i)))}"><img src="${escapeHtml(s.image)}" alt="" draggable="false"></div>`)
    .join("");
  const arrows = config.arrows ? '<button class="ol-prev" aria-label="Previous"></button><button class="ol-next" aria-label="Next"></button>' : "";
  const bg = `background-image:url(&quot;${escapeCssUrlInAttr(config.background.src)}&quot;)`;
  const open = config.background.clickable ? ` role="link" tabindex="0" onclick="${clickAttr(escapeJsInAttr(config.background.href.trim()))}"` : "";
  return (
    '<!doctype html><html lang="et"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    `<title>${escapeHtml(config.campaign)} 1250x400</title>` +
    `<style>${assets.sliderCss}${css(config)}</style></head><body>` +
    `<div class="banner" style="${bg}"${open}>` +
    // A click on the slider (also between the slides) must not reach the background link.
    `<div class="ol-slider" onclick="event.stopPropagation()" data-visible="${config.layout.visible}" data-gap="${config.layout.gap}" data-delay="${delay}" data-speed="${b.speedMs}" data-shuffle="${b.shuffle ? 1 : 0}" data-loop="${b.loop ? 1 : 0}">` +
    `${arrows}<div class="ol-viewport"><div class="ol-track">${slides}</div></div></div></div>` +
    `<script type="application/json" id="ol-banner">${jsonForScript(config)}</script>` +
    `<script>${CLICKTAG_JS}</script><script>${assets.runtimeJs}</script></body></html>`
  );
}
