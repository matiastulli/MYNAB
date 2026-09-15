# Code style

Linters decide formatting, so formatting is not a review topic. This file covers what they can't check. Invariants in each package's CLAUDE.md (price rows are INSERT-only, share card rules, slug rules…) win over anything here.

## Checks before handing off

Run the checks for every package the change touches:

| Package     | Command                                                              |
| ----------- | -------------------------------------------------------------------- |
| api         | `cd packages/api && ruff check . && pytest tests/`                   |
| ingestion   | `cd packages/ingestion && ruff check . && python -m pytest tests/`   |
| mobile      | `cd apps/mobile && npx tsc --noEmit && npm run lint && npm test`     |
| web         | `cd apps/web && npm run lint && npm run build`                       |

Report the results. Never claim a check passed if you didn't run it. On-device checks (Android emulator, iOS simulator) go in the hand-off as "to verify" unless someone actually did them.

## Python

- `ruff` config is in each `pyproject.toml`: line length 120, rules `E F I UP B`. `UP` enforces modern typing (`str | None`, `frozenset[str]`).
- Type hints on every public function.
- **API is async end to end:** asyncpg for the DB and an async HTTP client for providers. No sync DB driver and no `time.sleep` inside a coroutine. Ingestion scrapers are standalone sync scripts, so `requests` is fine there.
- SQL uses asyncpg `$N` placeholders. Never build SQL with f-strings.
- Query functions live in `db/queries/`, so routers stay thin.
- Schema changes only through Alembic (see `packages/api/CLAUDE.md`).
- HTTP errors: raise `HTTPException` in routers and auth. `db/queries/reporters.py` and `services/routing.py` still raise it too. New query and service code should raise plain exceptions and let the router map them.

## Logging

- Python uses the stdlib `logging` module: `logger = logging.getLogger("<module>")`. Pass `%`-style arguments instead of f-strings: `logger.info("[scheduler] prize job scheduled every %s minute(s)", minutes)`.
- **Never log** tokens, JWTs, emails, push tokens or full request bodies. Log ids and counts. This is a hard rule.
- Mobile and web: `console.log` is a debugging tool (CLAUDE.md § Debugging). Remove every one before commit.

## TypeScript

- `tsc` runs in `strict` mode; keep it clean. Avoid `any` at API boundaries; type responses in `api/client.ts` (mobile) or `src/lib/api.ts` (web).
- Mobile colors come from `constants/colors.ts` via `useTheme()`. Don't hardcode hex values or static Tailwind color classes, because they break dark mode.
- Server state lives in TanStack Query hooks in `hooks/`. Client state lives in Zustand in `store/`, with no async logic inside stores.
- Reuse the shared components named in `apps/mobile/CLAUDE.md` (`GlassCard`, `SortTabs`, `ScreenHeader`…) instead of inlining a second copy.
- Every price rendered shows its source and age.

## Comments

Comment the *why*, not the *what*. Platform quirks always get a comment, because the fix looks like a bug without one. Example: `captureOptionsFor()` in `utils/shareCardMetrics.ts`.

## Tests

- **api:** pytest in `tests/`. Keep them runnable without the production database.
- **ingestion:** unit tests need no DB. DB tests are opt-in with `RUN_DB_TESTS=1 python -m pytest tests/ -m db`. Check which database `DATABASE_URL` points at before running them.
- **mobile:** Jest in `__tests__/` for pure logic (models, metrics, filters). Keep layout math in `utils/` so it can be tested there.
- **Bug fixes:** a fix in pure logic adds a regression test that fails before the fix.
