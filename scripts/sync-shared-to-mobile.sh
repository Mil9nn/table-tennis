#!/usr/bin/env bash
# Sync backend shared/ to the standalone mobile repo.
# Usage (from backend repo root):
#   ./scripts/sync-shared-to-mobile.sh /path/to/TableTennisScorer
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <mobile-repo-path>" >&2
  exit 1
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND_SHARED="$ROOT/shared"
MOBILE_REPO="$1"
MOBILE_SHARED="$MOBILE_REPO/shared"

if [[ ! -d "$BACKEND_SHARED" ]]; then
  echo "Backend shared folder not found: $BACKEND_SHARED" >&2
  exit 1
fi

if [[ ! -d "$MOBILE_REPO" ]]; then
  echo "Mobile repo path not found: $MOBILE_REPO" >&2
  exit 1
fi

rm -rf "$MOBILE_SHARED"
cp -R "$BACKEND_SHARED" "$MOBILE_SHARED"
echo "Synced shared/ -> $MOBILE_SHARED"
