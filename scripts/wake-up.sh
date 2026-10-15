#!/usr/bin/env bash
# Wake up the Railway-hosted client and service (avoids cold starts).
# Usage: scripts/wake-up.sh
# Override targets with CLIENT_URL / SERVICE_URL, retries with MAX_ATTEMPTS / RETRY_DELAY.

set -euo pipefail

CLIENT_URL="${CLIENT_URL:-https://mynab.app}"
SERVICE_URL="${SERVICE_URL:-https://mynab-service.up.railway.app/healthcheck}"
MAX_ATTEMPTS="${MAX_ATTEMPTS:-10}"
RETRY_DELAY="${RETRY_DELAY:-5}"

wake() {
  local name="$1" url="$2" attempt status
  for ((attempt = 1; attempt <= MAX_ATTEMPTS; attempt++)); do
    status=$(curl -s -o /dev/null -w '%{http_code}' --max-time 30 "$url" || echo "000")
    if [[ "$status" =~ ^2 ]]; then
      echo "✅ $name is up ($status) — $url"
      return 0
    fi
    echo "⏳ $name not ready (HTTP $status), attempt $attempt/$MAX_ATTEMPTS — retrying in ${RETRY_DELAY}s"
    sleep "$RETRY_DELAY"
  done
  echo "❌ $name did not respond after $MAX_ATTEMPTS attempts — $url" >&2
  return 1
}

# Wake both in parallel, then wait for each.
wake "service" "$SERVICE_URL" & service_pid=$!
wake "client" "$CLIENT_URL" & client_pid=$!

failed=0
wait "$service_pid" || failed=1
wait "$client_pid" || failed=1
exit "$failed"
