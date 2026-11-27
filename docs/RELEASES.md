# Releases

A release is a named, dated version of the toolkit (`v0.3.0`), with a page on GitHub that says what is new, like professional projects have. Day-to-day work still goes live after each merge into `develop` ([DEPLOY.md](DEPLOY.md)). A release is a point where we say "this is version X": after a few features, or before handing something to IT.

## Version numbers

`MAJOR.MINOR.PATCH` ([Semantic Versioning](https://semver.org/)):

| Change | Example | Bump |
|---|---|---|
| Only fixes | a picture size bug | `0.3.0` to `0.3.1` |
| New tools or features, old banners still open | gift card, header logo | `0.3.1` to `0.4.0` |
| Something people must change in how they work (an old zip no longer opens, a format removed) | | `0.4.0` to `1.0.0` |

## Two places, two readers

1. **`CHANGELOG.md`** (in the repository): for people. Every pull request adds a short entry under `## [Unreleased]` while it is made. At release time the entries are grouped under **Added**, **Changed**, **Fixed** and **Removed** ([Keep a Changelog](https://keepachangelog.com/)), and the heading becomes `## [0.3.0] - 2026-11-27`.
2. **The GitHub release** (Releases page of the repository): a short **Highlights** paragraph written by hand (two to four lines, the things a salesperson notices), then the list made by the script, one line per pull request with its link, grouped as *New*, *Faster*, *Fixed*, *Under the hood*, *Documentation*.

## How to make one

```bash
git checkout develop && git pull
yarn release:notes > notes.md        # the grouped list since the last release
```

1. Read `notes.md`: put a **Highlights** paragraph at the top, remove lines nobody needs (in-between commits of one feature).
2. In `CHANGELOG.md`, rename `## [Unreleased]` to `## [X.Y.Z] - date`, group its entries under Added / Changed / Fixed / Removed, and start a new empty `## [Unreleased]` above it. Commit on a `docs/release-X.Y.Z` branch, pull request into `develop`, merge.
3. Bring `main` up to date and tag it:

```bash
git checkout main && git pull && git merge --no-ff develop -m "Release vX.Y.Z" && git push
git tag vX.Y.Z && git push origin vX.Y.Z
gh release create vX.Y.Z --title "vX.Y.Z" --notes-file notes.md
```

4. Delete `notes.md` (it is not kept in git).

The AI assistant does all of this when asked "make a release" (it needs the go-ahead for the merge into `main`, like any merge).
