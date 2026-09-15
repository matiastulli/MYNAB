# Code style

This file covers what tooling can't check. `CLAUDE.md` wins over anything here.

## Checks before handing off

Run the checks for every area the change touches:

| Area    | Command                                                    |
| ------- | ---------------------------------------------------------- |
| service | `cd app/service && python -m unittest discover -s tests` |
| client  | `cd app/client && npm run lint && npm run build`            |

Report the results. **Never claim a check passed if you didn't run it.**

There is no Python linter or formatter configured — no `ruff`, `black` or `pytest` in `requirements.txt`. Don't write instructions that assume one. If you add one, add it to `requirements.txt` and to this table in the same change.

## Python

- Type hints on every public function.
- **The service is async end to end**: asyncpg via SQLAlchemy Core, `async def` handlers. No sync DB driver and no `time.sleep` inside a coroutine. `requests` is used synchronously in `auth_user/service.py` for the Google userinfo call — don't spread that pattern.
- Queries are built with SQLAlchemy `select()`, `insert()`, `update()`, `delete()` and passed to `fetch_one` / `fetch_all` / `execute`. Never build SQL with f-strings. `fetch_all_sql` takes a raw string — it must never receive user input.
- All business logic lives in `service.py`; routers stay thin.
- Schema changes only through Alembic, generated and reviewed before `alembic upgrade head`.
- Raise domain exceptions from the module's `exceptions.py`; the handlers in `main.py` turn them into JSON. Don't raise bare `HTTPException` from a service.
- Every query touching `budget_entry`, `files` or `auth_user` filters by `user_id = jwt_data.id_user`. This is the single most important rule in the codebase — a miss here is a cross-user data leak.

## Logging

- The service uses `loguru`: `from loguru import logger`.
- **Never log** JWTs, refresh tokens, `ENV_JWT_SECRET`, email addresses, `national_id`, or `file_base64` contents. Log ids and counts. This is a hard rule.
- `console.log` is a debugging tool in the client. Remove every one before commit.

## JavaScript / React

- Components are functions. Server state lives in TanStack Query hooks (`hooks/useDashboardData.js`); everything else is props or local state. Don't add a global store.
- After a mutation, invalidate the affected query keys rather than refetching by hand.
- Reuse the primitives in `components/ui/` before adding a new one. Icons come from `lucide-react`.
- Colors and surfaces use the CSS custom property tokens in `src/index.css` (`--glass-bg`, `hsl(var(--accent))`, `hsl(var(--positive))`). Never hardcode hex values or opacity — they break dark mode.
- **Safari bug**: never combine `hover:scale-*` with `backdrop-blur-*` on the same element; it kills the blur in WebKit. Never apply `backdrop-blur-*` directly to a native `<input>`, `<select>` or `<textarea>`.
- The URL is the source of truth for tab, currency and date range. Keep views bookmarkable.

## Comments

Comment the *why*, not the *what*. Platform quirks always get a comment, because the fix looks like a bug without one — the Safari blur rule above is the standing example.

No docstrings beyond a single short line where one is genuinely needed. No backwards-compatibility shims for code that was removed. No defensive handling for cases that cannot happen.

## Tests

- Python tests live in `app/service/tests/` and must run without a real database — patch `fetch_one` / `fetch_all` / `execute` with `AsyncMock`, as `test_budget_service.py` does. The test module sets the required `ENV_*` vars **and** `GOOGLE_CLIENT_ID` before importing `src` — `auth_config` and `Config` both instantiate at import time, so a missing var is a collection-time `ValidationError`, not a test failure. When you add a required setting to `config.py` or `auth_user/config.py`, add it to that block in the same change.
- A bug fix in pure logic (a bank parser, a categorizer, a date helper) adds a regression test that fails before the fix.
- Bank parsers are the highest-value thing to test: column mapping, date format, income/outcome sign, and rows with missing fields being skipped rather than crashing.
