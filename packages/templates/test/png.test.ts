// The small PNG of the e-mail picture: the palette and the file. (The code lives in the app, apps/generator/src/lib/png.ts; it has no
// dependency on the browser except OxiPNG, which is loaded only by smallPng and is not used here.)
import { describe, expect, test } from "vitest";
import { indexedPng, quantise } from "../../../apps/generator/src/lib/png.ts";

// A picture of flat colours with soft edges: `colours` is a list of [r, g, b], the picture is split into vertical bands and the border of each band is a blend.
function bands(colours: number[][], width = 60, height = 20) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const at = (y * width + x) * 4;
      const band = Math.min(colours.length - 1, Math.floor((x / width) * colours.length));
      const c = colours[band]!;
      data.set([c[0]!, c[1]!, c[2]!, 255], at);
    }
  }
  return { data, width, height };
}

const colourAt = (palette: Uint8Array, indices: Uint8Array, i: number) => [...palette.subarray(indices[i]! * 3, indices[i]! * 3 + 3)];

describe("palette", () => {
  test("a picture with few colours keeps every one exactly", () => {
    const img = bands([[10, 20, 30], [245, 145, 30], [255, 255, 255], [0, 0, 0]]);
    const { palette, indices } = quantise(img, 256);
    expect(palette.length / 3).toBe(4);
    for (let i = 0; i < indices.length; i++) expect(colourAt(palette, indices, i)).toEqual([...img.data.subarray(i * 4, i * 4 + 3)]);
  });

  test("more colours than the palette holds: at most that many, and the most used stay exact", () => {
    const img = bands([[245, 145, 30], [255, 255, 255]], 600, 40);
    // soft edge colours: 600 different greys in the first row
    for (let x = 0; x < 600; x++) img.data.set([x % 256, (x * 7) % 256, (x * 13) % 256, 255], x * 4);
    const { palette, indices } = quantise(img, 64);
    expect(palette.length / 3).toBeLessThanOrEqual(64);
    const used = new Set<string>();
    for (let i = 600; i < indices.length; i++) used.add(colourAt(palette, indices, i).join(","));
    expect(used).toEqual(new Set(["245,145,30", "255,255,255"])); // the two flat colours, exactly
  });
});

describe("the PNG file", () => {
  const crcOf = (bytes: Uint8Array) => {
    let c = 0xffffffff;
    for (const b of bytes) {
      c ^= b;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    return (c ^ 0xffffffff) >>> 0;
  };

  test("signature, chunks in order, correct lengths and checksums", async () => {
    const img = bands([[10, 20, 30], [245, 145, 30]]);
    const { palette, indices } = quantise(img, 256);
    const png = await indexedPng(img.width, img.height, palette, indices);
    expect([...png.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
    const view = new DataView(png.buffer, png.byteOffset);
    const types: string[] = [];
    let at = 8;
    while (at < png.length) {
      const length = view.getUint32(at);
      const type = String.fromCharCode(...png.subarray(at + 4, at + 8));
      types.push(type);
      expect(view.getUint32(at + 8 + length), type).toBe(crcOf(png.subarray(at + 4, at + 8 + length)));
      if (type === "IHDR") expect([view.getUint32(at + 8), view.getUint32(at + 12), png[at + 16], png[at + 17]]).toEqual([img.width, img.height, 8, 3]); // 8 bits, indexed
      at += 12 + length;
    }
    expect(at).toBe(png.length);
    expect(types).toEqual(["IHDR", "PLTE", "IDAT", "IEND"]);
  });
});
