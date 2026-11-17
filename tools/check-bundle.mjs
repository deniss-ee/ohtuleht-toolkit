// Fails when the script the first screen downloads grows above the agreed budget (see docs/REFACTOR.md, phase 0).
// Run after `yarn build`. The entry script is the one dist/index.html loads; pages and the languages load later, on demand.
import { readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";

const BUDGET_KB = 90; // today about 71 KB gzip; raise it on purpose, in a pull request that says why
const dist = new URL("../apps/generator/dist/", import.meta.url);
const html = readFileSync(new URL("index.html", dist), "utf8");
const entry = html.match(/<script[^>]+src="\.?\/?(assets\/[^"]+\.js)"/)?.[1];
if (!entry) {
  console.error("No entry script found in dist/index.html. Run `yarn build` first.");
  process.exit(1);
}
const kb = gzipSync(readFileSync(new URL(entry, dist))).length / 1024;
console.log(`${entry}: ${kb.toFixed(1)} KB gzip (budget ${BUDGET_KB} KB)`);
if (kb > BUDGET_KB) {
  console.error("The first-load script is over budget.");
  process.exit(1);
}
