import type { ArticleItem } from "@ohtuleht/templates";

export interface ParseResult {
  articles: ArticleItem[];
  skipped: number; // pieces of text that were not understood
}

function decodeEntities(s: string): string {
  const el = document.createElement("textarea");
  el.innerHTML = s;
  return el.value;
}

function fromJson(value: unknown): ArticleItem | null {
  if (!value || typeof value !== "object") return null;
  const o = value as Record<string, unknown>;
  if (typeof o.url !== "string" || typeof o.title !== "string" || typeof o.image !== "string") return null;
  return { url: o.url.trim(), title: o.title.trim(), image: o.image.trim() };
}

// Old bookmarklet output: slide div with onclick getClickTag('URL'), a background-image url and a title or header paragraph.
function fromLegacyHtml(html: string): ArticleItem[] {
  const out: ArticleItem[] = [];
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.querySelectorAll<HTMLElement>(".swiper-slide, .ol-slide").forEach((slide) => {
    const click = slide.getAttribute("onclick") ?? "";
    const url = /getClickTag\('([^']+)'\)/.exec(click)?.[1];
    const style = slide.querySelector<HTMLElement>("[style*='background-image']")?.getAttribute("style") ?? "";
    const image = /url\(\s*["']?([^"')]+)["']?\s*\)/.exec(style)?.[1];
    const title = slide.querySelector(".title, .header")?.textContent;
    if (url && image && title) out.push({ url: decodeEntities(url), image: decodeEntities(image), title: title.trim() });
  });
  return out;
}

// Accepts JSON snippets (one object, an array, or one object per line) and the old HTML slide snippets.
export function parseSnippets(text: string): ParseResult {
  const trimmed = text.trim();
  if (!trimmed) return { articles: [], skipped: 0 };

  if (trimmed.includes("<")) {
    const found = fromLegacyHtml(trimmed);
    return { articles: found, skipped: found.length ? 0 : 1 };
  }
  const articles: ArticleItem[] = [];
  let skipped = 0;
  const add = (v: unknown) => {
    const a = fromJson(v);
    if (a) articles.push(a);
    else skipped++;
  };
  try {
    const whole: unknown = JSON.parse(trimmed);
    (Array.isArray(whole) ? whole : [whole]).forEach(add);
  } catch {
    trimmed
      .split(/\r?\n/)
      .filter((l) => l.trim())
      .forEach((line) => {
        try {
          add(JSON.parse(line));
        } catch {
          skipped++;
        }
      });
  }
  return { articles, skipped };
}
