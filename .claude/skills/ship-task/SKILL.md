---
name: ship-task
description: Take one plan (or one fix) from a fresh feature branch to a reviewed, PR-ready working tree. Use when starting work on a plan in docs/plans/, or when asked to "ship", "implement", "start" or "pick up" a feature or fix.
---

# Ship one plan

One plan slug (or one fix) per branch. If you find yourself doing two, stop and split.

## 1. Pick

- Find the plan in `docs/plans/` and read its status banner.
  - If it is `#DONE` or `#SHELVED`, stop and confirm with Juan.
  - If the work touches both `app/service/` and `app/client/`, or needs a migration, and has no plan, run `/new-plan <slug>` first.
  - A trivial fix needs no plan; just choose a short slug.
- Read the plan's **Acceptance criteria**: that is the definition of done. If they are vague, send the plan to the `project-manager` agent before building.

## 2. Branch

```bash
git branch --show-current
git status --porcelain          # uncommitted work unrelated to this task → stop and ask Juan
git checkout main && git pull
git checkout -b <type>/<slug>   # feat|fix|refactor|chore|docs|test
```

Full rules: [01-git-workflow.md](../../../docs/conventions/01-git-workflow.md). Then run `/update-status <slug> IN_PROGRESS`.

## 3. Build

Delegate in this order — agents cannot spawn each other, so every hop goes through main Claude:

| Situation | Agent |
| --- | --- |
| Needs scoping or task breakdown | `project-manager` |
| Touches DB + service + client, or adds a domain module | `architect` (before any code) |
| Implementation | `engineer` |

Give each agent: the branch name, the acceptance criteria, and [00-naming.md](../../../docs/conventions/00-naming.md) plus [02-code-style.md](../../../docs/conventions/02-code-style.md). Agents do not have context from this conversation — task descriptions must be self-contained.

## 4. Verify

- Run the checks in [02-code-style.md](../../../docs/conventions/02-code-style.md) for every area touched:
  - service: `cd app/service && python -m unittest discover -s tests`
  - client: `cd app/client && npm run lint && npm run build`
- Walk each acceptance criterion and say how it was verified. Never mark one passed that you did not actually run.
- Use the `qa-tester` agent when the change needs a test plan or a second opinion on correctness.
- Confirm no `console.log` is left in the client diff.
- If `database.py` changed, confirm the Alembic migration exists and its SQL matches the table definition.

## 5. Review

- Run `/review`, then fix every Critical and Major finding.
- Run the `security-reviewer` agent if the change adds an endpoint, or touches auth, file upload, or secrets.

## 6. Hand off — never commit

Report to Juan:

- branch name and files changed, grouped by area
- checks run with their results, plus anything still unverified
- suggested commit message(s): Conventional Commits, one scope per area
- suggested PR title and body: plan link, acceptance criteria, how each was verified
- deploy order if both service and client changed (service first)

Once Juan has reviewed the tree, he runs `/pr` to commit, push and open the PR. Don't run it for him.

## 7. After merge

`/update-status <slug> DONE "<one-line note>"`. Deleting the branch is Juan's call.
