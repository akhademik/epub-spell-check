#!/usr/bin/env bash
# Seeds Cloudflare KV with the current public/*.txt dictionary files.
# Run this ONCE after creating the KV namespace, to migrate off the
# hardcoded/bundled files. After this, add new words via the app's
# "Từ điển" panel (or a POST to /api/dict/:name) instead of editing
# these files and redeploying.
#
# Usage:
#   npx wrangler kv namespace create DICT_KV        # copy the printed id
#   ./scripts/seed-kv.sh <KV_NAMESPACE_ID>           # local/preview KV
#   ./scripts/seed-kv.sh <KV_NAMESPACE_ID> --remote  # production KV bound to Pages

set -euo pipefail

NAMESPACE_ID="${1:?Usage: scripts/seed-kv.sh <KV_NAMESPACE_ID> [--remote]}"
REMOTE_FLAG="${2:-}"

DICT_NAMES=(vn non-vn custom names)

for name in "${DICT_NAMES[@]}"; do
  file="public/${name}-dict.txt"
  if [[ ! -f "$file" ]]; then
    echo "Skipping ${name}: ${file} not found"
    continue
  fi
  echo "Seeding dict:${name}:content from ${file} ..."
  npx wrangler kv key put "dict:${name}:content" \
    --path "$file" \
    --namespace-id "$NAMESPACE_ID" \
    $REMOTE_FLAG
done

echo "Done. Verify with:"
echo "  npx wrangler kv key get \"dict:vn:content\" --namespace-id $NAMESPACE_ID $REMOTE_FLAG | head"
