// Small image helpers shared by the banner builder and the zip reader.

function mimeOf(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "svg") return "image/svg+xml";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "webp") return "image/webp";
  return "image/png";
}

export function toDataUrl(bytes: Uint8Array, name: string): string {
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return `data:${mimeOf(name)};base64,${btoa(binary)}`;
}

// Natural size of a picture, or undefined when it cannot be read.
export async function imageSize(dataUrl: string): Promise<{ width: number; height: number } | undefined> {
  try {
    const img = new Image();
    img.src = dataUrl;
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("image"));
      setTimeout(() => reject(new Error("timeout")), 3000);
    });
    return img.naturalWidth && img.naturalHeight ? { width: img.naturalWidth, height: img.naturalHeight } : undefined;
  } catch {
    return undefined;
  }
}

// Average colour of the left third of a picture (where the header text sits), as #rrggbb.
// Used to choose a readable text colour. Returns undefined when the picture cannot be read.
export async function averageColor(dataUrl: string): Promise<string | undefined> {
  try {
    const img = new Image();
    img.src = dataUrl;
    // Wait for the load event (decode() can stall while the tab is in the background); give up after 3 s.
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("image"));
      setTimeout(() => reject(new Error("timeout")), 3000);
    });
    const cols = 32;
    const rows = 4;
    const canvas = document.createElement("canvas");
    canvas.width = cols;
    canvas.height = rows;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return undefined;
    ctx.drawImage(img, 0, 0, cols, rows);
    const data = ctx.getImageData(0, 0, Math.ceil(cols / 3), rows).data;
    let r = 0;
    let g = 0;
    let b = 0;
    let weight = 0;
    for (let i = 0; i < data.length; i += 4) {
      const a = (data[i + 3] ?? 0) / 255; // transparent pixels do not count
      r += (data[i] ?? 0) * a;
      g += (data[i + 1] ?? 0) * a;
      b += (data[i + 2] ?? 0) * a;
      weight += a;
    }
    if (!weight) return undefined;
    const hex = (v: number) => Math.round(v / weight).toString(16).padStart(2, "0");
    return `#${hex(r)}${hex(g)}${hex(b)}`;
  } catch {
    return undefined;
  }
}

// Õhtuleht picture links carry a size number: https://p.ohtuleht.ee/webp/54/i/2026/10/26/x.jpg
// 54 suits the desktop banner, 48 the (cropped, sharper) mobile banner; the CMS gives other numbers.
// Both forms exist and both are accepted: /webp/53/i/... (site) and /53/i/... (CMS). The result is always the /webp/NN/ form.
// A link with no size at all (https://p.ohtuleht.ee/i/...) gets one. Returns null for anything else.
export function withPictureSize(url: string, size: number): string | null {
  const text = url.trim();
  const sized = /\/(?:webp\/)?\d{1,3}\/(?=i\/)/;
  if (sized.test(text)) return text.replace(sized, `/webp/${size}/`);
  const bare = /^(https?:\/\/p\.ohtuleht\.ee)\/(?=i\/)/;
  return bare.test(text) ? text.replace(bare, `$1/webp/${size}/`) : null;
}
