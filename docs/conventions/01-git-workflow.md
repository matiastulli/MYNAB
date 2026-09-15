# Git workflow

One developer (Juan) plus Claude agents. `master` is what gets built and shipped to the stores, so it must stay releasable.

## Rule: every feature or fix gets its own branch

No feature work happens on `master`. Before the first file edit:

```bash
git status --porcelain          # must be clean — if not, finish or stash that work first
git checkout master && git pull
git checkout -b <type>/<slug>
```

- `type` — one of `feat`, `fix`, `refactor`, `chore`, `docs`, `test`.
- `slug` — the plan slug from `docs/plans/project-status.yaml` when the work has a plan; otherwise kebab-case, ≤ 4 words.

```
feat/price-alerts-free-tier     # plan: 20260721-price-alerts-free-tier.md
feat/share-cards                # plan: 20260820-share-cards.md
fix/android-logo-fade           # small fix, no plan
docs/git-conventions
```

Using the plan slug means every branch maps to one line in `project-status.yaml`. **One plan (or one fix) per branch** — if a second, unrelated change shows up, it gets its own branch.

Branches created by Claude Code on the web (`claude/<slug>-<id>`) are accepted as they are.

### The one exception: release chores

The version bump in `apps/mobile/app.json`, the store whatsnew text and the release entries in `project-status.yaml` go on `master`, committed **before** the build is tagged. When that commit is left for later, the tag points at a commit with the old version (this happened on 5.0.27–5.0.29).

### What Claude may do

Agents create and switch branches. They never commit, push, merge or delete branches (CLAUDE.md § Hard rules). If the tree has uncommitted work unrelated to the task, the agent stops and asks instead of carrying it onto a new branch.

## Commits

[Conventional Commits](https://www.conventionalcommits.org). The scope is the area touched:

| Scope       | Covers                                     |
| ----------- | ------------------------------------------ |
| `mobile`    | `apps/mobile/`                             |
| `web`       | `apps/web/`                                |
| `api`       | `packages/api/` (excluding migrations)     |
| `db`        | Alembic migrations, materialized views     |
| `ingestion` | `packages/ingestion/`                      |
| `docs`      | `docs/`, CLAUDE.md, `.claude/`             |
| `release`   | version bumps, whatsnew, store metadata    |

```
feat(mobile): multi-price share card
fix(api): cap along-route radius at 50 km
chore(db): add paid_at to prize claims
chore(release): bump to 5.0.30 / 122
```

The subject is imperative, lowercase, with no trailing period, ≤ 72 chars. The body explains *why*, because the diff already shows *what*. When a change crosses packages, prefer one commit per package.

## Pull requests

- Push the branch and open a PR into `master`. Use the main commit subject as the title. `/pr` does commit + push + PR in one step; only Juan runs it.
- The body links the plan and lists its acceptance criteria, each with how it was verified (command output, device and OS). Say what was **not** verified.
- Before opening:
  - `/review` (reviewer agent).
  - `security` agent when the change adds an endpoint or touches auth, rate limiting or secrets.
- Plan status:
  - `/update-status <slug> IN_PROGRESS` when the branch is created.
  - `DONE` once it merges.
- If an API response shape changes and web consumes it, deploy the API first (ISR can bake blank pages otherwise).
- Merge with squash, so `master` reads one commit per feature. Delete the branch after merging.
- If a PR grows past ~400 changed lines (excluding lockfiles and generated files), split it by package.

## Never

- Committing `.env` files or API keys. The keystore and `credentials.json` in `apps/mobile` are an accepted exception.
- Leaving `console.log` in mobile or web code.
- Commented-out code, or a `TODO` without a plan slug. Write `// TODO(price-alerts-free-tier): …`.
- Force-pushing to `master`.

## Enforcement, and its limits

Today nothing technically stops a commit on `master`: there are no git hooks and no branch protection. The rule relies on:

- CLAUDE.md § Hard rules, which every agent reads
- the reviewer agent's git workflow checklist
- Juan

If it starts slipping, add a `.githooks/pre-commit` that refuses commits on `master` unless the message starts with `chore(release)`.
