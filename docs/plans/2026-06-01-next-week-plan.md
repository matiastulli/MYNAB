# MYNAB Next Week Plan

Week: Monday, June 1, 2026 through Friday, June 5, 2026.

## Goal

Stabilize MYNAB by restoring a clean validation baseline, closing obvious API security gaps, and improving existing bank import reliability.

## Decisions

- Keep uploaded bank files stored as base64.
- Duplicate detection policy: same bank reference for the same user.
- `/mail/send-template` is an API endpoint, not a visible UI page; treat its unauthenticated access as a security item unless it is confirmed to be intentionally public.
- Prioritize stabilizing existing bank parsers over adding new bank formats.
- Migration-backed changes are acceptable if needed, but should be kept small and reviewed before deploy.

## What Changes

- Frontend quality baseline: fix current lint failures so `npm run lint` is useful again.
- Security: protect the mail template API route and tighten token/passwordless behavior.
- Bank import reliability: validate files earlier, preserve base64 storage, improve same-reference duplicate handling, and make import feedback clearer.
- Tests: add initial backend coverage for import/category/duplicate behavior and user scoping.
- Polish if time remains: centralize bank metadata used by backend/frontend.

## Tasks

1. [engineer] Fix frontend lint/build baseline.
   Acceptance criteria:
   - `npm run lint` passes from `app/client/`.
   - `python3 -m compileall -q app/service/src` still passes.
   - No unrelated UI behavior changes.
   Likely files:
   - `app/client/eslint.config.js`
   - `app/client/vite.config.js`
   - `app/client/service-worker.js`
   - affected files under `app/client/src/components/`

2. [QA] Smoke test the main app flows after lint cleanup.
   Acceptance criteria:
   - Login/auth modal still renders.
   - Dashboard loads.
   - Currency/date filters still update URL state.
   - Activity, import, and files tabs still render.

3. [engineer] Protect `POST /mail/send-template`.
   Acceptance criteria:
   - Route is no longer publicly callable without authentication.
   - If retained, route requires an explicit role dependency, preferably admin-only.
   - Existing passwordless email flow remains unaffected because it sends mail through service code, not this public endpoint.
   Likely files:
   - `app/service/src/mail/router.py`
   - `app/service/src/auth_user/dependencies.py`
   - `app/service/src/constants.py`

4. [engineer] Tighten passwordless auth and frontend token handling.
   Acceptance criteria:
   - Refresh token is not stored redundantly in `localStorage`.
   - `api.logout()` and 401 handling clear all client auth state consistently.
   - OTP responses remain generic where user enumeration is a risk.
   - Existing registration/login flows continue to work.
   Likely files:
   - `app/service/src/auth_user/router.py`
   - `app/service/src/auth_user/service.py`
   - `app/client/src/services/api.jsx`
   - auth form components under `app/client/src/components/auth_user/`

5. [engineer] Improve import validation while keeping base64 file retention.
   Acceptance criteria:
   - Base64 payloads are validated before storage/parsing.
   - File extension and bank name checks remain allowlist-based.
   - Add a sane upload size limit to reduce accidental or malicious oversized imports.
   - Failed imports return user-safe errors.
   Likely files:
   - `app/service/src/budget/router.py`
   - `app/service/src/budget/service.py`
   - `app/client/src/components/tabs/ImportFile.jsx`

6. [engineer] Stabilize existing parser behavior and same-reference duplicate detection.
   Acceptance criteria:
   - Existing bank parsers continue to support current formats.
   - Row-level parse failures do not crash a whole import.
   - Duplicate detection uses same bank reference for the same user.
   - Duplicate checks do not leak or compare across users.
   - Skipped duplicate count is visible in import result.
   Likely files:
   - `app/service/src/budget/service.py`
   - `app/service/src/budget/schemas.py`
   - `app/client/src/components/tabs/ImportFile.jsx`

7. [engineer] Add focused backend tests.
   Acceptance criteria:
   - Tests cover duplicate detection for same bank reference and user scoping.
   - Tests cover at least one parser normalization path.
   - Tests cover transaction category matching or `CATEGORY_IDS` consistency.
   - Test command is documented in the PR or plan follow-up: `.venv/bin/python -m unittest discover -s tests` from `app/service/`.
   Likely files:
   - new test files under `app/service/`
   - `app/service/requirements.txt` if pytest dependencies are missing

8. [QA] Regression pass for import and deletion.
   Acceptance criteria:
   - Import returns correct imported/skipped counts.
   - Re-importing the same file skips duplicates.
   - File deletion deletes only that user's related entries.
   - `GET /budget/files` does not return `file_base64`.

9. [engineer] Centralize bank metadata if the main stabilization work lands cleanly.
   Acceptance criteria:
   - Backend has one source for supported bank names and extensions.
   - Frontend bank selector matches backend support.
   - Adding a future bank has a clear single update path or API-driven metadata.
   Likely files:
   - `app/service/src/budget/constants.py`
   - `app/service/src/budget/router.py`
   - `app/client/src/components/tabs/ImportFile.jsx`

## Daily Sequence

### Monday, June 1

- Fix frontend lint baseline.
- Run frontend lint and backend compile checks.
- QA smoke test dashboard, auth modal, tabs, and URL filters.

### Tuesday, June 2

- Protect `POST /mail/send-template`.
- Tighten frontend token cleanup and passwordless auth responses.
- Run focused security review on auth, mail, and CORS/cookie settings.

### Wednesday, June 3

- Add base64/file payload validation while retaining stored base64 files.
- Stabilize existing bank parsers.
- Implement same-bank-reference duplicate behavior for the same user.

### Thursday, June 4

- Add backend tests for duplicate detection, parser behavior, category matching, and user scoping.
- QA import/re-import/delete flows.

### Friday, June 5

- Centralize bank metadata if earlier tasks are stable.
- Use remaining time for bug fixes from QA/security findings.

## Risks

- Duplicate detection may need a database index or constraint to be robust under concurrent imports. If so, create and review an Alembic migration.
- Keeping base64 files means upload size limits matter; otherwise a large file can become a database and memory pressure issue.
- Changing auth/token behavior can break deployed sessions, so test refresh, logout, expired access token, and passwordless login before deploy.
- Parser stabilization should avoid adding new bank support in the same week to keep scope controlled.
