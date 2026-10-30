import { messages, type Lang } from "./messages.ts";
import type { ArticlesBannerConfig } from "./types.ts";

export const MIN_ARTICLES = 2;

// One thing the person must fix before the banner can be downloaded.
export interface Problem {
  message: string; // plain language, shown in the interface
  field: string; // id of the form field to jump to
}

const isUrl = (s: string) => /^https?:\/\//.test(s.trim());

// Returns what is still missing; empty means the banner can be exported.
export function validate(config: ArticlesBannerConfig, lang: Lang = "en"): Problem[] {
  const m = messages(lang);
  const problems: Problem[] = [];
  if (!config.campaign.trim()) problems.push({ message: m.campaign, field: "campaign" });
  if (config.articles.length < MIN_ARTICLES) {
    const have = config.articles.length;
    problems.push({ message: m.minArticles(MIN_ARTICLES, have), field: "paste" });
  }
  config.articles.forEach((a, i) => {
    const n = i + 1;
    if (!a.title.trim()) problems.push({ message: m.title(n), field: `a${i}-title` });
    if (!isUrl(a.url)) problems.push({ message: m.url(n), field: `a${i}-url` });
    if (!isUrl(a.image)) problems.push({ message: m.image(n), field: `a${i}-img` });
    if (a.badgeColor && !/^#[0-9a-fA-F]{6}$/.test(a.badgeColor)) problems.push({ message: m.color(n), field: `a${i}-color` });
  });
  if (!isUrl(config.header.href)) problems.push({ message: m.headerHref, field: "header-href" });
  if (config.header.type === "image" && !config.header.src) problems.push({ message: m.headerPicture, field: "header-choose" });
  if (config.format === "articles-1250x400" && config.ad) {
    if (!config.ad.src) problems.push({ message: m.adPicture, field: "ad-choose" });
    if (!isUrl(config.ad.href)) problems.push({ message: m.adHref, field: "ad-href" });
  }
  return problems;
}
