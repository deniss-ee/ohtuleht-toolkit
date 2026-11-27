import { useSyncExternalStore, type ReactNode } from "react";
import { BookOpen, House, Languages, LayoutTemplate, Moon, Palette, Sun, Wrench } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getLang, LANGS, nav, setLang, subscribeLang, ui, type NavItem, type PageId } from "@/content";

const icons = { home: House, content: LayoutTemplate, tools: Wrench, brand: Palette, guide: BookOpen } satisfies Record<PageId, unknown>;

// One section in the top bar's pill switch (v2): the open one is a raised white pill, the others quiet text.
function NavButton({ item, active, onSelect }: { item: NavItem; active: boolean; onSelect: (id: PageId) => void }) {
  const Icon = icons[item.id];
  return (
    <button
      type="button"
      disabled={!item.ready}
      aria-current={active ? "page" : undefined}
      onClick={() => onSelect(item.id)}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:opacity-50 ${active ? "bg-card font-medium text-foreground shadow-panel" : "text-muted-foreground hover:text-foreground"}`}
    >
      <Icon className="size-4" aria-hidden />
      {item.label}
      {!item.ready && <Badge variant="outline">{ui.soon}</Badge>}
      {item.ready && item.wip && (
        <Badge variant="outline" title={ui.wip} className="h-4 border-yellow-500/50 bg-yellow-300/30 px-1 text-[10px] text-foreground">
          {ui.wipShort}
        </Badge>
      )}
    </button>
  );
}

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const dark = resolvedTheme === "dark";
  return (
    <Button variant="ghost" size="icon" aria-label={dark ? ui.toLight : ui.toDark} onClick={() => setTheme(dark ? "light" : "dark")}>
      {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}

// EN / ET switch. The choice is remembered in the browser.
export function LangToggle() {
  const lang = useSyncExternalStore(subscribeLang, getLang);
  return (
    <div role="group" aria-label={ui.language} className="inline-flex h-8 items-center rounded-lg border p-0.5 text-xs font-medium">
      <Languages className="mx-1.5 size-3.5 text-muted-foreground" aria-hidden />
      {LANGS.map((l) => (
        <button
          key={l.id}
          type="button"
          lang={l.id}
          title={l.name}
          aria-pressed={lang === l.id}
          onClick={() => setLang(l.id)}
          className={`h-full rounded-md px-2 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none ${lang === l.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}

// Language and theme switches, together in every top bar.
export function Toggles() {
  return (
    <div className="flex items-center gap-1">
      <LangToggle />
      <ThemeToggle />
    </div>
  );
}

// Page frame (v2): a slim top bar with the logo, the sections as a pill switch and the switches; the page below on the grey ground.
// On a phone the sections move to their own row and scroll sideways.
export function AppShell({ page, onNavigate, children }: { page: PageId; onNavigate: (id: PageId) => void; children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-30 border-b border-foreground/[0.06] bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-[1280px] flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5 md:px-6">
          <span className="flex items-center gap-2 font-semibold" title={ui.wipText}>
            <span className="grid size-6 place-items-center rounded-md bg-primary text-[10px] font-extrabold text-primary-foreground" aria-hidden>
              ÕL
            </span>
            Toolkit
          </span>
          <nav aria-label={ui.mainNav} className="order-last -mx-4 w-[calc(100%+2rem)] overflow-x-auto px-4 md:order-none md:mx-0 md:w-auto md:px-0">
            <div className="inline-flex gap-0.5 rounded-full bg-muted p-1 ring-1 ring-foreground/[0.06]">
              {nav.map((item) => (
                <NavButton key={item.id} item={item} active={item.id === page} onSelect={onNavigate} />
              ))}
            </div>
          </nav>
          <div className="ml-auto">
            <Toggles />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full min-w-0 max-w-[1280px] flex-1 px-4 py-6 md:px-6">{children}</main>
    </div>
  );
}
