import { Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { brand } from "@ohtuleht/brand";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { brandManual as t } from "@/content";

type Font = (typeof brand.fonts)[number];

// The fonts shown in the manual (brand.json; the code font of the toolkit itself is left out).
const shown = () => brand.fonts.filter((f) => f.inManual !== false);

const cssFor = (f: Font) => `font-family: ${f.stack};`;

// Inter is loaded in this app under the name "Inter Variable"; the copied CSS keeps the plain name.
const stackOf = (f: Font) => (f.id === "inter" ? `"Inter Variable", ${f.stack}` : f.stack);

async function copy(text: string) {
  await navigator.clipboard.writeText(text);
  toast.success(t.copied(text));
}

// One brand font: big sample, short use, weights, letters (with the Estonian ones), copy and download.
function FontCard({ font }: { font: Font }) {
  const style = { fontFamily: stackOf(font) };
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-xl" style={style}>
            {font.family}
          </CardTitle>
          <Badge variant={font.id === "fira-sans" ? "default" : "secondary"}>{t.fontRoles[font.id] ?? font.role}</Badge>
        </div>
        <CardDescription>{t.fontUse[font.id] ?? font.role}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2 rounded-lg border bg-muted/30 p-4">
          <span className="text-7xl leading-none font-semibold" style={style} aria-hidden>
            Aa
          </span>
          <div className="min-w-0">
            <div className="text-2xl leading-tight font-semibold" style={style}>
              {t.fontSampleHeadline}
            </div>
            <p className="mt-1 text-sm text-muted-foreground" style={style}>
              {t.fontSampleText}
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="text-sm font-medium">{t.fontWeights}</div>
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

        <div className="space-y-1.5">
          <div className="text-sm font-medium">{t.fontLetters}</div>
          <p className="text-lg leading-snug break-words" style={style}>
            {t.fontUpper}
            <br />
            {t.fontLower}
            <br />
            {t.fontDigits}
          </p>
          <div className="text-sm font-medium">{t.fontEstonian}</div>
          <p className="text-lg" style={style}>
            {t.fontEt}
          </p>
        </div>

        <div className="space-y-1.5">
          <div className="text-sm font-medium">{t.fontCss}</div>
          <code className="block rounded-md border bg-muted/40 px-3 py-2 font-mono text-xs break-words">{cssFor(font)}</code>
        </div>
      </CardContent>
      <div className="mt-auto flex flex-wrap gap-2 border-t bg-muted/50 px-4 py-3">
        <Button size="sm" className="gap-2" onClick={() => copy(cssFor(font))}>
          <Copy className="size-4" /> {t.fontCopyCss}
        </Button>
        <Button size="sm" variant="outline" className="gap-2" asChild>
          <a href={font.url} target="_blank" rel="noreferrer">
            <ExternalLink className="size-4" /> {t.fontGet}
          </a>
        </Button>
      </div>
    </Card>
  );
}

// The same headline in the same narrow column, in both families: shows why the condensed one exists.
function Compare() {
  const normal = brand.fonts.find((f) => f.id === "fira-sans");
  const narrow = brand.fonts.find((f) => f.id === "fira-sans-condensed");
  if (!normal || !narrow) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.fontCompareTitle}</CardTitle>
        <CardDescription>{t.fontCompareText}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        {[normal, narrow].map((f) => (
          <div key={f.id} className="space-y-2">
            <div className="text-xs text-muted-foreground">{f.family}</div>
            <div className="mx-auto w-full max-w-[11rem] rounded-lg border bg-background p-4 text-2xl leading-tight font-semibold" style={{ fontFamily: stackOf(f), fontWeight: f.id === "fira-sans" ? 600 : 700 }}>
              {t.fontExampleHeadline}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// A news card built the way the brand uses the fonts.
function Example() {
  const narrow = brand.fonts.find((f) => f.id === "fira-sans-condensed");
  const text = brand.fonts.find((f) => f.id === "inter");
  if (!narrow || !text) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.fontExampleTitle}</CardTitle>
        <CardDescription>{t.fontExampleText}</CardDescription>
      </CardHeader>
      <CardContent>
        <article className="mx-auto max-w-sm overflow-hidden rounded-xl border bg-background">
          <div className="h-32 bg-gradient-to-br from-red-600 to-yellow-300" aria-hidden />
          <div className="space-y-2 p-4">
            <div className="text-xs font-semibold tracking-wide text-red-600 uppercase dark:text-red-400" style={{ fontFamily: stackOf(text) }}>
              {t.fontExampleLabel}
            </div>
            <h3 className="text-2xl leading-tight font-bold" style={{ fontFamily: stackOf(narrow) }}>
              {t.fontExampleHeadline}
            </h3>
            <p className="text-sm text-muted-foreground" style={{ fontFamily: stackOf(text) }}>
              {t.fontExampleLede}
            </p>
          </div>
        </article>
      </CardContent>
    </Card>
  );
}

export function Fonts() {
  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">{t.fontsIntro}</p>
      <div className="grid auto-rows-fr gap-4 xl:grid-cols-3">
        {shown().map((f) => (
          <FontCard key={f.id} font={f} />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Compare />
        <Example />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t.fontRulesTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {t.fontRules.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
