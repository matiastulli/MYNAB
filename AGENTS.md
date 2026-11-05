# MYNAB

Global working style, git rules and the `ship-task`, `pr`, `review`, `new-plan` and `design-taste-frontend` skills come from `~/.claude` (`~/Code/_claude-global`). Folder rules: [app/service/CLAUDE.md](app/service/CLAUDE.md) · [app/client/CLAUDE.md](app/client/CLAUDE.md).

## Project Overview

MYNAB ("Maybe You Need A Budget") is a personal budgeting app with a **FastAPI** backend and **React** frontend, deployed on Railway. Users can track income/expenses across multiple currencies, import bank statements from several Argentine and Australian banks, and authenticate via **Google OAuth**.

---

## Commands

### Frontend (`app/client/`)
```bash
npm run dev       # start Vite dev server
npm run build     # production build
npm run lint      # ESLint
npm run preview   # preview production build
```

### Backend (`app/service/`)
```bash
# Run locally (from app/service/)
uvicorn src.main:app --reload --port 3001

# Database migrations (run from app/service/)
alembic upgrade head                  # apply all pending migrations
alembic revision --autogenerate -m "description"  # generate new migration
alembic downgrade -1                  # rollback one migration
```

Install backend deps:
```bash
pip install -r app/service/requirements.txt
```

### Environment variables

**Frontend** (`app/client/.env`):
```
VITE_API_BASE_URL=http://localhost:3001
VITE_GOOGLE_CLIENT_ID=...      # Google OAuth client ID (baked in at build time)
```

**Backend** (`app/service/.env`):
```
ENV_DATABASE_URL=postgresql+asyncpg://user:pass@host/db
ENV_ENVIRONMENT=LOCAL          # LOCAL | STAGING | TESTING | PRODUCTION
ENV_CORS_ORIGINS=["http://localhost:5173"]
ENV_CORS_HEADERS=["*"]
ENV_JWT_SECRET=...
GOOGLE_CLIENT_ID=...           # Google OAuth client ID (used server-side for validation)
```

Backend JWT settings live in `app/service/src/auth_user/config.py`.

**Production note**: `VITE_GOOGLE_CLIENT_ID` must be set as a Railway build variable (not a runtime env var) — it is embedded into the JS bundle via `ARG VITE_GOOGLE_CLIENT_ID` in `Dockerfile.client`.

---

## Architecture

### Backend (`app/service/src/`)

**Pattern**: each domain module (`auth_user`, `budget`, `budget_transaction_category`) follows the same structure:
- `router.py` — FastAPI route handlers, dependency-injected auth via `require_role([])`
- `service.py` — business logic, calls database helpers
- `schemas.py` — Pydantic request/response models (extend `CustomModel` from `models.py`)
- `constants.py` / `config.py` / `exceptions.py` — domain-specific config

**Database** (`database.py`): SQLAlchemy **Core** (not ORM). Tables are defined as `Table` objects in `database.py` within the `mynab` schema. Queries use three async helpers:
- `fetch_one(stmt)` — returns first row as dict or `None`
- `fetch_all(stmt)` — returns list of dicts
- `execute(stmt)` — for INSERT/UPDATE/DELETE with no return value

There is no session/ORM abstraction — queries are built with SQLAlchemy `select()`, `insert()`, `update()`, `delete()` and passed directly to these helpers.

**Auth flow**:
1. Google OAuth: frontend calls `useGoogleLogin` (from `@react-oauth/google`) → receives an `access_token` → `POST /auth/google` with `{ access_token }` → backend calls `https://www.googleapis.com/oauth2/v3/userinfo` to verify and get profile → find-or-create user by `google_id` / email → returns JWT access token + sets httpOnly refresh token cookie
2. JWT is short-lived; refresh token is stored in an httpOnly cookie (`refreshToken`)
3. `require_role([])` on a route enforces authentication; passing specific `ROLES` values enforces role-based access
4. JWT is parsed in `auth_user/jwt.py`; `JWTData` schema carries `id_user`
5. Token refresh: `POST /auth/refresh` rotates both tokens; `DELETE /auth/logout` expires the refresh token

**Bank import** (`budget/service.py`): `process_bank_statement()` decodes a Base64-encoded file, dispatches to a bank-specific parser (`_process_*_format`), auto-categorizes transactions via regex patterns in `budget_transaction_category/constants.py`, then bulk-inserts entries. Supported banks and their formats:
| Bank | Format |
|------|--------|
| `santander_rio` | `.xlsx` |
| `icbc` | `.csv` |
| `mercado_pago` | `.pdf` |
| `bbva` | `.xls` (header on row 3) |
| `comm_bank` | `.csv` (no header row) |
| `revolut` | `.csv` |

**Transaction categories** are stored in the `budget_transaction_category` table and matched via regex patterns defined in `TRANSACTION_CATEGORIES` (constants.py). `CATEGORY_IDS` maps category key strings to their DB integer IDs (hardcoded).

**Migrations**: Alembic migrations live in `app/service/migrations/versions/`. The entrypoint script runs `alembic upgrade head` before starting uvicorn in production.

### Frontend (`app/client/src/`)

**Routing**: React Router v7 with URL-encoded state: `/dashboard/:tab/:currency`. Currency and date range filters are also reflected in URL search params (`startDate`, `endDate`, `preset`).
`/profile` is a protected route that shares `MainApp` as a layout route with the dashboard routes (sidebar and mobile chrome stay, `ProfilePage.jsx` renders through `<Outlet>`); entry points pass `state.from`, which `MainApp` feeds to `useDashboardData` so the shell keeps the previous tab, currency and date range.

**State management**: No global store. Server state lives in TanStack Query behind the `useDashboardData` hook (`hooks/useDashboardData.js`), which owns the `profile`, `categories`, `summary`, `currency-summary`, `details` and `files` queries and invalidates them after mutations. `MainApp.jsx` calls that hook and wraps the tabs in `DashboardProvider` (`contexts/DashboardContext.jsx`), so currency and date range come from context rather than prop drilling. All API calls go through the centralized `services/api.jsx` client, which reads the JWT from `localStorage`, attaches it as a `Bearer` header, and transparently retries once through `POST /auth/refresh` on a 401.

**UI**: Tailwind CSS v4 + shadcn/ui components (Radix UI primitives in `components/ui/`). Light/dark theme is managed via `lib/themeUtils.js` which listens to the system preference.

**Key tab components** (`components/tabs/`):
- `Dashboard.jsx` — spending breakdown (ranked bar list) and stat tiles
- `ActivityList.jsx` — paginated transaction list with delete
- `ImportFile.jsx` — bank statement upload (Base64 encodes file client-side)
- `AddTransaction.jsx` — manual entry form
- `FilesList.jsx` — lists imported files, supports delete (cascades to entries)

**Auth**: `main.jsx` wraps the app in `GoogleOAuthProvider` (client id from `VITE_GOOGLE_CLIENT_ID`); `LandingPage.jsx` calls `useGoogleLogin` directly to drive the sign-in button. On success, JWT is written to `localStorage` and `userId` to `localStorage`; `App.jsx` checks `api.isAuthenticated()` to route between landing and dashboard. `MainApp` is lazy-loaded via `React.lazy` so it doesn't affect landing page paint.

### Deployment

Both services are deployed on Railway. `Dockerfile.client` builds the Vite SPA (nginx serves it with gzip, SPA routing, and proper cache headers via `app/client/nginx.conf`); `Dockerfile.service` installs Python deps and runs `entrypoint.sh` (runs Alembic then Uvicorn). The `ENV_ENVIRONMENT` flag controls whether OpenAPI docs are exposed (`LOCAL`/`STAGING` show docs; `PRODUCTION` hides them).

The backend exposes `GET /healthcheck` (no auth) — useful for uptime monitors to prevent Railway cold starts.

---

## Conventions

| Doc | Covers |
|---|---|
| [`docs/conventions/00-naming.md`](docs/conventions/00-naming.md) | Python, database, API, env var and React naming |
| [`docs/conventions/01-git-workflow.md`](docs/conventions/01-git-workflow.md) | Branching off `main`, Conventional Commits, scopes, PRs |
| [`docs/conventions/02-code-style.md`](docs/conventions/02-code-style.md) | Pre-handoff checks, async rules, logging, tests |

---

## Plans

Plans live in `docs/plans/YYYYMMDD-slug.md`, each starting with a `Status: #TODO | #IN_PROGRESS | #DONE | #SHELVED` banner; done or shelved ones move to `docs/plans/archive/`. No index file. `/new-plan` scaffolds one, `/status` lists the open ones, and `.claude/settings.json` points plan mode at `docs/plans`.

## Checks

`cd app/service && python -m unittest discover -s tests` and `cd app/client && npm run lint && npm run build` ([docs/conventions/02-code-style.md](docs/conventions/02-code-style.md)).

## Constraints

- Default branch is `main`.
- Every query touching `budget_entry`, `files` or `auth_user` filters by `user_id = jwt_data.id_user` (see [02-code-style.md](docs/conventions/02-code-style.md)).
- `VITE_*` env vars are baked in at build time; they can't be set at runtime.
- The JWT lives in `localStorage` and there is no server-side session: designs that assume session state won't work.
- Migrations run on service start (`entrypoint.sh`), so a deploy applies them: review the generated SQL first.

## Agents and skills

- `.claude/agents/reviewer.md` and `security.md`: MYNAB overrides of the global agents (repo checklist, threat model). Every repo keeps these two and no others.
- `.claude/skills/railway`: Railway operations. Everything else is global.
