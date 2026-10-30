// Dependency-free slider for banners. Replaces Swiper.
// Markup contract (see slider.css and docs/ARCHITECTURE.md):
//   .ol-slider[data-visible][data-gap][data-delay][data-speed][data-shuffle][data-loop]
//     button.ol-prev
//     .ol-viewport > .ol-track > .ol-slide*
//   Optional: data-gap-css="1.6cqw" (gap with its own unit, for banners that scale with their width).
//   Sliders with data-effect (arc, cube) are run by fx.js instead.
//     button.ol-next
//     .ol-dots > button.ol-dot*   (optional pagination, one dot per slide)

interface Options {
  visible: number;
  gap: number;
  delay: number; // autoplay delay in ms, 0 = off
  speed: number; // transition time in ms
  shuffle: boolean;
  loop: boolean;
  // Off by default, like every existing banner: autoplay and sliding animation
  // run even when the OS has "reduce motion" on. Set data-respect-motion="1" to obey it.
  respectMotion: boolean;
  // Off by default: autoplay keeps running under the pointer, like the Dacia banner.
  // Set data-pause-on-hover="1" to pause while hovered or focused.
  pauseOnHover: boolean;
}

const DRAG_START_PX = 5; // movement before a press counts as a drag
const SWIPE_PX = 30; // movement that forces a step in the swipe direction

function readOptions(el: HTMLElement): Options {
  const num = (key: string, fallback: number) => {
    const value = Number(el.dataset[key]);
    return el.dataset[key] === undefined || Number.isNaN(value) ? fallback : value;
  };
  return {
    visible: Math.max(1, num("visible", 4)),
    gap: num("gap", 16),
    delay: num("delay", 3000),
    speed: num("speed", 250),
    shuffle: num("shuffle", 1) === 1,
    loop: num("loop", 1) === 1,
    respectMotion: num("respectMotion", 0) === 1,
    pauseOnHover: num("pauseOnHover", 0) === 1,
  };
}

// Fisher-Yates
function shuffled<T>(items: T[]): T[] {
  const a = items.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

export function initSlider(root: HTMLElement): void {
  const o = readOptions(root);
  const viewport = root.querySelector<HTMLElement>(".ol-viewport");
  const track = root.querySelector<HTMLElement>(".ol-track");
  if (!viewport || !track) return;

  let slides = Array.from(track.children) as HTMLElement[];
  if (o.shuffle) {
    slides = shuffled(slides);
    slides.forEach((s) => track.appendChild(s));
  }
  const n = slides.length;

  root.style.setProperty("--ol-visible", String(o.visible));
  root.style.setProperty("--ol-gap", root.dataset.gapCss ?? o.gap + "px");

  // Everything fits: plain row, no arrows, no autoplay. The cards share the whole width
  // (2 articles = two wide cards), instead of keeping the 4-column width and leaving a gap.
  if (n <= o.visible) {
    root.classList.add("ol-static");
    root.style.setProperty("--ol-visible", String(n));
    return;
  }

  const reduceMotion = o.respectMotion && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const speed = reduceMotion ? 0 : o.speed;
  const prevBtn = root.querySelector<HTMLButtonElement>(".ol-prev");
  const nextBtn = root.querySelector<HTMLButtonElement>(".ol-next");

  // Loop trick: copies of the edge slides so the strip looks endless.
  const pad = o.loop ? o.visible : 0;
  if (o.loop) {
    const copy = (s: HTMLElement) => {
      const c = s.cloneNode(true) as HTMLElement;
      c.setAttribute("aria-hidden", "true");
      c.setAttribute("tabindex", "-1"); // copies are not keyboard stops
      return c;
    };
    slides.slice(0, pad).forEach((s) => track.appendChild(copy(s)));
    slides
      .slice(n - pad)
      .reverse()
      .forEach((s) => track.insertBefore(copy(s), track.firstChild));
  }

  const maxIndex = n + 2 * pad - o.visible;
  let index = pad;
  let step = 0;
  let timer = 0;
  let settleTimer = 0;
  let paused = false;

  // Distance between two neighbouring slides. Measured as a difference of fractional positions:
  // slide widths are often fractional (e.g. 300.5 px), and offsetWidth would round them and drift.
  const measure = () => {
    const a = track.children[0] as HTMLElement;
    const b = track.children[1] as HTMLElement;
    step = b.getBoundingClientRect().left - a.getBoundingClientRect().left;
  };
  const place = (x: number, animate: boolean) => {
    track.style.transition = animate && speed ? `transform ${speed}ms ease` : "none";
    track.style.transform = `translate3d(${x}px,0,0)`;
  };
  const dots = Array.from(root.querySelectorAll<HTMLElement>(".ol-dot"));
  const render = (animate: boolean) => {
    place(-index * step, animate);
    const real = (((index - pad) % n) + n) % n; // position among the real slides, copies excluded
    dots.forEach((d, i) => d.classList.toggle("ol-on", i === real));
  };
  const updateArrows = () => {
    if (o.loop) return;
    if (prevBtn) prevBtn.disabled = index <= 0;
    if (nextBtn) nextBtn.disabled = index >= maxIndex;
  };
  // After an animation ends inside the copies, jump to the identical real slides.
  const normalize = () => {
    if (!o.loop) return;
    if (index >= pad + n) index -= n;
    else if (index < pad) index += n;
    render(false);
  };
  let animating = false;
  let queued = 0; // arrow presses that arrived while a slide was still moving
  const go = (target: number) => {
    window.clearTimeout(settleTimer);
    animating = true;
    index = Math.min(Math.max(target, 0), maxIndex);
    render(true);
    updateArrows();
    settleTimer = window.setTimeout(settle, speed + 30);
  };
  // The move has finished: leave the copies, then do the next waiting press (if any).
  const settle = () => {
    animating = false;
    normalize();
    if (queued) {
      const dir = queued > 0 ? 1 : -1;
      queued -= dir;
      go(index + dir);
    }
  };
  // One article per press. A press during a move waits its turn, so fast clicks are never lost or merged
  // (before, the index was clamped to the copied range and the extra click was dropped near the ends).
  const move = (dir: 1 | -1) => {
    if (animating) queued = Math.max(-3, Math.min(3, queued + dir));
    else go(index + dir);
  };

  // Autoplay
  const stop = () => window.clearInterval(timer);
  const start = () => {
    stop();
    if (reduceMotion || !o.delay || paused || document.hidden) return;
    timer = window.setInterval(() => {
      if (!animating) go(!o.loop && index >= maxIndex ? 0 : index + 1);
    }, o.delay);
  };
  const setPaused = (value: boolean) => {
    paused = value;
    start();
  };

  // Arrows and keyboard
  prevBtn?.addEventListener("click", () => {
    move(-1);
    start();
  });
  nextBtn?.addEventListener("click", () => {
    move(1);
    start();
  });
  dots.forEach((d, i) =>
    d.addEventListener("click", () => {
      go(pad + i);
      start();
    }),
  );
  viewport.tabIndex = 0;
  root.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") move(-1);
    else if (e.key === "ArrowRight") move(1);
    else return;
    start();
  });

  // Always pause in background tabs; optionally while pointed at or focused.
  if (o.pauseOnHover) {
    root.addEventListener("mouseenter", () => setPaused(true));
    root.addEventListener("mouseleave", () => setPaused(false));
    root.addEventListener("focusin", () => setPaused(true));
    root.addEventListener("focusout", () => setPaused(false));
  }
  document.addEventListener("visibilitychange", start);

  // Drag and swipe (mouse, touch, pen)
  let pressX = 0;
  let startX = 0; // track position when the press began
  let pressed = false;
  let dragging = false;
  let moved = false;
  const currentX = () => new DOMMatrix(getComputedStyle(track).transform).m41;

  viewport.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    window.clearTimeout(settleTimer);
    animating = false; // a press on the slides takes over from any running move
    queued = 0;
    let x = currentX();
    if (o.loop) {
      // Interrupted inside the copies: wrap to the equivalent real position first.
      while (x < -(pad + n) * step) x += n * step;
      while (x > -pad * step) x -= n * step;
    }
    place(x, false);
    pressed = true;
    dragging = false;
    moved = false;
    pressX = e.clientX;
    startX = x;
    stop();
  });
  viewport.addEventListener("pointermove", (e) => {
    if (!pressed) return;
    const dx = e.clientX - pressX;
    if (!dragging && Math.abs(dx) > DRAG_START_PX) {
      dragging = true;
      moved = true;
      viewport.setPointerCapture(e.pointerId);
    }
    if (dragging) place(startX + dx, false);
  });
  const release = (e: PointerEvent) => {
    if (!pressed) return;
    pressed = false;
    if (!dragging) {
      start();
      return;
    }
    dragging = false;
    const dx = e.clientX - pressX;
    const fraction = -(startX + dx) / step;
    index = dx < -SWIPE_PX ? Math.ceil(fraction) : dx > SWIPE_PX ? Math.floor(fraction) : Math.round(fraction);
    go(index);
    start();
  };
  viewport.addEventListener("pointerup", release);
  viewport.addEventListener("pointercancel", release);
  // A drag must not open the article behind it.
  viewport.addEventListener(
    "click",
    (e) => {
      if (moved) {
        e.stopPropagation();
        e.preventDefault();
        moved = false;
      }
    },
    true,
  );

  measure();
  render(false);
  updateArrows();
  new ResizeObserver(() => {
    measure();
    render(false);
  }).observe(viewport);
  start();
}
