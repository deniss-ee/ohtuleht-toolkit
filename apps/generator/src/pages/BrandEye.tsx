import { useEffect, useId, useMemo, useRef, useState, type PointerEvent } from "react";
import { Check, Download, RotateCcw, TriangleAlert } from "lucide-react";
import { brand } from "@ohtuleht/brand";
import { contrast } from "@ohtuleht/templates";
import { toast } from "sonner";
import { ColorField } from "@/components/editor/ColorField";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { brandEye as t } from "@/content";
import {
  applyPreset,
  approach,
  canvasOf,
  checkSafety,
  clampIris,
  eyePng,
  eyeSvg,
  IRIS_R,
  LIMITS,
  newEye,
  PRESETS,
  RATIOS,
  svgDataUrl,
  toGlyph,
  type EyeState,
  type RuleId,
} from "@/lib/eye";
import { download } from "@/lib/zip";

const RULES: RuleId[] = ["iris", "cap", "eye", "letter"];
const PNG_WIDTHS = [512, 1024, 2048];

const brandHex = (scale: string, step: string, fallback: string) => (brand.colors.find((c) => c.id === scale)?.steps as Record<string, string> | undefined)?.[step] ?? fallback;
const SWATCHES: { id: string; label: () => string; value: string | null }[] = [
  { id: "transparent", label: () => t.transparent, value: null },
  { id: "white", label: () => t.white, value: "#FFFFFF" },
  { id: "red", label: () => t.red, value: brandHex("red", "600", "#F50000") },
  { id: "dark", label: () => t.dark, value: brandHex("ink", "950", "#1c1c1c") },
  { id: "yellow", label: () => t.yellow, value: brandHex("yellow", "400", "#FFDB00") },
];

// A range slider with its label and value. Keyboard works as on any slider.
function Slider({ label, value, min, max, step = 1, unit = "", onChange }: { label: string; value: number; min: number; max: number; step?: number; unit?: string; onChange: (v: number) => void }) {
  const id = useId();
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between text-sm">
        <label htmlFor={id}>{label}</label>
        <span className="tabular-nums text-muted-foreground">
          {Math.round(value)}
          {unit}
        </span>
      </div>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-primary" />
    </div>
  );
}

// Brand manual tab: make the brand eye in any look, as PNG or SVG.
export function BrandEye() {
  const [eye, setEye] = useState<EyeState>(() => newEye());
  const [pngWidth, setPngWidth] = useState(1024);
  const [custom, setCustom] = useState(false);
  const [customColor, setCustomColor] = useState("#F5F0E6");
  const [stopped, setStopped] = useState<RuleId | null>(null);
  const view = useRef<HTMLDivElement>(null);
  const drag = useRef<{ kind: "iris" | "letter"; dx: number; dy: number } | null>(null);

  const svg = useMemo(() => eyeSvg(eye), [eye]);
  const safety = useMemo(() => checkSafety(eye), [eye]);
  const { w, h } = canvasOf(eye.ratio);

  // Every change of the letter goes through the safety rules: it stops where a rule would break.
  const change = (next: EyeState) => {
    const r = approach(eye, next);
    setStopped(r.stopped);
    setEye(r.state);
  };
  // Shape changes (picture shape) may make the current place unsafe: go back to the middle then.
  const setRatio = (ratio: [number, number]) => {
    const next = { ...eye, ratio };
    if (checkSafety(next).ok) return setEye(next), setStopped(null);
    const reset = { ...next, angle: 0, fx: 0.5, fy: 0.5, size: 1 };
    setEye(reset);
    setStopped(null);
  };

  useEffect(() => {
    if (!stopped) return;
    const id = setTimeout(() => setStopped(null), 4000);
    return () => clearTimeout(id);
  }, [stopped]);

  const point = (e: PointerEvent) => {
    const r = view.current!.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * w, y: ((e.clientY - r.top) / r.height) * h };
  };
  const onDown = (e: PointerEvent) => {
    const p = point(e);
    const g = toGlyph(eye, p.x, p.y);
    const onIris = Math.hypot(g.x - eye.iris.x, g.y - eye.iris.y) <= IRIS_R * 1.15;
    drag.current = onIris ? { kind: "iris", dx: eye.iris.x - g.x, dy: eye.iris.y - g.y } : { kind: "letter", dx: eye.fx - p.x / w, dy: eye.fy - p.y / h };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onMove = (e: PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const p = point(e);
    if (d.kind === "iris") {
      const g = toGlyph(eye, p.x, p.y);
      setEye({ ...eye, iris: clampIris({ x: g.x + d.dx, y: g.y + d.dy }) });
    } else change({ ...eye, fx: p.x / w + d.dx, fy: p.y / h + d.dy });
  };
  const onUp = () => (drag.current = null);

  const background = eye.background;
  const lightBackground = !background || contrast(background, "#FFFFFF") < 3;
  const file = (ext: string, extra = "") => `ohtuleht-eye-${eye.style}${background ? "" : "-transparent"}${extra}.${ext}`;
  const savePng = async () => {
    try {
      const name = file("png", `-${pngWidth}px`);
      download(await eyePng(eye, pngWidth), name);
      toast.success(t.pngDone(name));
    } catch {
      toast.error(t.pngFailed);
    }
  };
  const saveSvg = () => {
    const name = file("svg");
    download(new Blob([svg], { type: "image/svg+xml" }), name);
    toast.success(t.pngDone(name));
  };

  const checker = background
    ? undefined
    : {
        backgroundImage: `repeating-conic-gradient(${eye.style === "outline" ? "#3a3a3a 0% 25%, #2b2b2b 0% 50%" : "#e8e8e8 0% 25%, #ffffff 0% 50%"})`,
        backgroundSize: "24px 24px",
      };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="min-w-0 space-y-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-lg font-semibold">{t.previewTitle}</h2>
          <span className="text-xs text-muted-foreground">
            {w} × {h}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">{t.intro}</p>
        <div
          ref={view}
          role="img"
          aria-label={t.previewLabel}
          className="relative mx-auto w-full max-w-[640px] cursor-grab touch-none overflow-hidden rounded-xl border active:cursor-grabbing"
          style={{ aspectRatio: `${w} / ${h}`, ...checker, backgroundColor: background ?? undefined }}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
        >
          <img src={svgDataUrl(svg)} alt="" draggable={false} className="pointer-events-none absolute inset-0 size-full select-none" />
        </div>
        <p className="text-center text-xs text-muted-foreground">{t.previewHint}</p>
        {stopped && (
          <p role="status" className="rounded-md border border-yellow-500/50 bg-yellow-300/20 p-2 text-center text-sm">
            {t.stopped(t.rules[stopped]!)}
          </p>
        )}
        {eye.style === "outline" && lightBackground && (
          <p role="alert" className="flex items-start gap-2 rounded-md border border-yellow-500/50 bg-yellow-300/20 p-2 text-sm">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden /> {t.outlineWarning}
          </p>
        )}
        <section aria-label={t.safety} className="rounded-xl border bg-card p-4">
          <h3 className="font-medium">{t.safety}</h3>
          <p className="mb-2 text-sm text-muted-foreground">{t.safetyIntro}</p>
          <ul className="space-y-1 text-sm">
            {RULES.map((id) => {
              const ok = !safety.broken.includes(id);
              return (
                <li key={id} className="flex items-start gap-2">
                  <Check className={`mt-0.5 size-4 shrink-0 ${ok ? "text-green-600" : "text-destructive"}`} aria-hidden />
                  <span className="flex-1">{t.rules[id]}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {Math.round(safety.shares[id] * 100)}% / {Math.round(LIMITS[id] * 100)}%
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <div className="space-y-5">
        <section className="space-y-2">
          <h3 className="font-medium">{t.style}</h3>
          <Tabs value={eye.style} onValueChange={(v) => setEye({ ...eye, style: v as EyeState["style"] })}>
            <TabsList className="w-full">
              <TabsTrigger value="filled" className="flex-1">
                {t.filled}
              </TabsTrigger>
              <TabsTrigger value="outline" className="flex-1">
                {t.outline}
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <p className="text-xs text-muted-foreground">{eye.style === "filled" ? t.filledHint : t.outlineHint}</p>
        </section>

        <section className="space-y-2">
          <h3 className="font-medium">{t.presets}</h3>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <Button key={p.id} variant="outline" size="sm" onClick={() => (setEye(applyPreset(eye, p)), setStopped(null))}>
                {t.presetNames[p.id]}
              </Button>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">{t.adjust}</h3>
            <Button variant="ghost" size="sm" className="gap-2" onClick={() => (setEye({ ...newEye(eye.style), ratio: eye.ratio, background: eye.background }), setStopped(null))}>
              <RotateCcw className="size-4" /> {t.reset}
            </Button>
          </div>
          <Slider label={t.rotation} value={eye.angle} min={-180} max={180} unit="°" onChange={(v) => change({ ...eye, angle: v })} />
          <Slider label={t.size} value={eye.size * 100} min={40} max={220} unit="%" onChange={(v) => change({ ...eye, size: v / 100 })} />
          <Slider label={t.horizontal} value={eye.fx * 100} min={-30} max={130} unit="%" onChange={(v) => change({ ...eye, fx: v / 100 })} />
          <Slider label={t.vertical} value={eye.fy * 100} min={-30} max={130} unit="%" onChange={(v) => change({ ...eye, fy: v / 100 })} />
          <Slider label={t.lookX} value={eye.iris.x} min={403} max={759} onChange={(v) => setEye({ ...eye, iris: clampIris({ x: v, y: eye.iris.y }) })} />
          <Slider label={t.lookY} value={eye.iris.y} min={525} max={900} onChange={(v) => setEye({ ...eye, iris: clampIris({ x: eye.iris.x, y: v }) })} />
        </section>

        <section className="space-y-2">
          <h3 className="font-medium">{t.canvas}</h3>
          <Tabs value={RATIOS.find((r) => r.ratio[0] === eye.ratio[0] && r.ratio[1] === eye.ratio[1])?.id} onValueChange={(v) => setRatio(RATIOS.find((r) => r.id === v)!.ratio)}>
            <TabsList className="w-full flex-wrap">
              {RATIOS.map((r) => (
                <TabsTrigger key={r.id} value={r.id} className="flex-1">
                  {r.id}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </section>

        <section className="space-y-2">
          <h3 className="font-medium">{t.background}</h3>
          <div className="flex flex-wrap gap-2">
            {SWATCHES.map((s) => {
              const on = !custom && (s.value ?? null) === (background ?? null);
              return (
                <button
                  key={s.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => (setCustom(false), setEye({ ...eye, background: s.value }))}
                  className={`flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm ${on ? "border-primary ring-2 ring-primary/30" : "hover:bg-muted"}`}
                >
                  <span className="size-4 rounded-full border" style={s.value ? { backgroundColor: s.value } : { backgroundImage: "repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%)", backgroundSize: "8px 8px" }} />
                  {s.label()}
                </button>
              );
            })}
            <button
              type="button"
              aria-pressed={custom}
              onClick={() => (setCustom(true), setEye({ ...eye, background: customColor }))}
              className={`rounded-md border px-2.5 py-1.5 text-sm ${custom ? "border-primary ring-2 ring-primary/30" : "hover:bg-muted"}`}
            >
              {t.custom}
            </button>
          </div>
          {custom && (
            <ColorField
              label={t.customLabel}
              value={customColor}
              onChange={(hex) => {
                setCustomColor(hex);
                setEye({ ...eye, background: hex });
              }}
            />
          )}
        </section>

        <section className="space-y-3 rounded-xl border bg-card p-4">
          <h3 className="font-medium">{t.download}</h3>
          <div className="space-y-1.5">
            <div className="text-sm">{t.pngWidth}</div>
            <Tabs value={String(pngWidth)} onValueChange={(v) => setPngWidth(Number(v))}>
              <TabsList className="w-full">
                {PNG_WIDTHS.map((n) => (
                  <TabsTrigger key={n} value={String(n)} className="flex-1">
                    {n}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
          <div className="flex gap-2">
            <Button className="flex-1 gap-2" onClick={savePng}>
              <Download className="size-4" /> {t.png}
            </Button>
            <Button className="flex-1 gap-2" variant="outline" onClick={saveSvg}>
              <Download className="size-4" /> {t.svg}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">{t.fileHint}</p>
        </section>
      </div>
    </div>
  );
}
