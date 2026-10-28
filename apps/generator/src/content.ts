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
  intro: "Make a banner in three easy steps.",
  steps: [
    { title: "Pick a banner", text: "Choose the size you need below." },
    { title: "Fill it in", text: "Add your articles and the campaign name. You see the banner while you type." },
    { title: "Download", text: "Press Download zip and give the file to the ad system." },
  ],
  soon: "Coming soon",
  uploadTitle: "Open a banner you made before",
  uploadText: "Choose the zip file you downloaded last time and keep editing.",
  uploadButton: "Choose zip file",
  uploadFailed: "Could not open that zip.",
  create: "Make this banner",
};

export const editor = {
  back: "Back",
  heading: "Articles banner",
  untitled: "New banner",
  loadExample: "Try an example",
  download: "Download zip",
  downloading: "Building...",
  ready: "Ready to download",
  toFix: (n: number) => `${n} thing${n === 1 ? "" : "s"} left to do`,
  toFixTitle: "Still to do before you can download",
  toFixHelp: "Click one to jump to it.",
  allGood: "All done. You can download your banner.",
  sizeHelp: "How big the banner file is, without the article pictures. Smaller is better. Try to stay under 100 KB.",
  previewTitle: "Preview",
  previewLoading: "Loading preview…",
  previewScaled: (pct: number) => `Shown at ${pct}% to fit your screen. The real banner is 1250x400.`,
  previewFull: "Shown at full size, 1250x400.",
  pin: "Keep preview in view",
  light: "Light",
  dark: "Dark",
  weight: "File size",

  // 1 Articles
  articlesTitle: "Articles",
  articlesHint: (min: number) => `Add at least ${min}. Up to 4 show at once; with more, arrows and automatic sliding appear.`,
  pasteLabel: "Paste what the bookmark copied",
  pastePlaceholder: "Click here, then press Ctrl+V. You can paste many articles at once.",
  pasteButton: "Add articles",
  pasteHelp: "",
  howToSnippet: "Set up the bookmark first",
  firstTime: "First time here? Set up the bookmark once. After that, copying an article takes one click.",
  bookmarkTitle: "Copy articles with a bookmark",
  bookmarkIntro: "Set this up once. After that, each article takes one click.",
  bookmarkName: "Copy article",
  bookmarkStep1: "Drag this button onto your browser's bookmarks bar (press Ctrl+Shift+B to show the bar).",
  bookmarkCopyCode: "Copy code instead",
  bookmarkCopyHint: "If dragging does not work: create a bookmark by hand and paste this code as its address.",
  bookmarkCopied: "Bookmark code copied.",
  bookmarkStep2: "Open an article on ohtuleht.ee and click the bookmark you just added.",
  bookmarkStep3: "A big green message says “Article copied”. Come back here, click the box (Paste what the bookmark copied), press Ctrl+V, then Add articles. Repeat for every article.",
  bookmarkDone: "Got it",
  pasteNothing: "No articles found in that text.",
  pasteAdded: (n: number, skipped: number) => `Added ${n} article${n === 1 ? "" : "s"}${skipped ? ` (${skipped} line${skipped === 1 ? "" : "s"} not understood)` : ""}.`,
  addArticle: "Add an article by hand",
  emptyArticles: "No articles yet. Paste snippets above or add one by hand.",
  article: (n: number) => `Article ${n}`,
  titleField: "Title",
  articleUrl: "Article link",
  imageUrl: "Picture address",
  badgeField: "Label on the picture",
  badgeDefault: "Same as campaign label",
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
  badge: "Label on the article pictures",
  badgeHint: "Usually “Sisuturundus”. One article can have a different label (see Articles below).",

  // 3 Header
  headerTitle: "Header",
  headerHint: "The bar at the top of the banner. It shows the campaign name.",
  headerImage: "Picture",
  headerColor: "Solid colour",
  headerFile: "Header picture",
  headerChoose: "Choose picture",
  headerChange: "Change picture",
  headerFileHint: "This is the background. The campaign name is written on top of it, so use a picture without text. Best size 2496x92 px (shown at 1248x46).",
  headerNone: "No picture chosen yet.",
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
  colorHeaderText: "Header text",
  automatic: "Automatic",
  useAutomatic: "Use automatic",
  headerUsesMain: "The bar is filled with the main colour. Change the main colour under Campaign.",
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

  emptyTitle: "Let's make your banner",
  emptyText: "Your banner will show up right here as soon as you add something.",
  emptySteps: [
    "First, set up the bookmark. You do this only once. It copies articles from ohtuleht.ee for you.",
    "Open an article, click the bookmark, then come back here and paste.",
    "Write the campaign name and the link for the header.",
    "When the top bar says “Ready to download”, press Download zip.",
  ],
  emptySetupBookmark: "Set up the bookmark",
  emptyGoArticles: "Add articles",
  emptyTryExample: "Not sure? Try an example",
  imported: "Banner loaded.",
  exampleLoaded: "Example loaded.",
};
