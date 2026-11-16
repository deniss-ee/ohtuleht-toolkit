// All interface text, in two languages. English is in content.en.ts, Estonian in content.et.ts
// (same names, same shapes: the compiler checks that Estonian misses nothing).
// Components import from here as before; the objects below always return the text of the language chosen now.
// When the language changes, App renders again, so every component picks up the new text.
// Only the language in use is downloaded: the other one is fetched when the person switches to it.
type En = typeof import("./content.en");
const load = { en: () => import("./content.en"), et: () => import("./content.et") };
// Estonian must have every section English has (each section's own shape is checked in content.et.ts).
type Missing = Exclude<keyof En, keyof typeof import("./content.et")>;
const complete: Missing extends never ? true : Missing = true;
void complete;

export type { Device, BannerType, NavItem, PageId, ToolInfo } from "./content.en";

export type Lang = "en" | "et";
export const LANGS: { id: Lang; label: string; name: string }[] = [
  { id: "en", label: "EN", name: "English" },
  { id: "et", label: "ET", name: "Eesti" },
];

const KEY = "ol-lang";
const sets: Partial<Record<Lang, En>> = {};

function readLang(): Lang {
  // A link with ?lang=et opens in Estonian for this visit (it is not stored, so the person's own choice stays).
  const fromLink = typeof location !== "undefined" ? new URLSearchParams(location.search).get("lang") : null;
  if (fromLink === "en" || fromLink === "et") return fromLink;
  try {
    const v = localStorage.getItem(KEY);
    if (v === "en" || v === "et") return v;
  } catch {
    // storage blocked: use English
  }
  return "en";
}

let current: Lang = readLang();
const listeners = new Set<() => void>();
if (typeof document !== "undefined") document.documentElement.lang = current;

export const getLang = () => current;
export const subscribeLang = (fn: () => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};
// The text of the language chosen at the start. main.tsx waits for it before it loads and draws the app,
// so no component ever reads text that is not there yet.
export const ready: Promise<void> = load[current]().then((m) => {
  sets[current] = m as unknown as En;
});
const text = () => sets[current]!;

export function setLang(lang: Lang) {
  const apply = () => {
    current = lang;
    try {
      localStorage.setItem(KEY, lang);
    } catch {
      // not remembered, still works for this visit
    }
    document.documentElement.lang = lang;
    listeners.forEach((fn) => fn());
  };
  if (sets[lang]) return apply();
  // First switch to this language: fetch its text, then change. If that fails (offline), the language stays as it was.
  void load[lang]().then((m) => {
    sets[lang] = m as unknown as En;
    apply();
  });
}

// An object (or array) that reads from the active language every time it is used.
function live<T extends object>(pick: () => T, target: object = {}): T {
  return new Proxy(target, {
    get: (_, key) => Reflect.get(pick(), key),
    has: (_, key) => Reflect.has(pick(), key),
    ownKeys: () => Reflect.ownKeys(pick()),
    getOwnPropertyDescriptor: (_, key) => ({ ...Reflect.getOwnPropertyDescriptor(pick(), key), configurable: true }),
  }) as T;
}
const section = <K extends keyof En>(k: K): En[K] => live(() => text()[k] as En[K] & object) as En[K];

export const nav = live(() => text().nav, []);
export const bannerTypes = live(() => text().bannerTypes, []);
export const contentMarketing = section("contentMarketing");
export const editor = section("editor");
export const headerBar = section("headerBar");
export const sliderEditor = section("sliderEditor");
export const brandManual = section("brandManual");
export const tools = section("tools");
export const imageCropper = section("imageCropper");
export const movieBanner = section("movieBanner");
export const marketing = section("marketing");
export const signature = section("signature");
export const guide = section("guide");
export const frameEditor = section("frameEditor");
export const responsiveEditor = section("responsiveEditor");
export const utmTool = section("utmTool");
export const brandEye = section("brandEye");
export const ui = section("ui");
export const home = section("home");
