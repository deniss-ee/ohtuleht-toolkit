// All interface text and navigation in one place (language files come later).
export type PageId = "generator" | "brand" | "tasks";

export interface NavItem {
  id: PageId;
  label: string;
  ready: boolean;
}

export const nav: NavItem[] = [
  { id: "generator", label: "Banner generator", ready: true },
  { id: "brand", label: "Brand manual", ready: false },
  { id: "tasks", label: "Task tracker", ready: false },
];

export const generatorHome = {
  title: "Banner generator",
  intro: "Build a content-marketing banner and download it as a zip.",
  newBanner: "New banner",
  uploadZip: "Upload existing zip",
};
