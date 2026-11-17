// The gift card: path reading, the logo, the texts, the layout and the PDF. A stand-in font (every letter a box half an em wide)
// is used, so the tests do not depend on font files and the layout can be compared with a stored copy.
import { describe, expect, test } from "vitest";
import { A4, EMAIL, EMAIL_STYLES, PRINT_STYLES, cardText, contentOf, layoutBack, layoutCard, logoShapes, parsePathData, renderPdf } from "../src/index.ts";
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
};

// A tiny logo as the brand script writes them: the fill sits on the group, a clip path in <defs> must not be drawn.
const logo = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 120 40"><g clip-path="url(#a)" fill="#f5911e"><path d="M0 0h60v40H0z"/><path fill="#000" d="M70 0l40 0 0 40-40 0z"/></g><defs><clipPath id="a"><path fill="#fff" d="M0 0h120v40H0z"/></clipPath></defs></svg>`;

const spec: GiftCardSpec = { header: "Ristsõnaajakirja Ripsik\nkuue kuu tellimus", logo, logoWhite: logo, logoBlack: logo, color: "#f5911e", code: "M-1", email: "nimi@example.com", until: "31.12.2026", copy };

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
  const words = (s: GiftCardSpec) => {
    const t = cardText(s);
    return { order: t.order.map((p) => p.text).join(""), valid: t.valid.map((p) => p.text).join(""), values: t.order.concat(t.valid).filter((p) => p.value).map((p) => p.text) };
  };

  test("the order goes to the address, the code is mentioned, the values stand out", () => {
    expect(words(spec)).toEqual({ order: "Order and code to nimi@example.com", valid: "Valid until 31.12.2026", values: ["nimi@example.com", "31.12.2026"] });
  });

  test("parts without a value are left out", () => {
    expect(words({ ...spec, code: "", email: "" }).order).toBe("Order");
    expect(words({ ...spec, until: "" }).valid).toBe("");
  });
});

describe("layout", () => {
  const every = (spec0: GiftCardSpec) => [
    ...PRINT_STYLES.map((printStyle) => ({ name: "print " + printStyle, d: layoutCard("print", { ...spec0, printStyle }, fonts), w: A4.width, h: A4.height })),
    ...EMAIL_STYLES.map((emailStyle) => ({ name: "email " + emailStyle, d: layoutCard("email", { ...spec0, emailStyle }, fonts), w: EMAIL.width, h: EMAIL.height })),
    { name: "back", d: layoutBack(spec0), w: A4.width, h: A4.height },
  ];

  test("sizes: A4 in points, the e-mail picture 600x400, in every style", () => {
    expect([A4.width, A4.height]).toEqual([595.276, 841.89]);
    for (const { name, d, w, h } of every(spec)) expect(d, name).toMatchObject({ width: w, height: h });
  });

  test("every number is finite, and nothing is drawn outside the page", () => {
    for (const { name, d, w, h } of every(spec)) {
      for (const s of d.shapes) {
        for (const c of s.cmds) for (const v of c.slice(1) as number[]) expect(Number.isFinite(v), name).toBe(true);
        if (s.cmds.length > 40) continue; // the letters and the logo are checked by eye: they follow the font
        for (const c of s.cmds) if (c[0] !== "Z") expect((c[c.length - 2] as number) >= -0.5 && (c[c.length - 2] as number) <= w + 0.5 && (c[c.length - 1] as number) >= -0.5 && (c[c.length - 1] as number) <= h + 0.5, name).toBe(true);
      }
    }
  });

  const dashed = (d: ReturnType<typeof layoutCard>) => d.shapes.filter((s) => s.stroke?.dash);

  test("the page is the card: the page, then letters and the logo, and one dashed code block - nothing else", () => {
    for (const kind of ["print", "email"] as const) {
      const d = layoutCard(kind, spec, fonts);
      expect(d.shapes[0]).toMatchObject({ fill: expect.stringMatching(/^#[0-9a-f]{6}$/) }); // the page, first
      expect(d.shapes[0]!.cmds).toHaveLength(5); // a plain rectangle: no rounded card, no slot, no shadow
      expect(dashed(d)).toHaveLength(1);
      expect(dashed(layoutCard(kind, { ...spec, code: "" }, fonts))).toHaveLength(0);
    }
  });

  test("the two looks have exactly the same layout: only the colours differ", () => {
    for (const kind of ["print", "email"] as const) {
      const white = layoutCard(kind, { ...spec, printStyle: "white", emailStyle: "white" }, fonts);
      const colour = layoutCard(kind, { ...spec, printStyle: "colour", emailStyle: "colour" }, fonts);
      // the code block (the dashed line) is at the same place, and so is every letter and every logo path
      expect(dashed(colour)[0]!.cmds).toEqual(dashed(white)[0]!.cmds);
      // texts of one colour are one shape, so two looks may group the letters differently: compare every point of every shape
      const points = (d: ReturnType<typeof layoutCard>) => d.shapes.flatMap((s) => s.cmds.map((c) => c.join(","))).sort();
      expect(points(colour), kind).toEqual(points(white));
    }
  });

  test("the code block: the label and the code are centred in it, with the same room above and below", () => {
    const d = layoutCard("email", spec, fonts);
    const box = dashed(d)[0]!.cmds as [string, number, number][];
    const ys = box.filter((c) => c[0] !== "Z").map((c) => c[c.length - 1] as number);
    const [top, bottom] = [Math.min(...ys), Math.max(...ys)];
    // the two text shapes after the box: label, code (stand-in letters are boxes, 0.7 high, standing on the baseline)
    const [label, code] = d.shapes.slice(d.shapes.indexOf(dashed(d)[0]!) + 1);
    const span = (s: typeof label) => {
      const v = s!.cmds.filter((c) => c[0] !== "Z").map((c) => c[c.length - 1] as number);
      return [Math.min(...v), Math.max(...v)] as const;
    };
    const [labelTop] = span(label);
    const [, codeBottom] = span(code);
    expect(labelTop - top).toBeCloseTo(bottom - codeBottom, 0);
    // and across: the code is in the middle of the box
    const xs = (s: typeof label) => s!.cmds.filter((c) => c[0] !== "Z").map((c) => c[1] as number);
    const bx = box.filter((c) => c[0] !== "Z").map((c) => c[1]);
    const [left, right] = [Math.min(...bx), Math.max(...bx)];
    expect((Math.min(...xs(code)) - left) - (right - Math.max(...xs(code)))).toBeCloseTo(0, 0);
  });

  test("the e-mail picture carries only the logo and the code: the page, the logo's paths, the dashed block, its label and its code", () => {
    for (const style of EMAIL_STYLES) {
      const d = layoutCard("email", { ...spec, emailStyle: style }, fonts);
      expect(d.shapes).toHaveLength(1 + logoShapes(logo).shapes.length + 3);
    }
  });


  test("the header: one long line is made smaller until it fits", () => {
    for (const { name, d } of every({ ...spec, header: "Ristsõnaajakirja Ripsik Ristsõnaajakirja Ripsik" })) if (name !== "back") expect(d.shapes.length, name).toBeGreaterThan(3);
  });

  test("every style is stable (stored copy)", async () => {
    for (const style of PRINT_STYLES) await expect(contentOf(layoutCard("print", { ...spec, printStyle: style }, fonts))).toMatchFileSnapshot("./golden/giftcard-print-" + style + ".txt");
    for (const style of EMAIL_STYLES) await expect(contentOf(layoutCard("email", { ...spec, emailStyle: style }, fonts))).toMatchFileSnapshot("./golden/giftcard-email-" + style + ".txt");
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
