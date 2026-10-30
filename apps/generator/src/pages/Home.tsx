import { useEffect, useRef, useState } from "react";
import { Clapperboard, Crop, Eye, FileSearch, FileText, House, Images, Link2, ListChecks, Megaphone, Search, Lightbulb, Newspaper, Palette, PanelTop, PenLine, Replace, Shapes, Smartphone, Type, type LucideIcon } from "lucide-react";
import { ContinueCard } from "@/components/editor/ContinueCard";
import { StartCard } from "@/components/editor/StartCard";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/editor/PageHeader";
import { home as t, nav, ui, type PageId, type ToolInfo } from "@/content";
import type { BrandTab } from "@/lib/route";
import type { SavedInfo } from "@/lib/storage";

// Where a card leads. `make` opens a new banner of that type.
export interface Destination {
  page: PageId;
  tool?: ToolInfo["id"];
  tab?: BrandTab;
  make?: string;
}

// One icon and destination per card id (the texts are in content: home.groups).
const ITEMS: Record<string, { icon: LucideIcon; to: Destination }> = {
  "articles-1250x400": { icon: Newspaper, to: { page: "content", make: "articles-1250x400" } },
  "articles-mobile": { icon: Smartphone, to: { page: "content", make: "articles-mobile" } },
  "image-slider-1250x400": { icon: Images, to: { page: "content", make: "image-slider-1250x400" } },
  "image-slider-600x500": { icon: Smartphone, to: { page: "content", make: "image-slider-600x500" } },
  "header-bar": { icon: PanelTop, to: { page: "content", make: "header-bar" } },
  "movie-banner": { icon: Clapperboard, to: { page: "tools", tool: "movie-banner" } },
  "image-cropper": { icon: Crop, to: { page: "tools", tool: "image-cropper" } },
  "article-scraper": { icon: FileSearch, to: { page: "tools", tool: "article-scraper" } },
  "picture-converter": { icon: Replace, to: { page: "tools", tool: "picture-converter" } },
  "utm-builder": { icon: Link2, to: { page: "tools", tool: "utm-builder" } },
  "email-signature": { icon: PenLine, to: { page: "tools", tool: "email-signature" } },
  "banner-request": { icon: Megaphone, to: { page: "request" } },
  "task-tracker": { icon: ListChecks, to: { page: "tasks" } },
  colours: { icon: Palette, to: { page: "brand", tab: "colours" } },
  logos: { icon: Shapes, to: { page: "brand", tab: "logos" } },
  fonts: { icon: Type, to: { page: "brand", tab: "fonts" } },
  eye: { icon: Eye, to: { page: "brand", tab: "eye" } },
};

// The first screen: what is here, and one click to each thing.
export function Home({ saved, onContinue, onDiscard, onGo }: { saved: SavedInfo | null; onContinue: () => void; onDiscard: () => void; onGo: (to: Destination) => void }) {
  const [query, setQuery] = useState("");
  const box = useRef<HTMLInputElement>(null);
  // The "/" key jumps to the search box (unless a field already has the focus).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (e.key === "/" && tag !== "INPUT" && tag !== "TEXTAREA" && tag !== "SELECT") {
        e.preventDefault();
        box.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const q = query.trim().toLowerCase();
  const groups = t.groups.map((g) => ({ ...g, items: q ? g.items.filter((i) => `${i.name} ${i.text}`.toLowerCase().includes(q)) : g.items })).filter((g) => g.items.length > 0);
  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <PageHeader icon={House} title={t.title} intro={t.intro} />

      {saved && <ContinueCard saved={saved} onContinue={onContinue} onDiscard={onDiscard} />}

      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input ref={box} type="search" aria-label={t.search} className="h-10 pl-9" placeholder={t.searchPlaceholder} value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>
      {q && groups.length === 0 && <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">{t.noResults(query.trim())}</p>}

      {groups.map((g) => (
        <section key={g.title} aria-labelledby={`home-${g.id}`} className="space-y-3">
          <div>
            <h2 id={`home-${g.id}`} className="text-lg font-semibold">
              {g.title}
            </h2>
            {g.text && <p className="text-sm text-muted-foreground">{g.text}</p>}
          </div>
          <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {g.items.map((i) => {
              const item = ITEMS[i.id];
              if (!item) return null;
              const off = nav.find((n) => n.id === item.to.page)?.ready === false;
              return <StartCard key={i.id} icon={item.icon} title={i.name} text={i.text} action={off ? ui.soon : t.open} disabled={off} onAction={() => onGo(item.to)} />;
            })}
          </div>
        </section>
      ))}

      <section aria-labelledby="home-tips" className="rounded-xl border border-dashed bg-muted/50 p-4">
        <h2 id="home-tips" className="mb-2 flex items-center gap-2 text-lg font-semibold">
          <Lightbulb className="size-5 text-primary" aria-hidden /> {t.tipsTitle}
        </h2>
        <ul className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          {t.tips.map((tip) => (
            <li key={tip} className="flex gap-2">
              <FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
              {tip}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
