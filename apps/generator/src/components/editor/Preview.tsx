import { useEffect, useRef, useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { renderPreview, type Draft } from "@/lib/banner";

const W = 1250;
const H = 400;

// Live banner in an iframe, scaled down to fit the column. Re-renders shortly after edits stop.
export function Preview({ draft }: { draft: Draft }) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [html, setHtml] = useState("");
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const id = setTimeout(() => setHtml(renderPreview(draft, theme)), 300);
    return () => clearTimeout(id);
  }, [draft, theme]);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setScale(Math.min(1, el.clientWidth / W)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          Preview {W}x{H}, shown at {Math.round(scale * 100)}%
        </span>
        <Tabs value={theme} onValueChange={(v) => setTheme(v as "light" | "dark")}>
          <TabsList>
            <TabsTrigger value="light">Light</TabsTrigger>
            <TabsTrigger value="dark">Dark</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <div ref={box} className="w-full overflow-hidden rounded-md border" style={{ height: H * scale }}>
        <iframe
          title="Banner preview"
          srcDoc={html}
          sandbox="allow-scripts allow-popups"
          width={W}
          height={H}
          style={{ border: 0, transform: `scale(${scale})`, transformOrigin: "top left", display: "block" }}
        />
      </div>
    </div>
  );
}
