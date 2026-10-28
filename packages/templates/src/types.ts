// Banner config. Stored inside every generated banner so the zip can be re-imported.
// Draft schema is described in docs/ARCHITECTURE.md.

export interface ThemeColors {
  bg: string; // page and badge background
  text: string; // article titles
  badge: string; // badge text and arrow buttons
  hover: string; // title colour on hover
  headerBg: string; // header colour (also shown behind a header image)
}

export interface ArticleItem {
  url: string;
  title: string;
  image: string;
}

export type Header =
  | { type: "image"; src: string; href: string } // src is a file name inside the zip
  | { type: "color"; href: string };

export interface ArticlesBannerConfig {
  v: 1;
  format: "articles-1250x400";
  campaign: string;
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
