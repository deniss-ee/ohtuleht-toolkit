// Direct links. The address after the "?" says where the app is, so a link can be sent to a colleague:
//   ?section=home | content | tools | brand   (no section = home)
//   &tool=image-cropper | movie-banner | article-scraper | picture-converter | email-signature       (with section=tools)
//   &tab=colours | logos | fonts | eye                     (with section=brand)
//   &make=header-bar | articles-1250x400 | articles-mobile | image-slider-1250x400 | image-slider-600x500   (with section=content: opens a new banner of that type)
//   &topic=<topic id>&step=<n>   (with section=guide: opens that topic and scrolls to its step n)
//   &lang=en | et
import { nav, type Lang, type PageId, type ToolInfo } from "@/content";
import { TOPICS } from "@/guide-content";

export type BrandTab = "colours" | "logos" | "fonts" | "eye";
// Only pages that are switched on (see nav in content) can be opened by a link.
export const PAGES: PageId[] = nav.filter((n) => n.ready).map((n) => n.id);
export const TOOL_IDS: ToolInfo["id"][] = ["image-cropper", "movie-banner", "article-scraper", "picture-converter", "email-signature", "utm-builder"];
export const MAKE_IDS = ["header-bar", "articles-1250x400", "articles-mobile", "image-slider-1250x400", "image-slider-600x500", "frame-banner"];

export interface Route {
  page: PageId | null; // null = not in the link (the home page opens)
  tool: ToolInfo["id"] | null;
  tab: BrandTab;
  make: string | null;
  topic: string | null;
  step: number | null;
  lang: Lang | null;
}

const pick = <T extends string>(value: string | null, allowed: readonly T[]): T | null => (allowed.includes(value as T) ? (value as T) : null);

export function parseRoute(search: string): Route {
  const q = new URLSearchParams(search);
  const tool = pick(q.get("tool"), TOOL_IDS);
  const tab = pick(q.get("tab"), ["colours", "logos", "fonts", "eye"] as const);
  const make = pick(q.get("make"), MAKE_IDS);
  // A link with only a tool, a tab or a type also says which section it means.
  const page = pick(q.get("section"), PAGES) ?? (tool ? "tools" : tab ? "brand" : make ? "content" : null);
  return { page, tool: page === "tools" ? tool : null, tab: tab ?? "colours", make: page === "content" ? make : null, topic: page === "guide" ? pick(q.get("topic"), TOPICS.map((x) => x.id)) : null, step: page === "guide" && Number.isInteger(Number(q.get("step"))) && Number(q.get("step")) > 0 ? Number(q.get("step")) : null, lang: pick(q.get("lang"), ["en", "et"] as const) };
}

// Address for the current place. Order is always the same, so equal places give equal addresses.
export function buildSearch(page: PageId, tool: Route["tool"], tab: BrandTab, lang: Lang, topic: string | null = null, step: number | null = null): string {
  const q = new URLSearchParams();
  if (page !== "home") q.set("section", page);
  if (page === "tools" && tool) q.set("tool", tool);
  if (page === "brand") q.set("tab", tab);
  if (page === "guide" && topic) q.set("topic", topic);
  if (page === "guide" && topic && step) q.set("step", String(step));
  q.set("lang", lang);
  return `?${q.toString()}`;
}
