// Every banner format rendered from a fixed config must equal its stored copy in golden/.
// A deliberate change of a template: run `yarn test -u`, look at the diff of the golden files, and say why in the pull request.
import { expect, test } from "vitest";
import { renderArticles1250x400, renderArticlesBoth, renderArticlesMobile, renderFrameBanner, renderHeaderBar, renderImageSlider, renderResponsiveBanner, validate, validateFrameBanner, validateHeaderBar, validateImageSlider, validateResponsiveBanner } from "../src/index.ts";
import * as f from "./fixtures.ts";

const cases: [string, () => string][] = [
  ["articles-1250x400", () => renderArticles1250x400(f.articlesDesktop, f.assets)],
  ["articles-1250x400-ad", () => renderArticles1250x400(f.articlesDesktopAd, f.assets)],
  ["articles-mobile", () => renderArticlesMobile(f.articlesMobile, f.assets)],
  ["articles-both", () => renderArticlesBoth(f.articlesDesktopAd, f.articlesMobile, f.assets)],
  ["image-slider-1250x400", () => renderImageSlider(f.sliderDesktop, f.assets)],
  ["image-slider-1250x400-arc", () => renderImageSlider(f.sliderDesktopArc, f.assets)],
  ["image-slider-600x500", () => renderImageSlider(f.sliderMobile, f.assets)],
  ["image-slider-600x500-cube", () => renderImageSlider(f.sliderMobileCube, f.assets)],
  ["frame-banner-fixed", () => renderFrameBanner(f.frameFixed)],
  ["frame-banner-responsive", () => renderFrameBanner(f.frameResponsive)],
  ["responsive-banner-video", () => renderResponsiveBanner(f.responsiveVideo)],
  ["responsive-banner-pictures", () => renderResponsiveBanner(f.responsivePictures)],
];

test.each(cases)("%s equals its golden file", async (name, render) => {
  await expect(render()).toMatchFileSnapshot(`./golden/${name}.html`);
});

test.each([
  ["header-bar", f.headerBar],
  ["header-bar-picture", f.headerBarPicture],
] as const)("%s equals its golden files", async (name, config) => {
  const files = renderHeaderBar(config);
  for (const [file, text] of Object.entries(files)) await expect(text).toMatchFileSnapshot(`./golden/${name}/${file}`);
});

test("every fixture is a valid banner", () => {
  expect(validate(f.articlesDesktop)).toEqual([]);
  expect(validate(f.articlesDesktopAd)).toEqual([]);
  expect(validate(f.articlesMobile)).toEqual([]);
  expect(validateImageSlider(f.sliderDesktop)).toEqual([]);
  expect(validateImageSlider(f.sliderMobile)).toEqual([]);
  expect(validateFrameBanner(f.frameFixed)).toEqual([]);
  expect(validateFrameBanner(f.frameResponsive)).toEqual([]);
  expect(validateResponsiveBanner(f.responsiveVideo)).toEqual([]);
  expect(validateResponsiveBanner(f.responsivePictures)).toEqual([]);
  expect(validateHeaderBar(f.headerBar)).toEqual([]);
});
