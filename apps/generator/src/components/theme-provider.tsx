import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

type Theme = "light" | "dark" | "system";
const KEY = "ol-theme";

const prefersDark = () => window.matchMedia("(prefers-color-scheme: dark)").matches;

function readStored(): Theme {
  try {
    const v = localStorage.getItem(KEY);
    if (v === "light" || v === "dark") return v;
  } catch {
    // storage blocked: fall back to the system setting
  }
  return "system";
}

const ThemeContext = createContext<{ theme: Theme; resolvedTheme: "light" | "dark"; setTheme: (t: Theme) => void } | null>(null);

// Puts the "dark" class on <html> (shadcn's convention). index.html sets it before first paint.
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(readStored);
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));

  const apply = useCallback((t: Theme) => {
    const isDark = t === "dark" || (t === "system" && prefersDark());
    document.documentElement.classList.toggle("dark", isDark);
    setDark(isDark);
  }, []);

  useEffect(() => {
    apply(theme);
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => apply("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme, apply]);

  const setTheme = (t: Theme) => {
    try {
      if (t === "system") localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, t);
    } catch {
      // storage blocked: the choice lasts until reload
    }
    setThemeState(t);
  };

  return <ThemeContext.Provider value={{ theme, resolvedTheme: dark ? "dark" : "light", setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
