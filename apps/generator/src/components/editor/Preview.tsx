import { useEffect, useRef, useState } from "react";
import { Bookmark, FlaskConical, Loader2, Pin, PinOff, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { editor as t, ui } from "@/content";
import { SwapFrame, type Geometry } from "@/components/editor/SwapFrame";
import { FORMATS, renderPreview, type Draft } from "@/lib/banner";

// Common phone widths (CSS pixels).
const PHONES = [
  { name: "SE 375", w: 375 },
  { name: "390", w: 390 },
  { name: "Max 430", w: 430 },
];

// Shown instead of the banner until there is something to show: tells a new person what to do.
function EmptyGuide({ onAddArticles, onTryExample, onOpenBookmark, working }: { onAddArticles: () => void; onTryExample: () => void; onOpenBookmark: () => void; working: boolean }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 overflow-auto p-4 text-center">
      <div>
        <h2 className="text-lg font-semibold">{t.emptyTitle}</h2>
        <p className="text-sm text-muted-foreground">{t.emptyText}</p>
      </div>
      <ol className="space-y-2 text-left text-sm">
        {t.emptySteps.map((text, i) => (
          <li key={i} className="flex items-start gap-3">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">{i + 1}</span>
            <span className="pt-0.5">{text}</span>
          </li>
        ))}
      </ol>
      <div className="flex flex-wrap justify-center gap-2">
        <Button className="gap-2" onClick={onOpenBookmark}>
          <Bookmark className="size-4" /> {t.emptySetupBookmark}
        </Button>
        <Button variant="outline" className="gap-2" onClick={onAddArticles}>
          <Plus className="size-4" /> {t.emptyGoArticles}
        </Button>
        <Button variant="outline" className="gap-2" disabled={working} onClick={onTryExample}>
          {working ? <Loader2 className="size-4 animate-spin" /> : <FlaskConical className="size-4" />} {working ? t.preparing : t.emptyTryExample}
        </Button>
      </div>
    </div>
  );
}

// Live banner in a frame at full size when the screen allows, otherwise scaled to fit.
// A change is rendered in a second, hidden frame first; it replaces the visible one only when its fonts and
// images are ready. So there is no blank flash and no jumping fonts while you edit.
export function Preview({
  draft,
  pinned,
  onPin,
  onAddArticles,
  onTryExample,
  onOpenBookmark,
  working,
}: {
  draft: Draft;
  pinned: boolean;
  onPin: (v: boolean) => void;
  onAddArticles: () => void;
  onTryExample: () => void;
  onOpenBookmark: () => void;
  working: boolean;
}) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const box = useRef<HTMLDivElement>(null);
  const [boxW, setBoxW] = useState(1250);
  const mobile = draft.config.format === "articles-mobile";
  const [phone, setPhone] = useState(375); // phones differ in width: the wider the phone, the more of the next card shows
  const { height: H } = FORMATS[draft.config.format];
  const W = mobile ? phone : FORMATS[draft.config.format].width;
  const empty = draft.config.articles.length === 0;
  // The size of the frame on screen. It follows a change (desktop/mobile, phone width) only when the new frame is ready,
  // so the area never shows the old banner in the new size.
  const [shown, setShown] = useState<Geometry>({ width: W, height: H });
  const scaleFor = (w: number) => Math.min(1, boxW / w);
  const shownW = Number(shown.width);
  const scale = scaleFor(shownW);
  const shownMobile = shownW !== FORMATS["articles-1250x400"].width;

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setBoxW(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const pct = Math.round(scale * 100);
  return (
    <div className="space-y-2">
      <div className="flex min-h-8 flex-wrap items-center justify-between gap-2">
        <div className="flex items-baseline gap-3">
          <span className="text-sm font-semibold">{t.previewTitle}</span>
          {!empty && <span className="text-xs text-muted-foreground">{shownMobile ? t.previewMobile(shownW) : pct < 100 ? t.previewScaled(pct, FORMATS[draft.config.format].label) : t.previewFull(FORMATS[draft.config.format].label)}</span>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant={pinned ? "secondary" : "ghost"} size="sm" className="gap-1.5" aria-pressed={pinned} onClick={() => onPin(!pinned)}>
            {pinned ? <Pin className="size-4" /> : <PinOff className="size-4" />}
            {t.pin}
          </Button>
          {mobile && (
            <Tabs value={String(phone)} onValueChange={(v) => setPhone(Number(v))}>
              <TabsList aria-label={t.phoneWidth}>
                {PHONES.map((p) => (
                  <TabsTrigger key={p.w} value={String(p.w)}>
                    {p.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          )}
          <Tabs value={theme} onValueChange={(v) => setTheme(v as "light" | "dark")}>
            <TabsList>
              <TabsTrigger value="light">{t.light}</TabsTrigger>
              <TabsTrigger value="dark">{t.dark}</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
      <div ref={box} className={empty ? "relative w-full overflow-hidden rounded-xl border border-dashed" : "relative w-full overflow-hidden"} style={{ height: Math.max(shown.height * scale, empty ? 300 : 0), transition: "height .25s ease" }}>
        {/* The phone banner is narrow: keep it in the middle of the wide preview area. */}
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2" style={{ width: shownMobile && !empty ? shownW * scale : "100%", transition: "width .25s ease" }}>
        {empty ? (
          <EmptyGuide onAddArticles={onAddArticles} onTryExample={onTryExample} onOpenBookmark={onOpenBookmark} working={working} />
        ) : (
          <SwapFrame build={(id) => renderPreview(draft, theme, id)} deps={[draft, theme, W, H]} width={W} height={H} scaleFor={scaleFor} onShown={setShown} title={ui.bannerPreview} />
        )}
        </div>
      </div>
    </div>
  );
}
