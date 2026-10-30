// Slider arrows shared by every banner: a rounded square with a chevron. The square takes the campaign's main colour in the
// articles banners (as the header does) and a neutral dark in the image slider; it is 85 % solid, so the picture shows through
// a little. The chevron is cut out of a picture (a mask), so it can be white or dark, whichever reads on the colour.

// Chevron only, black: the mask keeps its shape and the page paints it. 15 % smaller than the old chevron (scale .95).
const chevron = (path: string) =>
  `data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 42 42'><path transform='translate(21 21) scale(.95) translate(-21 -21)' d='${path}'/></svg>`)}`;
const CHEVRON_LEFT = chevron("M17.2 21l9.2 9.2-2.8 2.8-12-12 12-12 2.8 2.8z");
const CHEVRON_RIGHT = chevron("M24.8 21l-9.2-9.2 2.8-2.8 12 12-12 12-2.8-2.8z");

export const ARROW_SIZE = 32;

// Colour of the square: the main colour (the page defines --primary and --arrow-ink, the colour of the chevron), or a neutral dark.
export const ARROW_MAIN = "background-color:var(--primary);background-color:color-mix(in srgb,var(--primary) 85%,transparent)";
export const ARROW_DARK = "background-color:rgba(28,28,28,.85)";

// The look of the two buttons (size, solid at rest, a little darker on hover, faint only when they cannot be used, visible
// keyboard focus). Nothing moves. The template adds where they sit (top, left, right).
export const arrowCss = (square: string, size: string = `${ARROW_SIZE}px`) =>
  `.ol-prev,.ol-next{position:absolute;z-index:2;width:${size};height:${size};padding:0;border:0;border-radius:4px;cursor:pointer;transition:filter .15s;${square}}` +
  ".ol-prev::before,.ol-next::before{content:\"\";position:absolute;inset:0;background:var(--arrow-ink,#fff);-webkit-mask:var(--chevron) center/100% 100% no-repeat;mask:var(--chevron) center/100% 100% no-repeat}" +
  ".ol-prev:hover,.ol-next:hover{filter:brightness(.88)}" +
  ".ol-prev:disabled,.ol-next:disabled{opacity:.35;cursor:default}" +
  ".ol-prev:focus-visible,.ol-next:focus-visible{outline:2px solid #fff;outline-offset:2px}" +
  `.ol-prev{--chevron:url("${CHEVRON_LEFT}")}` +
  `.ol-next{--chevron:url("${CHEVRON_RIGHT}")}`;
