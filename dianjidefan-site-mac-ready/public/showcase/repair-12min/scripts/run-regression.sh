#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

node scripts/smoke-check.js

python3 -m http.server 4173 >/tmp/repair12-http.log 2>&1 &
SERVER_PID=$!
cleanup() {
  kill "$SERVER_PID" >/dev/null 2>&1 || true
  wait "$SERVER_PID" 2>/dev/null || true
}
trap cleanup EXIT
sleep 1

node scripts/playwright-smoke.js http://127.0.0.1:4173/index.html
./scripts/verify-deploy.sh http://127.0.0.1:4173/index.html

echo "PASS: full local regression completed"
