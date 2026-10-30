import { Clapperboard, Crop, Eye, FileSearch, FileText, House, Images, Lightbulb, Newspaper, Palette, PanelTop, PenLine, Replace, Shapes, Smartphone, Type, type LucideIcon } from "lucide-react";
import { ContinueCard } from "@/components/editor/ContinueCard";
import { StartCard } from "@/components/editor/StartCard";
import { PageHeader } from "@/components/editor/PageHeader";
import { home as t, type PageId, type ToolInfo } from "@/content";
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
  "email-signature": { icon: PenLine, to: { page: "tools", tool: "email-signature" } },
  colours: { icon: Palette, to: { page: "brand", tab: "colours" } },
  logos: { icon: Shapes, to: { page: "brand", tab: "logos" } },
  fonts: { icon: Type, to: { page: "brand", tab: "fonts" } },
  eye: { icon: Eye, to: { page: "brand", tab: "eye" } },
};

// The first screen: what is here, and one click to each thing.
export function Home({ saved, onContinue, onDiscard, onGo }: { saved: SavedInfo | null; onContinue: () => void; onDiscard: () => void; onGo: (to: Destination) => void }) {
  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <PageHeader icon={House} title={t.title} intro={t.intro} />

      {saved && <ContinueCard saved={saved} onContinue={onContinue} onDiscard={onDiscard} />}

      {t.groups.map((g) => (
        <section key={g.title} aria-labelledby={`home-${g.id}`} className="space-y-3">
          <div>
            <h2 id={`home-${g.id}`} className="text-lg font-semibold">
              {g.title}
            </h2>
            {g.text && <p className="text-sm text-muted-foreground">{g.text}</p>}
          </div>
          <div className="grid auto-rows-fr gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {g.items.map((i) => {
              const item = ITEMS[i.id];
              if (!item) return null;
              return <StartCard key={i.id} icon={item.icon} title={i.name} text={i.text} action={t.open} variant="outline" onAction={() => onGo(item.to)} />;
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
