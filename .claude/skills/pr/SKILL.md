---
name: pr
description: Commit the current changes, push the branch and open a pull request into main. Only runs when Juan types /pr — invoking it is his explicit request to commit. Usage -> /pr [optional hint for the commit/PR title]
disable-model-invocation: true
allowed-tools:
  - Bash
  - Read
  - Grep
---

Commit, push and open a PR for the current branch. Hint from Juan (may be empty): **$ARGUMENTS**

Typing `/pr` is Juan's explicit request to commit in this conversation. It covers one commit + push + PR for the changes in the tree right now, nothing later. Never merge, never force-push, never delete branches.

## 1. Preflight — stop and ask if any check fails

```bash
git branch --show-current      # must NOT be main
git status --porcelain         # must NOT be empty
git fetch -q origin
git log --oneline origin/main..HEAD
git status --porcelain --untracked-files=all
```

- **On `main`:** stop. Suggest `git checkout -b <type>/<slug>` ([01-git-workflow.md](../../../docs/conventions/01-git-workflow.md)).
- **Unrelated changes in the tree** (files outside the branch's plan or fix): list them and ask before staging. One plan or one fix per branch.
- **Never stage:** `.env*`, API keys, `ENV_JWT_SECRET`, build outputs (`app/client/dist/`, `*.aab`, `*.apk`). The Android keystore at `app/client/android/android.keystore` is an accepted exception but must not be newly added by accident.
- **Client files changed:** `git diff HEAD -- app/client/ | grep '^+.*console\.'` must print nothing.
- **`database.py` changed:** confirm a matching migration exists in `app/service/migrations/versions/` in the same diff. Without it the Railway deploy breaks when `entrypoint.sh` runs `alembic upgrade head`.

## 2. Commit

Stage the intended files (`git add <paths>`, or `git add -A` when everything belongs), then commit with [Conventional Commits](../../../docs/conventions/01-git-workflow.md#commits):

- Subject: `<type>(<scope>): <imperative summary>`, lowercase, no trailing period, ≤ 72 chars. Scope from the table in 01-git-workflow (`service`, `client`, `db`, `docs`, `deploy`). Use Juan's hint if he gave one.
- Body: *why*, not what. One or two sentences.
- Changes across areas: prefer one commit per scope. A migration plus the service code that uses it belongs in one commit.
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
gh pr create --base main --head "$(git branch --show-current)" --title "<commit subject>" --body-file - <<'EOF'
…
EOF
```

Body:

- **Summary:** what changed and why; link the plan (`docs/plans/<file>.md`) when the branch has one.
- **Acceptance criteria:** each one with how it was verified (command output). Say plainly what was **not** verified.
- **Deploy order:** service first when the client consumes a changed response shape.
- **Migration:** name it explicitly when the PR contains one, so the deploy is watched.
- End with the PR footer the harness specifies.

## 5. Report

- Commit hash + subject, branch, PR URL.
- Checks that still need Juan.
- After merge: `/update-status <slug> DONE "<note>"` if the branch had a plan. Deleting the branch is Juan's call.
