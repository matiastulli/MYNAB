# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

**Pattern**: each domain module (`auth_user`, `budget`, `budget_transaction_category`, `mail`) follows the same structure:
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
| `ICBC` | `.csv` |
| `mercado_pago` | `.pdf` |
| `bbva` | `.xls` |
| `comm_bank` | `.csv` |

**Transaction categories** are stored in the `budget_transaction_category` table and matched via regex patterns defined in `TRANSACTION_CATEGORIES` (constants.py). `CATEGORY_IDS` maps category key strings to their DB integer IDs (hardcoded).

**Migrations**: Alembic migrations live in `app/service/migrations/versions/`. The entrypoint script runs `alembic upgrade head` before starting uvicorn in production.

### Frontend (`app/client/src/`)

**Routing**: React Router v7 with URL-encoded state: `/dashboard/:tab/:currency`. Currency and date range filters are also reflected in URL search params (`startDate`, `endDate`, `preset`).

**State management**: No global store. `MainApp.jsx` is the top-level state holder — it fetches summary, entries, and files data and passes handlers down as props. All API calls go through the centralized `services/api.jsx` client, which reads the JWT from `localStorage` and attaches it as a `Bearer` header.

**UI**: Tailwind CSS v4 + shadcn/ui components (Radix UI primitives in `components/ui/`). Light/dark theme is managed via `lib/themeUtils.js` which listens to the system preference.

**Key tab components** (`components/tabs/`):
- `Dashboard.jsx` — charts and category breakdowns (Recharts)
- `ActivityList.jsx` — paginated transaction list with delete
- `ImportFile.jsx` — bank statement upload (Base64 encodes file client-side)
- `AddTransaction.jsx` — manual entry form
- `FilesList.jsx` — lists imported files, supports delete (cascades to entries)

**Auth**: `LandingPage.jsx` → `AuthModal.jsx` → custom Google Sign-In button (uses `useGoogleLogin` from `@react-oauth/google`). On success, JWT is written to `localStorage` and `userId` to `localStorage`; `App.jsx` checks `api.isAuthenticated()` to route between landing and dashboard. `MainApp` is lazy-loaded via `React.lazy` so it doesn't affect landing page paint.

### Deployment

Both services are deployed on Railway. `Dockerfile.client` builds the Vite SPA (nginx serves it with gzip, SPA routing, and proper cache headers via `app/client/nginx.conf`); `Dockerfile.service` installs Python deps and runs `entrypoint.sh` (runs Alembic then Uvicorn). The `ENV_ENVIRONMENT` flag controls whether OpenAPI docs are exposed (`LOCAL`/`STAGING` show docs; `PRODUCTION` hides them).

The backend exposes `GET /healthcheck` (no auth) — useful for uptime monitors to prevent Railway cold starts.

---

## Team Workflow

Features follow a PM → Engineer pipeline. See [`.claude/WORKFLOW.md`](.claude/WORKFLOW.md) for the full process.

**Short version**: user describes a goal → main Claude spawns **PM agent** to produce a scoped plan → main Claude spawns **Engineer agent** with that plan → main Claude reports back. Agents cannot spawn each other; all coordination goes through the main Claude instance.
