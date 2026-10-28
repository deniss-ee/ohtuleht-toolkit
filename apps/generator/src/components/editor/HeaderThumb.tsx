import { resolveTheme } from "@ohtuleht/templates";
import type { Draft } from "@/lib/banner";

// Small, exact copy of how the banner header will look: picture or colour, with the campaign name on top.
// It fills its container edge to edge, with the banner's own proportions (1248 x 46).
export function HeaderThumb({ draft }: { draft: Draft }) {
  const c = draft.config;
  const theme = resolveTheme(c, "light");
  const picture = c.header.type === "image" ? draft.headerFile?.dataUrl : undefined;
  return (
    <div
      className="flex w-full items-center overflow-hidden rounded-md"
      style={{
        aspectRatio: "1248 / 46",
        minHeight: 28,
        backgroundColor: theme.headerBg,
        backgroundImage: picture ? `url("${picture}")` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <span className="truncate px-[1.28%] font-heading text-[11px] font-semibold uppercase leading-none" style={{ color: theme.headerText }}>
        {c.campaign.trim() || "Campaign name"}
      </span>
    </div>
  );
}
