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

export type Header =
  | { type: "image"; src: string; href: string; avg?: string } // src is a file name inside the zip; avg = average colour of the picture, used to pick a readable text colour
  | { type: "color"; href: string };

export interface ArticlesBannerConfig {
  v: 1;
  format: "articles-1250x400";
  campaign: string;
  primary: string; // main campaign colour: header, arrows and default label colour
  header: Header;
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
}
