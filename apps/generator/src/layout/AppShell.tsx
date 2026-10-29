import { useSyncExternalStore, type ReactNode } from "react";
import { House, Languages, LayoutTemplate, ListChecks, Moon, Palette, Sun, Wrench } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getLang, LANGS, nav, setLang, subscribeLang, ui, type NavItem, type PageId } from "@/content";

const icons = { home: House, content: LayoutTemplate, tools: Wrench, brand: Palette, tasks: ListChecks } satisfies Record<PageId, unknown>;

function NavButton({ item, active, onSelect }: { item: NavItem; active: boolean; onSelect: (id: PageId) => void }) {
  const Icon = icons[item.id];
  return (
    <Button
      variant={active ? "secondary" : "ghost"}
      className="justify-start gap-2"
      disabled={!item.ready}
      aria-current={active ? "page" : undefined}
      onClick={() => onSelect(item.id)}
    >
      <Icon className="size-4" />
      <span className="flex-1 text-left">{item.label}</span>
      {!item.ready && <Badge variant="outline">{ui.soon}</Badge>}
    </Button>
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

// Page frame: top bar, navigation (side on desktop, row on small screens), content.
export function AppShell({ page, onNavigate, children }: { page: PageId; onNavigate: (id: PageId) => void; children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex h-14 items-center justify-between border-b px-4">
        <span className="font-heading text-lg font-semibold">Õhtuleht Toolkit</span>
        <Toggles />
      </header>
      <div className="flex flex-1 flex-col md:flex-row">
        <nav aria-label={ui.mainNav} className="flex gap-1 overflow-x-auto border-b p-2 md:w-60 md:flex-col md:border-r md:border-b-0 md:p-3">
          {nav.map((item) => (
            <NavButton key={item.id} item={item} active={item.id === page} onSelect={onNavigate} />
          ))}
        </nav>
        <main className="flex-1 p-4 md:px-6 md:py-4">{children}</main>
      </div>
    </div>
  );
}
