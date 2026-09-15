# Naming conventions

Checked during `/review`. When this doc and the surrounding code disagree, match the code and fix this doc.

## Python — `app/service/`

| Thing              | Convention                  | Example                              |
| ------------------ | --------------------------- | ------------------------------------ |
| Module             | `snake_case.py`             | `budget_transaction_category/service.py` |
| Class              | `PascalCase`                | `BudgetEntryCreate`, `CustomModel`   |
| Function, variable | `snake_case`                | `process_bank_statement`             |
| Constant           | `UPPER_SNAKE`               | `TRANSACTION_CATEGORIES`, `CATEGORY_IDS` |
| Private helper     | leading `_`                 | `_get_existing_reference_ids`        |
| Bank parser        | `_process_<bank>_format`    | `_process_comm_bank_format`          |
| Async function     | no `async_` prefix          | `fetch_all`, not `async_fetch_all`   |

**Domain module layout** — every domain lives in `app/service/src/<domain>/`:

- `router.py` — route handlers only, no business logic. Exposes `router = APIRouter()`, mounted with its prefix in `main.py`.
- `service.py` — business logic and all database access.
- `schemas.py` — Pydantic request/response models extending `CustomModel` from `src/models.py`.
- `constants.py`, `config.py`, `exceptions.py`, `utils.py` as needed.

`budget_transaction_category` uses `schema.py` (singular) — it predates this doc. New modules use `schemas.py`.

Shared code sits directly in `src/`: `database.py`, `models.py`, `config.py`, `constants.py`, `exceptions.py`, `logging.py`, `utils.py`.

## Database — schema `mynab`

- Tables `snake_case` and **singular**: `auth_user`, `budget_entry`, `budget_transaction_category`, `auth_refresh_token`. `files` is the one plural legacy name — don't copy it.
- Columns `snake_case` and singular: `user_id`, `reference_id`, `file_base64`.
- Primary key `id`. Foreign keys `<entity>_id`: `user_id`, `file_id`, `category_id`.
- Timestamps `created_at` / `updated_at`, `DateTime` with server defaults.
- Booleans read as a predicate: `email_verified`.
- Tables are `Table(...)` objects in `src/database.py` with `schema="mynab"`. SQLAlchemy **Core** only — no ORM models, no session layer. All queries go through `fetch_one`, `fetch_all`, `execute`.
- Migrations: `alembic revision --autogenerate -m "verb_object"` in snake_case (`add_avatar_data_to_auth_user`). Alembic prefixes the date and revision id — never rename the generated file.

## API

- Router prefixes are kebab-case and mounted in `main.py`: `/auth`, `/budget`, `/budget-transaction-category`, `/mail`.
- Sub-paths kebab-case: `/budget/import-file`, `/budget/summary-by-currency`, `/budget/export-xlsx`.
- Path params snake_case: `/budget/entry/{entry_id}`, `/budget/file/{file_id}`.
- Request, query and response fields are `snake_case` (`start_date`, `file_base64`, `id_user`). The client consumes them as they are — no camelCase mapping at the boundary.
- Every protected route takes `jwt_data: JWTData = Depends(require_role([]))`. The authenticated id is `jwt_data.id_user` — never trust a user-supplied id for ownership.
- Errors come back as `{"error": ...}` from the handlers in `main.py`; validation errors add `details` and `path`.

## Environment variables

- Backend: `UPPER_SNAKE` with an `ENV_` prefix — `ENV_DATABASE_URL`, `ENV_JWT_SECRET`, `ENV_JWT_ALG`, `ENV_CORS_ORIGINS`, `ENV_RESEND_API_KEY`. `GOOGLE_CLIENT_ID` has no prefix; it predates the convention. New backend vars get `ENV_`.
- Frontend: the `VITE_` prefix is required by Vite — `VITE_API_BASE_URL`, `VITE_GOOGLE_CLIENT_ID`. These are **baked in at build time**, so on Railway they must be build variables, not runtime variables.
- A new var is documented in `CLAUDE.md` § Environment variables in the same change.

## JavaScript / React — `app/client/`

| Thing                | Convention                          | Example                              |
| -------------------- | ----------------------------------- | ------------------------------------ |
| Component            | `PascalCase.jsx`, one per file      | `ActivityList.jsx`, `SummaryCards.jsx` |
| shadcn/ui primitive  | `kebab-case.jsx` in `components/ui/`| `financial-value.jsx`                |
| Component folder     | lowercase feature name              | `components/tabs/`, `components/filters/` |
| Hook                 | `useX.js` in `hooks/`               | `useDashboardData.js`                |
| Context              | `<Name>Context.jsx` in `contexts/`  | `DashboardContext.jsx`               |
| Lib / util module    | `camelCase.js` in `lib/`            | `currencyUtils.js`, `dateUtils.js`   |
| API client           | `camelCase.jsx` in `services/`      | `api.jsx`                            |
| Function, variable   | `camelCase`                         | `handleCurrencyChange`               |
| Exported constant    | `UPPER_SNAKE`                       | `API_BASE_URL`                       |

- `components/auth_user/` is snake_case to mirror the backend module name. New folders use a lowercase single word.
- All network calls go through the `api` object in `services/api.jsx` — never `fetch` directly from a component.
- TanStack Query keys are lowercase kebab strings with their filters appended: `["details", currency, startDate, endDate, limit, offset]`.
- Routes: `/dashboard/:tab/:currency`, with filters in search params (`startDate`, `endDate`, `preset`). camelCase there is deliberate — it is URL state, not an API payload.
- Currency and date formatting always go through `lib/currencyUtils.js` and `lib/dateUtils.js`, never inline.

## Tests

- Python: `app/service/tests/test_<module>.py`, stdlib `unittest` (`unittest.IsolatedAsyncioTestCase` for async code). Test names describe the behavior: `test_existing_reference_ids_are_scoped_by_user`, not `test_1`.
- The client has no test suite today. Don't claim one ran.

## Files that are not code

- Plans: `docs/plans/YYYY-MM-DD-short-slug.md` — see `.claude/rules/plans.md`.
- Conventions: `docs/conventions/NN-kebab-case.md`.
- Agents and skills: `.claude/agents/<role>.md`, `.claude/skills/<kebab-name>/SKILL.md`.
