// One made-up config per banner format. Texts are invented, links are example.com, no customer material.
import type { ArticlesBannerConfig, FrameBannerConfig, HeaderBarConfig, ImageSliderConfig, ResponsiveBannerConfig, RuntimeAssets } from "../src/index.ts";

// Stand-ins for the built runtime: the golden files must not change when the runtime is rebuilt.
export const assets: RuntimeAssets = { runtimeJs: "/*runtime*/", sliderCss: "/*slider-css*/", fxJs: "/*fx*/" };

const titles = ["Esimene näidisartikkel", "Teine näide, mille pealkiri on kahe rea pikkune ja murdub kaardil", "Kolmas näide", "Neljas näidisartikkel", "Viies näide: \"jutumärgid\" & <märgid>", "Kuues ja viimane"];

export const articlesDesktop: ArticlesBannerConfig = {
  v: 1,
  format: "articles-1250x400",
  campaign: "Example campaign",
  header: { type: "color", href: "https://example.com/campaign" },
  badge: "Sisuturundus",
  primary: "#f50000",
  theme: {
    light: { bg: "#ffffff", text: "#272727", hover: "#e3000f" },
    dark: { bg: "#0f0f0f", text: "#ffffff", hover: "#e3000f" },
  },
  behavior: { shuffle: true, autoplay: true, delayMs: 3000, speedMs: 250, loop: true },
  articles: titles.map((title, i) => ({ url: `https://example.com/article-${i + 1}`, image: `https://p.ohtuleht.ee/webp/54/i/2026/1/${i + 1}/example${i + 1}.jpg`, title })),
};

// Per-article label and colour, a picture header with a logo, and a static ad (3 articles visible).
export const articlesDesktopAd: ArticlesBannerConfig = {
  ...articlesDesktop,
  campaign: "Ad campaign",
  header: { type: "image", src: "header.jpg", href: "https://example.com/campaign", avg: "#8a0aa6" },
  headerLogo: "logo.svg",
  ad: { src: "ad.jpg", href: "https://example.com/ad", width: 247 },
  articles: articlesDesktop.articles.map((a, i) => (i === 0 ? { ...a, badge: "Kontsert", badgeColor: "#0a7a3d" } : a)),
};

export const articlesMobile: ArticlesBannerConfig = {
  ...articlesDesktop,
  format: "articles-mobile",
  theme: { ...articlesDesktop.theme, dark: { ...articlesDesktop.theme.dark, bg: "#1c1c1c" } },
  // One article with its own phone picture (an uploaded file), one with its own address.
  articles: articlesDesktop.articles.map((a, i) => (i === 1 ? { ...a, imageMobile: "pic-abc123.jpg" } : i === 2 ? { ...a, imageMobile: "https://example.com/own-phone-picture.jpg" } : a)),
};

export const sliderDesktop: ImageSliderConfig = {
  v: 1,
  kind: "image-slider",
  format: "image-slider-1250x400",
  campaign: "Slider campaign",
  background: "background.jpg",
  backgroundLink: { clickable: true, href: "https://example.com/bg" },
  slides: [1, 2, 3, 4, 5].map((n) => ({ image: `slide-${n}.jpg`, href: `https://example.com/slide-${n}` })),
  linkMode: "each",
  sharedHref: "",
  desktop: { layout: { x: 165, y: 100, width: 920, height: 250, gap: 10, visible: 3 }, arrows: true, effect: "slide" },
  mobile: { arrows: false, effect: "slide" },
  behavior: { shuffle: false, autoplay: true, delayMs: 2000, speedMs: 500, loop: true },
};

export const sliderMobile: ImageSliderConfig = { ...sliderDesktop, format: "image-slider-600x500", linkMode: "shared", sharedHref: "https://example.com/all" };
export const sliderDesktopArc: ImageSliderConfig = { ...sliderDesktop, desktop: { ...sliderDesktop.desktop, effect: "arc" } };
export const sliderMobileCube: ImageSliderConfig = { ...sliderMobile, mobile: { arrows: false, effect: "cube" } };

export const frameFixed: FrameBannerConfig = {
  v: 1,
  kind: "frame-banner",
  format: "frame-banner",
  campaign: "Loop campaign",
  width: 300,
  height: 250,
  responsive: false,
  fit: "cover",
  backgroundColor: "",
  backgroundImage: "",
  frames: [{ image: "frame-1.png" }, { image: "frame-2.png", holdMs: 5000 }, { image: "frame-3.png" }],
  holdMs: 3000,
  fadeMs: 800,
  loop: { forever: true, times: 3 },
  pauseOnHover: false,
  respectMotion: false,
  href: "https://example.com/loop",
};

export const frameResponsive: FrameBannerConfig = { ...frameFixed, width: 970, height: 250, responsive: true, fit: "contain", backgroundColor: "#101010", backgroundImage: "bg.jpg", fadeMs: 0, loop: { forever: false, times: 2 }, pauseOnHover: true, respectMotion: true, href: "" };

export const responsiveVideo: ResponsiveBannerConfig = {
  v: 1,
  kind: "responsive-banner",
  format: "responsive-banner",
  campaign: "Responsive campaign",
  small: { kind: "video", video: "540.mp4", poster: "540-poster.webp", pictures: [] },
  large: { kind: "video", video: "700.mp4", poster: "700-poster.webp", pictures: [] },
  holdMs: 3000,
  fadeMs: 800,
  href: "https://example.com/responsive",
};

export const responsivePictures: ResponsiveBannerConfig = {
  ...responsiveVideo,
  small: { kind: "pictures", video: "", poster: "", pictures: ["540-1.jpg", "540-2.jpg"] },
  large: { kind: "pictures", video: "", poster: "", pictures: ["700-1.jpg"] },
  href: "",
};

export const headerBar: HeaderBarConfig = { v: 1, format: "header-bar", label: "Näidiskampaania", href: "https://example.com/campaign", primary: "#99e300" };
export const headerBarPicture: HeaderBarConfig = { ...headerBar, primary: "#f50000", textColor: "#ffffff", picture: { src: "header.jpg", avg: "#223344" } };
