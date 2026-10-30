// Cleans a logo SVG exported from Figma and writes it into logos/.
// Usage: yarn workspace @ohtuleht/brand optimize-logo <input.svg> <output-name.svg>
import { readFileSync, writeFileSync } from "node:fs";
import { optimize } from "svgo";

const [input, name] = process.argv.slice(2);
if (!input || !name) {
  console.error("Usage: optimize-logo <input.svg> <output-name.svg>");
  process.exit(1);
}
const source = readFileSync(input, "utf8")
  .replace(/\spreserveAspectRatio="none"/, "")
  .replace(/\soverflow="visible"/, "")
  .replace(/\sstyle="display: block;"/, "");
const { data } = optimize(source, {
  multipass: true,
  plugins: [
    "preset-default",
    "removeDimensions", // size comes from the viewBox, so the file scales cleanly
  ],
});
writeFileSync(new URL(`../logos/${name}`, import.meta.url), data);
console.log(`${name}: ${source.length} B -> ${data.length} B`);
