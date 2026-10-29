import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { Check, ChevronRight, Download, RotateCcw, RotateCw, TriangleAlert, X } from "lucide-react";
import { brand } from "@ohtuleht/brand";
import { contrast } from "@ohtuleht/templates";
import { toast } from "sonner";
import { ColorField } from "@/components/editor/ColorField";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { brandEye as t } from "@/content";
import { applyPreset, canvasOf, checkSafety, clampIris, eyePng, eyeSvg, IRIS_R, LIMITS, newEye, PRESETS, RATIOS, toGlyph, type EyeState, type RuleId } from "@/lib/eye";
import { download } from "@/lib/zip";

const RULES: RuleId[] = ["iris", "cap", "eye", "letter"];
const PNG_WIDTHS = [512, 1024, 2048];
const HANDLE_REACH = 540; // how far above the letter's middle the turn handle sits (glyph units)

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

const wrapAngle = (a: number) => ((((a + 180) % 360) + 360) % 360) - 180;

// Brand manual tab: make the brand eye in any look, as PNG or SVG.
export function BrandEye() {
  const [eye, setEye] = useState<EyeState>(() => newEye());
  const [pngWidth, setPngWidth] = useState(1024);
  const [custom, setCustom] = useState(false);
  const [customColor, setCustomColor] = useState("#F5F0E6");
  const view = useRef<HTMLDivElement>(null);
  const drag = useRef<{ kind: "iris" | "letter" | "turn"; dx: number; dy: number } | null>(null);
  const pending = useRef<{ x: number; y: number } | null>(null); // latest pointer position, handled once per frame
  const frame = useRef(0);
  const eyeRef = useRef(eye);
  eyeRef.current = eye;

  const svg = useMemo(() => eyeSvg(eye), [eye]);
  const safety = useMemo(() => checkSafety(eye), [eye]);
  const { w, h } = canvasOf(eye.ratio);

  // The letter moves freely. A broken safety rule shows a red cross on the picture and blocks the download.
  const change = (next: EyeState) => setEye(next);
  // A new picture shape may make the current place unsafe: go back to the middle then.
  const setRatio = (ratio: [number, number]) => {
    const next = { ...eye, ratio };
    setEye(checkSafety(next).ok ? next : { ...next, angle: 0, fx: 0.5, fy: 0.5, size: 1 });
  };

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  const point = (clientX: number, clientY: number) => {
    const r = view.current!.getBoundingClientRect();
    return { x: ((clientX - r.left) / r.width) * w, y: ((clientY - r.top) / r.height) * h };
  };
  const start = (e: PointerEvent, kind: "iris" | "letter" | "turn") => {
    const p = point(e.clientX, e.clientY);
    if (kind === "iris") {
      const g = toGlyph(eye, p.x, p.y);
      drag.current = { kind, dx: eye.iris.x - g.x, dy: eye.iris.y - g.y };
    } else drag.current = { kind, dx: eye.fx - p.x / w, dy: eye.fy - p.y / h };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onDown = (e: PointerEvent) => {
    const p = point(e.clientX, e.clientY);
    const g = toGlyph(eye, p.x, p.y);
    start(e, Math.hypot(g.x - eye.iris.x, g.y - eye.iris.y) <= IRIS_R * 1.15 ? "iris" : "letter");
  };
  // Pointer moves come faster than the screen draws: only the latest one is handled, once per frame.
  const handle = () => {
    frame.current = 0;
    const d = drag.current;
    const p = pending.current;
    const cur = eyeRef.current;
    if (!d || !p) return;
    if (d.kind === "iris") {
      const g = toGlyph(cur, p.x, p.y);
      setEye({ ...cur, iris: clampIris({ x: g.x + d.dx, y: g.y + d.dy }) });
    } else if (d.kind === "turn") {
      const { w: cw, h: ch } = canvasOf(cur.ratio);
      change({ ...cur, angle: (Math.atan2(p.x - cur.fx * cw, -(p.y - cur.fy * ch)) * 180) / Math.PI });
    } else change({ ...cur, fx: p.x / w + d.dx, fy: p.y / h + d.dy });
  };
  const onMove = (e: PointerEvent) => {
    if (!drag.current) return;
    pending.current = point(e.clientX, e.clientY);
    if (!frame.current) frame.current = requestAnimationFrame(handle);
  };
  const onUp = () => {
    drag.current = null;
    pending.current = null;
  };
  const onTurnKey = (e: KeyboardEvent) => {
    const step = e.shiftKey ? 15 : 5;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") change({ ...eye, angle: wrapAngle(eye.angle + step) });
    else if (e.key === "ArrowLeft" || e.key === "ArrowDown") change({ ...eye, angle: wrapAngle(eye.angle - step) });
    else return;
    e.preventDefault();
  };

  // The turn handle sits above the letter, in the direction the letter points; kept inside the picture.
  const rad = (eye.angle * Math.PI) / 180;
  const hx = Math.min(w - 24, Math.max(24, eye.fx * w + Math.sin(rad) * HANDLE_REACH * eye.size));
  const hy = Math.min(h - 24, Math.max(24, eye.fy * h - Math.cos(rad) * HANDLE_REACH * eye.size));

  const background = eye.background;
  const badOutline = eye.style === "outline" && !!background && contrast(background, "#FFFFFF") < 3;
  const file = (ext: string, extra = "") => `ohtuleht-eye-${eye.style}${background ? "" : "-transparent"}${extra}.${ext}`;
  const savePng = async () => {
    if (!safety.ok) return;
    try {
      const name = file("png", `-${pngWidth}px`);
      download(await eyePng(eye, pngWidth), name);
      toast.success(t.pngDone(name));
    } catch {
      toast.error(t.pngFailed);
    }
  };
  const saveSvg = () => {
    if (!safety.ok) return;
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
    <div className="grid gap-x-6 gap-y-4 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="min-w-0 space-y-3">
        <section aria-label={t.safety} className="rounded-xl border bg-card p-3">
          <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3">
            <h2 className="text-sm font-semibold">{t.safety}</h2>
            <span className="text-xs text-muted-foreground">{t.safetyIntro}</span>
          </div>
          <ul className="grid gap-2 text-sm sm:grid-cols-2">
            {RULES.map((id) => {
              const ok = !safety.broken.includes(id);
              const Icon = ok ? Check : X;
              return (
                <li
                  key={id}
                  title={`${Math.round(safety.shares[id] * 100)}% / ${Math.round(LIMITS[id] * 100)}%`}
                  className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 ${ok ? "border-green-600/40 bg-green-600/10" : "border-red-600/60 bg-red-600/15 text-red-700 dark:text-red-300"}`}
                >
                  <span className={`flex size-5 shrink-0 items-center justify-center rounded-full text-white ${ok ? "bg-green-600" : "bg-red-600"}`}>
                    <Icon className="size-3.5" strokeWidth={3} aria-hidden />
                  </span>
                  <span>{t.rules[id]}</span>
                </li>
              );
            })}
          </ul>
        </section>

        {/* The picture fits the screen height, so the controls beside it stay in view. Notes and the red cross are drawn on top of it, so nothing around it moves. */}
        <div
          ref={view}
          role="img"
          aria-label={t.previewLabel}
          className="relative mx-auto cursor-grab touch-none overflow-hidden rounded-xl border active:cursor-grabbing"
          style={{ aspectRatio: `${w} / ${h}`, width: `min(100%, calc((100vh - 25rem) * ${w / h}))`, minWidth: "min(100%, 240px)", ...checker, backgroundColor: background ?? undefined }}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
        >
          <div className="pointer-events-none absolute inset-0 select-none [&>svg]:size-full" dangerouslySetInnerHTML={{ __html: svg }} />
          {!safety.ok && (
            <>
              <div className="pointer-events-none absolute inset-0 rounded-xl ring-4 ring-inset ring-red-600/85" aria-hidden />
              <svg className="pointer-events-none absolute inset-0 size-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
                <path d="M8 8L92 92M92 8L8 92" stroke="#e00000" strokeWidth="1.2" strokeLinecap="round" vectorEffect="non-scaling-stroke" opacity=".75" />
              </svg>
              <p role="status" className="pointer-events-none absolute inset-x-2 bottom-2 flex items-start gap-2 rounded-md border border-red-600 bg-red-50/95 p-2 text-xs text-black shadow">
                <TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-red-600" aria-hidden /> {t.unsafe(t.rules[safety.broken[0]!]!, safety.broken.length - 1)}
              </p>
            </>
          )}
          {safety.ok && badOutline && (
            <p role="status" className="pointer-events-none absolute inset-x-2 bottom-2 flex items-start gap-2 rounded-md border border-yellow-500/60 bg-yellow-100/95 p-2 text-xs text-black shadow">
              <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden /> {t.outlineWarning}
            </p>
          )}
          <button
            type="button"
            aria-label={t.turnHandle}
            title={t.turnHandle}
            onPointerDown={(e) => (e.stopPropagation(), start(e, "turn"))}
            onKeyDown={onTurnKey}
            className="absolute flex size-8 -translate-x-1/2 -translate-y-1/2 cursor-grab items-center justify-center rounded-full border-2 border-white bg-primary text-primary-foreground shadow-md active:cursor-grabbing"
            style={{ left: `${(hx / w) * 100}%`, top: `${(hy / h) * 100}%` }}
          >
            <RotateCw className="size-4" aria-hidden />
          </button>
        </div>
        <p className="text-center text-xs text-muted-foreground">{t.previewHint}</p>
      </div>

      <div className="space-y-4">
        <section className="space-y-2">
          <h3 className="text-sm font-medium">{t.style}</h3>
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
          <h3 className="text-sm font-medium">{t.presets}</h3>
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((p) => (
              <Button key={p.id} variant="outline" size="sm" onClick={() => setEye(applyPreset(eye, p))}>
                {t.presetNames[p.id]}
              </Button>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">{t.adjust}</h3>
            <Button variant="ghost" size="sm" className="gap-2" onClick={() => setEye({ ...newEye(eye.style), ratio: eye.ratio, background: eye.background })}>
              <RotateCcw className="size-4" /> {t.reset}
            </Button>
          </div>
          <Slider label={t.rotation} value={eye.angle} min={-180} max={180} unit="°" onChange={(v) => change({ ...eye, angle: v })} />
          <Slider label={t.size} value={eye.size * 100} min={40} max={220} unit="%" onChange={(v) => change({ ...eye, size: v / 100 })} />
        </section>

        <section className="space-y-3 rounded-xl border bg-card p-3">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className="text-sm font-medium">{t.download}</div>
              <div className="text-xs text-muted-foreground">{t.pngWidth}</div>
            </div>
            <Tabs value={String(pngWidth)} onValueChange={(v) => setPngWidth(Number(v))}>
              <TabsList>
                {PNG_WIDTHS.map((n) => (
                  <TabsTrigger key={n} value={String(n)}>
                    {n}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
          <div className="flex gap-2">
            <Button className="flex-1 gap-2" disabled={!safety.ok} onClick={savePng}>
              <Download className="size-4" /> {t.png}
            </Button>
            <Button className="flex-1 gap-2" variant="outline" disabled={!safety.ok} onClick={saveSvg}>
              <Download className="size-4" /> {t.svg}
            </Button>
          </div>
          {!safety.ok && <p className="text-xs text-destructive">{t.cannotDownload}</p>}
        </section>

        <details className="group rounded-xl border bg-card">
          <summary className="flex cursor-pointer list-none items-center gap-2 p-3 text-sm font-medium [&::-webkit-details-marker]:hidden">
            <span className="flex-1">
              {t.moreOptions}
              <span className="block text-xs font-normal text-muted-foreground">{t.moreHint}</span>
            </span>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90" />
          </summary>
          <div className="space-y-4 border-t p-3">
            <div className="space-y-2">
              <h4 className="text-sm font-medium">{t.canvas}</h4>
              <Tabs value={RATIOS.find((r) => r.ratio[0] === eye.ratio[0] && r.ratio[1] === eye.ratio[1])?.id} onValueChange={(v) => setRatio(RATIOS.find((r) => r.id === v)!.ratio)}>
                <TabsList className="w-full">
                  {RATIOS.map((r) => (
                    <TabsTrigger key={r.id} value={r.id} className="flex-1">
                      {r.id}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium">{t.background}</h4>
              <div className="flex flex-wrap gap-1.5">
                {SWATCHES.map((s) => {
                  const on = !custom && (s.value ?? null) === (background ?? null);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => (setCustom(false), setEye({ ...eye, background: s.value }))}
                      className={`flex items-center gap-2 rounded-md border px-2 py-1 text-sm ${on ? "border-primary ring-2 ring-primary/30" : "hover:bg-muted"}`}
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
                  className={`rounded-md border px-2 py-1 text-sm ${custom ? "border-primary ring-2 ring-primary/30" : "hover:bg-muted"}`}
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
            </div>

            <div className="space-y-3">
              <Slider label={t.horizontal} value={eye.fx * 100} min={-30} max={130} unit="%" onChange={(v) => change({ ...eye, fx: v / 100 })} />
              <Slider label={t.vertical} value={eye.fy * 100} min={-30} max={130} unit="%" onChange={(v) => change({ ...eye, fy: v / 100 })} />
              <Slider label={t.lookX} value={eye.iris.x} min={403} max={759} onChange={(v) => setEye({ ...eye, iris: clampIris({ x: v, y: eye.iris.y }) })} />
              <Slider label={t.lookY} value={eye.iris.y} min={525} max={900} onChange={(v) => setEye({ ...eye, iris: clampIris({ x: eye.iris.x, y: v }) })} />
            </div>
          </div>
        </details>
        <p className="text-xs text-muted-foreground">{t.fileHint}</p>
      </div>
    </div>
  );
}
