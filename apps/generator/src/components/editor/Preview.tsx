import { useEffect, useRef, useState } from "react";
import { Pin, PinOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { editor as t } from "@/content";
import { renderPreview, type Draft } from "@/lib/banner";

const W = 1250;
const H = 400;

// Live banner in an iframe at full size when the screen allows, otherwise scaled to fit.
// Re-renders shortly after edits stop. The pin keeps it in view while scrolling the form.
export function Preview({ draft, pinned, onPin }: { draft: Draft; pinned: boolean; onPin: (v: boolean) => void }) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [html, setHtml] = useState("");
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => {
      setLoaded(false);
      setHtml(renderPreview(draft, theme));
    }, 300);
    return () => clearTimeout(id);
  }, [draft, theme]);

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
          <span className="text-xs text-muted-foreground">{pct < 100 ? t.previewScaled(pct) : t.previewFull}</span>
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
      <div ref={box} className="relative w-full overflow-hidden rounded-md border bg-muted" style={{ height: H * scale }}>
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
      </div>
    </div>
  );
}
