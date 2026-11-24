// The rules that have already broken once, pinned.
import { describe, expect, test } from "vitest";
import { BAR_HEIGHT, brandTextColor, contrast, forDesktop, frameTimeline, LOGO_HEIGHT, LOGO_MIN, logoHeight, OWN_PICTURE, pictureFits, readableOn, renderArticles1250x400, renderHeaderBar, renderArticlesMobile, validate } from "../src/index.ts";
import { fadeRamp, frameStops } from "../src/frame-banner.ts";
import * as f from "./fixtures.ts";

const P = "https://p.ohtuleht.ee/webp";
const cards = (html: string) => [...html.matchAll(/background-image:url\(&quot;([^&]*)&quot;\)/g)].map((m) => m[1]);

describe("article pictures", () => {
  test("desktop never uses the phone size 48", () => {
    const config = { ...f.articlesDesktop, articles: f.articlesDesktop.articles.map((a) => ({ ...a, image: a.image.replace("/webp/54/", "/webp/48/") })) };
    const html = renderArticles1250x400(config, f.assets);
    expect(html).not.toContain("/webp/48/"); // cards and the saved settings alike
    expect(cards(html).every((u) => u!.includes("/webp/54/"))).toBe(true);
  });

  test("desktop keeps other sizes set by hand, and uploaded files", () => {
    expect(forDesktop(`${P}/59/i/x.jpg`)).toBe(`${P}/59/i/x.jpg`);
    expect(forDesktop("pic-abc123.jpg")).toBe("pic-abc123.jpg");
    expect(forDesktop(`${P}/48/i/x.jpg`)).toBe(`${P}/54/i/x.jpg`);
  });

  test("mobile uses 48 unless the article has its own phone picture", () => {
    const urls = cards(renderArticlesMobile(f.articlesMobile, f.assets));
    expect(urls[0]).toContain("/webp/48/");
    expect(urls[1]).toBe("pic-abc123.jpg");
    expect(urls[2]).toBe("https://example.com/own-phone-picture.jpg");
    expect(urls[3]).toContain("/webp/48/");
  });

  test("an empty own phone picture falls back to 48", () => {
    const config = { ...f.articlesMobile, articles: f.articlesMobile.articles.map((a) => ({ ...a, imageMobile: "  " })) };
    expect(cards(renderArticlesMobile(config, f.assets)).every((u) => u!.includes("/webp/48/"))).toBe(true);
  });

  test("uploaded picture names", () => {
    for (const ok of ["pic-abc123.jpg", "pic-x1.PNG", "pic-9z.webp", "pic-a.jpeg"]) expect(OWN_PICTURE.test(ok)).toBe(true);
    for (const bad of ["header.jpg", "pic-.jpg", "pic-abc.svg", "../pic-abc.jpg", "https://x/pic-abc.jpg", "pic-abc.jpg.exe"]) expect(OWN_PICTURE.test(bad)).toBe(false);
  });
});

describe("validate", () => {
  test("names the field of each problem", () => {
    const config = { ...f.articlesDesktop, campaign: " ", articles: [{ url: "example.com", title: "", image: "not a picture" }] };
    expect(validate(config).map((p) => p.field)).toEqual(["campaign", "paste", "a0-title", "a0-url", "a0-img"]);
  });

  test("accepts an uploaded picture as the article picture", () => {
    const config = { ...f.articlesDesktop, articles: f.articlesDesktop.articles.map((a) => ({ ...a, image: "pic-abc123.jpg" })) };
    expect(validate(config)).toEqual([]);
  });

  test("an ad needs a picture and a link", () => {
    const config = { ...f.articlesDesktopAd, ad: { src: "", href: "", width: 247 } };
    expect(validate(config).map((p) => p.field)).toEqual(["ad-choose", "ad-href"]);
  });
});

describe("colours", () => {
  test("brand text rule: black up to step 500, white from 600", () => {
    expect(brandTextColor("#f50000")).toBe("#ffffff"); // Primary Red 600
    expect(brandTextColor("#123456")).toBeUndefined(); // not a brand colour
  });

  test("a label colour is made readable on its background", () => {
    for (const bg of ["#ffffff", "#0f0f0f", "#1c1c1c"]) for (const c of ["#f50000", "#ffdb00", "#99e300", "#101010", "#fafafa"]) expect(contrast(readableOn(c, bg), bg)).toBeGreaterThanOrEqual(4.5);
  });
});

describe("picture loop fade", () => {
  // At every moment of the round at least one picture is fully solid: the background never shows between two pictures.
  const at = (stops: [number, number][], t: number) => {
    let prev = stops[0]!;
    for (const s of stops) {
      if (s[0] > t) return prev[1] + ((s[1] - prev[1]) * (t - prev[0])) / (s[0] - prev[0] || 1);
      prev = s;
    }
    return prev[1];
  };

  test.each([
    [[3000, 3000, 3000], 800],
    [[3000, 5000, 300], 800],
    [[1000, 1000], 0],
    [[400, 400, 400, 400], 400],
  ])("holds %j, fade %i: always one solid picture", (holds, fade) => {
    const { v, total } = frameTimeline(holds, fade);
    const stops = holds.map((_, i) => frameStops(i, holds.length, v, total, fadeRamp(fade)).opacity);
    for (let t = 0; t <= total; t += 7) expect(Math.max(...stops.map((s) => at(s, t)))).toBe(1);
  });

  test("the round is the sum of the holds and the fades", () => {
    expect(frameTimeline([3000, 5000, 3000], 800).total).toBe(3000 + 5000 + 3000 + 3 * 800);
  });
});

test("responsive banner accepts a picture at 1x and 2x only", () => {
  expect(pictureFits("small", 540, 200)).toBe(true);
  expect(pictureFits("small", 1080, 400)).toBe(true);
  expect(pictureFits("large", 700, 200)).toBe(true);
  expect(pictureFits("large", 1400, 400)).toBe(true);
  expect(pictureFits("small", 700, 200)).toBe(false);
});

describe("header bar logo", () => {
  const withLogo = (height?: number) => renderHeaderBar({ ...f.headerBar, logo: { src: "logo.png", height } });

  test("no logo: nothing about a logo in the files", () => {
    const { html, css } = renderHeaderBar(f.headerBar);
    expect(html).not.toContain("banner__logo");
    expect(css).not.toContain("banner__logo");
  });

  test("the logo is an image at the right end, the usual height when none is chosen", () => {
    const { html, css } = withLogo();
    expect(html).toContain('<img class="banner__logo" src="logo.png" alt="" />');
    expect(html.indexOf("banner__label")).toBeLessThan(html.indexOf("banner__logo"));
    expect(css).toContain(`height: ${LOGO_HEIGHT}px;`);
  });

  test("a chosen height is used, and kept between the minimum and the height of the bar", () => {
    expect(withLogo(20).css).toContain("height: 20px;");
    expect(logoHeight({ ...f.headerBar, logo: { src: "x", height: 500 } })).toBe(BAR_HEIGHT);
    expect(logoHeight({ ...f.headerBar, logo: { src: "x", height: 1 } })).toBe(LOGO_MIN);
  });
});
