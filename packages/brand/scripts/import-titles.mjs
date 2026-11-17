// Imports the logos of the publisher's titles (magazines and puzzle books) from the design team's zips.
// Usage: yarn workspace @ohtuleht/brand import-titles <folder with the unzipped logo folders>
//   <folder>/<zip name>/svg/<file>.svg (and _w, _b)  ->  titles/<id>.svg, <id>-white.svg, <id>-black.svg  and  titles.json
// Three files for each title: the coloured logo, and its white and black versions (arcs are not made: the card tool draws curves and lines only). The old red of the logos (#E3000F) becomes the brand red (Primary Red 600, the production value).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { optimize } from "svgo";

// id, name shown in the app, folder and file of the source, main colour (from the logo; the old red is replaced below),
// how the logo goes on a page of the title's colour, and, when the usual rule (white text where it reads at 3:1, else black) is not right, the text colour there:
//   "white"    the white version of the design team (a single-colour logo)
//   "original" the logo in its own colours, as designed, with only a thin white edge so that it stands out from a page of its own colour
//   "swap"     the logo with the title colour and white exchanged (a box becomes a white box with letters in the title colour). Only for the
//              logos where the owner asked for it: Naisteleht, Naisteleht 55+, Naistelehe ristsõnad.
const TITLES = [
  ["ohtuleht", "Õhtuleht", "ohtuleht", "ohtuleht.svg", "#F50000", "white"],
  ["ol-ristsonad", "Õhtulehe ristsõnad", "ohtulehe_ristsonad", "ol_rist.svg", "#F50000", "original"],
  ["naisteleht", "Naisteleht", "naisteleht", "nl.svg", "#E60073", "swap"],
  ["naisteleht-55", "Naisteleht 55+", "naisteleht_55", "nl55.svg", "#A51982", "swap"],
  ["naistelehe-ristsonad", "Naistelehe ristsõnad", "naistelehe_ristsonad", "nl_rist.svg", "#E60073", "swap"],
  ["teleleht", "Teleleht", "teleleht", "tv.svg", "#2D3291", "original"],
  ["tiiu", "Tiiu", "tiiu", "tiiu.svg", "#E63223", "white"],
  ["tiiu-ristsonad", "Tiiu ristsõnad", "tiiu_ristsonad", "tiiu_rist.svg", "#E63223", "original"],
  ["avesta", "Avesta", "avesta", "avesta.svg", "#E60073", "white"],
  ["ristik", "Ristik", "ristik", "ristik.svg", "#F50000", "original"],
  ["miniristik", "Miniristik", "miniristik", "miniristik.svg", "#F50000", "original"],
  ["megaristik", "Megaristik", "megaristik", "megaristik.svg", "#F50000", "original"],
  ["meistriristik", "Meistriristik", "meistriristik", "meistriristik.svg", "#F50000", "original"],
  ["meluristik", "Meluristik", "meluristik", "meluristik.svg", "#F50000", "original"],
  ["sudoku", "Ristiku Sudoku", "sudoku", "sudoku.svg", "#F50000", "white"],
  ["ripsik", "Ripsik", "ripsik", "ripsik.svg", "#F5911E", "white", "white"],
];

const OLD_RED = /#E3000F/gi;
const NEW_RED = "#F50000";

const dir = process.argv[2];
if (!dir) {
  console.error("Usage: import-titles <folder with the unzipped logo folders>");
  process.exit(1);
}
mkdirSync(new URL("../titles/", import.meta.url), { recursive: true });

const optimise = (source) => optimize(source, { multipass: true, plugins: [{ name: "preset-default", params: { overrides: { convertPathData: { makeArcs: false } } } }, "removeDimensions"] }).data;

// The brand's own CMYK numbers (a "cmyk" field typed into titles.json by hand) survive a new import.
const known = existsSync(new URL("../titles.json", import.meta.url)) ? JSON.parse(readFileSync(new URL("../titles.json", import.meta.url), "utf8")) : [];
const cmykOf = (id) => known.find((t) => t.id === id)?.cmyk;

const out = [];
let before = 0;
let after = 0;
for (const [id, name, folder, file, main, onColour, textOnColour] of TITLES) {
  const source = readFileSync(`${dir}/${folder}/svg/${file}`, "utf8").replace(OLD_RED, NEW_RED);
  const [, w, h] = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(source) ?? [];
  if (!w || !h) throw new Error(`${file}: no viewBox`);
  const entry = { id, name, file: `${id}.svg`, white: `${id}-white.svg`, black: `${id}-black.svg`, width: Number(w), height: Number(h), main, onColour, ...(textOnColour ? { textOnColour } : {}) };
  // the coloured logo, and the one-colour versions of the design team (_w white, _b black) for use on a coloured background
  for (const [suffix, target] of [["", entry.file], ["_w", entry.white], ["_b", entry.black]]) {
    const text = readFileSync(`${dir}/${folder}/svg/${file.replace(".svg", suffix + ".svg")}`, "utf8").replace(OLD_RED, NEW_RED);
    const data = optimise(text);
    writeFileSync(new URL(`../titles/${target}`, import.meta.url), data);
    before += text.length;
    after += data.length;
  }
  const cmyk = cmykOf(id);
  out.push(cmyk ? { ...entry, cmyk } : entry);
}
writeFileSync(new URL("../titles.json", import.meta.url), JSON.stringify(out, null, 2) + "\n");
console.log(`${out.length} titles, ${out.length * 3} files, ${before} B -> ${after} B`);
