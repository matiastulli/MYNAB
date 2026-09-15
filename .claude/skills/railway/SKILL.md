---
name: railway
description: Railway platform management for TuPlayero — checking logs, managing env vars, redeploying services, and creating new cron services. Use when you need to inspect a running service, debug a failed deployment, or provision a new ingestion pipeline.
---

# Railway Management

## Project identifiers

| Resource | Value |
|---|---|
| Project | TuPlayero |
| Daily ingestion service | `TuPlayero Ingestion` |
| Weekly ingestion service | `TuPlayero Ingestion Weekly` (project `4cb8e2a7-62b8-4057-8693-46f61302a721`, env `8393bb2e-1838-4af0-8451-5cbfaa07a88e`) |
| API service | `TuPlayero API` |
| Web service | `TuPlayero Web` |
| GraphQL API | `https://backboard.railway.com/graphql/v2` |

---

## Check service logs

1. Open [railway.app](https://railway.app) → select **TuPlayero** project
2. Click the service → **Deployments** tab → click the latest deployment
3. **Logs** tab — filter by `ERROR` or scroll to the bottom for the last run output

For ingestion cron services: logs appear once the cron fires. Check **Metrics** → **Last run** to confirm it ran.

---

## Redeploy a service

### Via dashboard
Service → **Deployments** → latest deployment → **Redeploy**

### Via CLI
```bash
railway redeploy --service "TuPlayero API"
```

---

## Manage environment variables

### View
Service → **Variables** tab

### Add / update
Service → **Variables** → **New Variable** or click an existing one to edit.

**Never commit secrets to git.** All credentials live in Railway Variables, not in `.env` files checked in.

### Variable references (ingestion weekly)
The weekly service uses Railway variable references so it stays in sync with the daily service:
```
DATABASE_URL  →  ${{TuPlayero Ingestion.DATABASE_URL}}
DATABASE_SSL  →  ${{TuPlayero Ingestion.DATABASE_SSL}}
```
If you add a new variable to the daily service that the weekly also needs, add the same reference pattern — don't copy the literal value.

---

## Add a new cron service

Use this pattern when a new ingestion task needs a **different schedule** than the daily run. Never add a date-gate inside `cron_daily.sh`.

1. Create the service via Railway GraphQL API (`serviceCreate`) or dashboard → **New Service** → **Empty Service**
2. Set source:
   - Same repo as the daily service
   - Same `Dockerfile.package.ingestion.*` 
   - `watchPatterns: ["/packages/ingestion/**"]`
3. Set runtime:
   - `startCommand`: the two commands to run (e.g. `python -m scrapers.50_promotions.scrape_modo_promos ... && python -m scrapers.50_promotions.import_promotions ...`)
   - `cronSchedule`: cron expression (e.g. `"0 3 * * 0"` = Sundays 03:00 UTC)
4. Add variable references pointing to the daily service's `DATABASE_URL` / `DATABASE_SSL`
5. Deploy once manually to confirm it works before the cron fires

---

## Debug a failed deployment

1. Check **Build logs** — usually a dependency install or Docker layer failure
2. Check **Deploy logs** — usually a startup crash or missing env var
3. Common causes:
   - Missing env var → add it in Variables tab
   - asyncpg TIMESTAMPTZ error → Python `datetime` missing `tzinfo` — check the offending query
   - Railway `DATABASE_SSL=disable` — confirm the service has this variable set (PostgreSQL 18 image requires it)

---

## Useful Railway CLI commands

```bash
# Login
railway login

# Link to project (run once per machine)
railway link

# Run a command in the service environment (uses Railway env vars)
railway run python -m scrapers.30_prices.scrape_gov --all --since-days 7

# Check service status
railway status

# View logs
railway logs --service "TuPlayero Ingestion"
```
