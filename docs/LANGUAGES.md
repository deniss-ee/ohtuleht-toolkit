# Languages (English and Estonian)

The interface has an **EN / ET** switch in every top bar. The choice is remembered in the browser (`localStorage`, key `ol-lang`); the default is English. The banners themselves are always Estonian.

## Where the text is

| File | What |
|---|---|
| `apps/generator/src/content.en.ts` | English text (the base) |
| `apps/generator/src/content.et.ts` | Estonian text: same names, same shapes. The compiler fails (`yarn typecheck`) if a text is missing |
| `apps/generator/src/content.ts` | Picks the language. Components import `editor`, `ui`, `tools` ... from here as before |
| `packages/templates/src/messages.ts` | "Things left to do" messages of the banner and header bar checks (`validate(config, lang)`) |

## Add or change a text

1. Add it to `content.en.ts`.
2. Add the same name to `content.et.ts` (typecheck tells you if you forget).
3. Use it in the component: `import { ui } from "@/content"` and `{ui.back}`. Never write interface text inside a component.

Brand names and descriptions from `packages/brand/brand.json` (colour scales, logo names and use) are translated by id in `brandManual` (`scaleNames`, `scaleRoles`, `logoNames`, `logoUsage`); a new id falls back to the English text in `brand.json`.

## How the switch works

`content.ts` exports objects that always read the active language. When the language changes, `App` renders again, so every component shows the new text and nothing the person typed is lost. Code outside React (checks, zip errors) uses the same objects, so its messages follow the language too.

## Add a third language

Copy `content.et.ts` to `content.xx.ts`, translate, add it to `sets` and `LANGS` in `content.ts`, and a block in `messages.ts`.
