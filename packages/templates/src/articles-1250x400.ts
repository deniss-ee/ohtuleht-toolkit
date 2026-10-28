// Template: articles 1250x400. Rebuild of the Kultuurisügis banner without Swiper.
import { clickAttr, CLICKTAG_JS } from "./clicktag.ts";
import { escapeCssUrlInAttr, escapeHtml, escapeJsInAttr, jsonForScript } from "./escape.ts";
import type { ArticlesBannerConfig, RuntimeAssets, ThemeColors } from "./types.ts";

const VISIBLE = 4;
const GAP = 16;

const FONTS_URL = "https://fonts.googleapis.com/css2?family=Fira+Sans+Condensed:wght@700&family=Roboto:wght@700&display=swap";

// White chevrons; the square behind them takes the campaign badge colour.
const ARROW_LEFT = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 42 42'%3E%3Cpath fill='%23fff' d='M17.2 21l9.2 9.2-2.8 2.8-12-12 12-12 2.8 2.8z'/%3E%3C/svg%3E";
const ARROW_RIGHT = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 42 42'%3E%3Cpath fill='%23fff' d='M24.8 21l-9.2-9.2 2.8-2.8 12 12-12 12-2.8-2.8z'/%3E%3C/svg%3E";

function themeVars(t: ThemeColors): string {
  return `--bg:${t.bg};--text:${t.text};--badge:${t.badge};--hover:${t.hover};--header-bg:${t.headerBg}`;
}

function css(config: ArticlesBannerConfig): string {
  const header =
    config.header.type === "image"
      ? `background:url("${config.header.src}") center/contain no-repeat` // image only: no colour behind its rounded corners
      : "background:var(--header-bg)";
  return (
    `:root{${themeVars(config.theme.light)};color-scheme:light dark}` +
    `@media(prefers-color-scheme:dark){:root{${themeVars(config.theme.dark)}}}` +
    "*{box-sizing:border-box;margin:0;padding:0}" +
    // Fixed-size ad: never narrower than 1248 px, no matter the window.
    'html,body{min-width:1248px;overflow:hidden;background:var(--bg);font-family:"Roboto",sans-serif;-webkit-font-smoothing:antialiased}' +
    // Fills the 1250 px ad frame; never narrower than 1248 px.
    ".banner{position:relative;width:100%;min-width:1248px;max-width:1250px}" +
    `.header{display:block;height:46px;margin-bottom:${GAP}px;${header};cursor:pointer}` +
    ".article{width:100%}" +
    ".img{position:relative;height:215px;border-radius:6px;background-position:center;background-size:cover}" +
    ".badge{position:absolute;bottom:-2px;left:0;padding:7px 5px 0 0;background:var(--bg);color:var(--badge);font-size:12px;font-weight:700;line-height:1;text-transform:capitalize}" +
    '.title{padding:8px 0;color:var(--text);font:700 20px/24px "Fira Sans Condensed",sans-serif;overflow-wrap:break-word;transition:color .2s}' +
    ".ol-slide:hover .title{color:var(--hover)}" +
    ".ol-slide:focus-visible,.header:focus-visible{outline:2px solid var(--hover);outline-offset:2px}" +
    ".ol-prev,.ol-next{position:absolute;top:82px;z-index:2;box-sizing:content-box;width:42px;height:42px;padding:0;border:4px solid var(--bg);background:var(--badge) center/cover no-repeat;cursor:pointer}" +
    `.ol-prev{left:0;border-left:0;background-image:url("${ARROW_LEFT}")}` +
    `.ol-next{right:0;border-right:0;background-image:url("${ARROW_RIGHT}")}`
  );
}

function slide(a: ArticlesBannerConfig["articles"][number], defaultBadge: string): string {
  // Each article may carry its own badge text and colour (set when the snippet is made); otherwise the campaign default.
  const badge = a.badge?.trim() || defaultBadge;
  const color = a.badgeColor ? ` style="color:${escapeHtml(a.badgeColor)}"` : "";
  const open = clickAttr(escapeJsInAttr(a.url));
  return (
    `<div class="ol-slide" role="link" tabindex="0" onclick="${open}">` +
    `<div class="article"><div class="img" style="background-image:url(&quot;${escapeCssUrlInAttr(a.image)}&quot;)">` +
    `<p class="badge"${color}>${escapeHtml(badge)}</p></div>` +
    `<p class="title">${escapeHtml(a.title)}</p></div></div>`
  );
}

export function renderArticles1250x400(config: ArticlesBannerConfig, assets: RuntimeAssets): string {
  const b = config.behavior;
  const delay = b.autoplay ? b.delayMs : 0;
  const header = `<a class="header" role="link" tabindex="0" aria-label="${escapeHtml(config.campaign)}" onclick="${clickAttr(escapeJsInAttr(config.header.href))}"></a>`;
  return (
    '<!doctype html><html lang="et"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    `<title>${escapeHtml(config.campaign)} 1250x400</title>` +
    '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' +
    // Fonts must never block the first paint: load as "print" media, then switch to "all" once loaded.
    `<link rel="stylesheet" href="${FONTS_URL}" media="print" onload="this.media='all'">` +
    `<style>${assets.sliderCss}${css(config)}</style></head><body>` +
    `<div class="banner">${header}` +
    `<div class="ol-slider" data-visible="${VISIBLE}" data-gap="${GAP}" data-delay="${delay}" data-speed="${b.speedMs}" data-shuffle="${b.shuffle ? 1 : 0}" data-loop="${b.loop ? 1 : 0}">` +
    '<button class="ol-prev" aria-label="Previous"></button>' +
    `<div class="ol-viewport"><div class="ol-track">${config.articles.map((a) => slide(a, config.badge)).join("")}</div></div>` +
    '<button class="ol-next" aria-label="Next"></button></div></div>' +
    `<script type="application/json" id="ol-banner">${jsonForScript(config)}</script>` +
    `<script>${CLICKTAG_JS}</script><script>${assets.runtimeJs}</script></body></html>`
  );
}
