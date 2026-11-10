#!/usr/bin/env bash
# Smoke test against the live API. Spends nothing.
#  - Always: unpaid requests must return HTTP 402 with a PAYMENT-REQUIRED header.
#  - If TRADING_SIGNALS_API_KEY is set: free-tier calls must return 200 JSON (uses ~3 of your 100 monthly calls).
set -euo pipefail
BASE="${TRADING_SIGNALS_BASE_URL:-https://signals.incomefather.com}"
fail=0
for path in "/futures/event-gate?window=30" "/futures/session-brief?symbol=ES" "/sec/insider-buys?ticker=AAPL" "/ai/trade-brief?symbol=ES" "/bundle/pre-trade-check?symbol=ES"; do
  out=$(curl -sS -o /dev/null -D - "$BASE$path" | tr -d '\r')
  code=$(echo "$out" | head -1 | awk '{print $2}')
  if [[ "$code" == "402" ]] && echo "$out" | grep -qi '^payment-required:'; then echo "ok   402 $path"; else echo "FAIL $code $path"; fail=1; fi
done
if [[ -n "${TRADING_SIGNALS_API_KEY:-}" ]]; then
  for path in "/futures/event-gate?window=30" "/sec/insider-buys?ticker=AAPL&days=30" "/futures/session-brief?symbol=ES&window=30"; do
    code=$(curl -sS -o /dev/null -w '%{http_code}' -H "x-api-key: $TRADING_SIGNALS_API_KEY" "$BASE$path")
    if [[ "$code" == "200" ]]; then echo "ok   200 (free key) $path"; else echo "FAIL $code (free key) $path"; fail=1; fi
  done
fi
exit $fail
