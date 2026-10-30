// Template: articles, mobile. Design: Figma "Õhtuleht - Brand hub", frame "Mobile Content".
// The banner fills the width of the page (8 px side margins). Everything inside has a fixed size:
// header 46 px, cards 267x400 with 8 px between, dots 8 px. A wider phone shows more of the next card.
import { clickAttr, CLICKTAG_JS } from "./clicktag.ts";
import { escapeCssUrlInAttr, escapeHtml, escapeJsInAttr, jsonForScript } from "./escape.ts";
import { resolveTheme, contrast, onColor } from "./colors.ts";
import { headerCss, headerHtml } from "./articles-1250x400.ts";
import type { ArticlesBannerConfig, ResolvedTheme, RuntimeAssets } from "./types.ts";

const CARD_W = 267;
const CARD_H = 400;
const GAP = 8;

// Mobile fonts: titles Fira Sans Condensed, labels Inter (Figma).
const FONTS_URL = "https://fonts.googleapis.com/css2?family=Fira+Sans+Condensed:wght@700&family=Inter:wght@700&display=swap";

// ohtuleht.ee picture sizes: /webp/54/ suits the desktop cards, /webp/48/ is the cropped, higher-resolution version for phones.
// Applied when the banner is written, so the form keeps the address the person pasted.
const MOBILE_IMAGE = "/webp/48/";
const forMobile = (url: string) => url.replace(/\/webp\/\d+\//, MOBILE_IMAGE);

// Dots are black on a light background and white on a dark one.
const dotColor = (bg: string) => (contrast(bg, "#000000") >= contrast(bg, "#ffffff") ? "#000000" : "#ffffff");

// Label colour: the main colour, unless the theme sets its own. The text on it follows the brand rule (white on red 600).
function themeVars(t: ResolvedTheme, chip: string): string {
  return `--bg:${t.bg};--dot:${dotColor(t.bg)};--header-bg:${t.headerBg};--header-text:${t.headerText};--chip:${chip};--chip-text:${onColor(chip)}`;
}

function css(config: ArticlesBannerConfig): string {
  return (
    `:root{${themeVars(resolveTheme(config, "light"), config.theme.light.badge ?? config.primary)};color-scheme:light dark}` +
    `@media(prefers-color-scheme:dark){:root{${themeVars(resolveTheme(config, "dark"), config.theme.dark.badge ?? config.primary)}}}` +
    "*{box-sizing:border-box;margin:0;padding:0}" +
    // The page is as wide as the phone; the banner sits in the middle of the height.
    'html,body{min-width:320px;overflow:hidden;background:var(--bg);font-family:"Fira Sans Condensed",sans-serif;-webkit-font-smoothing:antialiased}' +
    "body{display:flex;align-items:center;min-height:100vh;padding:0 8px}" +
    ".banner{width:100%}" +
    headerCss(config) +
    ".header{margin-bottom:16px}" +
    `.ol-slide{flex:0 0 ${CARD_W}px;width:${CARD_W}px}` +
    `.card{position:relative;display:flex;align-items:flex-end;height:${CARD_H}px;border-radius:8px;overflow:hidden;background:#000 center/cover no-repeat}` +
    // Picture fades to black behind the title (Figma: 216 px gradient, text 16 px from the left, 36 px from the right, 20 px from the bottom).
    ".shade{display:flex;flex-direction:column;align-items:flex-start;justify-content:flex-end;gap:4px;width:100%;min-height:216px;padding:0 36px 20px 16px;background:linear-gradient(to bottom,rgba(0,0,0,0),#000)}" +
    // Category label (Figma "Article Label"): chip on the main colour, Inter Bold 12/15, uppercase, 4 px radius, 4 x 6 px padding.
    '.badge{padding:4px 6px;border-radius:4px;background:var(--chip);color:var(--chip-text);font:700 12px/15px "Inter",sans-serif;text-transform:uppercase;white-space:nowrap}' +
    ".title{min-width:0;display:-webkit-box;overflow:hidden;color:#fff;font-size:18px;font-weight:700;line-height:23px;overflow-wrap:break-word;-webkit-box-orient:vertical;-webkit-line-clamp:6}" +
    ".ol-slide:focus-visible,.header:focus-visible{outline:2px solid var(--header-bg);outline-offset:2px}" +
    ".ol-dots{display:flex;justify-content:center;gap:8px;margin-top:28px}" +
    // 8 px dots as drawn, with a 16 px touch area around each.
    ".ol-dot{position:relative;width:8px;height:8px;padding:0;border:0;border-radius:50%;background:var(--dot);opacity:.3;cursor:pointer}" +
    ".ol-dot::after{content:'';position:absolute;inset:-4px}" +
    ".ol-dot.ol-on{opacity:1}"
  );
}

function slide(a: ArticlesBannerConfig["articles"][number], defaultBadge: string): string {
  // Same rule as the desktop banner: the article's own label text and colour, else the campaign's.
  const badge = a.badge?.trim() || defaultBadge;
  const color = a.badgeColor ? ` style="background:${escapeHtml(a.badgeColor)};color:${onColor(a.badgeColor)}"` : "";
  return (
    `<div class="ol-slide" role="link" tabindex="0" onclick="${clickAttr(escapeJsInAttr(a.url))}">` +
    `<div class="card" style="background-image:url(&quot;${escapeCssUrlInAttr(forMobile(a.image))}&quot;)">` +
    `<div class="shade">${badge ? `<p class="badge"${color}>${escapeHtml(badge)}</p>` : ""}<p class="title">${escapeHtml(a.title)}</p></div></div></div>`
  );
}

export function renderArticlesMobile(config: ArticlesBannerConfig, assets: RuntimeAssets): string {
  const b = config.behavior;
  const delay = b.autoplay ? b.delayMs : 0;
  const dots = config.articles.map((_, i) => `<button class="ol-dot" aria-label="Article ${i + 1}"></button>`).join("");
  return (
    '<!doctype html><html lang="et"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    `<title>${escapeHtml(config.campaign)} mobile</title>` +
    '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' +
    `<link rel="stylesheet" href="${FONTS_URL}" media="print" onload="this.media='all'">` +
    `<style>${assets.sliderCss}${css(config)}</style></head><body>` +
    `<div class="banner">${headerHtml(config)}` +
    `<div class="ol-slider" data-visible="1" data-gap="${GAP}" data-delay="${delay}" data-speed="${b.speedMs}" data-shuffle="${b.shuffle ? 1 : 0}" data-loop="${b.loop ? 1 : 0}">` +
    `<div class="ol-viewport"><div class="ol-track">${config.articles.map((a) => slide(a, config.badge)).join("")}</div></div>` +
    `<div class="ol-dots">${dots}</div></div></div>` +
    `<script type="application/json" id="ol-banner">${jsonForScript(config)}</script>` +
    `<script>${CLICKTAG_JS}</script><script>${assets.runtimeJs}</script></body></html>`
  );
}
