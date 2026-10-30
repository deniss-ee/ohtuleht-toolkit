# Workflow

Plain-language guide to making changes safely. Every command can be copied as is.

## The idea in one picture

```
issue  ->  branch  ->  commits  ->  pull request  ->  develop  ->  release  ->  main
```

| Branch | Meaning | Who pushes |
|---|---|---|
| `main` | Released, deployed state | Only via release PR from `develop` |
| `develop` | Integration branch, always works | Only via reviewed PRs |
| `feat/12-short-slug` | One piece of work, from one issue | You |

## Rules

1. One task = one issue. Small related tasks may share one issue.
2. One issue = one branch = one pull request (PR).
3. Never commit directly to `develop` or `main`.
4. Keep PRs small: one idea, reviewable in 10 minutes.
5. CI must be green before merge (CI is not set up yet, issue #6; until then run `yarn typecheck` and `yarn build` yourself).

## Step by step

### 1. Start from an issue

Find or create an issue on GitHub. Note its number, for example `12`.

### 2. Update `develop`

```bash
git checkout develop
git pull
```

### 3. Create a branch

```bash
git checkout -b feat/12-banner-runtime
```

Branch prefixes:

| Prefix | Use |
|---|---|
| `feat/` | New feature |
| `fix/` | Bug fix |
| `docs/` | Documentation only |
| `chore/` | Tooling, config, cleanup |

### 4. Work and commit

```bash
git status
git add path/to/changed-file
git commit -m "feat: add infinite loop to banner runtime"
```

Commit message format: `type: short description in present tense`. Types match branch prefixes. Add `(#12)` or `Closes #12` in the PR, not necessarily every commit.

### 5. Push and open a PR

```bash
git push -u origin feat/12-banner-runtime
gh pr create --base develop --fill
```

The PR description must say what changed, how to check it, and `Closes #12`.

### 6. Review and merge

- CI runs automatically.
- Fix review comments with new commits on the same branch and `git push`.
- Merge with **Squash and merge** into `develop`. Delete the branch afterwards.

### 7. Release

When `develop` is tested and ready:

```bash
gh pr create --base main --head develop --title "release: 0.2.0"
```

Merge with a **merge commit**. Tag it:

```bash
git checkout main
git pull
git tag v0.2.0
git push --tags
```

Update `CHANGELOG.md` in the release PR.

## Common problems

| Problem | Fix |
|---|---|
| "I committed on `develop` by mistake" | `git branch feat/12-fix`, then `git reset --hard origin/develop`, then `git checkout feat/12-fix` |
| "My branch is behind `develop`" | `git checkout feat/12-x`, `git merge develop`, resolve conflicts, `git push` |
| "I want to undo the last commit but keep changes" | `git reset --soft HEAD~1` |
| "I do not know what I changed" | `git status`, then `git diff` |
| "Commit rejected: file too large" | Compress images first; see [RECOMMENDATIONS.md](RECOMMENDATIONS.md) |

## Package manager

Yarn only.

```bash
yarn install        # install
yarn add <pkg>      # add a dependency
yarn dev            # dev server
yarn build          # production build
```

Never use `npm` or `npx`. Never create `package-lock.json`. Always commit `yarn.lock`.

## What CI checks (planned, issues #5 and #6)

| Check | Meaning |
|---|---|
| Lint and format | Code style is consistent |
| Type check | No TypeScript errors |
| Tests | Unit tests pass |
| Build | `yarn build` succeeds |
| Size budget | Banner runtime stays under its gzip limit |

## Secrets

Never commit `.env` files, keys, or tokens. Never put secrets in browser code. Anything needing a secret goes behind the Cloudflare Worker.
