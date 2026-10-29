import type { ReactNode } from "react";
import { ArrowLeft, CheckCircle2, TriangleAlert } from "lucide-react";
import { goTo, HoverPill } from "@/components/editor/HoverPill";
import { Button } from "@/components/ui/button";
import { ui } from "@/content";
import { Toggles } from "@/layout/AppShell";

export interface ToolProblem {
  field: string; // id of the control to jump to
  message: string;
}

// Full-screen frame shared by the tools, same as the banner editors:
// top bar with Back, title, "things left to do" pill, theme switch and the download button; content scrolls under it.
export function ToolShell({
  title,
  subtitle,
  problems,
  readyText,
  doneText,
  extra,
  downloadLabel,
  busy,
  onDownload,
  onBack,
  children,
}: {
  title: string;
  subtitle: string;
  problems: ToolProblem[];
  readyText: string;
  doneText: string;
  extra?: ReactNode; // more buttons, left of the theme switch
  downloadLabel: ReactNode;
  busy?: boolean;
  onDownload: () => void;
  onBack: () => void;
  children: ReactNode;
}) {
  const n = problems.length;
  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-background">
      <header className="flex shrink-0 flex-wrap items-center gap-x-2 gap-y-2 border-b px-3 py-2 lg:h-14 lg:flex-nowrap lg:gap-3 lg:px-4 lg:py-0">
        <Button variant="ghost" size="sm" className="gap-2" onClick={onBack} aria-label={ui.backToTools}>
          <ArrowLeft className="size-4" />
          <span className="hidden sm:inline">{ui.back}</span>
        </Button>
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold leading-tight">{title}</div>
          <div className="text-xs text-muted-foreground">{subtitle}</div>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto lg:flex-nowrap lg:gap-3">
          <HoverPill
            tone={n === 0 ? "ok" : "warn"}
            icon={n === 0 ? <CheckCircle2 className="size-3.5 text-green-600" /> : <TriangleAlert className="size-3.5 text-yellow-600" />}
            label={
              <>
                <span className="hidden sm:inline">{n === 0 ? readyText : ui.toFix(n)}</span>
                <span className="sm:hidden">{n === 0 ? "" : n}</span>
              </>
            }
          >
            {(close) =>
              n === 0 ? (
                <p className="text-sm">{doneText}</p>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm font-medium">{ui.toFixTitle}</p>
                  <ul className="space-y-1">
                    {problems.map((p) => (
                      <li key={p.field}>
                        <button
                          type="button"
                          className="w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
                          onClick={() => {
                            close();
                            goTo(p.field);
                          }}
                        >
                          {p.message}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            }
          </HoverPill>
          {extra}
          <Toggles />
          <Button className="ml-auto gap-2 sm:ml-0" disabled={n > 0 || busy} onClick={onDownload}>
            {downloadLabel}
          </Button>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
