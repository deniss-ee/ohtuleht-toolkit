import { Settings2, Zap } from "lucide-react";
import { IconChip } from "@/components/editor/IconChip";
import { Button } from "@/components/ui/button";
import { editor as t } from "@/content";

export interface QuickFact {
  label: string;
  value: string;
}

// Quick edit: the side panel next to the list when a banner was opened from a zip. Most of the time only the articles or pictures change,
// so the page shows the preview, the list on the left and this panel on the right (on a phone: above the list). It says what the banner is,
// what to do, and "All settings" brings back the whole form (nothing is lost either way). Sticky, so it stays in view next to a long list.
// `place`: the grid cell classes of the editor it sits in (the slider has two columns, the articles banner three).
export function QuickPanel({ what, facts, onFull, place = "lg:col-start-2 lg:row-start-1" }: { what: "articles" | "pictures"; facts: QuickFact[]; onFull: () => void; place?: string }) {
  return (
    <aside aria-label={t.quickTitle} className={`order-first space-y-4 rounded-xl bg-card p-5 shadow-panel ring-1 ring-foreground/[0.07] lg:order-none lg:sticky lg:top-4 ${place}`}>
      <div className="flex items-center gap-3">
        <IconChip icon={Zap} tone="yellow" />
        <div className="font-semibold">{t.quickTitle}</div>
      </div>
      <p className="text-sm text-muted-foreground">{what === "articles" ? t.quickArticles : t.quickPictures}</p>
      <dl className="divide-y rounded-lg border text-sm">
        {facts.map((f) => (
          <div key={f.label} className="flex items-baseline justify-between gap-3 px-3 py-2">
            <dt className="shrink-0 text-muted-foreground">{f.label}</dt>
            <dd className="min-w-0 truncate text-right font-medium">{f.value || "–"}</dd>
          </div>
        ))}
      </dl>
      <Button variant="outline" className="w-full gap-2" onClick={onFull}>
        <Settings2 className="size-4" /> {t.quickFull}
      </Button>
    </aside>
  );
}
