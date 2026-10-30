// 3D effects for image sliders. Dependency-free. Same markup as the slider:
//   .ol-slider[data-effect="arc"|"cube"][data-visible][data-gap][data-delay][data-speed][data-shuffle][data-loop]
//     button.ol-prev, .ol-viewport > .ol-track > .ol-slide*, button.ol-next
// arc  = a carousel: the slides stand on a ring that turns; the front one is straight, the next ones are tilted back.
// cube = one slide at a time on a cube, a quarter turn per step.

const SWIPE_PX = 30;
const RING_MIN = 8; // cells on the ring, at least: a step is 45 degrees or less, so the side slides stay readable

interface Options {
  visible: number;
  gap: number;
  delay: number;
  speed: number;
  shuffle: boolean;
  loop: boolean;
}

function options(root: HTMLElement): Options {
  const num = (key: string, fallback: number) => (root.dataset[key] === undefined || Number.isNaN(Number(root.dataset[key])) ? fallback : Number(root.dataset[key]));
  return { visible: Math.max(1, num("visible", 3)), gap: num("gap", 10), delay: num("delay", 0), speed: num("speed", 600), shuffle: num("shuffle", 0) === 1, loop: num("loop", 1) === 1 };
}

// What both effects share: slides, shuffle, arrows, keys, autoplay, swipe and drag. `step(dir)` moves one slide;
// `drag` (optional) follows the pointer: begin() when pressed, move(dx) while dragging, end(dx) when let go.
function controls(root: HTMLElement, viewport: HTMLElement, o: Options, step: (dir: 1 | -1) => void, drag?: { begin: () => void; move: (dx: number) => void; end: (dx: number) => void }) {
  let timer = 0;
  const start = () => {
    window.clearInterval(timer);
    if (o.delay && !document.hidden) timer = window.setInterval(() => step(1), o.delay);
  };
  root.querySelector(".ol-prev")?.addEventListener("click", () => (step(-1), start()));
  root.querySelector(".ol-next")?.addEventListener("click", () => (step(1), start()));
  root.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") step(-1);
    else if (e.key === "ArrowRight") step(1);
    else return;
    start();
  });
  document.addEventListener("visibilitychange", start);

  // Pointer (mouse, touch, pen). A drag or swipe must not open the slide behind it.
  let pressX = 0;
  let pressed = false;
  let moved = false;
  viewport.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    pressed = true;
    moved = false;
    pressX = e.clientX;
    window.clearInterval(timer);
    drag?.begin();
  });
  viewport.addEventListener("pointermove", (e) => {
    if (!pressed) return;
    const dx = e.clientX - pressX;
    if (!moved && Math.abs(dx) > 5) {
      moved = true;
      if (drag) viewport.setPointerCapture(e.pointerId);
    }
    if (moved) drag?.move(dx);
  });
  const release = (e: PointerEvent) => {
    if (!pressed) return;
    pressed = false;
    const dx = e.clientX - pressX;
    if (drag) {
      if (moved) drag.end(dx);
    } else if (Math.abs(dx) > SWIPE_PX) {
      moved = true;
      step(dx < 0 ? 1 : -1);
    }
    start();
  };
  viewport.addEventListener("pointerup", release);
  viewport.addEventListener("pointercancel", release);
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
  start();
}

// ---- Ring ---------------------------------------------------------------------------------------------------------
// The slides are cells of a regular polygon seen from outside. The ring turns around its middle: a step is one cell.
// With few slides the cells are repeated until there are at least RING_MIN of them (4 slides: each twice).
function initRing(root: HTMLElement): void {
  const viewport = root.querySelector<HTMLElement>(".ol-viewport");
  const track = root.querySelector<HTMLElement>(".ol-track");
  if (!viewport || !track) return;
  const o = options(root);
  let slides = Array.from(track.children) as HTMLElement[];
  if (o.shuffle) {
    slides = slides.sort(() => Math.random() - 0.5);
    slides.forEach((s) => track.appendChild(s));
  }
  const n = slides.length;
  const m = n * Math.ceil(RING_MIN / n);
  for (let k = 1; k < m / n; k++) {
    slides.forEach((s) => {
      const c = s.cloneNode(true) as HTMLElement;
      c.setAttribute("aria-hidden", "true");
      c.setAttribute("tabindex", "-1");
      track.appendChild(c);
    });
  }
  const cells = Array.from(track.children) as HTMLElement[];
  const angle = 360 / m;
  viewport.style.cssText += ";overflow:hidden;position:relative";
  track.style.cssText = "position:absolute;inset:0;transform-style:preserve-3d";

  let radius = 0;
  let cellW = 0;
  const layout = () => {
    const w = viewport.clientWidth;
    cellW = (w - o.gap * (o.visible - 1)) / o.visible;
    // Distance from the middle of the ring to the cells: neighbours stand edge to edge, plus the gap.
    radius = (cellW + o.gap) / (2 * Math.tan(Math.PI / m));
    viewport.style.perspective = `${Math.round(radius * 3 + cellW)}px`;
    cells.forEach((c, i) => {
      c.style.cssText += `;position:absolute;left:50%;top:0;flex:none;width:${cellW}px;height:100%;margin-left:${-cellW / 2}px;backface-visibility:hidden;transform:rotateY(${i * angle}deg) translateZ(${radius}px)`;
    });
  };
  let index = 0; // position of the front cell (whole number at rest, a fraction while dragging)
  const place = (pos: number, animate: boolean) => {
    track.style.transition = animate && o.speed ? `transform ${o.speed}ms ease` : "none";
    track.style.transform = `translateZ(${-radius}px) rotateY(${-pos * angle}deg)`;
  };
  const go = (dir: 1 | -1) => {
    // Without loop the ring stops at the first and the last real slide.
    if (!o.loop && (index + dir < 0 || index + dir > n - 1)) return;
    index += dir;
    place(index, true);
  };

  let startIndex = 0; // where the ring was when the drag began
  controls(root, viewport, o, go, {
    begin: () => (startIndex = index),
    move: (dx) => place(startIndex - dx / (cellW + o.gap), false),
    end: (dx) => {
      const pos = startIndex - dx / (cellW + o.gap);
      index = dx < -SWIPE_PX ? Math.ceil(pos) : dx > SWIPE_PX ? Math.floor(pos) : Math.round(pos);
      if (!o.loop) index = Math.min(n - 1, Math.max(0, index));
      place(index, true);
    },
  });

  layout();
  place(index, false);
  new ResizeObserver(() => {
    layout();
    place(index, false);
  }).observe(viewport);
}

// ---- Cube ---------------------------------------------------------------------------------------------------------
// The track is a cube turned by 90 degrees per step; only the slide on show and the one coming in are visible.
function initCube(root: HTMLElement): void {
  const viewport = root.querySelector<HTMLElement>(".ol-viewport");
  const track = root.querySelector<HTMLElement>(".ol-track");
  if (!viewport || !track) return;
  const o = options(root);
  let slides = Array.from(track.children) as HTMLElement[];
  if (o.shuffle) {
    slides = slides.sort(() => Math.random() - 0.5);
    slides.forEach((s) => track.appendChild(s));
  }
  const n = slides.length;
  viewport.style.cssText += ";overflow:hidden;position:relative";
  track.style.cssText = "position:absolute;inset:0;transform-style:preserve-3d;height:100%";
  slides.forEach((s) => (s.style.cssText += ";position:absolute;inset:0;flex:none;visibility:hidden;backface-visibility:hidden"));
  if (n < 2) {
    if (slides[0]) slides[0].style.visibility = "visible";
    root.classList.add("ol-static");
    return;
  }

  let cur = 0; // slide on show
  let turns = 0; // quarter turns so far (can be negative)
  let busy = false;
  const half = () => viewport.clientWidth / 2;
  const face = (el: HTMLElement, turn: number) => (el.style.transform = `rotateY(${turn * 90}deg) translateZ(${half()}px)`);
  const stage = (animate: boolean) => {
    viewport.style.perspective = `${half() * 5}px`;
    track.style.transition = animate ? `transform ${o.speed}ms ease` : "none";
    track.style.transform = `translateZ(${-half()}px) rotateY(${-turns * 90}deg)`;
  };
  const show = () => {
    face(slides[cur]!, turns);
    slides[cur]!.style.visibility = "visible";
    stage(false);
  };
  const go = (dir: 1 | -1) => {
    const target = cur + dir;
    if (busy || (!o.loop && (target < 0 || target >= n))) return;
    busy = true;
    const next = slides[(target + n) % n]!;
    face(next, turns + dir);
    next.style.visibility = "visible";
    void track.offsetWidth; // the new face is in place before the turn starts
    turns += dir;
    stage(true);
    window.setTimeout(() => {
      slides[cur]!.style.visibility = "hidden";
      cur = (target + n) % n;
      busy = false;
    }, o.speed + 30);
  };

  controls(root, viewport, o, go);
  show();
  new ResizeObserver(() => {
    if (!busy) show();
  }).observe(viewport);
}

function boot() {
  document.querySelectorAll<HTMLElement>('.ol-slider[data-effect="arc"]').forEach(initRing);
  document.querySelectorAll<HTMLElement>('.ol-slider[data-effect="cube"]').forEach(initCube);
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
else boot();
