import type { ArticlesBannerConfig } from "./types.ts";

export const MIN_ARTICLES = 2;

// One thing the person must fix before the banner can be downloaded.
export interface Problem {
  message: string; // plain language, shown in the interface
  field: string; // id of the form field to jump to
}

const isUrl = (s: string) => /^https?:\/\//.test(s.trim());

// Returns what is still missing; empty means the banner can be exported.
export function validate(config: ArticlesBannerConfig): Problem[] {
  const problems: Problem[] = [];
  if (!config.campaign.trim()) problems.push({ message: "Give the campaign a name.", field: "campaign" });
  if (config.articles.length < MIN_ARTICLES) {
    const have = config.articles.length;
    problems.push({ message: `Add at least ${MIN_ARTICLES} articles (you have ${have}).`, field: "paste" });
  }
  config.articles.forEach((a, i) => {
    const n = i + 1;
    if (!a.title.trim()) problems.push({ message: `Article ${n}: write the title.`, field: `a${i}-title` });
    if (!isUrl(a.url)) problems.push({ message: `Article ${n}: paste the article link (it starts with https://).`, field: `a${i}-url` });
    if (!isUrl(a.image)) problems.push({ message: `Article ${n}: paste the picture address (it starts with https://).`, field: `a${i}-img` });
    if (a.badgeColor && !/^#[0-9a-fA-F]{6}$/.test(a.badgeColor)) problems.push({ message: `Article ${n}: the label colour looks wrong.`, field: `a${i}-color` });
  });
  if (!isUrl(config.header.href)) problems.push({ message: "Paste the link where the header should lead (it starts with https://).", field: "header-href" });
  if (config.header.type === "image" && !config.header.src) problems.push({ message: "Choose a header picture, or switch the header to a solid colour.", field: "header-choose" });
  return problems;
}
