"""OpenAI Agents SDK + Trading Signals Toolkit.

Option A (default): function tools over HTTP with a free-tier key (100 calls/month).
    pip install -r requirements.txt
    TRADING_SIGNALS_API_KEY=tsk_... OPENAI_API_KEY=sk-... python agent.py

Option B: the MCP server, paying per call over x402 from your own wallet (no key).
    X402_PRIVATE_KEY=0x... OPENAI_API_KEY=sk-... python agent.py --mcp
"""
import asyncio
import json
import os
import sys

import requests
from agents import Agent, Runner, function_tool

BASE = os.environ.get("TRADING_SIGNALS_BASE_URL", "https://signals.incomefather.com")
INSTRUCTIONS = (
    "You are a cautious trading assistant. Use the tools for facts about event risk, "
    "macro releases and insider buying. Never give investment advice; summarize the data."
)


def _get(path: str, params: dict) -> str:
    key = os.environ.get("TRADING_SIGNALS_API_KEY")
    if not key:
        return "error: set TRADING_SIGNALS_API_KEY (free key from POST /billing/free)"
    r = requests.get(BASE + path, params=params, headers={"x-api-key": key}, timeout=60)
    return r.text[:6000] if r.ok else f"error {r.status_code}: {r.text[:300]}"


@function_tool
def event_gate(window: int = 30) -> str:
    """Safe-to-trade verdict for US index futures over the next `window` minutes, plus the next high-impact US release."""
    return _get("/futures/event-gate", {"window": window})


@function_tool
def session_brief(symbol: str = "ES", window: int = 30) -> str:
    """Session brief for ES, NQ, CL, GC or ZN: releases, Treasury yields, CFTC positioning, verdict."""
    return _get("/futures/session-brief", {"symbol": symbol, "window": window})


@function_tool
def insider_clusters(days: int = 7, min_buyers: int = 3) -> str:
    """US tickers with several distinct insiders buying on the open market (SEC Form 4)."""
    return _get("/sec/insider-clusters", {"days": days, "minBuyers": min_buyers})


QUESTION = "Should I stand aside on ES for the next 30 minutes? Also list this week's insider cluster buys."


async def main() -> None:
    if "--mcp" in sys.argv:
        from agents.mcp import MCPServerStdio

        async with MCPServerStdio(
            name="trading-signals",
            params={
                "command": "npx",
                "args": ["-y", "x402-trading-signals-mcp"],
                "env": {**os.environ, "MAX_USD_PER_CALL": os.environ.get("MAX_USD_PER_CALL", "0.10")},
            },
        ) as server:
            agent = Agent(name="Trading assistant", instructions=INSTRUCTIONS, mcp_servers=[server])
            result = await Runner.run(agent, QUESTION)
    else:
        agent = Agent(
            name="Trading assistant",
            instructions=INSTRUCTIONS,
            tools=[event_gate, session_brief, insider_clusters],
        )
        result = await Runner.run(agent, QUESTION)
    print(result.final_output)


if __name__ == "__main__":
    asyncio.run(main())
