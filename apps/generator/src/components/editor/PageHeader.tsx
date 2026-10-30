import type { LucideIcon } from "lucide-react";
import { IconChip } from "@/components/editor/IconChip";

// Title block at the top of every section start screen: icon (same as in the side menu), title, one line of help.
export function PageHeader({ icon, title, intro }: { icon: LucideIcon; title: string; intro: string }) {
  return (
    <div className="flex items-center gap-3">
      <IconChip icon={icon} tone="red" />
      <div>
        <h1 className="text-xl font-semibold sm:text-2xl">{title}</h1>
        {/* On short screens the help line gives way to the tools. */}
        <p className="text-sm text-muted-foreground sm:text-base [@media(min-width:640px)_and_(max-height:860px)]:hidden">{intro}</p>
      </div>
    </div>
  );
}
