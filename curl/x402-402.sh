#!/usr/bin/env bash
# See the x402 handshake without paying: an unpaid request returns HTTP 402
# with a base64 PAYMENT-REQUIRED header that says exactly what to pay.
set -euo pipefail
BASE="${TRADING_SIGNALS_BASE_URL:-https://signals.incomefather.com}"
URL="$BASE/futures/event-gate?window=30"
echo "GET $URL"
HDRS=$(curl -sS -o /dev/null -D - "$URL")
echo "$HDRS" | head -1
PR=$(echo "$HDRS" | tr -d '\r' | awk -F': ' 'tolower($1)=="payment-required"{print $2}')
echo "Decoded PAYMENT-REQUIRED (price in USDC base units, 6 decimals):"
echo "$PR" | base64 -d 2>/dev/null | python3 -c '
import json, sys
d = json.load(sys.stdin)
for a in d["accepts"]:
    print("  %s %s amount=%s payTo=%s" % (a["scheme"], a["network"], a["amount"], a["payTo"]))
'
