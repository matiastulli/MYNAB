# Plans convention

All implementation plans for MYNAB live in `docs/plans/`. These rules apply to every agent and to main Claude.

## Location — non-negotiable

- **Always** create plan files at `docs/plans/YYYY-MM-DD-slug.md`
- **Never** create plan files anywhere else — not in `.claude/`, not in the workspace root, not in `docs/` directly
- When a plan is finished or abandoned, update its status banner in place. There is no archive directory; git history is the archive.

`plansDirectory` is **not** set in `.claude/settings.json`, so Claude Code's built-in Plan feature does not write here automatically. Either create plans with `/new-plan`, or add `"plansDirectory": "docs/plans"` to settings.json if you want the built-in feature to use it.

## Filename format

```
YYYY-MM-DD-short-slug.md
```

Examples: `2026-06-01-next-week-plan.md`, `2026-09-15-revolut-parser.md`

Use `/new-plan <slug>` to scaffold one with today's date.

## Status banner

Every plan file starts with:

```
-----
Status: #TODO | #IN_PROGRESS | #DONE | #SHELVED — one-line note
-----
```

The banner is the single source of truth for a plan's state. Update it with `/update-status <slug> <STATUS> [note]` when the state changes — when the branch is created, and again when the PR merges. There is no index file to keep in sync.

## Branch naming

A plan's slug is the branch slug: `2026-09-15-revolut-parser.md` → `feat/revolut-parser`. See [01-git-workflow.md](../../docs/conventions/01-git-workflow.md).

## When to create a plan

Create a plan for any work that:

- Touches both `app/service/` and `app/client/`
- Requires a database migration
- Requires more than one session to complete
- Has a non-obvious sequence of steps

One-line fixes and trivial tweaks don't need a plan.
