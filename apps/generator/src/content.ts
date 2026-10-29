// All interface text, in two languages. English is in content.en.ts, Estonian in content.et.ts
// (same names, same shapes: the compiler checks that Estonian misses nothing).
// Components import from here as before; the objects below always return the text of the language chosen now.
// When the language changes, App renders again, so every component picks up the new text.
import * as en from "./content.en";
import * as et from "./content.et";

export type { Device, BannerType, NavItem, PageId, ToolInfo } from "./content.en";

export type Lang = "en" | "et";
export const LANGS: { id: Lang; label: string; name: string }[] = [
  { id: "en", label: "EN", name: "English" },
  { id: "et", label: "ET", name: "Eesti" },
];

const KEY = "ol-lang";
const sets = { en, et };

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
export function setLang(lang: Lang) {
  current = lang;
  try {
    localStorage.setItem(KEY, lang);
  } catch {
    // not remembered, still works for this visit
  }
  document.documentElement.lang = lang;
  listeners.forEach((fn) => fn());
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
const section = <K extends keyof typeof en & keyof typeof et>(k: K): (typeof en)[K] => live(() => sets[current][k] as (typeof en)[K]);

export const nav = live(() => sets[current].nav, []);
export const bannerTypes = live(() => sets[current].bannerTypes, []);
export const contentMarketing = section("contentMarketing");
export const editor = section("editor");
export const headerBar = section("headerBar");
export const brandManual = section("brandManual");
export const tools = section("tools");
export const imageCropper = section("imageCropper");
export const movieBanner = section("movieBanner");
export const ui = section("ui");
