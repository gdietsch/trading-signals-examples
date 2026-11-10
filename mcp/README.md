# MCP config: Claude Desktop, Cursor, Cline, Claude Code

The [`x402-trading-signals-mcp`](https://www.npmjs.com/package/x402-trading-signals-mcp) server exposes every Trading Signals Toolkit route as an MCP tool (`pre_trade_check`, `event_gate`, `session_brief`, `event_study`, `insider_buys`, `insider_clusters`, `token_verdict`, `vwap_bands`, `opening_range`, `atr_stop`, `backtest_opening_range_breakout`). Each tool call pays for itself over x402 in USDC on Base from a wallet you control, capped by `MAX_USD_PER_CALL`.

Use a **dedicated, low-balance wallet** (for example $2 to $5 of USDC on Base, no ETH needed). The config file will contain its private key, so don't commit or share it. Without `X402_PRIVATE_KEY` the server still starts and lists its tools; calls return a clear "no wallet configured" error and charge nothing.

| Client | File | Where |
|---|---|---|
| Claude Desktop | [`claude_desktop_config.json`](claude_desktop_config.json) | Settings → Developer → Edit Config |
| Cursor | [`cursor-mcp.json`](cursor-mcp.json) | `~/.cursor/mcp.json` (global) or `.cursor/mcp.json` (project) |
| Cline (VS Code) | [`cline_mcp_settings.json`](cline_mcp_settings.json) | Cline → MCP Servers → Configure → `cline_mcp_settings.json` |

Claude Code:

```bash
claude mcp add trading-signals \
  --env X402_PRIVATE_KEY=0xYOUR_DEDICATED_WALLET_KEY \
  --env MAX_USD_PER_CALL=0.10 \
  -- npx -y x402-trading-signals-mcp
```

Then ask: *"Run a pre-trade check for NQ with ticker NVDA"* or *"Which tickers had 3+ insiders buying this week?"*

Set `MAX_USD_PER_CALL=0.05` to block the $0.10 pre-trade check bundle. Source: [gdietsch/trading-signals-mcp](https://github.com/gdietsch/trading-signals-mcp).
