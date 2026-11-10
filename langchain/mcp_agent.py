"""LangChain / LangGraph agent using the MCP server (pay-per-call over x402, no API key).

    pip install langchain-mcp-adapters langgraph "langchain[openai]"
    X402_PRIVATE_KEY=0x... OPENAI_API_KEY=sk-... python mcp_agent.py
"""
import asyncio
import os

from langchain_mcp_adapters.client import MultiServerMCPClient
from langgraph.prebuilt import create_react_agent


async def main() -> None:
    client = MultiServerMCPClient({
        "trading-signals": {
            "command": "npx",
            "args": ["-y", "x402-trading-signals-mcp"],
            "transport": "stdio",
            "env": {**os.environ, "MAX_USD_PER_CALL": os.environ.get("MAX_USD_PER_CALL", "0.10")},
        }
    })
    tools = await client.get_tools()
    agent = create_react_agent("openai:gpt-4o-mini", tools)
    out = await agent.ainvoke({"messages": "Run a pre-trade check for NQ with ticker NVDA and summarize it."})
    print(out["messages"][-1].content)


asyncio.run(main())
