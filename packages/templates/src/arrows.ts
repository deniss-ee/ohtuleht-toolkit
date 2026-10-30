// Slider arrows shared by every banner: a neutral, semi-transparent dark rounded square with a white chevron. They do not take
// the campaign colour, so they look the same on every picture and in light and dark mode.

// A square with a chevron, as an image for `background-image`.
const arrow = (path: string) => `data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 42 42'><path fill='#000' fill-opacity='.333' d='M38 42H4a4 4 0 0 1-4-4V4a4 4 0 0 1 4-4h34a4 4 0 0 1 4 4v34a4 4 0 0 1-4 4z'/><path fill='#fff' d='${path}'/></svg>`)}`;
const ARROW_LEFT = arrow("M17.2 21l9.2 9.2-2.8 2.8-12-12 12-12 2.8 2.8z");
const ARROW_RIGHT = arrow("M24.8 21l-9.2-9.2 2.8-2.8 12 12-12 12-2.8-2.8z");

export const ARROW_SIZE = 36;

// The look of the two buttons (size, quiet at rest, full on hover, faint when it cannot be used, visible keyboard focus).
// The template adds where they sit (top, left, right).
export const arrowCss = (size: string = `${ARROW_SIZE}px`) =>
  `.ol-prev,.ol-next{position:absolute;z-index:2;width:${size};height:${size};padding:0;border:0;border-radius:4px;background:center/cover no-repeat;cursor:pointer;opacity:.6;transition:opacity .15s}` +
  ".ol-prev:hover,.ol-next:hover{opacity:1}" +
  ".ol-prev:disabled,.ol-next:disabled{opacity:.2;cursor:default}" +
  ".ol-prev:focus-visible,.ol-next:focus-visible{outline:2px solid #fff;outline-offset:2px}" +
  `.ol-prev{background-image:url("${ARROW_LEFT}")}` +
  `.ol-next{background-image:url("${ARROW_RIGHT}")}`;
