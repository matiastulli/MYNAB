# Naming conventions

Checked by the `reviewer` agent. When this doc and the surrounding code disagree, match the code and fix this doc. Package invariants in each package's CLAUDE.md win over anything here.

## Python — `packages/api`, `packages/ingestion`

| Thing              | Convention                  | Example                                   |
| ------------------ | --------------------------- | ----------------------------------------- |
| Module             | `snake_case.py`             | `price_alert_matcher.py`                  |
| Class              | `PascalCase`                | `GovRecord`                               |
| Function, variable | `snake_case`                | `accept_price_report`                     |
| Constant           | `UPPER_SNAKE`               | `POINTS_ACCEPTED`, `VALID_PRODUCTS`       |
| Private            | leading `_`                 | `_identity_safe_to_overwrite`             |
| Exception (new)    | ends in `Error`             | `<Provider>Error`                         |
| Boolean            | reads as a predicate        | `has_gnc`, `is_active`                    |
| Async function     | no `async_` prefix          | `send_push`, not `async_send_push`        |

**API layout** — one concern per folder:

- `routers/<resource>.py`, plural resource (`stations.py`, `alerts.py`). Each exposes `router = APIRouter(prefix="/<resource>", tags=[...])`.
- `db/queries/<topic>.py` — SQL lives here, not in routers.
- `models/<entity>.py`, singular (`station.py`, `report.py`) — Pydantic request/response models.
- `services/<capability>.py` — external providers and background jobs (`gemini.py`, `routing.py`, `streak_reminder.py`).
- Shared thresholds and enums in `config.py`.

**Ingestion layout** — pipeline steps are numbered in tens so a new step fits between two others:

- `scrapers/NN_topic/` (`10_stations`, `30_prices`, `50_promotions`), output mirrored in `data/NN_topic/`.
- Files are named by verb: `scrape_<source>.py`, `import_<what>.py`, `backfill_<what>.py`.
- Full walkthrough: the `new-scraper` skill.

## Database

- Schema `tuplayero`. Tables `snake_case`, **plural**: `stations`, `price_reports`, `reporter_favorites`.
- Columns `snake_case`, **singular**: `reporter_id`, `google_place_id`, `price_ars`.
- Primary key `id`; foreign key `<singular_table>_id`.
- Timestamps are `TIMESTAMPTZ` in UTC with an `_at` suffix: `effective_at`, `paid_at`. Converted to `America/Argentina/Buenos_Aires` only for display.
- Booleans `has_` / `is_`: `has_gnc`, `has_restaurant`.
- Fuel products use the canonical keys only: `nafta_super | nafta_premium | gasoil_g2 | gasoil_g3 | gnc` (EV: `ac_semirrapida | dc_rapida`).
- Migrations: `alembic revision --autogenerate -m "verb_object"` in `snake_case` (`add_prize_paid_at`). Alembic prefixes the date and revision id — never rename the file.

## API

- Paths `kebab-case`, plural resources: `/stations/along-route`, `/reporters/{id}/notification-preferences`.
- The authenticated user's own resources live under `/me`: `/reporters/me/cars/{car_id}`.
- Query, body and response fields `snake_case` (`radius_km`, `staleness_days`). Mobile and web consume them as is — no camelCase mapping at the boundary.
- Every price object carries `source` and `effective_at`.

## Environment variables

- `UPPER_SNAKE`, no project prefix, named after the provider or resource: `DATABASE_URL`, `GOOGLE_ROUTES_API_KEY`, `RESEND_API_KEY`.
- Client-exposed vars use the framework prefix: `EXPO_PUBLIC_*` (mobile), `NEXT_PUBLIC_*` (web).
- A new var is added to that package's example file in the same change: `packages/api/.env.example`, `packages/ingestion/.env.example`, `apps/mobile/env_example`.

## TypeScript — `apps/mobile`, `apps/web`

| Thing                         | Convention                       | Example                                   |
| ----------------------------- | -------------------------------- | ----------------------------------------- |
| Component                     | `PascalCase.tsx`, one per file   | `PriceShareCard.tsx`, `SiteHeader.tsx`    |
| Component folder              | lowercase feature name           | `components/share/`, `components/map/`    |
| Hook                          | `useX.ts` in `hooks/`            | `useNearbyStations.ts`                    |
| Utility / lib module          | `camelCase.ts`                   | `shareCardModel.ts`, `externalMaps.ts`    |
| Zustand store                 | `store/<name>Store.ts`           | `appStore.ts`                             |
| Exported constant             | `UPPER_SNAKE`                    | `STORY_SAFE_TOP`, `SOURCE_LABELS`         |
| Function, variable            | `camelCase`                      | `getBrandLogo`                            |
| Type / interface              | `PascalCase`, no `I` prefix      | `ShareCardPayload`                        |

- **Routes** (Expo Router screens, Next.js segments): `kebab-case`. User-facing web URLs are in Spanish: `/precios/[combustible]/[provincia]`, `/preguntas-frecuentes`. URL segments are slugs, never DB names — see `apps/web/CLAUDE.md`.
- `apps/web/src/lib/admin-api.ts` predates this doc; new lib files use `camelCase`. Don't rename old files just for this.
- User-facing copy is Spanish (Argentina), `vos` register — see `.claude/rules/argentina.md`.

## Tests

- Python: `tests/test_<module>.py`. Test names describe the behavior: `test_row_to_route_station_without_price`, not `test_1`.
- Mobile: `__tests__/<module>.test.ts(x)`, named after the module under test: `shareCardModel.test.ts`.

## Files that are not code

- Plans: `docs/plans/YYYYMMDD-short-slug.md` — see `.claude/rules/plans.md`.
- Conventions: `docs/conventions/NN-kebab-case.md`.
- Agents and skills: `.claude/agents/<role>.md`, `.claude/skills/<kebab-name>/SKILL.md`.
