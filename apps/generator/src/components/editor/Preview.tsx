import { useEffect, useRef, useState } from "react";
import { Bookmark, FlaskConical, Pin, PinOff, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { editor as t } from "@/content";
import { renderPreview, type Draft } from "@/lib/banner";

const W = 1250;
const H = 400;

interface Frame {
  id: number;
  html: string;
}

// Shown instead of the banner until there is something to show: tells a new person what to do.
function EmptyGuide({ onAddArticles, onTryExample, onOpenBookmark }: { onAddArticles: () => void; onTryExample: () => void; onOpenBookmark: () => void }) {
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
        <Button variant="outline" className="gap-2" onClick={onTryExample}>
          <FlaskConical className="size-4" /> {t.emptyTryExample}
        </Button>
      </div>
    </div>
  );
}

function BannerFrame({ frame, scale, hidden, frameRef }: { frame: Frame; scale: number; hidden?: boolean; frameRef?: (el: HTMLIFrameElement | null) => void }) {
  return (
    <iframe
      ref={frameRef}
      title="Banner preview"
      srcDoc={frame.html}
      sandbox="allow-scripts allow-popups"
      width={W}
      height={H}
      tabIndex={hidden ? -1 : undefined}
      aria-hidden={hidden}
      style={{
        border: 0,
        transform: `scale(${scale})`,
        transformOrigin: "top left",
        display: "block",
        position: hidden ? "absolute" : "relative",
        top: 0,
        left: 0,
        visibility: hidden ? "hidden" : "visible",
        pointerEvents: hidden ? "none" : "auto",
      }}
    />
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
}: {
  draft: Draft;
  pinned: boolean;
  onPin: (v: boolean) => void;
  onAddArticles: () => void;
  onTryExample: () => void;
  onOpenBookmark: () => void;
}) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [current, setCurrent] = useState<Frame | null>(null);
  const [pending, setPending] = useState<Frame | null>(null);
  const pendingFrame = useRef<HTMLIFrameElement | null>(null);
  const counter = useRef(0);
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const empty = draft.config.articles.length === 0;

  // Prepare the next version shortly after edits stop.
  useEffect(() => {
    if (empty) return;
    const timer = setTimeout(() => {
      const id = ++counter.current;
      setPending({ id, html: renderPreview(draft, theme, id) });
    }, 300);
    return () => clearTimeout(timer);
  }, [draft, theme, empty]);

  // The hidden frame says "ready" when fonts, images and the page have loaded; then it takes over.
  useEffect(() => {
    if (!pending) return;
    const swap = () => {
      setCurrent(pending);
      setPending(null);
    };
    const onMessage = (e: MessageEvent) => {
      if (e.source === pendingFrame.current?.contentWindow && (e.data as { olPreview?: number } | null)?.olPreview === pending.id) swap();
    };
    window.addEventListener("message", onMessage);
    const fallback = setTimeout(swap, 4000); // never leave an old version showing for long
    return () => {
      window.removeEventListener("message", onMessage);
      clearTimeout(fallback);
    };
  }, [pending]);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setScale(Math.min(1, el.clientWidth / W)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const pct = Math.round(scale * 100);
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-baseline gap-3">
          <span className="text-sm font-semibold">{t.previewTitle}</span>
          {!empty && <span className="text-xs text-muted-foreground">{pct < 100 ? t.previewScaled(pct) : t.previewFull}</span>}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="gap-1.5" aria-pressed={pinned} onClick={() => onPin(!pinned)}>
            {pinned ? <Pin className="size-4" /> : <PinOff className="size-4" />}
            {t.pin}
          </Button>
          <Tabs value={theme} onValueChange={(v) => setTheme(v as "light" | "dark")}>
            <TabsList>
              <TabsTrigger value="light">{t.light}</TabsTrigger>
              <TabsTrigger value="dark">{t.dark}</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
      <div ref={box} className={empty ? "relative w-full overflow-hidden rounded-xl border border-dashed" : "relative w-full overflow-hidden"} style={{ height: Math.max(H * scale, empty ? 300 : 0) }}>
        {empty ? (
          <EmptyGuide onAddArticles={onAddArticles} onTryExample={onTryExample} onOpenBookmark={onOpenBookmark} />
        ) : (
          <>
            {!current && <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">{t.previewLoading}</div>}
            {current && <BannerFrame key={current.id} frame={current} scale={scale} />}
            {pending && <BannerFrame key={pending.id} frame={pending} scale={scale} hidden frameRef={(el) => (pendingFrame.current = el)} />}
          </>
        )}
      </div>
    </div>
  );
}
