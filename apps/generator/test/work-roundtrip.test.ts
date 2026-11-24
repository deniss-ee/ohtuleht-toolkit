// Every kind of banner, built as a zip and opened through the same door the app uses ("Open a banner you made before"):
// (Drafts without pictures: the sample pictures are drawn on a canvas, which the test page does not have. The picture files are covered by the articles test and by hand.)
// the app must recognise the kind (the readers are tried one after another) and give back the same settings.
import { describe, expect, test } from "vitest";
import { buildFrameZip, newFrameDraft } from "@/lib/frames";
import { buildHeaderZip, exampleHeaderDraft } from "@/lib/header";
import { buildResponsiveZip, newResponsiveDraft } from "@/lib/responsive";
import { buildSliderZip, newSliderDraft } from "@/lib/slider";
import { openZip } from "@/lib/work";

const asFile = (blob: Blob) => new File([blob], "banner.zip", { type: "application/zip" });

describe("opening a zip finds the right kind and keeps the settings", () => {
  test("header bar", async () => {
    const draft = exampleHeaderDraft();
    const { work } = await openZip(asFile(await buildHeaderZip(draft)));
    expect(work.kind).toBe("header");
    expect(work.draft.config).toEqual(draft.config);
  });

  test("image slider, desktop", async () => {
    const draft = newSliderDraft();
    draft.config.campaign = "Round trip";
    const { work } = await openZip(asFile(await buildSliderZip(draft)));
    expect(work.kind).toBe("slider");
    expect(work.draft.config).toEqual(draft.config);
  });

  test("image slider, mobile", async () => {
    const draft = newSliderDraft("image-slider-600x500");
    const { work } = await openZip(asFile(await buildSliderZip(draft)));
    expect(work.kind).toBe("slider");
    expect(work.draft.config).toEqual(draft.config);
  });

  test("picture loop (frames)", async () => {
    const draft = newFrameDraft();
    draft.config.campaign = "Round trip";
    const { work } = await openZip(asFile(await buildFrameZip(draft)));
    expect(work.kind).toBe("frames");
    expect(work.draft.config).toEqual(draft.config);
  });

  test("responsive banner", async () => {
    const draft = newResponsiveDraft();
    draft.config.campaign = "Round trip";
    const { work } = await openZip(asFile(await buildResponsiveZip(draft)));
    expect(work.kind).toBe("responsive");
    expect(work.draft.config).toEqual(draft.config);
  });
});
