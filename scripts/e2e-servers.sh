#!/usr/bin/env bash
# Claude's end-to-end CHECK servers — not the app. The app is ./scripts/dev.sh on
# :5001 / :5173, run by Venkat; this script never touches those ports.
#
#   backend  :5002 against bmi_crm_iso_test (refuses any database not ending in _test)
#   frontend :5174 in `--mode e2e`, given its backend address EXPLICITLY. In e2e mode
#            Frontend/src/config/backend.ts has no default address and refuses :5001,
#            so a misconfiguration fails loudly instead of reaching the live backend.
#
# Ctrl-C (or killing this script) stops both.
set -euo pipefail

E2E_DB="bmi_crm_iso_test"
E2E_BACKEND_PORT="5002"
E2E_FRONTEND_PORT="5174"     # an allowed CORS origin (Backend/src/app.ts)

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

case "$E2E_DB" in *_test) ;; *) echo "e2e-servers: refusing database $E2E_DB (must end in _test)" >&2; exit 1 ;; esac
for p in "$E2E_BACKEND_PORT" "$E2E_FRONTEND_PORT"; do
  if [ "$p" = "5001" ] || [ "$p" = "5173" ]; then echo "e2e-servers: refusing port $p — that is the app's" >&2; exit 1; fi
  if lsof -nP -iTCP:"$p" -sTCP:LISTEN >/dev/null 2>&1; then
    echo "e2e-servers: port $p is already in use:" >&2; lsof -nP -iTCP:"$p" -sTCP:LISTEN >&2; exit 1
  fi
done

trap 'trap - EXIT INT TERM; kill 0 2>/dev/null' EXIT INT TERM
label() { awk -v p="$1" '{ print p " " $0; fflush() }'; }

( cd "$ROOT/Backend" && DB_NAME="$E2E_DB" PORT="$E2E_BACKEND_PORT" MIGRATIONS_ON_BOOT=check \
    CLIENT_URL="http://localhost:$E2E_FRONTEND_PORT" npx ts-node src/index.ts 2>&1 | label "[e2e-backend]" ) &
( cd "$ROOT/Frontend" && VITE_BACKEND_ORIGIN="http://localhost:$E2E_BACKEND_PORT" \
    npx vite --mode e2e --port "$E2E_FRONTEND_PORT" --strictPort 2>&1 | label "[e2e-frontend]" ) &

echo "e2e-servers: backend http://localhost:$E2E_BACKEND_PORT ($E2E_DB), frontend http://localhost:$E2E_FRONTEND_PORT"
wait
