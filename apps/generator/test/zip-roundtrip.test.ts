// A banner saved as a zip and opened again must give the same banner: nothing may be lost between "Download" and "Open a banner you made before".
import { describe, expect, test } from "vitest";
import { desktopOf, exampleDraft, newDraft } from "@/lib/banner";
import { buildBothZip, buildZip, importZip } from "@/lib/zip";

const asFile = (blob: Blob, name = "banner.zip") => new File([blob], name, { type: "application/zip" });

describe("articles banner: zip round trip", () => {
  for (const format of ["articles-1250x400", "articles-mobile"] as const) {
    test(`${format}: the settings and the articles survive`, async () => {
      const draft = await exampleDraft(format);
      draft.config.campaign = "Round trip";
      draft.config.primary = "#123456";
      const opened = await importZip(asFile(await buildZip(draft)));
      expect(opened.notes).toEqual([]);
      expect(opened.draft.config).toEqual(draft.config);
    });
  }

  test("one zip for both sizes opens as the desktop banner, with the same settings", async () => {
    const draft = await exampleDraft("articles-mobile");
    const opened = await importZip(asFile(await buildBothZip(draft)));
    expect(opened.draft.config).toEqual(desktopOf(draft).config);
  });

  test("an empty banner opens again as an empty banner", async () => {
    const draft = newDraft();
    const opened = await importZip(asFile(await buildZip(draft)));
    expect(opened.draft.config.articles).toEqual([]);
    expect(opened.draft.config.format).toBe("articles-1250x400");
  });

  test("a zip without index.html is refused with a message", async () => {
    await expect(importZip(asFile(new Blob(["not a zip"])))).rejects.toThrow();
  });
});
