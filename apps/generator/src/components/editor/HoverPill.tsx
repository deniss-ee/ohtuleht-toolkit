import { useRef, useState, type ReactNode } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// Pill in the top bar that explains itself on hover (or on click, for touch screens).
// On small screens the text is hidden: only the icon shows, in a round button, with `short` (a count, say) next to it when there is one.
export function HoverPill({ icon, label, short, tone, children }: { icon: ReactNode; label: ReactNode; short?: ReactNode; tone: "ok" | "warn" | "plain"; children: (close: () => void) => ReactNode }) {
  const [open, setOpen] = useState(false);
  const timer = useRef<number>(0);
  const show = () => {
    window.clearTimeout(timer.current);
    setOpen(true);
  };
  const hide = () => {
    timer.current = window.setTimeout(() => setOpen(false), 200);
  };
  const colors = tone === "warn" ? "border-yellow-400 bg-yellow-100/70 dark:bg-yellow-300/15" : tone === "ok" ? "border-green-600/40 bg-green-600/10" : "";
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" onMouseEnter={show} onMouseLeave={hide} className={`inline-flex h-8 min-w-8 items-center justify-center gap-1.5 rounded-full border text-xs font-medium max-sm:h-10 max-sm:min-w-10 sm:px-3 ${short === undefined ? "max-sm:w-10 max-sm:px-0" : "max-sm:px-3"} ${colors}`}>
          {icon}
          <span className="max-sm:hidden">{label}</span>
          {short !== undefined && <span className="sm:hidden">{short}</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80" onMouseEnter={show} onMouseLeave={hide}>
        {children(() => setOpen(false))}
      </PopoverContent>
    </Popover>
  );
}

// Scrolls to a form field and puts the cursor in it.
export function goTo(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  // A field inside a closed article: the list opens that article first.
  window.dispatchEvent(new CustomEvent("ol-reveal", { detail: id }));
  setTimeout(() => {
    el.scrollIntoView({ block: "center", behavior: "smooth" });
    setTimeout(() => el.focus({ preventScroll: true }), 350);
  }, 80);
}
