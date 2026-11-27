import { Settings2, Zap } from "lucide-react";
import { IconChip } from "@/components/editor/IconChip";
import { Button } from "@/components/ui/button";
import { editor as t } from "@/content";

// Quick edit: shown above the list when a banner was opened from a zip. Most of the time only the articles or pictures change,
// so the editor shows just the preview and the list; "All settings" brings back the whole form (nothing is lost either way).
export function QuickBar({ what, onFull }: { what: "articles" | "pictures"; onFull: () => void }) {
  return (
    <div role="region" aria-label={t.quickTitle} className="flex flex-wrap items-center gap-3 rounded-xl border border-dashed bg-muted/50 p-4">
      <IconChip icon={Zap} tone="yellow" />
      <div className="min-w-0 flex-1">
        <div className="font-medium">{t.quickTitle}</div>
        <div className="text-sm text-muted-foreground">{what === "articles" ? t.quickArticles : t.quickPictures}</div>
      </div>
      <Button variant="outline" className="gap-2" onClick={onFull}>
        <Settings2 className="size-4" /> {t.quickFull}
      </Button>
    </div>
  );
}
