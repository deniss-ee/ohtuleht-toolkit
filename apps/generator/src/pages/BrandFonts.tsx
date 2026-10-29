import { Copy, Download, ListChecks } from "lucide-react";
import { toast } from "sonner";
import { brand } from "@ohtuleht/brand";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { brandManual as t } from "@/content";

type Font = (typeof brand.fonts)[number];

// The fonts shown in the manual (brand.json; the code font of the toolkit itself is left out).
const shown = () => brand.fonts.filter((f) => f.inManual !== false);

const cssFor = (f: Font) => `font-family: ${f.stack};`;

// Inter is loaded in this app under the name "Inter Variable"; the copied CSS keeps the plain name.
const stackOf = (f: Font) => (f.id === "inter" ? `"Inter Variable", ${f.stack}` : f.stack);

// Fonts are in public/fonts/<id>.zip (TTF files of the brand weights and the license).
const zipOf = (f: Font) => `./fonts/${f.id}.zip`;

async function copy(text: string) {
  await navigator.clipboard.writeText(text);
  toast.success(t.copied(text));
}

// When to use which font: the first thing on the page, because it is what people come for.
function Rules() {
  const byId = (id: string) => brand.fonts.find((f) => f.id === id);
  return (
    <section aria-labelledby="font-rules" className="rounded-xl border-2 border-primary/40 bg-primary/5 p-4 sm:p-5">
      <div className="mb-4 flex items-center gap-2">
        <ListChecks className="size-5 text-primary" aria-hidden />
        <h2 id="font-rules" className="text-lg font-semibold">
          {t.fontRulesTitle}
        </h2>
      </div>
      <ol className="grid gap-3 md:grid-cols-3">
        {t.fontRules.map((r, i) => {
          const font = byId(r.font);
          return (
            <li key={r.font} className="flex gap-3 rounded-lg border bg-background p-4">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">{i + 1}</span>
              <div className="min-w-0">
                <div className="text-sm text-muted-foreground">{r.when}</div>
                <div className="text-2xl leading-tight font-semibold" style={{ fontFamily: font ? stackOf(font) : undefined }}>
                  {font?.family}
                </div>
                <p className="mt-1 text-sm">{r.text}</p>
              </div>
            </li>
          );
        })}
      </ol>
      <p className="mt-4 text-sm font-medium">{t.fontRuleLimit}</p>
    </section>
  );
}

// One brand font. The five parts sit on shared rows (subgrid), so the three cards line up from top to bottom.
function FontCard({ font }: { font: Font }) {
  const style = { fontFamily: stackOf(font) };
  return (
    <div className="overflow-hidden rounded-xl border bg-card text-card-foreground min-w-0 xl:row-span-5 xl:grid xl:grid-cols-[minmax(0,1fr)] xl:grid-rows-subgrid xl:gap-y-0">
      <div className="space-y-1.5 px-4 pt-4 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-xl font-semibold" style={style}>
            {font.family}
          </h3>
          <Badge variant={font.id === "fira-sans" ? "default" : "secondary"}>{t.fontRoles[font.id] ?? font.role}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">{t.fontUse[font.id] ?? font.role}</p>
      </div>

      <div className="px-4 pb-3">
        <div className="h-full space-y-2 rounded-lg border bg-muted/30 p-4">
          <span className="block text-7xl leading-none font-semibold" style={style} aria-hidden>
            Aa
          </span>
          <div className="text-2xl leading-tight font-semibold" style={style}>
            {t.fontSampleHeadline}
          </div>
          <p className="text-sm text-muted-foreground" style={style}>
            {t.fontSampleText}
          </p>
        </div>
      </div>

      <div className="px-4 pb-3">
        <div className="mb-1.5 text-sm font-medium">{t.fontWeights}</div>
        <ul className="divide-y rounded-lg border">
          {font.weights.map((w) => (
            <li key={w} className="flex items-baseline justify-between gap-3 px-3 py-2">
              <span className="truncate text-lg" style={{ ...style, fontWeight: w }}>
                {t.fontSampleHeadline}
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {w} {t.fontWeightNames[w]}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-3 px-4 pb-4">
        <div>
          <div className="mb-1 text-sm font-medium">{t.fontLetters}</div>
          <p className="text-lg leading-snug break-words" style={style}>
            {t.fontUpper}
            <br />
            {t.fontLower}
            <br />
            {t.fontDigits}
          </p>
        </div>
        <div>
          <div className="mb-1 text-sm font-medium">{t.fontEstonian}</div>
          <p className="text-lg" style={style}>
            {t.fontEt}
          </p>
        </div>
        <div>
          <div className="mb-1 text-sm font-medium">{t.fontCss}</div>
          <code className="block rounded-md border bg-muted/40 px-3 py-2 font-mono text-xs break-words">{cssFor(font)}</code>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t bg-muted/50 px-4 py-3">
        <Button size="sm" className="gap-2" asChild>
          <a href={zipOf(font)} download={`${font.id}.zip`}>
            <Download className="size-4" /> {t.fontDownload}
          </a>
        </Button>
        <Button size="sm" variant="outline" className="gap-2" onClick={() => copy(cssFor(font))}>
          <Copy className="size-4" /> {t.fontCopyCss}
        </Button>
      </div>
    </div>
  );
}

export function Fonts() {
  return (
    <div className="space-y-6">
      <Rules />
      <p className="text-muted-foreground">{t.fontsIntro}</p>
      <div className="grid gap-4 xl:grid-cols-3">
        {shown().map((f) => (
          <FontCard key={f.id} font={f} />
        ))}
      </div>
    </div>
  );
}
