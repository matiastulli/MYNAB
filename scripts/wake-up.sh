#!/usr/bin/env bash
# Run MYNAB locally against a local Postgres: client on :3000, API on :8000.
# Usage: scripts/wake-up.sh        (Ctrl+C stops both servers)
#
# Never touches Railway. app/service/.env keeps its values; this script overrides
# the database URL and environment for this run only (exported vars win over .env).
# Override with DB_NAME / DB_HOST / DB_PORT / DB_USER / CLIENT_PORT / API_PORT.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SERVICE_DIR="$ROOT/app/service"
CLIENT_DIR="$ROOT/app/client"

DB_NAME="${DB_NAME:-mynab_dev}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-$(whoami)}"
CLIENT_PORT="${CLIENT_PORT:-3000}"
API_PORT="${API_PORT:-8000}"

log() { printf '\033[1m==>\033[0m %s\n' "$*"; }
die() { printf '\033[31mxx\033[0m %s\n' "$*" >&2; exit 1; }

port_busy() { lsof -iTCP:"$1" -sTCP:LISTEN -t >/dev/null 2>&1; }

# 1. Postgres
command -v pg_isready >/dev/null || die "Postgres client tools not found (brew install postgresql@18)"
if ! pg_isready -q -h "$DB_HOST" -p "$DB_PORT"; then
  formula="$(brew list --formula 2>/dev/null | grep -m1 '^postgresql' || true)"
  [[ -n "$formula" ]] || die "Postgres is not running on $DB_HOST:$DB_PORT and no Homebrew postgresql formula was found"
  log "Starting $formula"
  brew services start "$formula" >/dev/null
  for _ in {1..20}; do pg_isready -q -h "$DB_HOST" -p "$DB_PORT" && break; sleep 0.5; done
  pg_isready -q -h "$DB_HOST" -p "$DB_PORT" || die "Postgres did not come up on $DB_HOST:$DB_PORT"
fi

PSQL=(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -v ON_ERROR_STOP=1 -qAt)
if [[ -z "$("${PSQL[@]}" -d postgres -c "select 1 from pg_database where datname = '$DB_NAME'")" ]]; then
  log "Creating database $DB_NAME"
  createdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME"
fi

# 2. Environment for this run only
export ENV_DATABASE_URL="postgresql+asyncpg://$DB_USER@$DB_HOST:$DB_PORT/$DB_NAME"
export ENV_ENVIRONMENT="LOCAL"
export ENV_CORS_ORIGINS="[\"http://localhost:$CLIENT_PORT\", \"http://127.0.0.1:$CLIENT_PORT\"]"
export VITE_API_BASE_URL="http://127.0.0.1:$API_PORT"

# 3. Dependencies (first run only)
if [[ ! -x "$SERVICE_DIR/.venv/bin/uvicorn" ]]; then
  log "Creating Python venv and installing service dependencies"
  python3 -m venv "$SERVICE_DIR/.venv"
  "$SERVICE_DIR/.venv/bin/pip" install -q -r "$SERVICE_DIR/requirements.txt"
fi
if [[ ! -d "$CLIENT_DIR/node_modules" ]]; then
  log "Installing client dependencies"
  (cd "$CLIENT_DIR" && npm ci)
fi

# 4. Schema + reference data
log "Migrating $DB_NAME"
(cd "$SERVICE_DIR" && .venv/bin/alembic upgrade head)

# Imports write these ids (CATEGORY_IDS in budget_transaction_category/constants.py);
# without the rows the budget_entry foreign key rejects categorized lines.
"${PSQL[@]}" -d "$DB_NAME" <<'SQL'
INSERT INTO mynab.budget_transaction_category (id, category_key, category_name) VALUES
  (1, 'TRANSFER_SENT', 'Transfer sent'),
  (2, 'TRANSFER_RECEIVED', 'Transfer received'),
  (3, 'SERVICE_PAYMENT', 'Service payment'),
  (4, 'CREDIT_CARD_PAYMENT', 'Credit card payment'),
  (5, 'WITHDRAWAL', 'Withdrawal'),
  (6, 'INVESTMENT_SUBSCRIPTION', 'Investment subscription'),
  (7, 'INTEREST_INCOME', 'Interest income'),
  (8, 'DEBIT_PURCHASE', 'Debit purchase'),
  (9, 'DIRECT_DEBIT', 'Direct debit'),
  (10, 'BANK_FEES', 'Bank fees'),
  (11, 'TRANSPORTATION', 'Transportation')
ON CONFLICT (id) DO NOTHING;
SELECT setval(pg_get_serial_sequence('mynab.budget_transaction_category', 'id'),
              (SELECT max(id) FROM mynab.budget_transaction_category));
SQL

# 5. Servers
port_busy "$API_PORT" && die "Port $API_PORT is already in use (lsof -iTCP:$API_PORT -sTCP:LISTEN)"
port_busy "$CLIENT_PORT" && die "Port $CLIENT_PORT is already in use (lsof -iTCP:$CLIENT_PORT -sTCP:LISTEN)"

pids=()
cleanup() {
  trap - INT TERM EXIT
  log "Stopping servers"
  kill ${pids[@]+"${pids[@]}"} 2>/dev/null || true
  wait 2>/dev/null || true
}
trap cleanup INT TERM EXIT

(cd "$SERVICE_DIR" && exec .venv/bin/uvicorn src.main:app --reload --port "$API_PORT") &
pids+=($!)
(cd "$CLIENT_DIR" && exec npx vite --port "$CLIENT_PORT" --strictPort) &
pids+=($!)

for _ in {1..40}; do
  curl -sf "http://127.0.0.1:$API_PORT/healthcheck" >/dev/null && break
  sleep 0.5
done
curl -sf "http://127.0.0.1:$API_PORT/healthcheck" >/dev/null || die "API did not answer on :$API_PORT"

log "MYNAB is up: http://localhost:$CLIENT_PORT (API http://127.0.0.1:$API_PORT, DB $DB_NAME)"
# macOS ships bash 3.2 (no `wait -n`): exit as soon as either server stops
while kill -0 "${pids[0]}" 2>/dev/null && kill -0 "${pids[1]}" 2>/dev/null; do sleep 1; done
die "A server stopped; shutting the other one down"
