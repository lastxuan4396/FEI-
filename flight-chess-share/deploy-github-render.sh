#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <github_repo_url> [branch]"
  echo "Example: $0 https://github.com/<you>/flight-chess-share.git main"
  exit 1
fi

REPO_URL="$1"
BRANCH="${2:-main}"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  git init
fi

git add .
if ! git diff --cached --quiet; then
  git commit -m "chore: publish flight chess share page"
fi

git branch -M "$BRANCH"

if git remote get-url origin >/dev/null 2>&1; then
  git remote set-url origin "$REPO_URL"
else
  git remote add origin "$REPO_URL"
fi

git push -u origin "$BRANCH"

echo
echo "GitHub push done."
echo "Next: Render Dashboard -> New + Blueprint -> select this repo -> Apply."
