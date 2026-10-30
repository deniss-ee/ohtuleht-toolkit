// Slider arrows shared by every banner: a neutral, semi-transparent dark rounded square with a white chevron. They do not take
// the campaign colour, so they look the same on every picture and in light and dark mode.

// A dark square with a white chevron, both fully solid (no see-through arrow). The chevron is 10 px wide on the banner, as it
// was before: it is only scaled by 36/32 inside the viewBox because the square is 32 px now.
const arrow = (path: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 42 42'><path fill='#1c1c1c' fill-opacity='.85' d='M38 42H4a4 4 0 0 1-4-4V4a4 4 0 0 1 4-4h34a4 4 0 0 1 4 4v34a4 4 0 0 1-4 4z'/><path transform='translate(21 21) scale(1.125) translate(-21 -21)' fill='#fff' d='${path}'/></svg>`,
  )}`;
const ARROW_LEFT = arrow("M17.2 21l9.2 9.2-2.8 2.8-12-12 12-12 2.8 2.8z");
const ARROW_RIGHT = arrow("M24.8 21l-9.2-9.2 2.8-2.8 12 12-12 12-2.8-2.8z");

export const ARROW_SIZE = 32;

// The look of the two buttons (size, solid at rest, a darker square on hover, faint only when they cannot be used, visible
// keyboard focus). Nothing moves. The template adds where they sit (top, left, right).
export const arrowCss = (size: string = `${ARROW_SIZE}px`) =>
  `.ol-prev,.ol-next{position:absolute;z-index:2;width:${size};height:${size};padding:0;border:0;border-radius:4px;background:center/cover no-repeat;background-color:transparent;cursor:pointer;transition:background-color .15s}` +
  ".ol-prev:hover,.ol-next:hover{background-color:rgba(0,0,0,.35)}" +
  ".ol-prev:disabled,.ol-next:disabled{opacity:.35;cursor:default}" +
  ".ol-prev:focus-visible,.ol-next:focus-visible{outline:2px solid #fff;outline-offset:2px}" +
  `.ol-prev{background-image:url("${ARROW_LEFT}")}` +
  `.ol-next{background-image:url("${ARROW_RIGHT}")}`;
