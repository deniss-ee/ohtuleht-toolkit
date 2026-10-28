# Banner runtime

Dependency-free slider script that replaces Swiper in banners. Builds to one file, `dist/runtime.js` (about 1.5 KB gzip, budget 3 KB).

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
<div class="ol-slider" data-visible="4" data-gap="16" data-delay="2500" data-speed="250" data-shuffle="1" data-loop="1">
  <button class="ol-prev" aria-label="Previous"></button>
  <div class="ol-viewport"><div class="ol-track">
    <div class="ol-slide" onclick="...">...</div>
  </div></div>
  <button class="ol-next" aria-label="Next"></button>
</div>
```

| Attribute | Default | Meaning |
|---|---|---|
| `data-visible` | 4 | Slides in view |
| `data-gap` | 16 | Gap in px |
| `data-delay` | 2500 | Autoplay delay in ms, 0 = off |
| `data-speed` | 250 | Transition time in ms |
| `data-shuffle` | 1 | Shuffle slides on load |
| `data-loop` | 1 | Endless loop |
| `data-respect-motion` | 0 | 1 = obey the OS "reduce motion" setting (autoplay off, no slide animation) |
| `data-pause-on-hover` | 0 | 1 = pause autoplay while hovered or focused |

## Behaviour

- Slides at or below `data-visible`: static row, arrows hidden, no autoplay; the cards share the full width instead of keeping the column width.
- More slides: arrows, autoplay, endless loop (edge slides are cloned), mouse/touch drag, Left/Right keys.
- Autoplay always runs, like the existing banners, and pauses only in hidden tabs. Hover pause and `prefers-reduced-motion` are opt-in (see attributes).
- A drag never triggers the slide's click.

## Open items

- Slide-fade and cube transitions (image-slider template).
- Automated tests (needs the test setup from the CI issue).
