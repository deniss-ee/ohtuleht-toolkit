// Small PNGs for flat artwork (the gift card picture): the colours are reduced to a palette, the picture is written as an indexed PNG,
// and OxiPNG (the Squoosh codec, run in the browser, nothing is uploaded) squeezes it further. This is what "Reduce palette" in Squoosh does.
//
// The palette keeps the most used colours exactly (the page, the box, the text), so flat areas stay exactly as drawn; only the soft
// edges of letters and logos are matched to the nearest palette colour. There is no dithering: flat art does not need it.

export interface Pixels {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

// ---- Palette -------------------------------------------------------------------------------------------------------------
interface Entry {
  r: number;
  g: number;
  b: number;
  n: number; // how many pixels
}

const key = (r: number, g: number, b: number) => (r << 16) | (g << 8) | b;

// The palette (r, g, b for each colour) and the index of the palette colour of every pixel.
export function quantise(img: Pixels, maxColours: number): { palette: Uint8Array; indices: Uint8Array } {
  const counts = new Map<number, number>();
  const { data } = img;
  for (let i = 0; i < data.length; i += 4) {
    const k = key(data[i]!, data[i + 1]!, data[i + 2]!);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  const entries: Entry[] = [...counts].map(([k, n]) => ({ r: k >> 16, g: (k >> 8) & 255, b: k & 255, n })).sort((a, b) => b.n - a.n);

  // the most used colours stay exact; the rest is cut into boxes (median cut) and each box becomes one colour
  const exact = entries.slice(0, Math.min(entries.length, Math.max(1, Math.floor(maxColours / 4))));
  const rest = entries.slice(exact.length);
  const palette: Entry[] = [...exact];
  if (rest.length) {
    const boxes: Entry[][] = [rest];
    const room = maxColours - exact.length;
    const range = (box: Entry[]) => {
      const lo = [255, 255, 255];
      const hi = [0, 0, 0];
      for (const e of box) {
        lo[0] = Math.min(lo[0]!, e.r); hi[0] = Math.max(hi[0]!, e.r);
        lo[1] = Math.min(lo[1]!, e.g); hi[1] = Math.max(hi[1]!, e.g);
        lo[2] = Math.min(lo[2]!, e.b); hi[2] = Math.max(hi[2]!, e.b);
      }
      const spans = [hi[0]! - lo[0]!, hi[1]! - lo[1]!, hi[2]! - lo[2]!];
      const channel = spans[1]! >= spans[0]! && spans[1]! >= spans[2]! ? "g" : spans[0]! >= spans[2]! ? "r" : "b";
      return { channel: channel as "r" | "g" | "b", span: Math.max(...spans) };
    };
    while (boxes.length < room) {
      let best = -1;
      let bestScore = 0;
      boxes.forEach((box, i) => {
        if (box.length < 2) return;
        const score = range(box).span * Math.sqrt(box.reduce((sum, e) => sum + e.n, 0));
        if (score > bestScore) [best, bestScore] = [i, score];
      });
      if (best < 0) break;
      const box = boxes[best]!;
      const { channel } = range(box);
      box.sort((a, b) => a[channel] - b[channel]);
      const total = box.reduce((sum, e) => sum + e.n, 0);
      let acc = 0;
      let cut = 1;
      for (let i = 0; i < box.length - 1; i++) {
        acc += box[i]!.n;
        cut = i + 1;
        if (acc >= total / 2) break;
      }
      boxes.splice(best, 1, box.slice(0, cut), box.slice(cut));
    }
    for (const box of boxes) {
      const n = box.reduce((sum, e) => sum + e.n, 0);
      palette.push({ r: Math.round(box.reduce((s, e) => s + e.r * e.n, 0) / n), g: Math.round(box.reduce((s, e) => s + e.g * e.n, 0) / n), b: Math.round(box.reduce((s, e) => s + e.b * e.n, 0) / n), n });
    }
  }

  // every colour of the picture to its nearest palette colour (the eye is most sensitive to green, least to blue)
  const nearest = new Map<number, number>();
  for (const e of entries) {
    let best = 0;
    let bestD = Infinity;
    palette.forEach((p, i) => {
      const d = 2 * (e.r - p.r) ** 2 + 4 * (e.g - p.g) ** 2 + 3 * (e.b - p.b) ** 2;
      if (d < bestD) [best, bestD] = [i, d];
    });
    nearest.set(key(e.r, e.g, e.b), best);
  }
  const indices = new Uint8Array(img.width * img.height);
  for (let i = 0; i < indices.length; i++) indices[i] = nearest.get(key(data[i * 4]!, data[i * 4 + 1]!, data[i * 4 + 2]!))!;
  const rgb = new Uint8Array(palette.length * 3);
  palette.forEach((p, i) => rgb.set([p.r, p.g, p.b], i * 3));
  return { palette: rgb, indices };
}

// ---- The PNG file --------------------------------------------------------------------------------------------------------
const CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (const b of bytes) c = CRC[(c ^ b) & 255]! ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

async function deflate(data: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([data as BlobPart]).stream().pipeThrough(new CompressionStream("deflate"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

function chunk(type: string, body: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + body.length);
  const view = new DataView(out.buffer);
  view.setUint32(0, body.length);
  for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i);
  out.set(body, 8);
  view.setUint32(8 + body.length, crc32(out.subarray(4, 8 + body.length)));
  return out;
}

// An indexed PNG (8 bits per pixel): the palette (r, g, b for each colour) and one index per pixel.
export async function indexedPng(width: number, height: number, palette: Uint8Array, indices: Uint8Array): Promise<Uint8Array> {
  const head = new Uint8Array(13);
  const view = new DataView(head.buffer);
  view.setUint32(0, width);
  view.setUint32(4, height);
  head.set([8, 3, 0, 0, 0], 8); // 8 bits, indexed colour, the usual compression, filter and no interlace
  const rows = new Uint8Array((width + 1) * height); // each row starts with its filter type: 0 (none), OxiPNG chooses better ones
  for (let y = 0; y < height; y++) rows.set(indices.subarray(y * width, (y + 1) * width), y * (width + 1) + 1);
  const parts = [new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", head), chunk("PLTE", palette), chunk("IDAT", await deflate(rows)), chunk("IEND", new Uint8Array(0))];
  const out = new Uint8Array(parts.reduce((sum, p) => sum + p.length, 0));
  let at = 0;
  for (const p of parts) {
    out.set(p, at);
    at += p.length;
  }
  return out;
}

// The picture as a small PNG with at most `colours` colours.
// `level` is how hard OxiPNG tries (1 fast, 6 slow): a lower one for a batch of pictures.
export async function smallPng(img: Pixels, colours = 256, level = 4): Promise<Uint8Array> {
  const { palette, indices } = quantise(img, Math.min(256, Math.max(2, colours)));
  const plain = await indexedPng(img.width, img.height, palette, indices);
  const { optimise } = await import("@jsquash/oxipng");
  const packed = new Uint8Array(await optimise(plain.buffer.slice(plain.byteOffset, plain.byteOffset + plain.byteLength) as ArrayBuffer, { level }));
  return packed.length < plain.length ? packed : plain;
}
