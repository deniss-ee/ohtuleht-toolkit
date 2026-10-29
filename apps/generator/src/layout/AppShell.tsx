import type { ReactNode } from "react";
import { LayoutTemplate, ListChecks, Moon, Palette, Sun, Wrench } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { nav, type NavItem, type PageId } from "@/content";

const icons = { content: LayoutTemplate, tools: Wrench, brand: Palette, tasks: ListChecks } satisfies Record<PageId, unknown>;

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
      {!item.ready && <Badge variant="outline">Soon</Badge>}
    </Button>
  );
}

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const dark = resolvedTheme === "dark";
  return (
    <Button variant="ghost" size="icon" aria-label={dark ? "Switch to light theme" : "Switch to dark theme"} onClick={() => setTheme(dark ? "light" : "dark")}>
      {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}

// Page frame: top bar, navigation (side on desktop, row on small screens), content.
export function AppShell({ page, onNavigate, children }: { page: PageId; onNavigate: (id: PageId) => void; children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex h-14 items-center justify-between border-b px-4">
        <span className="font-heading text-lg font-semibold">Õhtuleht Toolkit</span>
        <ThemeToggle />
      </header>
      <div className="flex flex-1 flex-col md:flex-row">
        <nav aria-label="Main" className="flex gap-1 overflow-x-auto border-b p-2 md:w-60 md:flex-col md:border-r md:border-b-0 md:p-3">
          {nav.map((item) => (
            <NavButton key={item.id} item={item} active={item.id === page} onSelect={onNavigate} />
          ))}
        </nav>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
