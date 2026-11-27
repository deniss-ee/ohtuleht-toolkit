# Working with an AI assistant (optional)

This project was built together with an AI coding assistant (Claude Code). You **do not need one** to work on it: everything is plain code and documents. If you do use one, this is how to get good results.

## What the assistant reads

[`CLAUDE.md`](../CLAUDE.md) in the repository root is read automatically at the start of every session. It holds the project rules, the layout and the commands. Keep it short and true; if a rule changes, change it there, not in the chat.

## Which model for which job

| Job | Model | Why |
|---|---|---|
| Plan a phase, write a design note, review a whole area | The strongest model you have | Reads everything, decides the shape once |
| Build a planned step, refactor under tests, write documents | Sonnet | Fast, cheap, follows a written plan well |
| Hard design or a bug that survived one fix (draft model, login, zip migration) | Opus | Worth the cost when thinking is the bottleneck |
| A one-line fix or a text change | Haiku | Anything bigger is wasted |

A plan written once by a strong model ([REFACTOR.md](REFACTOR.md)) lets a cheaper model do the work: point it at the phase and the step.

## Start prompts

Paste one into a new session.

**Continue in general**

```
Read CLAUDE.md and docs/REFACTOR.md, then run `git status`, `git pull` on develop and `gh pr list`. Tell me in 5 lines where we are and propose the next step. Do not start building until I answer.
```

**A refactor step** (the phases carry their own prompts in [REFACTOR.md](REFACTOR.md))

```
Read CLAUDE.md and docs/REFACTOR.md. Do phase <N>, step <N.N> only. Behaviour must not change. Report the sizes before and after. Branch from develop, PR into develop, do not merge.
```

**A bug**

```
Read CLAUDE.md. Bug: <what I did, what I saw, what I expected>. First find the cause and tell me in 3 lines. Then fix it, add a test that would have caught it (if tests exist), and show how to check it. Do not merge.
```

**A new banner type or tool**

```
Read CLAUDE.md and docs/ARCHITECTURE.md ("Adding a banner type"). I want: <what it is, sizes, who uses it>. Ask me at most 3 questions, then build it with its document in docs/. Do not merge.
```

**Microsoft login** (after IT created the app registration)

```
Read CLAUDE.md and docs/AUTH-MICROSOFT.md. Client ID <...>, tenant ID <...>. Build step 3 of "Order of work" in that document. Verify that a signed-out request to the API gets 401. Do not merge until I say so.
```

## Good habits

- **One task per session.** Start a new session after a merged pull request, or when the assistant starts re-explaining things. The repository carries the memory, not the chat.
- **Say what "done" is**: "PR into develop, do not merge" or "merge and publish".
- **Ask for the cause before the fix** when something is wrong. A fix without a cause tends to come back (the mobile picture rule needed three rounds).
- Ask for the test address and the restart command at the end of every task, and for what was **not** tested.
- If you dictate, read the message before sending: a cut-off sentence costs a round of questions.
- Before ending a long session, make sure everything is committed and pushed, and that any decision that matters is written into a document.
- After the chat was compacted, make it re-check reality:

```
We just compacted. Read CLAUDE.md, run `git status` and `gh pr list`, and tell me in 5 lines what is done and what you think the next step is. Do not start building until I confirm.
```

## Accounts and access

- **GitHub:** best is `gh auth login` once on your computer; the assistant then uses your login and no token passes through the chat. If you use a fine-grained token instead, limit it to this repository (Administration, Contents, Issues, Pull requests, Workflows: read and write), give it a short life, and **revoke it after the session**: a token pasted into a chat stays in the chat history. Never put a token into a file in the repository.
- Once publishing runs in GitHub Actions ([REFACTOR.md](REFACTOR.md), phase 0), the assistant needs no token to publish at all.
- **Cloudflare:** `yarn wrangler login` opens a browser; the login stays on that computer.
- **Figma:** the assistant reaches it through the Figma connector, with your own Figma login.

## Things learned the hard way

- Long shell scripts with quotes in one line often fail to parse: write the script to a file and run it.
- The dev server can serve a stale copy after new files or fast edits (blank page, strange errors): stop it and start it again.
- A browser pane that is hidden throttles timers to about one per second: measure with JavaScript instead of trusting timing.
- The preview iframes are sandboxed: read their HTML from the `srcdoc` attribute.
- On a zoomed screen widths are fractional (a 540 px slot can measure 540.35): round before comparing with a breakpoint.
- A rule that lives in several places gets fixed in one and forgotten in the others (picture sizes 48 and 54): put it in one function first, then fix it.
- Figma: very large frames break `get_metadata`; find nodes by name with read-only scripts, then read the design with `get_design_context`.
- Deleting a pull request's base branch closes pull requests stacked on it: stack on `develop`.
- After a squash merge, rebase any branch that carried the old commits: `git rebase --onto origin/develop <old tip> <branch>`.
