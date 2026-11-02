# Guide (new-employee handbook)

Menu item **Guide** (`?section=guide`, topic `?section=guide&topic=<id>`). Short numbered steps with a screenshot slot each, a "Start here" checklist (ticks kept in the browser) and Previous/Next between topics. Source: the handbook "Uue töötaja käsiraamat" (PDF, Estonian). The guide text is Estonian in both site languages.

## The public repository must stay clean

The repository and the site are public. The guide text therefore holds **no secrets**:

- Names of people, personal e-mail addresses, phone numbers, passwords (also the starting password), Wi-Fi, contract links and amounts are written as `[[key]]`.
- On the site a placeholder shows as a grey "after sign-in" chip (or a locked link). The real value is read from the private backend (`GET /api/values`) once Microsoft login exists. Until then the Worker answers `{}` and refuses to store anything (`apps/api/src/index.ts`, table `guide_values`), so there is nothing to leak.
- The list of keys: `docs/GUIDE-VALUES.md` (generated). Fill them in only after login is built, never in a commit.

## Change the text

Everything is in `apps/generator/src/guide-content.ts`: `TOPICS` (topics, steps), `FIRST_DAYS` (the checklist). A step has `title`, `text`, optional `chips`, `tip`, `warn`, `links`, `people` and `shot`. `**word**` is red, `[[key]]` a private value, Links go in `links` (a label and an address), not inside the text.

## Add a screenshot

1. Open `docs/GUIDE-SCREENSHOTS.md` (generated; `yarn guide:docs` after any text change). It lists what to capture for each slot.
2. Save as WebP, about 1200 px wide, under 150 KB, as `apps/generator/public/guide/<id>.webp`.
3. Done: the page shows the picture instead of the dashed placeholder (click to enlarge). No code change.

Blur or crop private things in the pictures (names, phone numbers, passwords).

## Code

`pages/Guide.tsx`, `components/editor/ShotPlaceholder.tsx`, `lib/guide.tsx` (placeholders, rich text, checklist), `lib/route.ts` (`topic`), content labels in `content.*.ts` (`guide`).
