// Direct links. The address after the "?" says where the app is, so a link can be sent to a colleague:
//   ?section=home | content | tools | brand   (no section = home)
//   &tool=image-cropper | movie-banner | article-scraper | picture-converter | email-signature       (with section=tools)
//   &tab=colours | logos | fonts | eye                     (with section=brand)
//   &make=header-bar | articles-1250x400 | articles-mobile | image-slider-1250x400 | image-slider-600x500   (with section=content: opens a new banner of that type)
//   &lang=en | et
import type { Lang, PageId, ToolInfo } from "@/content";

export type BrandTab = "colours" | "logos" | "fonts" | "eye";
export const PAGES: PageId[] = ["home", "content", "tools", "brand", "request", "tasks"];
export const TOOL_IDS: ToolInfo["id"][] = ["image-cropper", "movie-banner", "article-scraper", "picture-converter", "email-signature", "utm-builder"];
export const MAKE_IDS = ["header-bar", "articles-1250x400", "articles-mobile", "image-slider-1250x400", "image-slider-600x500"];

export interface Route {
  page: PageId | null; // null = not in the link (the home page opens)
  tool: ToolInfo["id"] | null;
  tab: BrandTab;
  make: string | null;
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
  return { page, tool: page === "tools" ? tool : null, tab: tab ?? "colours", make: page === "content" ? make : null, lang: pick(q.get("lang"), ["en", "et"] as const) };
}

// Address for the current place. Order is always the same, so equal places give equal addresses.
export function buildSearch(page: PageId, tool: Route["tool"], tab: BrandTab, lang: Lang): string {
  const q = new URLSearchParams();
  if (page !== "home") q.set("section", page);
  if (page === "tools" && tool) q.set("tool", tool);
  if (page === "brand") q.set("tab", tab);
  q.set("lang", lang);
  return `?${q.toString()}`;
}
