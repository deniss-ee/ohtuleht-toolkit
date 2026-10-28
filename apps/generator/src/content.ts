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
  uploadText: "Upload a banner zip you made with this tool.",
  uploadButton: "Upload zip",
  uploadFailed: "Could not open that zip.",
  create: "Create",
};

export const editor = {
  back: "Back",
  heading: "Articles banner",
  untitled: "New banner",
  loadExample: "Load example",
  download: "Download zip",
  downloading: "Building...",
  ready: "Ready to download",
  toFix: (n: number) => `${n} thing${n === 1 ? "" : "s"} to fix`,
  previewTitle: "Preview",
  previewLoading: "Loading preview…",
  previewScaled: (pct: number) => `Shown at ${pct}% to fit your screen. The real banner is 1250x400.`,
  previewFull: "Shown at full size, 1250x400.",
  pin: "Keep preview in view",
  light: "Light",
  dark: "Dark",
  weight: "File size",
  weightHint: "Without article images. Aim to stay under 100 KB.",
  todoTitle: "To do before you can download",

  // 1 Articles
  articlesTitle: "Articles",
  articlesHint: (min: number) => `Add at least ${min}. Up to 4 show at once; with more, arrows and automatic sliding appear.`,
  pasteLabel: "Paste article snippets here",
  pastePlaceholder: "One snippet per line, or paste several at once",
  pasteButton: "Add articles",
  pasteHelp: "Old HTML snippets work too.",
  howToSnippet: "How do I get a snippet?",
  bookmarkTitle: "Copy articles with a bookmark",
  bookmarkIntro: "Set this up once. After that, each article takes one click.",
  bookmarkName: "Copy article",
  bookmarkStep1: "Drag this button onto your browser's bookmarks bar (press Ctrl+Shift+B to show the bar).",
  bookmarkCopyCode: "Copy code instead",
  bookmarkCopyHint: "If dragging does not work: create a bookmark by hand and paste this code as its address.",
  bookmarkCopied: "Bookmark code copied.",
  bookmarkStep2: "Open an article on ohtuleht.ee and click the bookmark. A small message says “Copied”.",
  bookmarkStep3: "Come back here, paste into the box above (Ctrl+V) and press Add articles. Repeat for every article.",
  pasteNothing: "No articles found in that text.",
  pasteAdded: (n: number, skipped: number) => `Added ${n} article${n === 1 ? "" : "s"}${skipped ? ` (${skipped} line${skipped === 1 ? "" : "s"} not understood)` : ""}.`,
  addArticle: "Add an article by hand",
  emptyArticles: "No articles yet. Paste snippets above or add one by hand.",
  article: (n: number) => `Article ${n}`,
  titleField: "Title",
  articleUrl: "Article link",
  imageUrl: "Image address",
  badgeField: "Label on image",
  badgeDefault: "Uses campaign label",
  badgeColor: "Label colour",
  useDefault: "Use default",
  noImage: "No image",
  moveUp: "Move up",
  moveDown: "Move down",
  remove: "Remove",

  // 2 Campaign
  campaignTitle: "Campaign",
  campaignName: "Campaign name",
  campaignHint: "Used for the file name.",
  mainColor: "Main colour",
  mainColorHint: "Used for the header, the arrows and the default label colour. In dark mode the label colour is lightened automatically so it stays readable.",
  badge: "Default label on article images",
  badgeHint: "Usually “Sisuturundus”. Each article can have its own label above.",

  // 3 Header
  headerTitle: "Header",
  headerHint: "The bar at the top of the banner.",
  headerImage: "Image",
  headerColor: "Solid colour",
  headerFile: "Header image",
  headerChoose: "Choose image",
  headerChange: "Change image",
  headerFileHint: "PNG, WebP or SVG. Best size 2496x92 px (shown at 1248x46).",
  headerNone: "No image chosen yet.",
  headerLink: "Where the header leads",
  headerLinkHint: "Link opened when someone clicks the header.",

  // 4 Advanced
  colorsTitle: "Colours",
  colorsHint: "Light and dark mode. Most campaigns can keep these.",
  colorBg: "Background",
  colorText: "Title text",
  colorBadge: "Label and arrows",
  colorHover: "Title on hover",
  colorHeader: "Header colour",
  automatic: "Automatic",
  useAutomatic: "Use automatic",
  headerUsesMain: "The header uses the main colour. Change it under Campaign, or override it in Advanced, Colours.",
  behaviorTitle: "Slider settings",
  behaviorHint: "Only used when there are more than 4 articles.",
  shuffle: "Random order every time the banner loads",
  autoplay: "Slide automatically",
  loop: "Start again after the last article",
  delay: "Seconds between slides",
  speed: "Slide speed",
  speedFast: "Fast",
  speedNormal: "Normal",
  speedSlow: "Slow",
  advanced: "Advanced",

  imported: "Banner loaded.",
  exampleLoaded: "Example loaded.",
};
