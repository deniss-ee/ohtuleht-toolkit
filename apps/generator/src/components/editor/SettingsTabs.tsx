import { useEffect, useState, type CSSProperties } from "react";

// Settings in tabs on the right of an editor (v2, docs/REDESIGN.md): one pill switch, one tab's settings at a time.
// Every tab's settings stay in the page (hidden), so "to fix" can find a field; goTo in HoverPill then sends the tab's name
// (the panel's data-tab-panel) and this hook opens it.
export function useSettingsTab<T extends string>(ids: readonly T[]) {
  const [tab, setTab] = useState<T>(ids[0]!);
  useEffect(() => {
    const show = (e: Event) => {
      const id = (e as CustomEvent<string>).detail;
      if ((ids as readonly string[]).includes(id)) setTab(id as T);
    };
    window.addEventListener("ol-show-tab", show);
    return () => window.removeEventListener("ol-show-tab", show);
  }, [ids]);
  return [tab, setTab] as const;
}

export function SettingsTabs<T extends string>({ ids, labels, tab, onTab, label }: { ids: readonly T[]; labels: Record<T, string>; tab: T; onTab: (id: T) => void; label: string }) {
  return (
    <div role="tablist" aria-label={label} className="inline-flex w-full gap-0.5 rounded-full bg-muted p-1 ring-1 ring-foreground/[0.06]">
      {ids.map((id) => (
        <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => onTab(id)} className={`flex-1 rounded-full px-2 py-1.5 text-[13px] whitespace-nowrap transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none ${tab === id ? "bg-card font-medium text-foreground shadow-panel" : "text-muted-foreground hover:text-foreground"}`}>
          {labels[id]}
        </button>
      ))}
    </div>
  );
}

// The desk in the middle of an editor: the banner on a dotted ground, staying in view while the lists scroll.
export const DESK_CLASS = "order-1 min-w-0 rounded-xl p-3 lg:order-none lg:sticky lg:top-3 lg:col-start-2 lg:row-start-1";
export const DESK_STYLE: CSSProperties = { backgroundImage: "radial-gradient(var(--border) 1px, transparent 1px)", backgroundSize: "16px 16px" };
// The three columns: the list, the desk, the settings.
export const EDITOR_GRID = "grid items-start gap-4 lg:grid-cols-[400px_minmax(0,1fr)_340px]";
