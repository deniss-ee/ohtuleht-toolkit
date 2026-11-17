// Imports the logos of the publisher's titles (magazines and puzzle books) from the design team's zips.
// Usage: yarn workspace @ohtuleht/brand import-titles <folder with the unzipped logo folders>
//   <folder>/<zip name>/svg/<file>.svg (and _w, _b)  ->  titles/<id>.svg, <id>-white.svg, <id>-black.svg  and  titles.json
// Three files for each title: the coloured logo, and its white and black versions (arcs are not made: the card tool draws curves and lines only). The old red of the logos (#E3000F) becomes the brand red (Primary Red 600, the production value).
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { optimize } from "svgo";

// id, name shown in the app, folder and file of the source, main colour (from the logo; the old red is replaced below)
const TITLES = [
  ["ohtuleht", "Õhtuleht", "ohtuleht", "ohtuleht.svg", "#F50000"],
  ["ol-ristsonad", "Õhtulehe ristsõnad", "ohtulehe_ristsonad", "ol_rist.svg", "#F50000"],
  ["naisteleht", "Naisteleht", "naisteleht", "nl.svg", "#E60073"],
  ["naisteleht-55", "Naisteleht 55+", "naisteleht_55", "nl55.svg", "#A51982"],
  ["naistelehe-ristsonad", "Naistelehe ristsõnad", "naistelehe_ristsonad", "nl_rist.svg", "#E60073"],
  ["teleleht", "Teleleht", "teleleht", "tv.svg", "#2D3291"],
  ["tiiu", "Tiiu", "tiiu", "tiiu.svg", "#E63223"],
  ["tiiu-ristsonad", "Tiiu ristsõnad", "tiiu_ristsonad", "tiiu_rist.svg", "#E63223"],
  ["avesta", "Avesta", "avesta", "avesta.svg", "#E60073"],
  ["ristik", "Ristik", "ristik", "ristik.svg", "#F50000"],
  ["miniristik", "Miniristik", "miniristik", "miniristik.svg", "#F50000"],
  ["megaristik", "Megaristik", "megaristik", "megaristik.svg", "#F50000"],
  ["meistriristik", "Meistriristik", "meistriristik", "meistriristik.svg", "#F50000"],
  ["meluristik", "Meluristik", "meluristik", "meluristik.svg", "#F50000"],
  ["sudoku", "Ristiku Sudoku", "sudoku", "sudoku.svg", "#F50000"],
  ["ripsik", "Ripsik", "ripsik", "ripsik.svg", "#F5911E"],
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

const out = [];
let before = 0;
let after = 0;
for (const [id, name, folder, file, main] of TITLES) {
  const source = readFileSync(`${dir}/${folder}/svg/${file}`, "utf8").replace(OLD_RED, NEW_RED);
  const [, w, h] = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(source) ?? [];
  if (!w || !h) throw new Error(`${file}: no viewBox`);
  const entry = { id, name, file: `${id}.svg`, white: `${id}-white.svg`, black: `${id}-black.svg`, width: Number(w), height: Number(h), main };
  // the coloured logo, and the one-colour versions of the design team (_w white, _b black) for use on a coloured background
  for (const [suffix, target] of [["", entry.file], ["_w", entry.white], ["_b", entry.black]]) {
    const text = readFileSync(`${dir}/${folder}/svg/${file.replace(".svg", suffix + ".svg")}`, "utf8").replace(OLD_RED, NEW_RED);
    const data = optimise(text);
    writeFileSync(new URL(`../titles/${target}`, import.meta.url), data);
    before += text.length;
    after += data.length;
  }
  out.push(entry);
}
writeFileSync(new URL("../titles.json", import.meta.url), JSON.stringify(out, null, 2) + "\n");
console.log(`${out.length} titles, ${out.length * 3} files, ${before} B -> ${after} B`);
