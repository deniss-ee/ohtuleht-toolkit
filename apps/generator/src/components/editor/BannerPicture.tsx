// A tiny drawing of what each banner looks like, for the tiles on the first screen (v2, docs/REDESIGN.md).
// Plain boxes in CSS, no pictures to load. The red is the brand red the banners start with.
const PHOTO = ["from-slate-400 to-slate-200", "from-stone-400 to-stone-200", "from-emerald-300 to-emerald-100", "from-violet-300 to-violet-100"];
const photo = (i: number) => `bg-gradient-to-br ${PHOTO[i % PHOTO.length]}`;

export function BannerPicture({ id }: { id: string }) {
  return (
    <div aria-hidden className="grid aspect-[16/10] place-items-center overflow-hidden rounded-lg bg-muted p-4 ring-1 ring-foreground/[0.05]">
      <div className="w-full">{drawing(id)}</div>
    </div>
  );
}

function drawing(id: string) {
  if (id.startsWith("articles")) {
    return (
      <div className="grid gap-1.5">
        <div className="h-2.5 rounded-sm bg-primary" />
        <div className="grid grid-cols-4 gap-1.5">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="grid gap-1">
              <div className={`aspect-[300/215] rounded-sm ${photo(i)}`} />
              <div className="h-1 rounded-full bg-foreground/15" />
              <div className="h-1 w-2/3 rounded-full bg-foreground/15" />
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (id === "header-bar") {
    return (
      <div className="grid gap-2">
        <div className="flex h-4 items-center rounded-sm bg-primary px-1.5">
          <div className="h-1 w-1/4 rounded-full bg-white/80" />
        </div>
        <div className="h-1 w-3/5 rounded-full bg-foreground/15" />
        <div className="h-1 w-2/5 rounded-full bg-foreground/15" />
      </div>
    );
  }
  if (id.startsWith("image-slider")) {
    const mobile = id.endsWith("600x500");
    return mobile ? (
      <div className={`mx-auto aspect-[6/5] w-1/2 rounded-md ${photo(1)} p-1.5`}>
        <div className="flex h-full items-end justify-center gap-0.5 pb-0.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className={`size-1 rounded-full ${i === 0 ? "bg-white" : "bg-white/50"}`} />
          ))}
        </div>
      </div>
    ) : (
      <div className="grid grid-cols-3 gap-1.5 rounded-md bg-gradient-to-br from-slate-600 to-slate-400 p-2.5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="aspect-[6/5] rounded-sm bg-white/90" />
        ))}
      </div>
    );
  }
  if (id === "frame-banner") {
    return (
      <div className="grid grid-cols-3 items-center gap-1.5">
        {[1, 0.6, 0.3].map((o, i) => (
          <div key={i} className={`aspect-square rounded-md ${photo(i)}`} style={{ opacity: o }} />
        ))}
      </div>
    );
  }
  if (id === "responsive-banner") {
    return (
      <div className="grid gap-1.5">
        <div className={`h-7 rounded-md ${photo(3)}`} />
        <div className={`h-7 w-3/5 rounded-md ${photo(3)}`} />
      </div>
    );
  }
  return <div className={`aspect-[16/9] rounded-md ${photo(0)}`} />;
}
