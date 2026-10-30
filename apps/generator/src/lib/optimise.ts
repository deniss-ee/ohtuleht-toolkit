// Picture optimiser: the codecs of the Squoosh app (jSquash), run in the browser. Nothing is uploaded anywhere.
// JPEG: MozJPEG at quality 75, which keeps text edges clean at banner size. PNG: OxiPNG, lossless.
// A picture is only made smaller in pixels when it is bigger than the banner can show (2x for sharp screens).
// If the result is not smaller than the original, the original is kept.

export interface Optimised {
  bytes: Uint8Array;
  name: string; // file name with the extension of the result
  before: number;
  after: number;
}

// Largest size each picture is ever shown at, times 2 for sharp screens. Bigger pictures are scaled down.
export const HEADER_LIMIT = { maxWidth: 2496, maxHeight: 92 };
export const AD_LIMIT = { maxWidth: 800, maxHeight: 676 }; // 338 px high (AD_HEIGHT) times 2
export const SLIDE_LIMIT = { maxWidth: 600, maxHeight: 500 }; // slides are 300x250 on the banner
export const BG_LIMIT = { maxWidth: 2500, maxHeight: 800 }; // background 1250x400
export const BG_MOBILE_LIMIT = { maxWidth: 1200, maxHeight: 1000 }; // background 600x500

const JPEG_QUALITY = 75; // measured on a real ad: 80 was not smaller than an already tight original, 75 saves about 10%, 70 about 20%

const extOf = (name: string) => name.split(".").pop()?.toLowerCase() ?? "";

async function decodeToImageData(bytes: Uint8Array, mime: string): Promise<ImageData> {
  const bitmap = await createImageBitmap(new Blob([bytes as BlobPart], { type: mime }));
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("canvas");
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

// maxWidth / maxHeight: the size the picture is shown at, times 2. Larger pictures are scaled down (keeping the shape).
export async function optimiseImage(bytes: Uint8Array, name: string, limit: { maxWidth: number; maxHeight: number; quality?: number }): Promise<Optimised> {
  const ext = extOf(name);
  const keep: Optimised = { bytes, name, before: bytes.length, after: bytes.length };
  if (ext !== "jpg" && ext !== "jpeg" && ext !== "png") return keep; // SVG and WebP are left as they are
  try {
    const mime = ext === "png" ? "image/png" : "image/jpeg";
    const [{ default: resize }, jpeg, oxipng] = await Promise.all([import("@jsquash/resize"), import("@jsquash/jpeg"), import("@jsquash/oxipng")]);
    let image = await decodeToImageData(bytes, mime);
    const scale = Math.min(1, limit.maxWidth / image.width, limit.maxHeight / image.height);
    const resized = scale < 1;
    if (resized) image = await resize(image, { width: Math.round(image.width * scale), height: Math.round(image.height * scale) });
    let out: Uint8Array;
    if (ext === "png") {
      // OxiPNG takes raw pixels too, so a resized picture needs no extra PNG step.
      out = new Uint8Array(await oxipng.optimise(resized ? image : (bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer), { level: 3 }));
    } else {
      out = new Uint8Array(await jpeg.encode(image, { quality: limit.quality ?? JPEG_QUALITY }));
    }
    if (out.length >= bytes.length) return keep;
    return { bytes: out, name, before: bytes.length, after: out.length };
  } catch {
    return keep; // the optimiser must never block the person: use the picture as it is
  }
}
