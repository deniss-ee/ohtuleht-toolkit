import { initSlider } from "./slider";

// Entry point of the banner script: wires up every slider on the page.
function boot() {
  document.querySelectorAll<HTMLElement>('.ol-slider:not([data-effect="cube"])').forEach(initSlider);
}

// Slides and headers are div/a with role="link": Enter opens them like a real link.
document.addEventListener("keydown", (e) => {
  const el = e.target as HTMLElement;
  if (e.key === "Enter" && el.getAttribute?.("role") === "link") el.click();
});

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
else boot();
