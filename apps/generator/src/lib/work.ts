// The banner being edited ("work"): making a new one, opening a zip, keeping it in the browser.
// This module pulls in every draft kind, the templates and the zip code, so the app loads it only when a banner is opened.
import { newDraft } from "@/lib/banner";
import { importFrameZip, newFrameDraft } from "@/lib/frames";
import { importHeaderZip, newHeaderDraft } from "@/lib/header";
import { importSliderAny } from "@/lib/legacySlider";
import { importResponsiveZip, newResponsiveDraft } from "@/lib/responsive";
import { newSliderDraft } from "@/lib/slider";
import type { Work } from "@/lib/storage";
import { importZip } from "@/lib/zip";

export { loadWork, saveWork } from "@/lib/storage";

// A new, empty banner of the type chosen on the start page (the ids are the banner types in the content files).
export function newWork(typeId: string): NonNullable<Work> {
  if (typeId === "header-bar") return { kind: "header", draft: newHeaderDraft() };
  if (typeId === "frame-banner") return { kind: "frames", draft: newFrameDraft() };
  if (typeId === "responsive-banner") return { kind: "responsive", draft: newResponsiveDraft() };
  if (typeId === "image-slider-1250x400" || typeId === "image-slider-600x500") return { kind: "slider", draft: newSliderDraft(typeId) };
  return { kind: "banner", draft: newDraft(typeId === "articles-mobile" ? "articles-mobile" : "articles-1250x400") };
}

// A zip may be any banner made with this tool, or an old Swiper banner. notes = things to check after opening an old one.
// Each reader returns nothing when the zip is not its kind; the articles reader comes last and also takes the old banners.
export async function openZip(file: File): Promise<{ work: NonNullable<Work>; notes: string[] }> {
  const header = await importHeaderZip(file);
  if (header) return { work: { kind: "header", draft: header }, notes: [] };
  const slider = await importSliderAny(file);
  const frames = slider ? null : await importFrameZip(file);
  const responsive = slider || frames ? null : await importResponsiveZip(file);
  if (responsive) return { work: { kind: "responsive", draft: responsive }, notes: [] };
  if (frames) return { work: { kind: "frames", draft: frames }, notes: [] };
  if (slider) return { work: { kind: "slider", draft: slider.draft }, notes: slider.notes };
  const opened = await importZip(file);
  return { work: { kind: "banner", draft: opened.draft }, notes: opened.notes };
}
