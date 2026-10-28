// Prints the gzip size of the built runtime and fails when it exceeds the budget.
import { readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";

const BUDGET_BYTES = 3 * 1024; // see docs/BANNERS.md: runtime at most about 3 KB gzip
const file = new URL("../dist/runtime.js", import.meta.url);
const gzip = gzipSync(readFileSync(file)).length;
console.log(`runtime.js gzip: ${gzip} B (budget ${BUDGET_BYTES} B)`);
if (gzip > BUDGET_BYTES) {
  console.error("Over budget");
  process.exit(1);
}
