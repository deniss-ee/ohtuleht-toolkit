import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";

// A tiny drawing of what each banner or tool makes, for the tiles of the start screens (v2, docs/REDESIGN.md).
// Plain boxes in CSS, no pictures to load. The red is the brand red the banners start with.
const PHOTO = ["from-slate-400 to-slate-200", "from-stone-400 to-stone-200", "from-emerald-300 to-emerald-100", "from-violet-300 to-violet-100"];
const photo = (i: number) => `bg-gradient-to-br ${PHOTO[i % PHOTO.length]}`;
const line = (w = "w-full") => <div className={`h-1 rounded-full bg-foreground/15 ${w}`} />;
const chip = (text: string, red = false) => <span className={`rounded px-1 py-0.5 font-mono text-[9px] leading-none ${red ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground ring-1 ring-foreground/10"}`}>{text}</span>;

export function BannerPicture({ id }: { id: string }) {
  return (
    <div aria-hidden className="grid aspect-[16/10] place-items-center overflow-hidden rounded-lg bg-muted p-4 ring-1 ring-foreground/[0.05]">
      <div className="w-full">{drawing(id)}</div>
    </div>
  );
}

// One tile of a start screen: the drawing, the name and one line; the whole tile is the way in. It lifts a little on hover.
export function PictureTile({ id, title, text, badges, disabled, soon, onOpen }: { id: string; title: string; text: string; badges?: string[]; disabled?: boolean; soon?: string; onOpen: () => void }) {
  return (
    <button type="button" disabled={disabled} onClick={onOpen} className="ol-lift grid content-start gap-3 rounded-xl bg-card p-2.5 text-left shadow-panel ring-1 ring-foreground/[0.07] focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-60">
      <BannerPicture id={id} />
      <span className="grid gap-1 px-1.5 pb-1.5">
        <span className="flex flex-wrap items-center gap-1.5 font-semibold">
          {title}
          {disabled && soon && <Badge variant="outline">{soon}</Badge>}
        </span>
        <span className="text-sm text-muted-foreground">{text}</span>
        {badges && badges.length > 0 && (
          <span className="mt-1 flex flex-wrap gap-1.5">
            {badges.map((b) => (
              <Badge key={b} variant="secondary" className="font-normal">
                {b}
              </Badge>
            ))}
          </span>
        )}
      </span>
    </button>
  );
}

function drawing(id: string): ReactNode {
  if (id.startsWith("articles")) {
    return (
      <div className="grid gap-1.5">
        <div className="h-2.5 rounded-sm bg-primary" />
        <div className="grid grid-cols-4 gap-1.5">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="grid gap-1">
              <div className={`aspect-[300/215] rounded-sm ${photo(i)}`} />
              {line()}
              {line("w-2/3")}
            </div>
          ))}
        </div>
      </div>
    );
  }
  switch (id) {
    case "header-bar":
      return (
        <div className="grid gap-2">
          <div className="flex h-4 items-center rounded-sm bg-primary px-1.5">
            <div className="h-1 w-1/4 rounded-full bg-white/80" />
          </div>
          {line("w-3/5")}
          {line("w-2/5")}
        </div>
      );
    case "image-slider-600x500":
      return (
        <div className={`mx-auto aspect-[6/5] w-1/2 rounded-md ${photo(1)} p-1.5`}>
          <div className="flex h-full items-end justify-center gap-0.5 pb-0.5">
            {[0, 1, 2].map((i) => (
              <div key={i} className={`size-1 rounded-full ${i === 0 ? "bg-white" : "bg-white/50"}`} />
            ))}
          </div>
        </div>
      );
    case "image-slider-1250x400":
      return (
        <div className="grid grid-cols-3 gap-1.5 rounded-md bg-gradient-to-br from-slate-600 to-slate-400 p-2.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="aspect-[6/5] rounded-sm bg-white/90" />
          ))}
        </div>
      );
    case "frame-banner":
      return (
        <div className="grid grid-cols-3 items-center gap-1.5">
          {[1, 0.6, 0.3].map((o, i) => (
            <div key={i} className={`aspect-square rounded-md ${photo(i)}`} style={{ opacity: o }} />
          ))}
        </div>
      );
    case "responsive-banner":
      return (
        <div className="grid gap-1.5">
          <div className={`h-7 rounded-md ${photo(3)}`} />
          <div className={`h-7 w-3/5 rounded-md ${photo(3)}`} />
        </div>
      );
    case "movie-banner":
      return (
        <div className={`relative grid aspect-[16/7] place-items-center rounded-md ${photo(0)}`}>
          <div className="grid size-7 place-items-center rounded-full bg-black/55">
            <div className="ml-0.5 size-0 border-y-[6px] border-l-[9px] border-y-transparent border-l-white" />
          </div>
        </div>
      );
    case "image-cropper":
      return (
        <div className={`relative mx-auto aspect-[4/3] w-4/5 overflow-hidden rounded-md ${photo(2)}`}>
          <div className="absolute inset-[14%] rounded-sm border-2 border-dashed border-white shadow-[0_0_0_999px_rgb(0_0_0/0.25)]" />
        </div>
      );
    case "article-scraper":
      return (
        <div className="grid grid-cols-[1fr_2fr] gap-2 rounded-md bg-card p-2 ring-1 ring-foreground/10">
          <div className={`aspect-square rounded-sm ${photo(1)}`} />
          <div className="grid content-start gap-1">
            <div className="h-1.5 w-full rounded-full bg-primary/70" />
            {line()}
            {line("w-4/5")}
            {line("w-3/5")}
          </div>
        </div>
      );
    case "picture-converter":
      return (
        <div className="grid justify-items-center gap-1.5">
          {chip("…/webp/54/pic.jpg")}
          <span className="text-xs text-muted-foreground">↓</span>
          {chip("…/webp/48/pic.jpg", true)}
        </div>
      );
    case "utm-builder":
      return (
        <div className="grid justify-items-start gap-1.5">
          {chip("ohtuleht.ee/teema")}
          <span className="flex flex-wrap gap-1">
            {chip("?utm_source", true)}
            {chip("&utm_campaign", true)}
          </span>
        </div>
      );
    case "gift-card":
      return (
        <div className="mx-auto grid aspect-[3/2] w-3/5 content-center justify-items-center gap-1.5 rounded-md bg-card p-2 shadow-panel ring-1 ring-foreground/10">
          <div className="h-2 w-1/3 rounded-sm bg-primary" />
          <span className="rounded border border-dashed border-foreground/30 px-1.5 font-mono text-[9px]">12334-1</span>
        </div>
      );
    case "email-signature":
      return (
        <div className="grid gap-1.5 rounded-md bg-card p-2.5 ring-1 ring-foreground/10">
          <div className="h-1.5 w-1/2 rounded-full bg-foreground/40" />
          {line("w-2/3")}
          {line("w-1/2")}
          <div className="mt-1 h-2 w-1/4 rounded-sm bg-primary" />
        </div>
      );
    case "guide":
      return (
        <div className="mx-auto grid w-4/5 grid-cols-2 gap-1 rounded-md bg-card p-2 ring-1 ring-foreground/10">
          {[0, 1].map((i) => (
            <div key={i} className="grid content-start gap-1">
              {line()}
              {line("w-4/5")}
              {line()}
              {line("w-3/5")}
            </div>
          ))}
        </div>
      );
    case "colours":
      return (
        <div className="grid grid-cols-5 gap-1.5">
          {["bg-red-600", "bg-red-300", "bg-yellow-300", "bg-ink-950", "bg-ink-200"].map((c) => (
            <div key={c} className={`aspect-[2/3] rounded-md ${c}`} />
          ))}
        </div>
      );
    case "logos":
      return (
        <div className="flex items-center justify-center gap-2">
          <span className="grid size-9 place-items-center rounded-md bg-primary text-xs font-extrabold text-primary-foreground">ÕL</span>
          <span className="grid gap-1">
            <span className="h-2 w-16 rounded-sm bg-foreground/70" />
            <span className="h-2 w-10 rounded-sm bg-primary" />
          </span>
        </div>
      );
    case "fonts":
      return (
        <div className="flex items-baseline justify-center gap-2 font-[Fira_Sans] text-foreground">
          <span className="text-4xl font-semibold leading-none">Aa</span>
          <span className="text-lg leading-none text-muted-foreground">Aa</span>
        </div>
      );
    case "eye":
      return (
        <div className="grid place-items-center">
          <div className="grid size-12 place-items-center rounded-full border-[5px] border-primary">
            <div className="size-3 rounded-full bg-foreground/80" />
          </div>
        </div>
      );
    default:
      return <div className={`aspect-[16/9] rounded-md ${photo(0)}`} />;
  }
}
