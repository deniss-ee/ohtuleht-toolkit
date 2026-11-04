# Working with an AI assistant (optional)

This project was built together with an AI coding assistant (Claude Code). You **do not need one** to work on it: everything is plain code and documents. If you do use one, this is how to get good results.

## What the assistant reads

[`CLAUDE.md`](../CLAUDE.md) in the repository root is read automatically at the start of every session. It holds the project rules and commands. Keep it short and true; if a rule changes, change it there.

## Start prompts

Paste one into a new session.

**Continue in general**

```
Read CLAUDE.md and docs/TRANSFER.md in this repo, then run `git status`, `git pull` on develop and `gh issue list --state open --limit 30`. Tell me in 5 lines where we are and propose the next step. Do not start building until I answer.
```

**Lint, format and CI**

```
Read CLAUDE.md. Do issues #5 and #6: ESLint, Prettier, Vitest, and GitHub Actions (typecheck, build, test, runtime size budget). Branch feat/5-lint-ci from develop, PR into develop. Keep the existing code style; do not reformat everything in one huge commit: format only touched files or do one clearly labelled format-only commit.
```

**Microsoft login**

```
Read CLAUDE.md and docs/AUTH-MICROSOFT.md. IT has created the Entra app registration: client ID <...>, tenant ID <...>. Build step 3 of "Order of work" in that document. Verify that a signed-out request to the API gets 401. Do not merge until I say so.
```

## Good habits

- One task per session. Start a new session after a merged pull request, or when the assistant starts re-explaining things. The repository carries the memory, not the chat.
- Say "do not merge until I say so" if you want to review.
- Ask for the test address and the restart command at the end of every task.
- Before compacting or ending a long session, make sure everything is committed and pushed, and that any decision that matters is written into a document in the repository.
- After compacting, make it re-check reality:

```
We just compacted. Read CLAUDE.md, run `git status` and `gh pr list`, and tell me in 5 lines what is done and what you think the next step is. Do not start building until I confirm.
```

## Accounts and access

- The assistant uses your own GitHub login (`gh auth login`) or a **fine-grained token** limited to this repository: Administration, Contents, Issues, Pull requests, Workflows (read and write). Tokens expire; renew them, and never paste a token into a file in the repository.
- Cloudflare: `yarn wrangler login` opens a browser; the login stays on that computer. No token needs to pass through the chat.
- Figma: the assistant reaches it through the Figma connector, with your own Figma login.

## Things learned the hard way

- Long shell scripts with quotes in one line often fail to parse: write the script to a file and run it.
- The dev server can serve a stale copy after new files or fast edits (blank page, strange errors): stop it and start it again.
- A browser pane that is hidden throttles timers to about one per second: measure with JavaScript instead of trusting timing.
- The preview iframes are sandboxed: read their HTML from the `srcdoc` attribute.
- Figma: very large frames break `get_metadata`; find nodes by name with read-only scripts, then read the design with `get_design_context`.
- Deleting a pull request's base branch closes pull requests stacked on it: stack on `develop`.
- After a squash merge, rebase any branch that carried the old commits: `git rebase --onto origin/develop <old tip> <branch>`.
