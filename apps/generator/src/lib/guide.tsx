import { createContext, Fragment, useContext, useEffect, useState, type ReactNode } from "react";
import { Lock } from "lucide-react";
import { guide as t } from "@/content";
import { API_URL } from "@/lib/sync";

// Values that are not public (names, phone numbers, passwords, Wi-Fi, amounts). The guide text only holds [[key]] placeholders;
// the real values come from the private backend and only after sign-in. Until that exists the backend answers with nothing,
// and every placeholder stays a grey "after sign-in" chip.
const Values = createContext<Record<string, string>>({});
export const ValuesProvider = Values.Provider;
export const useValues = () => useContext(Values);

export function useGuideValues(): Record<string, string> {
  const [values, setValues] = useState<Record<string, string>>({});
  useEffect(() => {
    let alive = true;
    fetch(`${API_URL}/api/values`, { signal: AbortSignal.timeout(6000) })
      .then((r) => (r.ok ? r.json() : {}))
      .then((v) => alive && v && typeof v === "object" && setValues(v as Record<string, string>))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);
  return values;
}

// A placeholder chip, or the real value when it is known.
export function Secret({ k }: { k: string }) {
  const value = useValues()[k];
  if (value) return <span className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[0.9em]">{value}</span>;
  return (
    <span title={k} className="inline-flex items-center gap-1 rounded-md border border-dashed px-1.5 py-0.5 align-baseline text-[0.85em] text-muted-foreground">
      <Lock className="size-3" aria-hidden /> {t.afterSignIn}
    </span>
  );
}

// Text with **red bold** parts and [[secret]] placeholders.
export function Rich({ text }: { text: string }): ReactNode {
  return text.split(/(\*\*[^*]+\*\*|\[\[[\w-]+\]\])/).map((part, i) => {
    if (part.startsWith("**")) return <strong key={i} className="font-semibold text-primary"><Rich text={part.slice(2, -2)} /></strong>;
    if (part.startsWith("[[")) return <Secret key={i} k={part.slice(2, -2)} />;
    return <Fragment key={i}>{part}</Fragment>;
  });
}

// A link whose address may be a [[secret]]: without the value it shows a locked chip instead of a link.
export function GuideLink({ label, href }: { label: string; href: string }) {
  const values = useValues();
  const secret = /^\[\[([\w-]+)\]\]$/.exec(href);
  const real = secret ? values[secret[1]!] : href;
  if (!real)
    return (
      <span className="inline-flex items-center gap-1.5 rounded-lg border border-dashed px-2.5 py-1 text-sm text-muted-foreground">
        <Lock className="size-3.5" aria-hidden /> {label}
      </span>
    );
  return (
    <a href={real} target="_blank" rel="noreferrer noopener" className="inline-flex items-center rounded-lg border px-2.5 py-1 text-sm font-medium text-primary hover:bg-primary/5 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none">
      {label}
    </a>
  );
}

// The ticks of the first-days checklist, kept in this browser.
const KEY = "ol-guide-done";
export function useChecklist(): [Set<string>, (id: string) => void] {
  const [done, setDone] = useState<Set<string>>(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem(KEY) ?? "[]") as string[]);
    } catch {
      return new Set();
    }
  });
  const toggle = (id: string) =>
    setDone((d) => {
      const next = new Set(d);
      if (!next.delete(id)) next.add(id);
      try {
        localStorage.setItem(KEY, JSON.stringify([...next]));
      } catch {
        /* not remembered */
      }
      return next;
    });
  return [done, toggle];
}
