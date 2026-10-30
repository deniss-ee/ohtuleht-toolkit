// Template: image slider (client banners). A background picture (clickable) with a slider of pictures on it, no libraries.
// 1250x400: fixed size, built after the Dacia/Renault banners (slides 300x250, three visible, arrows outside the slider).
// 600x500: the phone banner fills the page width and keeps the 6:5 shape; every size inside scales with it (container units).
// It has no background: the pictures fill the whole banner.
import { arrowCss, ARROW_DARK, ARROW_SIZE } from "./arrows.ts";
import { clickAttr, CLICKTAG_JS } from "./clicktag.ts";
import { escapeCssUrlInAttr, escapeHtml, escapeJsInAttr, jsonForScript } from "./escape.ts";
import type { ImageSliderConfig, RuntimeAssets, SliderLayout, SliderView } from "./types.ts";

export const SLIDER_CANVAS = { width: 1250, height: 400 };
export const SLIDER_CANVAS_MOBILE = { width: 600, height: 500 };
const ARROW_OUT = 46; // arrows sit this far outside the slider when there is room

// Link of one slide: its own, or the shared one. Empty means "the link set in the ad system".
export const slideHref = (config: ImageSliderConfig, i: number) => (config.linkMode === "shared" ? config.sharedHref : (config.slides[i]?.href ?? "")).trim();

export const isMobile = (config: ImageSliderConfig) => config.format === "image-slider-600x500";
// On the phone the pictures always fill the whole banner, one at a time.
export const SLIDER_MOBILE_LAYOUT: SliderLayout = { x: 0, y: 0, width: 600, height: 500, gap: 0, visible: 1 };
export const sliderView = (config: ImageSliderConfig): SliderView => (isMobile(config) ? { ...config.mobile, layout: SLIDER_MOBILE_LAYOUT } : config.desktop);

function css(config: ImageSliderConfig): string {
  const view = sliderView(config);
  const mobile = isMobile(config);
  const canvas = mobile ? SLIDER_CANVAS_MOBILE : SLIDER_CANVAS;
  const { x, y, width, height } = view.layout;
  // Desktop sizes are px. Mobile sizes are a share of the banner width (1/6 cqw per px of the 600 px canvas), so everything scales together.
  const u = (v: number) => (mobile ? `${+(v / 6).toFixed(3)}cqw` : `${v}px`);
  // Arrows go outside the slider when there is room on both sides, otherwise on top of its edges.
  const outside = x >= ARROW_OUT && canvas.width - (x + width) >= ARROW_OUT;
  const left = outside ? -ARROW_OUT : 6;
  const full = width >= canvas.width && height >= canvas.height; // a picture over the whole banner has square corners
  const arrowSize = mobile ? `max(${u(ARROW_SIZE)},30px)` : `${ARROW_SIZE}px`;
  const shell = mobile ? `width:100%;aspect-ratio:6/5;container-type:inline-size` : `width:${canvas.width}px;height:${canvas.height}px`;
  return (
    "*{box-sizing:border-box;margin:0;padding:0}" +
    `html,body{${mobile ? "min-width:300px;" : ""}overflow:hidden;background:#000}` +
    `.banner{position:relative;${shell};overflow:hidden;background-position:center;background-size:cover;cursor:${!mobile && config.backgroundLink.clickable ? "pointer" : "default"}}` +
    `.ol-slider{position:absolute;left:${u(x)};top:${u(y)};width:${u(width)};height:${u(height)};cursor:default}` +
    ".ol-viewport,.ol-track{height:100%}" +
    ".ol-slide{height:100%;cursor:pointer}" +
    `.ol-slide img{display:block;width:100%;height:100%;object-fit:cover;border-radius:${full ? "0" : mobile ? "1.2cqw" : "4px"};pointer-events:none;-webkit-user-drag:none}` +
    arrowCss(ARROW_DARK, arrowSize) +
    `.ol-prev,.ol-next{top:50%;margin-top:calc(${arrowSize} / -2)}` +
    ".ol-slide:focus-visible,.banner:focus-visible{outline:2px solid #fff;outline-offset:2px}" +
    `.ol-prev{left:${u(left)}}` +
    `.ol-next{right:${u(left)}}`
  );
}

export function renderImageSlider(config: ImageSliderConfig, assets: RuntimeAssets): string {
  const b = config.behavior;
  const view = sliderView(config);
  const mobile = isMobile(config);
  const delay = b.autoplay ? b.delayMs : 0;
  const effect = view.effect;
  const visible = effect === "cube" ? 1 : view.layout.visible;
  const gap = mobile ? ` data-gap-css="${+(view.layout.gap / 6).toFixed(3)}cqw"` : "";
  const slides = config.slides
    .map((s, i) => `<div class="ol-slide" role="link" tabindex="0" onclick="${clickAttr(escapeJsInAttr(slideHref(config, i)))}"><img src="${escapeHtml(s.image)}" alt="" draggable="false"></div>`)
    .join("");
  const arrows = view.arrows ? '<button class="ol-prev" aria-label="Previous"></button><button class="ol-next" aria-label="Next"></button>' : "";
  // The phone banner has no background picture and no background link.
  const bg = mobile ? "" : ` style="background-image:url(&quot;${escapeCssUrlInAttr(config.background)}&quot;)"`;
  const open = !mobile && config.backgroundLink.clickable ? ` role="link" tabindex="0" onclick="${clickAttr(escapeJsInAttr(config.backgroundLink.href.trim()))}"` : "";
  const size = mobile ? "600x500" : "1250x400";
  return (
    '<!doctype html><html lang="et"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    `<title>${escapeHtml(config.campaign)} ${size}</title>` +
    `<style>${assets.sliderCss}${css(config)}</style></head><body>` +
    `<div class="banner"${bg}${open}>` +
    // A click on the slider (also between the slides) must not reach the background link.
    `<div class="ol-slider" onclick="event.stopPropagation()"${effect === "slide" ? "" : ` data-effect="${effect}"`} data-visible="${visible}" data-gap="${view.layout.gap}"${gap} data-delay="${delay}" data-speed="${b.speedMs}" data-shuffle="${b.shuffle ? 1 : 0}" data-loop="${b.loop ? 1 : 0}">` +
    `${arrows}<div class="ol-viewport"><div class="ol-track">${slides}</div></div></div></div>` +
    `<script type="application/json" id="ol-banner">${jsonForScript(config)}</script>` +
    `<script>${CLICKTAG_JS}</script><script>${assets.runtimeJs}</script>${effect !== "slide" && assets.fxJs ? `<script>${assets.fxJs}</script>` : ""}</body></html>`
  );
}
