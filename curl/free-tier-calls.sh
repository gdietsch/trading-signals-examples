#!/usr/bin/env bash
# Call the toolkit with a free-tier API key (x-api-key header skips the x402 payment).
# Usage: TRADING_SIGNALS_API_KEY=tsk_... ./free-tier-calls.sh
set -euo pipefail
BASE="${TRADING_SIGNALS_BASE_URL:-https://signals.incomefather.com}"
KEY="${TRADING_SIGNALS_API_KEY:?set TRADING_SIGNALS_API_KEY (see free-tier-signup.sh)}"
H=(-sS -H "x-api-key: $KEY")

echo "# Event-risk gate: is it safe to trade the next 30 minutes? (1 unit)"
curl "${H[@]}" "$BASE/futures/event-gate?window=30"; echo; echo

echo "# SEC Form 4 open-market insider buys for one ticker (1 unit)"
curl "${H[@]}" "$BASE/sec/insider-buys?ticker=AAPL&days=30"; echo; echo

echo "# ES futures session brief: next releases, yields, CFTC positioning (1 unit)"
curl "${H[@]}" "$BASE/futures/session-brief?symbol=ES&window=30"; echo; echo

# Heavier calls (uncomment):
# Pre-trade check, one GO / CAUTION / NO_GO verdict:
# curl "${H[@]}" "$BASE/bundle/pre-trade-check?symbol=NQ&window=30&ticker=NVDA"
# AI trade brief (20 units on key plans, $0.08 pay-per-call):
# curl "${H[@]}" "$BASE/ai/trade-brief?symbol=ES&window=30"
