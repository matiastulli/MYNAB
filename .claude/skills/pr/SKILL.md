---
name: pr
description: Commit the current changes, push the branch and open a pull request into master. Only runs when Juan types /pr — invoking it is his explicit request to commit. Usage -> /pr [optional hint for the commit/PR title]
disable-model-invocation: true
allowed-tools:
  - Bash
  - Read
  - Grep
---

Commit, push and open a PR for the current branch. Hint from Juan (may be empty): **$ARGUMENTS**

Typing `/pr` is Juan's explicit request to commit in this conversation (CLAUDE.md § Hard rules). It covers one commit + push + PR for the changes in the tree right now, nothing later. Never merge, never force-push, never delete branches.

## 1. Preflight — stop and ask if any check fails

```bash
git branch --show-current      # must NOT be master
git status --porcelain         # must NOT be empty
git fetch -q origin
git log --oneline origin/master..HEAD
git status --porcelain --untracked-files=all
```

- **On `master`:** stop. Suggest `git checkout -b <type>/<slug>` ([01-git-workflow.md](../../../docs/conventions/01-git-workflow.md)). Release chores on master are Juan's to commit by hand.
- **Unrelated changes in the tree** (files outside the branch's plan or fix): list them and ask before staging. One plan or one fix per branch.
- **Never stage:** `.env*`, API keys, `*.p8`, service-account JSON, build outputs (`*.aab`, `*.ipa`). The keystore and `apps/mobile/credentials.json` are an accepted exception but must not be newly added by accident.
- **Mobile or web files changed:** `git diff HEAD -- apps/ | grep '^+.*console\.'` must print nothing.

## 2. Commit

Stage the intended files (`git add <paths>`, or `git add -A` when everything belongs), then commit with [Conventional Commits](../../../docs/conventions/01-git-workflow.md#commits):

- Subject: `<type>(<scope>): <imperative summary>`, lowercase, no trailing period, ≤ 72 chars. Scope from the table in 01-git-workflow (`mobile`, `web`, `api`, `db`, `ingestion`, `docs`, `release`). Use Juan's hint if he gave one.
- Body: *why*, not what. One or two sentences.
- Changes across packages: prefer one commit per package.
- End the message with the co-author trailer the harness specifies.

Use a heredoc (`git commit -F - <<'EOF' … EOF`) so quotes and newlines survive.

## 3. Push

```bash
git push -u origin "$(git branch --show-current)"
```

If the push is rejected, stop and report. Don't force-push, don't rebase without asking.

## 4. Open the PR

If a PR already exists for this branch (`gh pr view --json url`), report its URL instead of creating a second one.

```bash
gh pr create --base master --head "$(git branch --show-current)" --title "<commit subject>" --body-file - <<'EOF'
…
EOF
```

Body:
- **Summary:** what changed and why; link the plan (`docs/plans/<file>.md`) when the branch has one.
- **Acceptance criteria:** each one with how it was verified (command output, device + OS). Say plainly what was **not** verified.
- **Deploy order:** API first when the web consumes a changed response shape.
- End with the PR footer the harness specifies.

## 5. Report

- Commit hash + subject, branch, PR URL.
- Checks that still need Juan (on-device QA, store steps).
- After merge: `/update-status <slug> DONE "<note>"` if the branch had a plan. Deleting the branch is Juan's call.
