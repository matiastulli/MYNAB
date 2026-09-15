# Git workflow

One developer (Juan) plus Claude agents. `main` is what Railway builds and deploys, so it must stay releasable.

## Rule: every feature or fix gets its own branch

No feature work happens on `main`. Before the first file edit:

```bash
git status --porcelain          # must be clean — if not, finish or stash that work first
git checkout main && git pull
git checkout -b <type>/<slug>
```

- `type` — one of `feat`, `fix`, `refactor`, `chore`, `docs`, `test`.
- `slug` — the plan slug from `docs/plans/` when the work has a plan; otherwise kebab-case, ≤ 4 words.

```
feat/revolut-parser             # plan: 2026-09-15-revolut-parser.md
feat/profile-avatar-upload
fix/422-on-empty-date-range     # small fix, no plan
docs/system-design-diagram
```

**One plan (or one fix) per branch** — if a second, unrelated change shows up, it gets its own branch.

Branches created by Claude Code on the web (`claude/<slug>-<id>`) are accepted as they are.

### What Claude may do

Agents create and switch branches. They never commit, push, merge or delete branches. If the tree has uncommitted work unrelated to the task, the agent stops and asks instead of carrying it onto a new branch.

Only Juan commits, by running `/pr`.

## Commits

[Conventional Commits](https://www.conventionalcommits.org). The scope is the area touched:

| Scope     | Covers                                                        |
| --------- | ------------------------------------------------------------- |
| `service` | `app/service/` (excluding migrations)                          |
| `client`  | `app/client/`                                                  |
| `db`      | `app/service/migrations/`, table definitions in `database.py`   |
| `docs`    | `docs/`, `README.md`, `CLAUDE.md`, `.claude/`                  |
| `deploy`  | `Dockerfile.*`, `entrypoint.sh`, `nginx.conf`, `.dockerignore` |

```
feat(client): multi-currency overview cards
fix(service): scope reference_id lookup by user_id
chore(db): add avatar_data to auth_user
docs(docs): add system design diagrams to README
```

The subject is imperative, lowercase, with no trailing period, ≤ 72 chars. The body explains *why*, because the diff already shows *what*. When a change crosses areas, prefer one commit per scope — a migration plus the service code that uses it is the common exception and belongs in one commit.

### Migrations

A schema change is never committed without its Alembic migration in the same commit. `entrypoint.sh` runs `alembic upgrade head` before uvicorn starts, so a `database.py` change that reaches `main` without a migration breaks the deploy.

## Pull requests

- Push the branch and open a PR into `main`. Use the main commit subject as the title. `/pr` does commit + push + PR in one step; only Juan runs it.
- The body links the plan when the branch has one and lists its acceptance criteria, each with how it was verified. Say what was **not** verified.
- Before opening: run `/review`, and the `security-reviewer` agent when the change adds an endpoint or touches auth, file upload or secrets.
- If a response shape changes and the client consumes it, deploy the service first.
- Merge with squash, so `main` reads one commit per feature. Delete the branch after merging.
- If a PR grows past ~400 changed lines (excluding lockfiles and generated files), split it.

## Never

- Committing `.env` files, API keys, or `ENV_JWT_SECRET`. The Android keystore at `app/client/android/android.keystore` is an accepted exception.
- Committing build outputs: `app/client/dist/`, `*.aab`, `*.apk`.
- Leaving `console.log` in client code.
- Commented-out code, or a `TODO` without a plan slug. Write `// TODO(revolut-parser): …`.
- Force-pushing to `main`.

## Enforcement, and its limits

Nothing technically stops a commit on `main` today: there are no git hooks and no branch protection. The rule relies on this doc, the `/pr` preflight checks, and Juan.

If it starts slipping, add a `.githooks/pre-commit` that refuses commits on `main`.
