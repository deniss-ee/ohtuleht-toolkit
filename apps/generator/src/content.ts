// All interface text and navigation in one place (language files come later).
export type PageId = "content" | "brand" | "tasks";

export interface NavItem {
  id: PageId;
  label: string;
  ready: boolean;
}

export const nav: NavItem[] = [
  { id: "content", label: "Content marketing", ready: true },
  { id: "brand", label: "Brand manual", ready: false },
  { id: "tasks", label: "Task tracker", ready: false },
];

export type Device = "Desktop" | "Mobile";

export interface BannerType {
  id: string;
  name: string;
  size: string;
  device: Device;
  description: string;
  ready: boolean;
}

// Every banner type the category can build. Add new templates here.
export const bannerTypes: BannerType[] = [
  { id: "articles-1250x400", name: "Articles", size: "1250x400", device: "Desktop", description: "Header and a slider of article cards.", ready: true },
  { id: "articles-ad-1250x400", name: "Articles with static ad", size: "1250x400", device: "Desktop", description: "Fixed ad next to a slider of three articles.", ready: false },
  { id: "image-slider-1250x400", name: "Image slider", size: "1250x400", device: "Desktop", description: "Client background with a slider of images.", ready: false },
  { id: "articles-600x500", name: "Articles", size: "600x500", device: "Mobile", description: "Full-width article slider.", ready: false },
  { id: "image-slider-600x500", name: "Image slider", size: "600x500", device: "Mobile", description: "Client images with slide, fade or cube transition.", ready: false },
];

export const contentMarketing = {
  title: "Content marketing banners",
  intro: "Pick a banner type, fill in the campaign and download the zip.",
  soon: "Soon",
  uploadTitle: "Edit an existing banner",
  uploadText: "Upload a banner zip you made before.",
  uploadButton: "Upload zip",
  uploadFailed: "Could not open that zip.",
  create: "Create",
};

export const editor = {
  back: "All banner types",
  title: "Articles 1250x400",
  loadExample: "Load example",
  download: "Download zip",
  downloading: "Building zip...",
  campaignCard: "Campaign",
  campaignName: "Campaign name",
  badge: "Badge text",
  badgeHint: "Shown on every article image.",
  headerCard: "Header",
  headerType: "Header type",
  headerImage: "Image",
  headerColor: "Solid colour",
  headerFile: "Header image",
  headerFileHint: "PNG, WebP or SVG. Shown 1248x46 px (use 2496x92 for sharp screens).",
  headerLink: "Header link",
  headerNone: "No file chosen",
  colorsCard: "Colours",
  light: "Light",
  dark: "Dark",
  colorBg: "Background",
  colorText: "Title text",
  colorBadge: "Badge and arrows",
  colorHover: "Title on hover",
  colorHeader: "Header colour",
  behaviorCard: "Behaviour",
  shuffle: "Shuffle articles on every view",
  autoplay: "Autoplay",
  loop: "Endless loop",
  delay: "Autoplay delay (ms)",
  speed: "Slide speed (ms)",
  articles: "Articles",
  articlesHint: (min: number) => `At least ${min}. Up to 4 show at once; with more, arrows and autoplay appear.`,
  pasteLabel: "Paste article snippets",
  pastePlaceholder: '{"url":"https://www.ohtuleht.ee/123456/","title":"...","image":"https://p.ohtuleht.ee/..."}',
  pasteButton: "Add from snippets",
  pasteNothing: "No articles found in that text.",
  pasteAdded: (n: number, skipped: number) => `Added ${n} article${n === 1 ? "" : "s"}${skipped ? ` (${skipped} not understood)` : ""}.`,
  addArticle: "Add article manually",
  titleField: "Title",
  articleUrl: "Article link (https://...)",
  imageUrl: "Image URL (https://...)",
  moveUp: "Move up",
  moveDown: "Move down",
  remove: "Remove",
  weight: "File weight",
  weightHint: "Zip content without article images. Soft limit about 100 KB.",
  problemsTitle: "Fix before download",
  imported: "Banner loaded.",
};
