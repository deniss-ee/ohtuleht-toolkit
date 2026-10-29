import type { LucideIcon } from "lucide-react";
import { IconChip } from "@/components/editor/IconChip";

// Title block at the top of every section start screen: icon (same as in the side menu), title, one line of help.
export function PageHeader({ icon, title, intro }: { icon: LucideIcon; title: string; intro: string }) {
  return (
    <div className="flex items-center gap-3">
      <IconChip icon={icon} tone="red" />
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-muted-foreground">{intro}</p>
      </div>
    </div>
  );
}
