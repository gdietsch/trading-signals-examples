"""LangChain tools for the Trading Signals Toolkit (free-tier API key, 100 calls/month).

    pip install -r requirements.txt
    TRADING_SIGNALS_API_KEY=tsk_... python trading_signals_tools.py          # call the tools directly
    TRADING_SIGNALS_API_KEY=tsk_... OPENAI_API_KEY=sk-... python trading_signals_tools.py --agent

Prefer pay-per-call with no key? Use the MCP variant in mcp_agent.py.
"""
import json
import os
import sys

import requests
from langchain_core.tools import tool

BASE = os.environ.get("TRADING_SIGNALS_BASE_URL", "https://signals.incomefather.com")


def _get(path: str, params: dict) -> str:
    key = os.environ.get("TRADING_SIGNALS_API_KEY")
    if not key:
        return "error: set TRADING_SIGNALS_API_KEY (free key from POST /billing/free)"
    r = requests.get(BASE + path, params=params, headers={"x-api-key": key}, timeout=60)
    if r.status_code >= 400:
        return f"error {r.status_code}: {r.text[:300]}"
    return json.dumps(r.json())[:6000]


@tool
def event_gate(window: int = 30) -> str:
    """Is it safe to trade US index futures in the next `window` minutes? Returns safeToTrade,
    reasons, and the next high-impact US release (CPI, NFP, PPI, FOMC, Treasury auctions) in ET."""
    return _get("/futures/event-gate", {"window": window})


@tool
def session_brief(symbol: str = "ES", window: int = 30) -> str:
    """Futures session brief for ES, NQ, CL, GC or ZN: upcoming releases with latest/prior values,
    Treasury 2y/10y/2s10s, CFTC positioning percentile, holiday flags and a trade/no-trade verdict."""
    return _get("/futures/session-brief", {"symbol": symbol, "window": window})


@tool
def insider_buys(ticker: str, days: int = 30) -> str:
    """SEC Form 4 open-market insider purchases (code P) for one US ticker over the last `days` days."""
    return _get("/sec/insider-buys", {"ticker": ticker, "days": days})


@tool
def insider_clusters(days: int = 7, min_buyers: int = 3) -> str:
    """US tickers where at least `min_buyers` different insiders bought on the open market recently."""
    return _get("/sec/insider-clusters", {"days": days, "minBuyers": min_buyers})


TOOLS = [event_gate, session_brief, insider_buys, insider_clusters]

if __name__ == "__main__":
    if "--agent" in sys.argv:
        from langgraph.prebuilt import create_react_agent

        agent = create_react_agent("openai:gpt-4o-mini", TOOLS)
        out = agent.invoke({"messages": "Is it safe to trade ES right now, and which stocks had insider cluster buys this week?"})
        print(out["messages"][-1].content)
    else:
        print(event_gate.invoke({"window": 30})[:400])
        print(insider_clusters.invoke({"days": 7, "min_buyers": 3})[:400])
