// Cube transition for banners that show one picture at a time (mobile image slider). Dependency-free.
// Markup: .ol-slider[data-effect="cube"][data-delay][data-speed][data-shuffle][data-loop]
//   button.ol-prev, .ol-viewport > .ol-track > .ol-slide*, button.ol-next
// The track is a cube turned by 90 degrees per step; only the slide on show and the one coming in are visible.

const SWIPE_PX = 30;

function initCube(root: HTMLElement): void {
  const viewport = root.querySelector<HTMLElement>(".ol-viewport");
  const track = root.querySelector<HTMLElement>(".ol-track");
  if (!viewport || !track) return;
  const num = (key: string, fallback: number) => (root.dataset[key] === undefined || Number.isNaN(Number(root.dataset[key])) ? fallback : Number(root.dataset[key]));
  const delay = num("delay", 0);
  const speed = num("speed", 600);
  const loop = num("loop", 1) === 1;

  let slides = Array.from(track.children) as HTMLElement[];
  if (num("shuffle", 0) === 1) {
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
    track.style.transition = animate ? `transform ${speed}ms ease` : "none";
    track.style.transform = `translateZ(${-half()}px) rotateY(${-turns * 90}deg)`;
  };
  const show = () => {
    face(slides[cur]!, turns);
    slides[cur]!.style.visibility = "visible";
    stage(false);
  };

  let timer = 0;
  const go = (dir: 1 | -1) => {
    const target = cur + dir;
    if (busy || (!loop && (target < 0 || target >= n))) return;
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
    }, speed + 30);
  };
  const start = () => {
    window.clearInterval(timer);
    if (delay && !document.hidden) timer = window.setInterval(() => go(1), delay);
  };

  root.querySelector(".ol-prev")?.addEventListener("click", () => (go(-1), start()));
  root.querySelector(".ol-next")?.addEventListener("click", () => (go(1), start()));
  root.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") go(-1);
    else if (e.key === "ArrowRight") go(1);
    else return;
    start();
  });
  document.addEventListener("visibilitychange", start);

  // Swipe (mouse, touch, pen); a swipe must not open the slide behind it.
  let pressX = 0;
  let pressed = false;
  let moved = false;
  viewport.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    pressed = true;
    moved = false;
    pressX = e.clientX;
  });
  const release = (e: PointerEvent) => {
    if (!pressed) return;
    pressed = false;
    const dx = e.clientX - pressX;
    if (Math.abs(dx) > SWIPE_PX) {
      moved = true;
      go(dx < 0 ? 1 : -1);
      start();
    }
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

  show();
  new ResizeObserver(() => {
    if (busy) return;
    show();
  }).observe(viewport);
  start();
}

function boot() {
  document.querySelectorAll<HTMLElement>('.ol-slider[data-effect="cube"]').forEach(initCube);
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
else boot();
