// Banner config. Stored inside every generated banner so the zip can be re-imported.
// Draft schema is described in docs/ARCHITECTURE.md.

export interface ThemeColors {
  bg: string; // page and label background
  text: string; // article titles
  hover: string; // title colour on hover
  badge?: string; // label colour; when empty, derived from the main colour so it stays readable
  headerBg?: string; // header colour; when empty, the main colour
  headerText?: string; // text colour on a colour header; when empty, a tinted dark or light picked for contrast
}

// Every colour filled in (see resolveTheme).
export interface ResolvedTheme {
  bg: string;
  text: string;
  hover: string;
  primary: string;
  badge: string;
  headerBg: string;
  headerText: string;
}

export interface ArticleItem {
  url: string;
  title: string;
  image: string;
  badge?: string; // overrides the campaign badge text for this article
  badgeColor?: string; // overrides the badge colour for this article (hex)
}

// textInPicture: the picture already contains the campaign name (banners made before this tool), so the name is not written on top.
// Only banners opened from old zips carry it; new banners leave it out.
export type Header =
  | { type: "image"; src: string; href: string; avg?: string; textInPicture?: boolean } // src is a file name inside the zip; avg = average colour of the picture, used to pick a readable text colour
  | { type: "color"; href: string; textInPicture?: boolean };

// articles-1250x400: desktop slider. articles-mobile: phone banner, 360 px wide, cards 267x400 with the next card peeking in, dots below.
export type ArticlesFormat = "articles-1250x400" | "articles-mobile";

// Static ad on the right of the desktop slider (articles-1250x400 only). It is 338 px high (400 minus the header and the gap);
// width is that height times the picture's shape, so the picture is never cropped. src is a file name inside the zip.
export interface AdItem {
  src: string;
  href: string;
  width: number;
}

export interface ArticlesBannerConfig {
  v: 1;
  format: ArticlesFormat;
  campaign: string;
  primary: string; // main campaign colour: header, arrows and default label colour
  header: Header;
  ad?: AdItem; // desktop only; with an ad the slider shows 3 articles instead of 4
  badge: string;
  theme: { light: ThemeColors; dark: ThemeColors };
  behavior: {
    shuffle: boolean;
    autoplay: boolean;
    delayMs: number;
    speedMs: number;
    loop: boolean;
  };
  articles: ArticleItem[];
}

// Script and stylesheet text inlined into the banner (built by banner-runtime).
export interface RuntimeAssets {
  runtimeJs: string;
  sliderCss: string;
  fxJs?: string; // 3D effects (ring, cube): only for banners that use one
}

// ---- Image slider (client banners): a background picture with a slider of pictures on top. Format 3 in docs/BANNERS.md.

// image: a file name inside the zip. href: where the slide leads; empty = the link set in the ad system (clickTag).
export interface SliderSlide {
  image: string;
  href: string;
}

// Where the slider sits on the background (px on the 1250x400 canvas) and how its slides are laid out.
export interface SliderLayout {
  x: number;
  y: number;
  width: number;
  height: number;
  gap: number;
  visible: number; // slides shown at once; each slide is (width - gaps) / visible wide and `height` high
}

// 1250x400: fixed desktop banner. 600x500: phone banner that fills the page width and keeps the 6:5 shape
// (everything inside scales with it). Both are one campaign: slides, links and behaviour are shared.
export type SliderFormat = "image-slider-1250x400" | "image-slider-600x500";

// slide: the strip moves sideways. arc (desktop): slides on a ring, the middle one straight. cube (mobile): one slide at a time on a turning cube.
export type SliderEffect = "slide" | "arc" | "cube";

// What differs between the two sizes. background is a file name inside the zip; layout is in px of the 1250x400 or 600x500 canvas.
export interface SliderView {
  background: string;
  layout: SliderLayout;
  arrows: boolean;
  effect: SliderEffect;
}

export interface ImageSliderConfig {
  v: 1;
  kind: "image-slider"; // tells these zips apart from the articles banners
  format: SliderFormat;
  campaign: string;
  backgroundLink: { clickable: boolean; href: string }; // href empty = the ad system's link
  slides: SliderSlide[];
  linkMode: "shared" | "each"; // one link for all slides, or one per slide
  sharedHref: string;
  desktop: SliderView;
  mobile: SliderView;
  behavior: { shuffle: boolean; autoplay: boolean; delayMs: number; speedMs: number; loop: boolean };
}
