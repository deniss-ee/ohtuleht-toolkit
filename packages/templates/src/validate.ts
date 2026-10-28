import type { ArticlesBannerConfig } from "./types.ts";

export const MIN_ARTICLES = 2;

// Returns human-readable problems; empty means the banner can be exported.
export function validate(config: ArticlesBannerConfig): string[] {
  const problems: string[] = [];
  if (!config.campaign.trim()) problems.push("Campaign name is required.");
  if (config.articles.length < MIN_ARTICLES) problems.push(`Add at least ${MIN_ARTICLES} articles.`);
  config.articles.forEach((a, i) => {
    if (!/^https?:\/\//.test(a.url)) problems.push(`Article ${i + 1}: link must start with http(s)://`);
    if (!a.title.trim()) problems.push(`Article ${i + 1}: title is empty.`);
    if (!/^https?:\/\//.test(a.image)) problems.push(`Article ${i + 1}: image must be an http(s) URL.`);
  });
  if (!/^https?:\/\//.test(config.header.href)) problems.push("Header link must start with http(s)://");
  if (config.header.type === "image" && !config.header.src) problems.push("Header image is missing.");
  return problems;
}
