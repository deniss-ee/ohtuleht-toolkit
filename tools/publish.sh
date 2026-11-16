#!/usr/bin/env bash
# Publishes the built app to GitHub Pages (branch gh-pages).
#   tools/publish.sh        the site root (version 1). Run it on develop. The /v2/ folder is left alone.
#   tools/publish.sh v2     only the /v2/ folder (version 2). Run it on v2. The site root is left alone.
# It builds the branch you are on, so check `git branch --show-current` first.
set -euo pipefail

target="${1:-}"
root="$(git rev-parse --show-toplevel)"
pages="$root/../ol-pages"
cd "$root"

yarn build

# A fresh copy of what is live now.
git worktree remove --force "$pages" 2>/dev/null || true
git fetch --quiet origin gh-pages
git worktree add --quiet --detach "$pages" origin/gh-pages
cd "$pages"

if [ "$target" = "v2" ]; then
  rm -rf v2
  mkdir v2
  cp -r "$root/apps/generator/dist/." v2/
else
  # Everything but version 2 and a custom domain file is replaced.
  find . -mindepth 1 -maxdepth 1 ! -name .git ! -name v2 ! -name CNAME -exec rm -rf {} +
  cp -r "$root/apps/generator/dist/." .
fi
touch .nojekyll

git add -A
if git diff --cached --quiet; then
  echo "Nothing changed: the live ${target:-site} already equals this build."
else
  git commit --quiet -m "Publish ${target:-site} from $(git -C "$root" rev-parse --short HEAD)"
  git push --quiet origin HEAD:gh-pages
  echo "Published ${target:-site}. GitHub Pages refreshes in one or two minutes."
fi

cd "$root"
git worktree remove --force "$pages"
