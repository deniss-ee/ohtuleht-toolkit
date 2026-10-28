import { initSlider } from "./slider";

// Entry point of the banner script: wires up every slider on the page.
function boot() {
  document.querySelectorAll<HTMLElement>(".ol-slider").forEach(initSlider);
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
else boot();
