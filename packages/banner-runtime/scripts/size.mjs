// Prints the gzip size of the built scripts and fails when one exceeds its budget.
import { readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";

const BUDGETS = [
  { file: "runtime.js", bytes: 3 * 1024 }, // see docs/BANNERS.md: runtime at most about 3 KB gzip
  { file: "cube.js", bytes: 2 * 1024 }, // only in banners with the cube transition
];
let failed = false;
for (const { file, bytes } of BUDGETS) {
  const gzip = gzipSync(readFileSync(new URL(`../dist/${file}`, import.meta.url))).length;
  console.log(`${file} gzip: ${gzip} B (budget ${bytes} B)`);
  if (gzip > bytes) failed = true;
}
if (failed) {
  console.error("Over budget");
  process.exit(1);
}
