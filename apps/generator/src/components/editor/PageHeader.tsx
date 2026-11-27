import type { LucideIcon } from "lucide-react";

// Title block at the top of every section start screen (v2, docs/REDESIGN.md): a plain bold title and one line of help, the same as on Home.
// The section's icon is already in the top bar, so it is not repeated here (`icon` is kept so the pages need no change).
export function PageHeader({ title, intro }: { icon?: LucideIcon; title: string; intro: string }) {
  return (
    <div className="space-y-1">
      <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      <p className="text-muted-foreground">{intro}</p>
    </div>
  );
}
