import { useEffect, useRef, useState } from "react";
import { ChevronRight, Clapperboard, Crop, Eye, FileSearch, FileText, Gift, Images, BookOpen, Layers, Link2, MonitorSmartphone, Search, Lightbulb, Newspaper, Palette, PanelTop, PenLine, Replace, Shapes, Smartphone, Type, type LucideIcon } from "lucide-react";
import { ContinueCard } from "@/components/editor/ContinueCard";
import { OpenZipCard } from "@/components/editor/OpenZipCard";
import { BannerPicture } from "@/components/editor/BannerPicture";
import { Input } from "@/components/ui/input";
import { home as t, nav, ui, type PageId, type ToolInfo } from "@/content";
import type { BrandTab } from "@/lib/route";
import type { SavedInfo } from "@/lib/saved";

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
  "frame-banner": { icon: Layers, to: { page: "content", make: "frame-banner" } },
  "responsive-banner": { icon: MonitorSmartphone, to: { page: "content", make: "responsive-banner" } },
  "header-bar": { icon: PanelTop, to: { page: "content", make: "header-bar" } },
  "movie-banner": { icon: Clapperboard, to: { page: "tools", tool: "movie-banner" } },
  "image-cropper": { icon: Crop, to: { page: "tools", tool: "image-cropper" } },
  "article-scraper": { icon: FileSearch, to: { page: "tools", tool: "article-scraper" } },
  "picture-converter": { icon: Replace, to: { page: "tools", tool: "picture-converter" } },
  "utm-builder": { icon: Link2, to: { page: "tools", tool: "utm-builder" } },
  "gift-card": { icon: Gift, to: { page: "tools", tool: "gift-card" } },
  "email-signature": { icon: PenLine, to: { page: "tools", tool: "email-signature" } },
  guide: { icon: BookOpen, to: { page: "guide" } },
  colours: { icon: Palette, to: { page: "brand", tab: "colours" } },
  logos: { icon: Shapes, to: { page: "brand", tab: "logos" } },
  fonts: { icon: Type, to: { page: "brand", tab: "fonts" } },
  eye: { icon: Eye, to: { page: "brand", tab: "eye" } },
};

// The first screen: what is here, and one click to each thing.
export function Home({ saved, onContinue, onDiscard, onGo, onUpload }: { saved: SavedInfo | null; onContinue: () => void; onDiscard: () => void; onGo: (to: Destination) => void; onUpload: (file: File) => void }) {
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
  // v2 (docs/REDESIGN.md): the banners as tiles with a small drawing of each, big on the left; continue, open a zip and the other tools on the right.
  const [banners, ...others] = groups;
  const bannerGroup = banners?.id === "banners" ? banners : undefined;
  const rest = bannerGroup ? others : groups;
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0 space-y-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">{t.title}</h1>
          <p className="text-muted-foreground">{t.intro}</p>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input ref={box} type="search" aria-label={t.search} className="h-11 rounded-xl bg-card pl-10 shadow-panel" placeholder={t.searchPlaceholder} value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        {q && groups.length === 0 && <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">{t.noResults(query.trim())}</p>}

        {bannerGroup && (
          <section aria-labelledby="home-banners" className="space-y-3">
            <div>
              <h2 id="home-banners" className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                {bannerGroup.title}
              </h2>
              {bannerGroup.text && <p className="text-sm text-muted-foreground">{bannerGroup.text}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">
              {bannerGroup.items.map((i) => {
                const item = ITEMS[i.id];
                if (!item) return null;
                return (
                  <button key={i.id} type="button" onClick={() => onGo(item.to)} className="ol-lift grid gap-3 rounded-xl bg-card p-2.5 text-left shadow-panel ring-1 ring-foreground/[0.07] focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none">
                    <BannerPicture id={i.id} />
                    <span className="grid gap-0.5 px-1.5 pb-1.5">
                      <span className="font-semibold">{i.name}</span>
                      <span className="text-sm text-muted-foreground">{i.text}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        <section aria-labelledby="home-tips" className="rounded-xl bg-card p-5 shadow-panel ring-1 ring-foreground/[0.07]">
          <h2 id="home-tips" className="mb-3 flex items-center gap-2 font-semibold">
            <Lightbulb className="size-4 text-muted-foreground" aria-hidden /> {t.tipsTitle}
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

      <aside className="min-w-0 space-y-4 lg:sticky lg:top-20">
        {saved && <ContinueCard saved={saved} onContinue={onContinue} onDiscard={onDiscard} />}
        <OpenZipCard onUpload={onUpload} />
        {rest.map((g) => (
          <section key={g.title} aria-labelledby={`home-${g.id}`} className="rounded-xl bg-card p-2 shadow-panel ring-1 ring-foreground/[0.07]">
            <h2 id={`home-${g.id}`} className="px-2.5 pt-2 pb-1 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              {g.title}
            </h2>
            <ul>
              {g.items.map((i) => {
                const item = ITEMS[i.id];
                if (!item) return null;
                const off = nav.find((n) => n.id === item.to.page)?.ready === false;
                const Icon = item.icon;
                return (
                  <li key={i.id}>
                    <button type="button" disabled={off} onClick={() => onGo(item.to)} title={i.text} className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:opacity-50">
                      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                        <Icon className="size-4" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1 truncate font-medium">{i.name}</span>
                      {off ? <span className="text-xs text-muted-foreground">{ui.soon}</span> : <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </aside>
    </div>
  );
}
