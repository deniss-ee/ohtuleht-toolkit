# Banner runtime

Dependency-free slider script that replaces Swiper in banners. Builds to `dist/runtime.js` (about 1.9 KB gzip, budget 3 KB) and `dist/cube.js` (cube transition, about 1.1 KB gzip, budget 2 KB; only banners that use it carry it).

## Run locally

```bash
yarn workspace @ohtuleht/banner-runtime dev
```

Open `http://localhost:5174/test-page/index.html`. The page has toggles for shuffle, autoplay, pause on hover and respecting the OS "reduce motion" setting.

## Build

```bash
yarn workspace @ohtuleht/banner-runtime build
yarn workspace @ohtuleht/banner-runtime size
```

## What to upload

Nothing on its own. The templates inline `dist/runtime.js` and `src/slider.css` into each banner's `index.html`.

## Markup

```html
<div class="ol-slider" data-visible="4" data-gap="16" data-delay="3000" data-speed="250" data-shuffle="1" data-loop="1">
  <button class="ol-prev" aria-label="Previous"></button>
  <div class="ol-viewport"><div class="ol-track">
    <div class="ol-slide" onclick="...">...</div>
  </div></div>
  <button class="ol-next" aria-label="Next"></button>
</div>
```

Optional pagination (used by the mobile banner, which has no arrows): `<div class="ol-dots"><button class="ol-dot"></button>...</div>` with one dot per slide. The runtime marks the current one with `ol-on` and a click on a dot goes to that slide.

| Attribute | Default | Meaning |
|---|---|---|
| `data-visible` | 4 | Slides in view |
| `data-gap` | 16 | Gap in px |
| `data-delay` | 3000 | Autoplay delay in ms, 0 = off |
| `data-speed` | 250 | Transition time in ms |
| `data-shuffle` | 1 | Shuffle slides on load |
| `data-loop` | 1 | Endless loop |
| `data-respect-motion` | 0 | 1 = obey the OS "reduce motion" setting (autoplay off, no slide animation) |
| `data-pause-on-hover` | 0 | 1 = pause autoplay while hovered or focused |
| `data-gap-css` | none | Gap with its own unit, e.g. `2cqw`, for banners that scale with their width (replaces `data-gap` for layout) |
| `data-effect` | slide | `arc`: slides on a ring (middle straight, others turned away), best with 3 or 5 visible. `cube`: run by `cube.js`, one slide at a time |

## Behaviour

- Slides at or below `data-visible`: static row, arrows hidden, no autoplay; the cards share the full width instead of keeping the column width.
- More slides: arrows, autoplay, endless loop (edge slides are cloned), mouse/touch drag, Left/Right keys.
- Autoplay always runs, like the existing banners, and pauses only in hidden tabs. Hover pause and `prefers-reduced-motion` are opt-in (see attributes).
- A drag never triggers the slide's click.

## Open items

- Fade transition.
- Automated tests (needs the test setup from the CI issue).
