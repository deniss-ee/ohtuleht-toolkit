// Release notes in the GitHub style, made from the commit messages since the last release.
//   node tools/release-notes.mjs            notes since the newest v* tag, up to develop
//   node tools/release-notes.mjs v0.2.5     notes since that tag
// Commits are "type: what changed (#PR)" (squash merges). They are grouped by type; the PR number becomes a link.
// Prints Markdown; `yarn release:notes > notes.md`, read it, then use it for the GitHub release (docs/RELEASES.md).
import { execSync } from "node:child_process";

const REPO = "https://github.com/deniss-ee/ohtuleht-toolkit";
const sh = (cmd) => execSync(cmd, { encoding: "utf8" }).trim();
const since = process.argv[2] || sh("git tag -l v* --sort=-v:refname").split(/\r?\n/)[0];
const until = process.argv[3] || "develop";

// Order and titles of the groups. Commits of other types go to "Other changes".
const GROUPS = [
  ["feat", "New"],
  ["perf", "Faster"],
  ["fix", "Fixed"],
  ["refactor", "Under the hood"],
  ["test", "Under the hood"],
  ["chore", "Under the hood"],
  ["docs", "Documentation"],
];

const lines = sh(`git log ${since}..${until} --no-merges --pretty=format:%s`).split("\n").filter(Boolean);
const groups = new Map();
for (const line of lines) {
  const m = /^(\w+)(?:\([^)]*\))?!?:\s*(.+)$/.exec(line);
  const type = m?.[1] ?? "other";
  let text = (m?.[2] ?? line).trim();
  text = text.charAt(0).toUpperCase() + text.slice(1);
  text = text.replace(/\(#(\d+)\)$/, `([#$1](${REPO}/pull/$1))`);
  const title = GROUPS.find(([t]) => t === type)?.[1] ?? "Other changes";
  if (!groups.has(title)) groups.set(title, []);
  groups.get(title).push(text);
}

const order = [...new Set(GROUPS.map(([, title]) => title)), "Other changes"];
const out = [];
for (const title of order) {
  const items = groups.get(title);
  if (!items?.length) continue;
  out.push(`### ${title}`, "", ...items.map((i) => `- ${i}`), "");
}
out.push(`**Full list of changes:** ${REPO}/compare/${since}...${until}`);
console.log(out.join("\n"));
