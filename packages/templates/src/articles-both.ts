// Template: one articles banner for desktop and mobile (docs/ONE-ARTICLES-BANNER.md).
// Both layouts are in the page; the width of the frame picks one. The desktop banner is never narrower than 1248 px
// and a phone is far narrower, so 1248 px is the switch. Each layout keeps its own picture sizes; a hidden layout's
// pictures are CSS backgrounds that the browser does not download. The slider script is shared and re-measures
// a slider when it becomes visible.
import { CLICKTAG_JS } from "./clicktag.ts";
import { escapeHtml, jsonForScript } from "./escape.ts";
import { desktopBody, desktopConfig, desktopCss, FONTS_URL } from "./articles-1250x400.ts";
import { mobileBody, mobileCss, MOBILE_FONTS_URL } from "./articles-mobile.ts";
import type { ArticlesBannerConfig, RuntimeAssets } from "./types.ts";

export const BOTH_BREAKPOINT = 1248;

// Splits a stylesheet into its top-level rules: [prelude, body] pairs (an @media rule keeps its inner rules as the body).
function rules(css: string): [string, string][] {
  const out: [string, string][] = [];
  let i = 0;
  while (i < css.length) {
    const open = css.indexOf("{", i);
    if (open < 0) break;
    let depth = 1;
    let j = open + 1;
    for (; j < css.length && depth > 0; j++) {
      if (css[j] === "{") depth++;
      else if (css[j] === "}") depth--;
    }
    out.push([css.slice(i, open).trim(), css.slice(open + 1, j - 1)]);
    i = j;
  }
  return out;
}

// The stylesheet of one layout, made to apply only inside `scope` (".d" or ".m").
// :root (the colours) becomes the scope itself; the page rules (html, body, *) are left out and written once for the page.
export function scopeCss(css: string, scope: string): string {
  return rules(css)
    .map(([prelude, body]) => {
      if (prelude.startsWith("@media")) return `${prelude}{${scopeCss(body, scope)}}`;
      const selectors = prelude
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s !== "*" && s !== "html" && s !== "body")
        .map((s) => (s === ":root" ? scope : `${scope} ${s}`));
      return selectors.length ? `${selectors.join(",")}{${body}}` : "";
    })
    .join("");
}

// The page: each layout fills the frame with its own background; only one is shown.
const PAGE_CSS =
  "*{box-sizing:border-box;margin:0;padding:0}" +
  ":root{color-scheme:light dark}html,body{overflow:hidden;-webkit-font-smoothing:antialiased}" +
  // Desktop (as its own banner): never narrower than 1248 px, Roboto for the labels.
  `.d{display:none;min-width:${BOTH_BREAKPOINT}px;min-height:100vh;background:var(--bg);font-family:"Roboto",sans-serif}` +
  ".d .banner{position:relative;width:100%;min-width:1248px;max-width:1250px}" +
  // Mobile (as its own banner): 8 px side margins, the banner in the middle of the height.
  '.m{display:flex;align-items:center;min-width:320px;min-height:100vh;padding:0 8px;background:var(--bg);font-family:"Fira Sans Condensed",sans-serif}' +
  ".m .banner{width:100%}" +
  `@media(min-width:${BOTH_BREAKPOINT}px){.d{display:block}.m{display:none}}`;

// `desktop` and `mobile` are the same campaign as each size would have it (dark background, own pictures); see switchFormat in the app.
export function renderArticlesBoth(desktop: ArticlesBannerConfig, mobile: ArticlesBannerConfig, assets: RuntimeAssets): string {
  const d = desktopConfig(desktop);
  return (
    '<!doctype html><html lang="et"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    `<title>${escapeHtml(d.campaign)} desktop + mobile</title>` +
    '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' +
    `<link rel="stylesheet" href="${FONTS_URL}" media="print" onload="this.media='all'">` +
    `<link rel="stylesheet" href="${MOBILE_FONTS_URL}" media="print" onload="this.media='all'">` +
    `<style>${assets.sliderCss}${PAGE_CSS}${scopeCss(desktopCss(d), ".d")}${scopeCss(mobileCss(mobile), ".m")}</style></head><body>` +
    `<div class="d">${desktopBody(d)}</div><div class="m">${mobileBody(mobile)}</div>` +
    // The settings of the desktop size are kept, so the zip opens in the editor like a desktop banner (the switch at the top gives the mobile one).
    `<script type="application/json" id="ol-banner">${jsonForScript(d)}</script>` +
    `<script>${CLICKTAG_JS}</script><script>${assets.runtimeJs}</script></body></html>`
  );
}
