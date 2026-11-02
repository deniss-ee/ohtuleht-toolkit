// Checks that every relative link and every #anchor in the Markdown files points at something that exists.
// Run: node tools/check-links.mjs     (exits with 1 when something is broken)
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve, relative } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const skip = new Set(["node_modules", ".git", "dist", "legacy"]);
const files = [];
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    if (skip.has(name)) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (name.endsWith(".md")) files.push(p);
  }
})(root);

const slug = (h) => h.trim().toLowerCase().replace(/[`*_]/g, "").replace(/[^\p{L}\p{N}\s-]/gu, "").replace(/\s/g, "-");
const anchorsOf = (file) => new Set([...readFileSync(file, "utf8").matchAll(/^#{1,6}\s+(.+)$/gm)].map((m) => slug(m[1])));

let bad = 0;
for (const file of files) {
  const text = readFileSync(file, "utf8").replace(/```[\s\S]*?```/g, "");
  for (const m of text.matchAll(/\[[^\]]*\]\(([^)\s]+)\)/g)) {
    const link = m[1];
    if (/^(https?:|mailto:)/.test(link)) continue;
    const [path, hash] = link.split("#");
    const target = path ? resolve(dirname(file), decodeURIComponent(path)) : file;
    if (!existsSync(target)) { console.log(`${relative(root, file)}: missing file ${link}`); bad++; continue; }
    if (hash && target.endsWith(".md") && !anchorsOf(target).has(hash)) { console.log(`${relative(root, file)}: missing anchor ${link}`); bad++; }
  }
}
console.log(bad ? `${bad} broken link(s)` : `${files.length} files, all links fine`);
process.exit(bad ? 1 : 0);
