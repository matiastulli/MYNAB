---
name: railway
description: Railway platform management for MYNAB — checking logs, managing env vars, and redeploying the client and service. Use when you need to inspect a running service or debug a failed deployment.
---

# Railway Management

> **Fill these in.** The exact Railway project and service names below are placeholders — replace them with the real ones from the dashboard the first time you use this skill.

## Project identifiers

| Resource | Value |
|---|---|
| Project | MYNAB |
| Service (backend) | `<service name>` — built from `Dockerfile.service` |
| Client (frontend) | `<client name>` — built from `Dockerfile.client` |
| Database | Railway PostgreSQL, schema `mynab` |

---

## How a deploy works

- **Service**: `Dockerfile.service` installs `app/service/requirements.txt`, then `entrypoint.sh` sleeps 10s, runs `alembic upgrade head`, and starts uvicorn on `$PORT`. **A migration runs on every boot** — a bad migration takes the service down, not just the request that needs it.
- **Client**: `Dockerfile.client` runs `npm ci && npm run build`, then serves `dist/` with nginx using `app/client/nginx.conf`.

Deploy the service before the client when a response shape changed.

---

## Check service logs

1. Open [railway.app](https://railway.app) → select the **MYNAB** project
2. Click the service → **Deployments** tab → click the latest deployment
3. **Logs** tab — filter by `ERROR`, or look for the Alembic output at the top of a fresh boot

The backend logs through `loguru`, and `log_middleware` in `src/logging.py` logs every request.

---

## Redeploy a service

### Via dashboard
Service → **Deployments** → latest deployment → **Redeploy**

### Via CLI
```bash
railway redeploy --service "<service name>"
```

---

## Manage environment variables

### View
Service → **Variables** tab

### Add / update
Service → **Variables** → **New Variable**, or click an existing one to edit.

**Never commit secrets to git.** All credentials live in Railway Variables, not in checked-in `.env` files.

Backend variables (all `ENV_`-prefixed except `GOOGLE_CLIENT_ID`):

```
ENV_DATABASE_URL       postgresql+asyncpg://…
ENV_ENVIRONMENT        PRODUCTION
ENV_CORS_ORIGINS       ["https://mynab.app"]
ENV_CORS_HEADERS       ["*"]
ENV_JWT_SECRET         …
ENV_JWT_ALG            HS256
ENV_RESEND_API_KEY     …
ENV_MAIL_FROM_EMAIL    …
GOOGLE_CLIENT_ID       …
```

### Client variables are build-time, not runtime

`VITE_API_BASE_URL` and `VITE_GOOGLE_CLIENT_ID` are baked into the JS bundle by Vite. They must be set as Railway **build** variables, and `VITE_GOOGLE_CLIENT_ID` is passed through `ARG VITE_GOOGLE_CLIENT_ID` in `Dockerfile.client`. Setting them as runtime variables does nothing — the built bundle already has the old value. Changing one requires a rebuild, not a restart.

---

## Debug a failed deployment

1. Check **Build logs** — usually a dependency install or Docker layer failure.
2. Check **Deploy logs** — usually a startup crash or a missing env var.
3. Common causes:
   - Missing env var → `Config` raises at import time, so the service never starts. Add it in the Variables tab.
   - Alembic failure → the entrypoint stops before uvicorn. Read the migration error; fix forward with a new migration rather than editing a applied one.
   - Google sign-in broken on the deployed client but fine locally → `VITE_GOOGLE_CLIENT_ID` was set as a runtime variable instead of a build variable.
   - CORS errors in the browser → `ENV_CORS_ORIGINS` doesn't include the client's real origin.

---

## Useful Railway CLI commands

```bash
railway login
railway link                              # once per machine
railway status
railway logs --service "<service name>"
railway run uvicorn src.main:app --port 3001   # run locally with Railway's env vars
```

---

## Healthcheck

`GET /healthcheck` is public and returns `{"status": "ok"}`. Point an uptime monitor at it to keep the service warm.
