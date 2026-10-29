import { Copy, Palette, Shapes, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { copyText } from "@/lib/clipboard";
import { marketing as t } from "@/content";
import type { BrandTab } from "@/lib/route";

// One value with its own Copy button. Long values wrap; nothing is cut.
export function CopyField({ label, value, missing }: { label: string; value: string; missing?: string }) {
  return (
    <section className="rounded-xl border bg-card p-4" aria-label={label}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <h3 className="font-medium">{label}</h3>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={!value}
          onClick={() => void copyText(value, t.copied(label))}
        >
          <Copy className="size-4" /> {t.copy}
        </Button>
      </div>
      {value ? <p className="whitespace-pre-line break-words text-sm">{value}</p> : <p className="text-sm text-destructive">{missing ?? t.notFound}</p>}
    </section>
  );
}

// Marketing works with the brand a lot: a short strip to the three brand pages.
export function BrandStrip({ onGo }: { onGo: (tab: BrandTab) => void }) {
  const items: { tab: BrandTab; label: string; icon: typeof Palette }[] = [
    { tab: "colours", label: t.brandColours, icon: Palette },
    { tab: "logos", label: t.brandLogos, icon: Shapes },
    { tab: "fonts", label: t.brandFonts, icon: Type },
  ];
  return (
    <section aria-label={t.brandTitle} className="flex flex-wrap items-center gap-3 rounded-xl border border-dashed bg-muted/50 p-4">
      <div className="min-w-0 flex-1">
        <h2 className="font-semibold">{t.brandTitle}</h2>
        <p className="text-sm text-muted-foreground">{t.brandText}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((i) => (
          <Button key={i.tab} variant="outline" size="sm" className="gap-2" onClick={() => onGo(i.tab)}>
            <i.icon className="size-4" /> {i.label}
          </Button>
        ))}
      </div>
    </section>
  );
}
