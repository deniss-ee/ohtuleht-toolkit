import { useState } from "react";
import { Copy, Download, FileArchive, Palette, Shapes } from "lucide-react";
import { toast } from "sonner";
import { brand, contrastRatio, formatColor, safeZone, tokensCss, tokensJson, tokensTailwind, wcagLevel, type ColorFormat, type LogoVariant } from "@ohtuleht/brand";
import { IconChip } from "@/components/editor/IconChip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { brandManual as t } from "@/content";
import { logoBox, logoFileName, logoPng, logoSvg, logoZip, svgDataUrl } from "@/lib/logos";
import { download } from "@/lib/zip";

const FORMAT_KEY = "ol-color-format";
const FORMATS: { id: ColorFormat; label: string }[] = [
  { id: "hex", label: "HEX" },
  { id: "rgb", label: "RGB" },
  { id: "hsl", label: "HSL" },
  { id: "css", label: "CSS variable" },
  { id: "tailwind", label: "Tailwind" },
];

function readFormat(): ColorFormat {
  try {
    const v = localStorage.getItem(FORMAT_KEY);
    if (FORMATS.some((f) => f.id === v)) return v as ColorFormat;
  } catch {
    // storage blocked: use the default
  }
  return "hex";
}

// A row of buttons where one is active (only the brand red 600 is used for the active one).
function Segmented<T extends string | number>({ label, options, value, onChange }: { label: string; options: { id: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <Button key={String(o.id)} size="sm" variant={o.id === value ? "default" : "outline"} aria-pressed={o.id === value} onClick={() => onChange(o.id)}>
          {o.label}
        </Button>
      ))}
    </div>
  );
}

async function copy(text: string) {
  await navigator.clipboard.writeText(text);
  toast.success(t.copied(text));
}

// ---------- Colours ----------

function Swatch({ scaleId, step, hex, base, format }: { scaleId: string; step: string; hex: string; base: boolean; format: ColorFormat }) {
  const white = contrastRatio(hex, "#ffffff");
  const black = contrastRatio(hex, "#000000");
  const useWhite = white >= black;
  const ratio = useWhite ? white : black;
  const level = wcagLevel(ratio);
  const value = formatColor(scaleId, step, hex, format);
  return (
    <button
      type="button"
      onClick={() => copy(value)}
      aria-label={t.copySwatch(scaleId, step, value)}
      className="group overflow-hidden rounded-lg border text-left transition-shadow hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      <div className="flex h-20 flex-col justify-between p-2" style={{ background: hex, color: useWhite ? "#fff" : "#000" }}>
        <div className="flex items-center justify-between text-xs font-medium">
          <span>{step}</span>
          {base && <span className="rounded bg-black/25 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-white">{t.base}</span>}
        </div>
        <div className="flex items-end justify-between">
          <span className="text-lg font-semibold leading-none">Aa</span>
          <span className="text-[10px] font-medium">
            {useWhite ? t.whiteText : t.blackText} {ratio.toFixed(1)} {level}
          </span>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 bg-card px-2 py-1.5">
        <span className="truncate font-mono text-xs">{value}</span>
        <Copy className="size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
      </div>
    </button>
  );
}

function Colours() {
  const [format, setFormat] = useState<ColorFormat>(readFormat);
  const pick = (f: ColorFormat) => {
    setFormat(f);
    try {
      localStorage.setItem(FORMAT_KEY, f);
    } catch {
      // storage blocked: the choice lasts until reload
    }
  };
  const save = (text: string, name: string, type: string) => download(new Blob([text], { type }), name);

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div>
          <div className="text-sm font-medium">{t.formatLabel}</div>
          <div className="text-xs text-muted-foreground">{t.formatHint}</div>
        </div>
        <Segmented label={t.formatLabel} options={FORMATS} value={format} onChange={pick} />
        <div className="flex flex-wrap gap-2 pt-1">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => save(tokensCss(), "ohtuleht-colors.css", "text/css")}>
            <Download className="size-4" /> {t.exportCss}
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => save(tokensTailwind(), "ohtuleht-colors.tailwind.css", "text/css")}>
            <Download className="size-4" /> {t.exportTailwind}
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => save(tokensJson(), "ohtuleht-colors.json", "application/json")}>
            <Download className="size-4" /> {t.exportJson}
          </Button>
        </div>
      </div>

      {brand.colors.map((scale) => (
        <section key={scale.id} className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold">{scale.name}</h2>
            <p className="text-sm text-muted-foreground">{scale.role}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {Object.entries(scale.steps).map(([step, hex]) => (
              <Swatch key={step} scaleId={scale.id} step={step} hex={hex} base={scale.base === Number(step)} format={format} />
            ))}
          </div>
        </section>
      ))}
      <p className="text-xs text-muted-foreground">{t.contrastNote}</p>
    </div>
  );
}

// ---------- Logos ----------

// Background the logo is shown on, matching the brand rules for that variant.
const PREVIEW_BG: Record<string, string> = {
  "wordmark-red": "#ffffff",
  "wordmark-white": "#464649",
  "wordmark-black": "#ffffff",
  "logomark-square": "#efeff1",
  "logomark-round": "#efeff1",
  "logomark-squircle": "#efeff1",
};

const SIZES = [128, 256, 512, 1024, 2048].map((w) => ({ id: w, label: `${w} px` }));
const BACKGROUNDS = [
  { id: "transparent", label: t.bgTransparent },
  { id: "white", label: t.bgWhite },
  { id: "black", label: t.bgBlack },
];
const bgColor = (id: string) => (id === "white" ? "#ffffff" : id === "black" ? "#000000" : null);

function LogoCard({ logo, withSafeZone, pixelWidth, background }: { logo: LogoVariant; withSafeZone: boolean; pixelWidth: number; background: string }) {
  const o = { safeZone: withSafeZone };
  const box = logoBox(logo, o);
  const [busy, setBusy] = useState(false);
  const outHeight = Math.round((pixelWidth * box.height) / box.width);

  const downloadPng = async () => {
    setBusy(true);
    try {
      download(await logoPng(logo, o, pixelWidth, bgColor(background)), logoFileName(logo, o, "png", pixelWidth));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t.pngFailed);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{logo.name}</CardTitle>
        <CardDescription>{logo.usage}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center rounded-lg border p-4" style={{ background: PREVIEW_BG[logo.id] ?? "#fff", minHeight: 140 }}>
          <img
            src={svgDataUrl(logoSvg(logo, o))}
            alt={logo.name}
            className={withSafeZone ? "outline outline-1 outline-dashed outline-red-500" : undefined}
            style={{ width: logo.family === "wordmark" ? "100%" : 96, maxWidth: logo.family === "wordmark" ? 336 : 96, height: "auto" }}
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {t.sizeInfo(logo.width, logo.height)}
          {withSafeZone && ` · ${t.safeZonePad(safeZone(logo))}`}
        </p>
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        <Button size="sm" className="gap-2" onClick={() => download(new Blob([logoSvg(logo, o)], { type: "image/svg+xml" }), logoFileName(logo, o, "svg"))}>
          <Download className="size-4" /> SVG
        </Button>
        <Button size="sm" variant="outline" className="gap-2" disabled={busy} onClick={downloadPng}>
          <Download className="size-4" /> PNG {pixelWidth}×{outHeight}
        </Button>
      </CardFooter>
    </Card>
  );
}

function Logos() {
  const [safe, setSafe] = useState(false);
  const [width, setWidth] = useState(512);
  const [custom, setCustom] = useState("");
  const [background, setBackground] = useState("transparent");
  const [busy, setBusy] = useState(false);
  const pixelWidth = custom && Number(custom) >= 16 && Number(custom) <= 8192 ? Number(custom) : width;

  const zipAll = async () => {
    setBusy(true);
    try {
      download(await logoZip(pixelWidth, bgColor(background)), "ohtuleht-logos.zip");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t.pngFailed);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-5 pt-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label htmlFor="safe-zone" className="text-sm font-medium">
                {t.safeZone}
              </Label>
              <p className="text-xs text-muted-foreground">{t.safeZoneHint(brand.clearSpace.ratio)}</p>
            </div>
            <Switch id="safe-zone" checked={safe} onCheckedChange={setSafe} />
          </div>
          <div className="space-y-2">
            <div className="text-sm font-medium">{t.pngSize}</div>
            <div className="flex flex-wrap items-center gap-3">
              <Segmented label={t.pngSize} options={SIZES} value={width} onChange={(w) => { setWidth(w); setCustom(""); }} />
              <div className="flex items-center gap-2">
                <Input aria-label={t.customWidth} placeholder={t.customWidth} inputMode="numeric" className="h-8 w-28" value={custom} onChange={(e) => setCustom(e.target.value.replace(/\D/g, ""))} />
                <span className="text-xs text-muted-foreground">px</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{t.pngSizeHint}</p>
          </div>
          <div className="space-y-2">
            <div className="text-sm font-medium">{t.pngBackground}</div>
            <Segmented label={t.pngBackground} options={BACKGROUNDS} value={background} onChange={setBackground} />
          </div>
          <Button variant="outline" className="gap-2" disabled={busy} onClick={zipAll}>
            <FileArchive className="size-4" /> {busy ? t.building : t.downloadAll}
          </Button>
          <p className="text-xs text-muted-foreground">{t.downloadAllHint}</p>
        </CardContent>
      </Card>

      {(["wordmark", "logomark"] as const).map((family) => (
        <section key={family} className="space-y-3">
          <h2 className="text-lg font-semibold">{family === "wordmark" ? t.wordmarks : t.logomarks}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {brand.logos
              .filter((l) => l.family === family)
              .map((l) => (
                <LogoCard key={l.id} logo={l} withSafeZone={safe} pixelWidth={pixelWidth} background={background} />
              ))}
          </div>
        </section>
      ))}
      <Badge variant="outline" className="whitespace-normal py-1 text-xs font-normal">
        {brand.clearSpace.note}
      </Badge>
    </div>
  );
}

export function BrandManual() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center gap-3">
        <IconChip icon={Palette} tone="red" />
        <div>
          <h1 className="text-2xl font-semibold">{t.title}</h1>
          <p className="text-muted-foreground">{t.intro}</p>
        </div>
      </div>
      <Tabs defaultValue="colours">
        <TabsList>
          <TabsTrigger value="colours" className="gap-2">
            <Palette className="size-4" /> {t.tabColours}
          </TabsTrigger>
          <TabsTrigger value="logos" className="gap-2">
            <Shapes className="size-4" /> {t.tabLogos}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="colours" className="pt-4">
          <Colours />
        </TabsContent>
        <TabsContent value="logos" className="pt-4">
          <Logos />
        </TabsContent>
      </Tabs>
    </div>
  );
}
