# MYNAB Codex Agent Instructions

This repository previously used Claude Code agents in `.claude/agents/`. Codex cannot execute those files as native custom agent definitions, so this file adapts their intent into project instructions and delegation templates.

## Project Overview

MYNAB ("Maybe You Need A Budget") is a personal budgeting app with a FastAPI backend and React frontend. Users track income and expenses across currencies, import bank statements from Argentine and Australian banks, and authenticate passwordlessly through email OTP.

## Commands

Frontend, from `app/client/`:

```bash
npm run dev
npm run build
npm run lint
npm run preview
```

Backend, from `app/service/`:

```bash
uvicorn src.main:app --reload --port 3001
alembic upgrade head
alembic revision --autogenerate -m "description"
alembic downgrade -1
```

Install backend dependencies:

```bash
pip install -r app/service/requirements.txt
```

## Architecture

Backend code lives in `app/service/src/`.

- Domains follow `router.py`, `service.py`, `schemas.py`, plus `constants.py`, `config.py`, or `exceptions.py` as needed.
- Use SQLAlchemy Core, not ORM.
- Tables are defined in `database.py` under the `mynab` schema.
- Use `fetch_one(stmt)`, `fetch_all(stmt)`, and `execute(stmt)` for database access.
- Protect non-public routes with `jwt_data: JWTData = Depends(require_role([]))`.
- Never trust user-supplied IDs for ownership. Scope user data with `jwt_data.id_user`.
- Schema changes require matching Alembic migrations in `app/service/migrations/versions/`.

Frontend code lives in `app/client/src/`.

- `MainApp.jsx` owns shared dashboard state.
- All API calls go through `src/services/api.jsx`; do not call `fetch` directly.
- URL state is source of truth for tab and currency: `/dashboard/:tab/:currency`.
- Date range lives in search params: `startDate`, `endDate`, `preset`.
- Use existing shadcn/ui components from `src/components/ui/`.
- Use `lucide-react` for icons.
- Use `src/lib/currencyUtils.js` and `src/lib/dateUtils.js` for formatting.

Bank imports are handled in `budget/service.py` by `process_bank_statement()`, with bank format allowlisting in `budget/router.py`. Transaction categories are matched by regex patterns in `budget_transaction_category/constants.py`; `CATEGORY_IDS` must match database row IDs.

## Codex Delegation Policy

Only spawn Codex sub-agents when the user explicitly asks for agents, delegation, or parallel agent work.

Codex has native `worker` and `explorer` agents, not custom named Claude agents. Use this mapping:

- Claude `engineer` -> Codex `worker`
- Claude `qa-tester` -> Codex `explorer` for review/verification, or local verification if no delegation was requested
- Claude `security-reviewer` -> Codex `explorer` for security review, or local review if no delegation was requested
- Claude `project-manager` -> local planning by default; use an `explorer` only for bounded codebase questions

When delegating code changes to a `worker`, give it exclusive ownership of specific files or modules. Tell it that other edits may be happening in the repo, that it must not revert changes it did not make, and that it must list changed files in its final response.

## Role Template: Engineer

Use for implementing features, fixing bugs, writing migrations, and making full-stack code changes.

Engineer rules:

- Follow existing patterns before adding abstractions.
- Keep route handlers thin; put business logic in `service.py`.
- Raise domain exceptions from `exceptions.py`; do not raise raw `HTTPException` from service code.
- Use SQLAlchemy Core statements with the existing async helpers.
- Scope every user-owned query by authenticated `user_id`.
- Add and review Alembic migrations for table or column changes.
- Use centralized frontend API methods in `api.jsx`.
- Keep dashboard state in `MainApp.jsx` unless the existing code has a stronger local pattern.
- Prefer editing existing files over creating new ones.
- Avoid comments unless the reason is not obvious from the code.

Bank parser steps:

1. Add bank name and extension to `bank_formats` in `budget/router.py`.
2. Add `_process_<bank>_format(df, file_id, bank_name, currency)` in `budget/service.py`.
3. Add dispatch in `process_bank_statement()`.
4. Add category regex patterns in `budget_transaction_category/constants.py` if needed.

## Role Template: QA Tester

Use after implementation or when correctness needs a second pass.

Review for:

- Requirement match and missing code paths.
- Empty inputs, `None` returns, zero amounts, single-item lists, and pagination boundaries.
- Auth edge cases: missing token, expired token, wrong user's data.
- Backend status codes, response schemas, and Pydantic validation.
- `require_role` dependencies on protected routes.
- User scoping on every budget/file query.
- Frontend loading, error, and empty states.
- Currency formatting through `currencyUtils.js`.
- Date formatting through `dateUtils.js`.
- URL state updates when filters change.

MYNAB checks:

- Every `SELECT` on `budget_entry` or `files` must include `WHERE user_id = <id>`.
- New parsers must not silently skip valid transactions through `ignored_descriptions`.
- `CATEGORY_IDS` integer values must match database rows.
- Frontend GET errors check `.error`; POST errors use `.detail || .error`.
- Alembic migrations must match `database.py` table definitions.

Report format:

```text
[SEVERITY] Area -> Finding
Severity: BLOCKER | MAJOR | MINOR
```

If no issues are found:

```text
Implementation verified. No issues found.
Tested: [scenarios checked]
```

## Role Template: Security Reviewer

Use for changes touching authentication, authorization, database queries, file uploads, bank import logic, API endpoints, or user input handling.

Priority threat model:

1. Cross-user data exposure or modification.
2. Authentication bypass or role escalation.
3. OTP brute force, reuse, or flow confusion.
4. File upload attacks, memory exhaustion, path traversal.
5. SQL or command injection.
6. Secrets, PII, raw files, or stack traces leaking through responses or logs.

Checks:

- `SELECT`, `UPDATE`, and `DELETE` on `budget_entry`, `files`, and `auth_user` must be scoped to the authenticated user or protected by an equivalent ownership check.
- Pagination queries must also be scoped by user.
- Delete endpoints must verify ownership before deleting.
- Non-public routes must use `Depends(require_role([]))` or an explicit role requirement.
- Refresh token validation and logout expiry must be preserved.
- OTP codes require short expiry, attempt limits, single-use enforcement, and `code_type` validation.
- File parsers must use in-memory bytes, not attacker-controlled paths.
- Bank selection must be allowlisted; no dynamic attribute access or `eval`.
- Query params such as currency and dates must be validated before use.
- Raw exception messages must not leak outside debug environments.
- `file_base64` must not appear in list/detail API responses.
- Frontend must not render user-controlled content through unsafe HTML.
- CORS wildcard origins are unacceptable outside local development.

Report format:

```text
[SEVERITY] Module/File -> Vulnerability description
Impact: what an attacker can do
Reproduce: minimal steps or code path
Fix: concrete recommendation
```

Severity levels:

- `CRITICAL`: cross-user data exposure/modification, auth bypass, code execution.
- `HIGH`: OTP brute force, sensitive PII in response, missing ownership check.
- `MEDIUM`: missing input validation, overly broad CORS, stack trace leakage.
- `LOW`: defense-in-depth gap or minor information disclosure.

## Role Template: Project Manager

Use for planning complex features before implementation.

Planning output:

```text
## Goal
One sentence.

## What changes
- Affected files/modules and how.

## Tasks
1. [engineer] Task description with acceptance criteria.
2. [QA] Validation steps once implementation is done.

## Open questions / risks
- Unknowns that need user input.
```

Planning rules:

- Keep scope tight and call out avoidable scope creep.
- Identify backend/frontend/migration ordering.
- Make task handoffs self-contained: include target files, current behavior, target behavior, and constraints.
- Surface database migrations, user scoping, category ID consistency, file cascade behavior, URL state, and Railway migration deploy risks when relevant.
