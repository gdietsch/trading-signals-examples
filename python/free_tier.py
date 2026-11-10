"""Free tier quickstart: no wallet, no card, 100 calls/month.

Get a key:
    curl -X POST https://signals.incomefather.com/billing/free \
      -H 'content-type: application/json' -d '{"email":"you@example.com"}'
Run:
    TRADING_SIGNALS_API_KEY=tsk_... python free_tier.py
"""
import os
import sys

import requests

BASE = os.environ.get("TRADING_SIGNALS_BASE_URL", "https://signals.incomefather.com")
KEY = os.environ.get("TRADING_SIGNALS_API_KEY")
if not KEY:
    sys.exit("Set TRADING_SIGNALS_API_KEY (free key from POST /billing/free)")


def call(path: str) -> dict:
    r = requests.get(BASE + path, headers={"x-api-key": KEY}, timeout=60)
    r.raise_for_status()
    return r.json()


brief = call("/futures/session-brief?symbol=ES&window=30")
print("ES safe to trade:", brief["verdict"]["safeToTrade"], brief["verdict"]["reasons"])
ev = brief.get("nextHighImpactEvent") or {}
print("Next high-impact release:", ev.get("title"), ev.get("timeEt"))

buys = call("/sec/insider-buys?ticker=TSM&days=30")
print(f"TSM insider open-market buys (30d): {buys['summary']['purchases']} trades, "
      f"{buys['summary']['distinctInsiders']} insiders, ${buys['summary']['totalValue']:,.0f}")
