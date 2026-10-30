import { editor } from "@/content";
import { resolveTheme } from "@ohtuleht/templates";
import type { Draft } from "@/lib/banner";

// Small copy of the header, with the banner's own proportions (1248 x 46): the picture, or the colour.
// No text: the campaign name is already in the form and in the preview.
export function HeaderThumb({ draft }: { draft: Draft }) {
  const c = draft.config;
  const picture = c.header.type === "image" ? draft.headerFile?.dataUrl : undefined;
  return (
    <div
      className="w-full overflow-hidden rounded-md border"
      style={{
        aspectRatio: "1248 / 46",
        minHeight: 28,
        backgroundColor: resolveTheme(c, "light").headerBg,
        backgroundImage: picture ? `url("${picture}")` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
      role="img"
      aria-label={picture ? editor.headerFile : editor.headerColor}
    />
  );
}
