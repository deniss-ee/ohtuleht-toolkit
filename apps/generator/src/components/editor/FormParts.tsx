import type { ReactNode } from "react";
import { ChevronRight, type LucideIcon } from "lucide-react";
import { IconChip, type Tone } from "@/components/editor/IconChip";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

// Building blocks of the full-screen editors.

export function Section({ title, description, icon, tone, children, className }: { title: string; description?: string; icon: LucideIcon; tone: Tone; children: ReactNode; className?: string }) {
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center gap-3">
          <IconChip icon={icon} tone={tone} />
          <div>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

// Closed by default: advanced settings stay out of the way for people who do not need them.
export function Collapsible({ title, description, icon, tone, children, className }: { title: string; description: string; icon: LucideIcon; tone: Tone; children: ReactNode; className?: string }) {
  return (
    <details className={`group rounded-xl border bg-card ${className ?? ""}`}>
      <summary className="flex cursor-pointer list-none items-center gap-3 p-4 [&::-webkit-details-marker]:hidden">
        <IconChip icon={icon} tone={tone} />
        <div className="flex-1">
          <div className="font-medium leading-none">{title}</div>
          <div className="mt-1 text-sm text-muted-foreground">{description}</div>
        </div>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90" />
      </summary>
      <div className="space-y-4 border-t p-4">{children}</div>
    </details>
  );
}

export function SwitchRow({ id, label, checked, onChange }: { id: string; label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <Label htmlFor={id} className="font-normal">
        {label}
      </Label>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
