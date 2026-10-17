#!/usr/bin/env bash
# Start the backend (:5001) and the frontend (:5173) together, from your own
# terminal. Ctrl-C (or closing the terminal) stops both. No dependencies beyond
# what Backend/ and Frontend/ already install.
#
#   ./scripts/dev.sh
#
# The backend runs plain ts-node, not `npm run dev` (ts-node-dev): on 2026-10-14
# a ts-node-dev that had run for days restarted on a file change, could not find
# the hook file it had left in the macOS temp folder (which macOS clears), and
# stayed down. Restart this script after pulling or editing backend code.
#
# The backend checks migrations on start and REFUSES to start if one is pending
# (MIGRATIONS_ON_BOOT=check). Apply them first with: (cd Backend && npm run db:migrate)
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

for port in 5001 5173; do
  if lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
    echo "Port $port is already in use by:"
    lsof -nP -iTCP:"$port" -sTCP:LISTEN
    echo "Stop that process first (kill <PID>), then run this again."
    exit 1
  fi
done

label() { awk -v p="$1" '{ print p $0; fflush() }'; }
trap 'trap - EXIT INT TERM; kill 0 2>/dev/null' EXIT INT TERM

(cd "$ROOT/Backend" && npx ts-node src/index.ts 2>&1 | label '[backend]  ') &
(cd "$ROOT/Frontend" && npx vite --port 5173 --strictPort 2>&1 | label '[frontend] ') &

echo "Starting... open http://localhost:5173 (not 127.0.0.1). Ctrl-C stops both."
wait
