// The gift card: path reading, the logo, the texts, the layout and the PDF. A stand-in font (every letter a box half an em wide)
// is used, so the tests do not depend on font files and the layout can be compared with a stored copy.
import { describe, expect, test } from "vitest";
import { A4, EMAIL, cardText, contentOf, layoutBack, layoutCard, logoShapes, parsePathData, renderPdf } from "../src/index.ts";
import type { CardCopy, FontFace, Fonts, GiftCardSpec } from "../src/index.ts";

const box: FontFace = {
  advance: (_, size) => size * 0.5,
  path: (_, x, y, size) => [
    { type: "M", x, y },
    { type: "L", x: x + size * 0.4, y },
    { type: "L", x: x + size * 0.4, y: y - size * 0.7 },
    { type: "L", x, y: y - size * 0.7 },
    { type: "Z" },
  ],
};
const fonts: Fonts = { title: box, regular: box, semibold: box, bold: box };

const copy: CardCopy = {
  label: "KINKEKAART",
  codeLabel: "SALAKOOD",
  print: { order: "Order", withCode: " and code", toEmail: " to {email}", valid: "Valid until {date}" },
  email: { order: "Reply", withCode: " with the code", valid: "Valid until {date}" },
};

// A tiny logo as the brand script writes them: the fill sits on the group, a clip path in <defs> must not be drawn.
const logo = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 120 40"><g clip-path="url(#a)" fill="#f5911e"><path d="M0 0h60v40H0z"/><path fill="#000" d="M70 0l40 0 0 40-40 0z"/></g><defs><clipPath id="a"><path fill="#fff" d="M0 0h120v40H0z"/></clipPath></defs></svg>`;

const spec: GiftCardSpec = { header: "Ristsõnaajakirja Ripsik\nkuue kuu tellimus", logo, color: "#f5911e", code: "M-1", email: "nimi@example.com", until: "31.12.2026", copy };

describe("path data", () => {
  test("absolute and relative commands, implicit repeats", () => {
    expect(parsePathData("M10 10L20 10 20 20z")).toEqual([["M", 10, 10], ["L", 20, 10], ["L", 20, 20], ["Z"]]);
    expect(parsePathData("m10 10h10v10H10z")).toEqual([["M", 10, 10], ["L", 20, 10], ["L", 20, 20], ["L", 10, 20], ["Z"]]);
    expect(parsePathData("M0 0 10 0")).toEqual([["M", 0, 0], ["L", 10, 0]]);
  });

  test("numbers run together as an optimiser writes them", () => {
    expect(parsePathData("M1.5.5-2-.5")).toEqual([["M", 1.5, 0.5], ["L", -2, -0.5]]);
  });

  test("quadratic curves become cubic ones through the same points", () => {
    const [, c] = parsePathData("M0 0Q30 0 30 30");
    expect(c).toEqual(["C", 20, 0, 30, 10, 30, 30]);
  });

  test("a smooth curve reflects the last control point", () => {
    const [, , s] = parsePathData("M0 0C0 10 10 20 20 20S40 10 40 0");
    expect(s).toEqual(["C", 30, 20, 40, 10, 40, 0]);
  });

  test("arcs are refused, not drawn wrong", () => {
    expect(() => parsePathData("M0 0A5 5 0 0 1 10 10")).toThrow(/not supported/);
  });
});

describe("logo", () => {
  test("a path takes the fill of its group, and shapes in <defs> are not drawn", () => {
    const l = logoShapes(logo);
    expect([l.width, l.height]).toEqual([120, 40]);
    expect(l.shapes.map((s) => s.fill)).toEqual(["#f5911e", "#000000"]);
  });

  test("the logos of the titles read without error and have colour", async () => {
    const { readFileSync, readdirSync } = await import("node:fs");
    const dir = new URL("../../brand/titles/", import.meta.url);
    const files = readdirSync(dir).filter((f) => f.endsWith(".svg"));
    expect(files.length).toBeGreaterThanOrEqual(16);
    for (const f of files) {
      const l = logoShapes(readFileSync(new URL(f, dir), "utf8"));
      expect(l.shapes.length, f).toBeGreaterThan(0);
      expect(l.shapes.every((s) => /^#[0-9a-f]{6}$/.test(s.fill!)), f).toBe(true);
      expect(readFileSync(new URL(f, dir), "utf8").toLowerCase(), f).not.toContain("#e3000f"); // the old red is the brand red now
    }
  });
});

describe("texts", () => {
  const words = (kind: "print" | "email", s: GiftCardSpec) => {
    const t = cardText(kind, s);
    return { order: t.order.map((p) => p.text).join(""), valid: t.valid.map((p) => p.text).join(""), values: t.order.concat(t.valid).filter((p) => p.value).map((p) => p.text) };
  };

  test("print: the order goes to the address, the code is mentioned, the values stand out", () => {
    expect(words("print", spec)).toEqual({ order: "Order and code to nimi@example.com", valid: "Valid until 31.12.2026", values: ["nimi@example.com", "31.12.2026"] });
  });

  test("print: parts without a value are left out", () => {
    expect(words("print", { ...spec, code: "", email: "" }).order).toBe("Order");
    expect(words("print", { ...spec, until: "" }).valid).toBe("");
  });

  test("e-mail: no address, even when one is written", () => {
    expect(words("email", spec).order).toBe("Reply with the code");
    expect(words("email", { ...spec, code: "" }).order).toBe("Reply");
  });
});

describe("layout", () => {
  test("sizes: A4 in points, the e-mail picture 600x400", () => {
    expect([A4.width, A4.height]).toEqual([595.276, 841.89]);
    expect(layoutCard("print", spec, fonts)).toMatchObject({ width: A4.width, height: A4.height });
    expect(layoutCard("email", spec, fonts)).toMatchObject({ width: EMAIL.width, height: EMAIL.height });
    expect(layoutBack(spec)).toMatchObject({ width: A4.width, height: A4.height });
  });

  test("every number is finite and the text stays on the card", () => {
    for (const d of [layoutCard("print", spec, fonts), layoutCard("email", spec, fonts), layoutBack(spec)]) {
      for (const s of d.shapes.filter((x) => x.fill && !x.evenOdd && x.cmds.length < 200)) {
        for (const c of s.cmds) for (const v of c.slice(1) as number[]) expect(Number.isFinite(v)).toBe(true);
      }
    }
  });


  test("the code box (a white box, its label and the code) is only there when there is a code", () => {
    for (const kind of ["print", "email"] as const) {
      const withCode = layoutCard(kind, spec, fonts).shapes.length;
      expect(withCode - layoutCard(kind, { ...spec, code: "" }, fonts).shapes.length).toBe(3);
    }
  });

  test("nothing is drawn around the card: only a white page, the circle, the text and the logo", () => {
    const shapes = layoutCard("print", spec, fonts).shapes;
    expect(shapes[0]).toMatchObject({ fill: "#ffffff" }); // the page
    expect(shapes[1]).toMatchObject({ fill: "#f5911e" }); // the circle, drawn once, right after the page
    expect(shapes.filter((s) => s.fill === "#f5911e" && s.cmds.length === 6)).toHaveLength(1);
    expect(shapes.every((s) => !("stroke" in s))).toBe(true);
  });

  test("the header: one long line is made smaller until it fits", () => {
    const wide = layoutCard("print", { ...spec, header: "Ristsõnaajakirja Ripsik Ristsõnaajakirja Ripsik" }, fonts);
    expect(wide.shapes.length).toBeGreaterThan(5);
  });

  test("a card of every kind, with and without back, is stable (stored copy)", async () => {
    await expect(contentOf(layoutCard("print", spec, fonts))).toMatchFileSnapshot("./golden/giftcard-print.txt");
    await expect(contentOf(layoutCard("email", spec, fonts))).toMatchFileSnapshot("./golden/giftcard-email.txt");
    await expect(contentOf(layoutBack(spec))).toMatchFileSnapshot("./golden/giftcard-back.txt");
  });
});

describe("pdf", () => {
  test("a plain PDF with the A4 page size, one page per drawing, and a cross-reference table that points at the right places", async () => {
    const bytes = await renderPdf([layoutCard("print", spec, fonts), layoutBack(spec)], { title: "Kinkekaart", compress: false });
    const text = new TextDecoder("latin1").decode(bytes);
    expect(text.startsWith("%PDF-1.4")).toBe(true);
    expect(text.match(/\/Type \/Page /g)).toHaveLength(2);
    expect(text).toContain("/MediaBox [0 0 595.276 841.89]");
    expect(text).toContain("/Count 2");
    // flat RGB colour, no fonts or pictures
    expect(text).toMatch(/ rg\n/);
    expect(text).not.toMatch(/\/Font|\/Image|\/CMYK|DeviceCMYK/);
    // every offset in the table is the start of that object, and startxref is the start of the table
    const start = Number(/startxref\n(\d+)/.exec(text)![1]);
    expect(text.slice(start, start + 4)).toBe("xref");
    const entries = [...text.slice(start).matchAll(/(\d{10}) 00000 n /g)].map((m) => Number(m[1]));
    entries.forEach((offset, i) => expect(text.slice(offset, offset + `${i + 1} 0 obj`.length)).toBe(`${i + 1} 0 obj`));
  });

  test("compressed, the same page is much smaller", async () => {
    const pages = [layoutCard("print", spec, fonts)];
    const plain = await renderPdf(pages, { compress: false });
    const packed = await renderPdf(pages);
    expect(packed.length).toBeLessThan(plain.length);
    expect(new TextDecoder("latin1").decode(packed)).toContain("/FlateDecode");
  });

  test("the title with letters outside ASCII is written as UTF-16", async () => {
    const text = new TextDecoder("latin1").decode(await renderPdf([layoutBack(spec)], { title: "Õhtuleht", compress: false }));
    expect(text).toContain("/Title <FEFF00d5");
  });
});
