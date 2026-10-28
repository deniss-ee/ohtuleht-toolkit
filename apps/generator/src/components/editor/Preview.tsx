import { useEffect, useRef, useState } from "react";
import { FlaskConical, Pin, PinOff, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { editor as t } from "@/content";
import { renderPreview, type Draft } from "@/lib/banner";

const W = 1250;
const H = 400;

// Shown instead of the banner until there is something to show: tells a new person what to do.
function EmptyGuide({ onAddArticles, onTryExample }: { onAddArticles: () => void; onTryExample: () => void }) {
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
        <Button className="gap-2" onClick={onAddArticles}>
          <Plus className="size-4" /> {t.emptyGoArticles}
        </Button>
        <Button variant="outline" className="gap-2" onClick={onTryExample}>
          <FlaskConical className="size-4" /> {t.emptyTryExample}
        </Button>
      </div>
    </div>
  );
}

// Live banner in an iframe at full size when the screen allows, otherwise scaled to fit.
// Re-renders shortly after edits stop. The pin keeps it in view while scrolling the form.
export function Preview({
  draft,
  pinned,
  onPin,
  onAddArticles,
  onTryExample,
}: {
  draft: Draft;
  pinned: boolean;
  onPin: (v: boolean) => void;
  onAddArticles: () => void;
  onTryExample: () => void;
}) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [html, setHtml] = useState("");
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [loaded, setLoaded] = useState(false);
  const empty = draft.config.articles.length === 0;

  useEffect(() => {
    if (empty) return;
    const id = setTimeout(() => {
      setLoaded(false);
      setHtml(renderPreview(draft, theme));
    }, 300);
    return () => clearTimeout(id);
  }, [draft, theme, empty]);

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
          <EmptyGuide onAddArticles={onAddArticles} onTryExample={onTryExample} />
        ) : (
          <>
            {!loaded && <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">{t.previewLoading}</div>}
            <iframe
              title="Banner preview"
              srcDoc={html}
              onLoad={() => setLoaded(true)}
              sandbox="allow-scripts allow-popups"
              width={W}
              height={H}
              style={{ border: 0, transform: `scale(${scale})`, transformOrigin: "top left", display: "block" }}
            />
          </>
        )}
      </div>
    </div>
  );
}
