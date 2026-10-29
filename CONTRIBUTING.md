# Contributing

Read [docs/WORKFLOW.md](docs/WORKFLOW.md) first. In short:

1. Pick or create an issue.
2. Branch from `develop`: `feat/<issue>-slug`, `fix/...`, `docs/...`, `chore/...`.
3. Commit with `type: description`.
4. Open a PR into `develop` with `Closes #<issue>`.
5. Wait for review (and green CI once it exists, issue #6); squash and merge.
6. `develop` is released to `main` through a release PR.

## Rules

- Yarn only; commit `yarn.lock`; no `package-lock.json`.
- No secrets in the repo or in browser code.
- Banners: zero dependencies, report file weight.
- Update docs and `CHANGELOG.md` with the change.
- Keep UI text and editable data in one config or content file.
