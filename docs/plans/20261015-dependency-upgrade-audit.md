-----
Status: #IN_PROGRESS — phase 0 on chore/deps-safety-net, phase 1 on chore/deps-security-patches
-----

# Dependency upgrade + general audit

Bring frameworks, runtimes and base images up to date, close the known CVEs, and fix the defects the audit turned up. Low-risk security patches ship first; the risky majors (Vite 8, pandas 3, ESLint 10) each ship separately behind tests.

Branch per phase, e.g. `chore/deps-security-patches`, `chore/deps-runtime-images`, `chore/deps-vite-8`.

## Audit snapshot (2026-10-15)

### Vulnerabilities

| Side | Tool | Result |
|---|---|---|
| service | `pip-audit -r requirements.txt` | **starlette 0.27.0**: 7 advisories, fixed only in ≥ 1.3.1 (requires FastAPI bump). **python-multipart 0.0.20**: 6 (fixed 0.0.31). **urllib3 2.5.0**: 6 (fixed 2.8.0). **requests 2.32.5**: 1 (2.33.0). **python-dotenv 1.1.0**: 1 (1.2.2) |
| client | `npm audit` | 42 total (1 critical, 26 high). Runtime deps alone: 22. Most come from `workbox-webpack-plugin` → webpack/terser/serialize-javascript (**unused**: Vite uses `vite-plugin-pwa`) and from `vite ≤ 6.4.2` (dev-server path traversal / file read) |

### Runtimes and images

| Item | Current | Target | Why |
|---|---|---|---|
| `Dockerfile.client` build image | `node:20-alpine` | `node:24-alpine` (LTS) | Node 20 EOL April 2026. Local dev is already 24.21 |
| `Dockerfile.client` serve image | `nginx:alpine` (floating) | pinned `nginx:1.x-alpine` | reproducible builds |
| `Dockerfile.service` | `python:3.11.6` (full Debian, old patch) | `python:3.13-slim` | stale patch release, image ~1 GB → ~150 MB |

### Backend versions

| Package | Current | Latest | Risk |
|---|---|---|---|
| fastapi / starlette | 0.104.1 / 0.27.0 | 0.143.2 / 1.8.0 | **medium**: Starlette 1.0 removed deprecated APIs; `main.py` and `logging.py` import from starlette directly |
| uvicorn / anyio | 0.24.0 / 3.7.1 | 0.54.0 / 4.15.1 | low |
| pydantic / pydantic-settings | 2.11.7 / 2.9.1 | 2.14.1 / 2.16.0 | low |
| SQLAlchemy | 2.0.41 | 2.1.4 | medium: take latest 2.0.x now, 2.1 later |
| alembic / asyncpg | 1.12.1 / 0.30.0 | 1.20.0 / 0.32.0 | low |
| pandas / numpy | 2.3.0 / 2.3.1 | 3.0.6 / 2.4.6 | **high**: pandas 3 makes copy-on-write and the `str` dtype defaults; every bank parser goes through it |
| pillow | 11.2.1 | 12.3.0 | low (avatar upload) |
| cryptography, google-auth, PyJWT, pdfplumber | minor drift | latest | low |

### Frontend versions

| Package | Current | Latest | Risk |
|---|---|---|---|
| react / react-dom | 19.1.0 | 19.3.1 | low |
| react-router-dom, recharts, radix-ui/*, tanstack query, tailwind 4.x, sonner | minor drift | latest in-major | low |
| vite / @vitejs/plugin-react / vite-plugin-pwa | 6.3.5 / 4.7.0 / 1.0.1 | 8.3.4 / 6.1.2 / 2.0.0 | **high**: Vite 8 bundles with Rolldown; `build.rollupOptions.output.manualChunks` needs rework |
| eslint / react-hooks plugin / globals | 9 / 5.2 / 16 | 10 / 7.1 / 17 | medium: react-hooks 7 adds React Compiler rules that will flag existing code |
| lucide-react | 0.516 | 1.57 | medium: icon renames in 1.0 (~10 files import icons) |
| date-fns | 3.6 | 4.4 | low: 2 files |

### Defects and smells found (not version-related)

1. **ICBC parser NaN bug** (`budget/service.py:622-623`): `pd.to_numeric(..., errors="coerce") or 0.0` never falls back, because `NaN` is truthy. A blank Credito/Debito cell yields `NaN`, and the `credito > 0` comparison then silently routes the row to the debit branch with `amount = NaN` when both are blank.
2. **Pydantic typo** (`auth_user/schemas.py:53`): `from_atributtes = True` is misspelled, so it's silently ignored. Use `model_config = ConfigDict(from_attributes=True)`.
3. **No CI.** Nothing runs lint, build, tests or audits before Railway deploys `main`.
4. **Thin tests**: 6 tests in total, and no per-bank parser fixtures. That is the high-risk path for the pandas upgrade.
5. **Windows-only and transitive pins in `requirements.txt`** (`win32_setctime`, `colorama`, `psycopg2-binary`, which appears unused now that alembic uses `ENV_DATABASE_URL`/asyncpg; verify). Split into direct deps and a lock file.
6. **`entrypoint.sh` sleeps 10 s** on every boot before migrating. Replace it with a DB-ready retry, or drop it.
7. **Dead PWA cache rule** (`vite.config.js`): `runtimeCaching` matches `/api*` paths, but the API lives on another origin under `/auth`, `/budget`…, so it never fires. Remove it rather than "fix" it, because caching financial responses on-device is undesirable.
8. `vite-plugin-pwa` and `workbox-*` are listed under `dependencies`; they are build-time only.

Found while implementing phases 0–1 (not fixed yet; each needs its own decision):

9. **Activity log stores full request bodies** (`src/logging.py`), including `file_base64` (entire bank statements) and `avatar_data`, in `auth_user_activity_log`. Privacy and storage problem. Redact or drop large or sensitive fields.
10. **`log_middleware` returns 500 on a malformed `Authorization` header** (`token.split(" ")[1]` when there is no space).
11. **Blank reference → `"nan"`** in ICBC and Santander (`str(NaN)` is truthy). Every blank-reference row shares `reference_id="nan"`, so later imports drop them as duplicates. Fixing it changes dedup keys for rows already in the DB.
12. **ICBC numeric Referencia gets an extra digit**: one blank cell makes pandas read the column as float, so `12345` → `"12345.0"` → `.replace(".", "")` → `"123450"`.
13. **BBVA inflates numeric `Importe`** if xlrd returns a number rather than a `"-1.234,56"` string (`-50.0` → `500.0`). Verify against a real `.xls`.
14. **Blank descriptions become `"nan"`** in ICBC, Santander and comm_bank; the `"Transacción sin descripción"` fallback never fires.
15. **Revolut adds the fee to income rows** as well as expenses (questionable, not clearly a bug).
16. **Missing commas in `budget_transaction_category/constants.py`** merge the `WW METRO` and `SKYBUS` Transportation regexes into their neighbours (no effect today).
17. **14 dev-only npm advisories** (9 high) all come from `@bubblewrap/cli` (Android TWA build only). The only fix npm offers is a breaking `--force` downgrade.

## Phases

### Phase 0: safety net (do first)
- [x] GitHub Actions workflow on PRs to `main`: client `npm ci && npm run lint && npm run build`; service `unittest`; `pip-audit` and `npm audit --omit=dev --audit-level=high` (non-blocking at first)
- [x] Golden-file regression test per bank parser (6 banks): a small anonymised fixture → exact list of `BudgetEntryCreate`. Run it green on **current** pandas before anything is bumped
- [x] Fix defect 1 (ICBC NaN) with a test that reproduces it

### Phase 1: security patches, no majors (`chore/deps-security-patches`)
- [x] Service: fastapi + starlette 1.x, uvicorn, anyio 4, python-multipart, urllib3, requests, python-dotenv; fix any Starlette 1.0 breakages in `main.py` / `logging.py`
- [x] Also cleared the rest of pip-audit: PyJWT 2.15.1, Mako, idna, pdfplumber 0.11.10 (pulls in pdfminer 20260107, pillow 12.3, pypdfium2 5.14), cryptography 50.0.2 + cffi 2.1.1. pip-audit reports 0 findings
- [x] Client: remove `workbox-webpack-plugin`; bump vite to the latest 6.4.x; `npm audit fix` (no `--force`). `npm audit --omit=dev` reports 0
- [x] Fix defect 2 (pydantic config)

### Phase 2: runtimes and images (`chore/deps-runtime-images`)
- [ ] `node:24-alpine`, pinned nginx, `python:3.13-slim`; confirm wheels exist for asyncpg/pandas/numpy/cryptography on 3.13
- [ ] Clean up `requirements.txt` (defect 5) and `entrypoint.sh` (defect 6)
- [ ] Deploy to Railway and check `/healthcheck`, Google login, one import per bank

### Phase 3: in-major bumps
- [ ] Client: react 19.3, router, recharts, radix, tanstack, tailwind 4.3, misc
- [ ] Service: pydantic, SQLAlchemy 2.0.x latest, alembic, asyncpg, pillow 12, cryptography, google-auth, PyJWT

### Phase 4: majors, one branch each
- [ ] Vite 8 + plugin-react 6 + vite-plugin-pwa 2 (rework `manualChunks`; drop the dead cache rule, defect 7)
- [ ] ESLint 10 + react-hooks 7 + globals 17 (fix or consciously disable new compiler rules)
- [ ] lucide-react 1.x, date-fns 4
- [ ] pandas 3 + numpy 2.4: gated on the Phase 0 parser fixtures staying byte-identical
- [ ] SQLAlchemy 2.1 (optional; defer if nothing needs it)

## Acceptance criteria

- `pip-audit` and `npm audit --omit=dev` report zero high/critical findings
- CI is green on every phase's PR; Railway deploy of each phase passes `/healthcheck`
- Every bank parser fixture produces identical output before and after the pandas upgrade
- No base image on an EOL runtime
