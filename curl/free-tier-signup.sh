#!/usr/bin/env bash
# Get a free Trading Signals Toolkit API key (100 calls/month, no card).
# Usage: ./free-tier-signup.sh you@example.com
# The key is printed once. Save it as TRADING_SIGNALS_API_KEY.
set -euo pipefail
BASE="${TRADING_SIGNALS_BASE_URL:-https://signals.incomefather.com}"
EMAIL="${1:?usage: $0 you@example.com}"
curl -sS -X POST "$BASE/billing/free" \
  -H 'content-type: application/json' \
  -d "{\"email\":\"$EMAIL\"}"
echo
