import JSZip from "jszip";

// Opens a zip and returns it scoped to the folder that holds index.html. Banners are often zipped as
// "folder/index.html" (right-click on a folder), sometimes with an extra outer folder; the shallowest
// index.html wins. Returns null when there is none. Mac "__MACOSX" leftovers are ignored.
export async function openZip(file: Blob): Promise<JSZip | null> {
  const zip = await JSZip.loadAsync(file);
  const paths = Object.keys(zip.files).filter((p) => /(^|\/)index\.html$/i.test(p) && !zip.files[p]?.dir && !/(^|\/)(__MACOSX|\.)/.test(p));
  const best = paths.sort((a, b) => a.split("/").length - b.split("/").length)[0];
  if (!best) return null;
  const prefix = best.slice(0, best.length - "index.html".length);
  return prefix ? zip.folder(prefix.replace(/\/$/, "")) : zip;
}
