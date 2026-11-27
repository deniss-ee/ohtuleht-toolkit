import type { ReactNode } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

// A small picture in a list that shows a big one when the pointer rests on it (or it gets the keyboard focus),
// so the text inside a slide or an article picture can be read without opening anything.
export function ZoomPicture({ src, children }: { src?: string; children: ReactNode }) {
  if (!src) return <>{children}</>;
  return (
    <Tooltip delayDuration={150}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="right" sideOffset={8} className="max-w-none bg-background p-1 shadow-lg ring-1 ring-border [&>svg]:hidden">
        <img src={src} alt="" className="block max-h-[min(70vh,480px)] max-w-[min(60vw,600px)] rounded object-contain" />
      </TooltipContent>
    </Tooltip>
  );
}
