import type { ReactNode } from "react";
import { Tooltip as T } from "radix-ui";

// A small picture in a list that shows a big one when the pointer rests on it (or it gets the keyboard focus),
// so the text inside a slide or an article picture can be read without opening anything.
// `aspect` (width / height): show the picture cut as the banner cuts it (an article card), not the whole file.
// Built on the tooltip primitive directly, without the little pointer arrow of the app's tooltips.
export function ZoomPicture({ src, aspect, children }: { src?: string; aspect?: number; children: ReactNode }) {
  if (!src) return <>{children}</>;
  return (
    <T.Root delayDuration={150}>
      <T.Trigger asChild>{children}</T.Trigger>
      <T.Portal>
        <T.Content side="right" sideOffset={8} collisionPadding={8} className="z-50 rounded-md bg-background p-1 shadow-lg ring-1 ring-border">
          {aspect ? (
            <img src={src} alt="" className="block w-[min(60vw,480px)] rounded object-cover" style={{ aspectRatio: aspect, maxHeight: "70vh" }} />
          ) : (
            <img src={src} alt="" className="block max-h-[min(70vh,480px)] max-w-[min(60vw,600px)] rounded object-contain" />
          )}
        </T.Content>
      </T.Portal>
    </T.Root>
  );
}
