---
name: update-status
description: Update the status banner of a plan in docs/plans/. Usage -> /update-status <slug> <STATUS> [optional note]
allowed-tools:
  - Read
  - Edit
  - Bash
  - Grep
---

Update the status of plan: **$ARGUMENTS**

Parse the arguments as: `<slug> <STATUS> [note]`

Valid statuses: `TODO` | `IN_PROGRESS` | `DONE` | `SHELVED`

The banner in the plan file is the **only** record of plan state — there is no index file to keep in sync. See [plans.md](../../rules/plans.md).

## Step 1 — Find the plan file

```bash
find docs/plans -name "*<slug>*.md"
```

- No match: list what is in `docs/plans/` and stop. Don't create a plan here — that's `/new-plan`.
- Multiple matches: list them and ask which one.

## Step 2 — Update the banner

The banner is the first three lines of the file:

```
-----
Status: #<STATUS> — <note>
-----
```

**If a banner exists**, replace only the `Status:` line. If no note was given and the old banner had one, keep the old note.

**If the file has no banner** (some older plans don't), insert one above the `# Title` heading, leaving the rest of the file untouched:

```
-----
Status: #<STATUS> — <note>
-----

# Existing Title
```

Use Edit, not Write — never rewrite a plan's body to change its status.

## Step 3 — Confirm

Report:

- File updated: `docs/plans/<filename>`
- Old status → new status
- The branch this plan maps to (`<type>/<slug>`), so it's easy to check whether the branch still exists

## When this runs

- `IN_PROGRESS` when the branch is created (`/ship-task` step 2)
- `DONE` after the PR merges (`/pr` step 5)
- `SHELVED` when work stops and isn't expected to resume soon

Only Juan commits, so leave the change in the working tree and say so — don't commit the status update.
