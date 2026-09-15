# Plans convention

All implementation plans for TuPlayero live in `docs/plans/`. These rules apply to every agent and to main Claude.

## Location — non-negotiable

- **Always** create plan files at `docs/plans/YYYYMMDD-slug.md`
- **Never** create plan files anywhere else — not in `.claude/`, not in the workspace root, not in `docs/` directly
- Claude Code's `plansDirectory` is already set to `docs/plans` in `.claude/settings.json` — the built-in Plan feature writes there automatically
- When a plan becomes `DONE` or `SHELVED`, move it to `docs/plans/archive/` (same filename) and update its `file:` path in `project-status.yaml`. `/update-status` does both.

## Filename format

```
YYYYMMDD-short-slug.md
```
Examples: `20260809-price-alerts.md`, `20260809-web-redesign.md`

Use `/new-plan <slug>` to scaffold one automatically with today's date.

## Status banner

Every plan file must start with:
```
-----
Status: #TODO | #IN_PROGRESS | #DONE | #SHELVED — one-line note
-----
```

## Keeping project-status.yaml in sync

`docs/plans/project-status.yaml` is the machine-readable index of every plan. When a plan's status changes:

1. Update the status banner in the plan file
2. Update the matching entry in `project-status.yaml`

Use `/update-status <slug> <STATUS> [note]` to do both in one step.

**Never let the two sources drift.** If you change one, always change the other.

## When to create a plan

Create a plan for any work that:
- Touches more than one package
- Requires more than one session to complete
- Has a non-obvious sequence of steps

One-line fixes and trivial tweaks don't need a plan.
