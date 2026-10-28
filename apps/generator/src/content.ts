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
  create: "Create",
};
