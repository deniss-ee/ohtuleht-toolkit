import { useMemo, useState } from "react";
import { ArrowLeft, Replace } from "lucide-react";
import { BrandStrip, CopyField } from "@/components/editor/MarketingParts";
import { PageHeader } from "@/components/editor/PageHeader";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { marketing as t } from "@/content";
import { copyText } from "@/lib/clipboard";
import { withPictureSize } from "@/lib/image";
import type { BrandTab } from "@/lib/route";

const DESKTOP = 54;
const MOBILE = 48;

// Tool: picture links from the CMS (any size number) to the banner sizes, 54 and 48. Converts while you type or paste.
export function PictureConverter({ onBack, onBrand, embedded }: { onBack?: () => void; onBrand?: (tab: BrandTab) => void; embedded?: boolean }) {
  const [text, setText] = useState("");
  const rows = useMemo(
    () =>
      text
        .split(/\r?\n/)
        .map((line, i) => ({ n: i + 1, line: line.trim() }))
        .filter((r) => r.line)
        .map((r) => ({ ...r, desktop: withPictureSize(r.line, DESKTOP), mobile: withPictureSize(r.line, MOBILE) })),
    [text],
  );
  const good = rows.filter((r) => r.desktop && r.mobile);
  const all = (key: "desktop" | "mobile") => good.map((r) => r[key]).join("\n");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {!embedded && onBack && (
        <Button variant="ghost" size="sm" className="gap-2" onClick={onBack}>
          <ArrowLeft className="size-4" /> {t.back}
        </Button>
      )}
      {embedded ? (
        <div>
          <h2 className="text-lg font-semibold">{t.converterTitle}</h2>
          <p className="text-sm text-muted-foreground">{t.converterIntro}</p>
        </div>
      ) : (
        <PageHeader icon={Replace} title={t.converterTitle} intro={t.converterIntro} />
      )}

      <div className="space-y-2">
        <Label htmlFor="picture-links">{t.converterInput}</Label>
        <Textarea id="picture-links" autoFocus={!embedded} rows={4} value={text} placeholder={t.converterPlaceholder} spellCheck={false} onChange={(e) => setText(e.target.value)} />
        {!text && (
          <Button variant="outline" size="sm" onClick={() => setText(t.converterExample)}>
            {t.tryExample}
          </Button>
        )}
        {rows.filter((r) => !r.desktop).map((r) => (
          <p key={r.n} className="text-sm text-destructive" role="alert">
            {t.converterBadLine(r.n)}
          </p>
        ))}
      </div>

      {good.length === 0 ? (
        <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">{t.converterEmpty}</p>
      ) : (
        <div className="space-y-3">
          <CopyField label={t.converterDesktop} value={all("desktop")} />
          <CopyField label={t.converterMobile} value={all("mobile")} />
          {good.length > 1 && (
            <p className="text-xs text-muted-foreground">
              <Button variant="link" className="h-auto p-0 text-xs" onClick={() => void copyText(good.map((r) => `${r.desktop}\t${r.mobile}`).join("\n"), t.converterCopyAll)}>
                {t.converterCopyAll}
              </Button>
            </p>
          )}
        </div>
      )}
      {!embedded && onBrand && <BrandStrip onGo={onBrand} />}
    </div>
  );
}
