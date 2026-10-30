import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { IconChip, type Tone } from "@/components/editor/IconChip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

// The card of every start screen (Home, Content marketing, Tools): icon, title and text, optional small labels,
// and one button in a band at the bottom. All buttons have the same width and sit at the same place in every card,
// so the rows line up. The whole card is clickable; the button is the way in for keyboard users.
export function StartCard({
  icon,
  title,
  text,
  badges,
  action,
  onAction,
  variant = "default",
  tone = "red",
  disabled,
  extra,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
  badges?: string[];
  action: string;
  onAction: () => void;
  variant?: "default" | "outline";
  tone?: Tone; // colour of the icon
  disabled?: boolean;
  extra?: ReactNode; // anything the card needs besides the button (for example a hidden file input)
}) {
  return (
    <Card className={disabled ? "h-full opacity-60" : "h-full cursor-pointer transition-colors hover:bg-muted/40"} onClick={disabled ? undefined : onAction}>
      <CardHeader>
        <div className="flex items-start gap-3">
          <IconChip icon={icon} tone={disabled ? "ink" : tone} />
          <div className="min-w-0">
            <CardTitle>{title}</CardTitle>
            <CardDescription>{text}</CardDescription>
          </div>
        </div>
      </CardHeader>
      {badges && badges.length > 0 && (
        <CardContent className="flex flex-wrap gap-2">
          {badges.map((b, i) => (
            <Badge key={b} variant={i === 0 ? "secondary" : "outline"}>
              {b}
            </Badge>
          ))}
        </CardContent>
      )}
      <CardFooter className="mt-auto">
        <Button className="min-w-40" variant={disabled ? "secondary" : variant} disabled={disabled}>
          {action}
        </Button>
        {extra}
      </CardFooter>
    </Card>
  );
}
