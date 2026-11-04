# Legacy tools (archive)

Older stand-alone tools from before the toolkit app. They are **not part of the build**, are not maintained, and are kept only because nobody has rebuilt them yet. Each folder opens by itself in a browser (open its `index.html`). Do not copy anything from here into the app without reading it first: they were written quickly and carry no tests.

| Folder | What it does | Rebuild in the toolkit? |
|---|---|---|
| `two-article-generator/` | Splits a story into two linked article pages (has its own README) | Idea in [ROADMAP](../../docs/ROADMAP.md) ("Story split builder") |
| `capcut-template-generator/` | Makes a CapCut video template page | Idea in the roadmap |
| `video-html-generator/` | Video HTML packager | Mostly replaced by the **Movie banner** tool |
| `podcast-story-generate/` | Podcast story page generator (10 MB, includes assets, no source of the assets) | Decide: rebuild or delete (issue #7) |
| `category-rubriik-4dimensioon/` | The older theme page header, kept as reference for the Header bar tool | Replaced by the **Header bar** tool |

## Removed on purpose

The old image cropper, the old movie banner generator and the older article scrapper scripts were rebuilt as tools of the toolkit and removed from this folder. They are still in git history: the tag **`legacy-tools-final`** points at the last commit that has them.

```bash
git checkout legacy-tools-final     # look around (read only)
git checkout develop                # come back
```

## If you delete this folder

Nothing in the app depends on it. Delete `tools/legacy/` in one commit and note it in the changelog.
