---
name: ship-task
description: Take one plan (or one fix) from a fresh feature branch to a reviewed, PR-ready working tree. Use when starting work on a plan slug from docs/plans/project-status.yaml, or when asked to "ship", "implement", "start" or "pick up" a feature or fix.
---

# Ship one plan

One plan slug (or one fix) per branch. If you find yourself doing two, stop and split.

## 1. Pick

- Find the slug in `docs/plans/project-status.yaml`.
  - If the work touches more than one package or needs more than one session and has no plan, run `/new-plan <slug>` first.
  - A trivial fix needs no plan; just choose a short slug.
- If the entry has `blocked_on`, say so and stop.
- Read the plan's **Acceptance criteria**: that is the definition of done. If they are vague, send the plan to the `pm` agent before building.

## 2. Branch

```bash
git branch --show-current
git status --porcelain          # uncommitted work unrelated to this task → stop and ask Juan
git checkout master && git pull
git checkout -b <type>/<slug>   # feat|fix|refactor|chore|docs|test
```

Full rules: `docs/conventions/01-git-workflow.md`. Then run `/update-status <slug> IN_PROGRESS`.

## 3. Build

Delegate using the table in CLAUDE.md § Orchestration protocol (PM → Architect if multi-layer → engineer agents). Give each agent:

- the branch name
- the acceptance criteria
- `docs/conventions/00-naming.md`, `02-code-style.md` and the package's CLAUDE.md

## 4. Verify

- Run the checks in `docs/conventions/02-code-style.md` for every package touched.
- Walk each acceptance criterion. For criteria that need a device or store build, list them as **to verify by Juan**; never mark them passed.
- Use the `qa-test` agent when the change needs a test plan.
- Confirm no `console.log` is left in the diff.

## 5. Review

- Run `/review`, then fix every Critical and Major finding.
- Run the `security` agent if the change adds an endpoint or touches auth, rate limiting or secrets.

## 6. Hand off — never commit

Report to Juan:

- branch name and files changed, grouped by package
- checks run with results, plus what still needs on-device verification
- suggested commit message(s): Conventional Commits, one scope per package
- suggested PR title and body: plan link, acceptance criteria, how each was verified
- deploy order if the API and web both changed (API first)

Once Juan has reviewed the tree, he runs `/pr` to commit, push and open the PR. Don't run it for him.

## 7. After merge

`/update-status <slug> DONE "<one-line note>"`. Deleting the branch is Juan's call.
