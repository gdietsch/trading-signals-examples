# Trading Signals API examples: futures event risk, SEC insider buying and AI trade briefs for agents

Copy-paste quickstarts for the **[Trading Signals Toolkit](https://signals.incomefather.com)**, a market data API built for AI agents and algo traders:

- **ES / NQ futures session brief and event-risk gate**: is it safe to trade the next 30 minutes, the next CPI / NFP / PPI / FOMC / Treasury auction in ET, Treasury 2y/10y/2s10s, CFTC positioning.
- **SEC Form 4 insider buying API**: open-market insider purchases per ticker, and *cluster buys* (3+ insiders buying the same stock).
- **AI trade brief API**: a short structured brief (bias, key levels, risks, catalysts, trade plan) written only from the toolkit's own data.
- **Pre-trade check**: one GO / CAUTION / NO_GO verdict with plain reasons.
- Macro event study ("what did ES do after the last 12 CPI prints?"), Base token safety verdicts, VWAP / opening range / ATR stop / ORB backtest calculators.

Two ways to call it, no sales call needed:

| | How | Cost |
|---|---|---|
| **Free tier** | `x-api-key` header, key issued by email | 100 calls / month, no card |
| **Pay per call ([x402](https://www.x402.org/))** | Your agent's wallet pays USDC on Base (or Solana) per request. No account, no key. | $0.005 to $0.10 per call |
| Plans | Starter $29/mo (10k calls), Pro $99/mo (100k calls) | [pricing](https://signals.incomefather.com/pricing) |

Informational only, not investment advice. Data comes from US government public sources (BLS, Federal Reserve, Treasury, CFTC), SEC EDGAR and Base public RPC.

## 30-second start (free tier)

```bash
# 1. Get a free key (shown once)
curl -X POST https://signals.incomefather.com/billing/free \
  -H 'content-type: application/json' -d '{"email":"you@example.com"}'

# 2. Call it
export TRADING_SIGNALS_API_KEY=tsk_...
curl -H "x-api-key: $TRADING_SIGNALS_API_KEY" \
  "https://signals.incomefather.com/futures/event-gate?window=30"
```

Real response (Nov 10, 2026, during the CME daily halt):

```json
{
  "verdict": { "safeToTrade": false, "reasons": ["CME Globex closed (weekend/daily halt/holiday halt)"], "windowMinutes": 30 },
  "nextHighImpactEvent": { "title": "Producer Price Index", "agency": "BLS", "impact": "high", "timeEt": "2026-11-13T08:30:00-05:00" },
  "nextEvent": { "title": "Unemployment Insurance Weekly Claims", "agency": "DOL", "impact": "medium", "timeEt": "2026-11-12T08:30:00-05:00" }
}
```

## Examples in this repo

| Folder | What | Auth |
|---|---|---|
| [`curl/`](curl) | Free-tier signup, free-tier calls, and decoding the x402 `402 Payment Required` handshake | key / none |
| [`js/`](js) | `free-tier.mjs` (plain `fetch`) and `x402-fetch.mjs` (pay per call with `@x402/fetch`, with a per-call spend cap) | key / wallet |
| [`python/`](python) | `free_tier.py` (`requests`) and `x402_pay.py` (official `x402` Python client + `httpx`, with `max_amount` cap) | key / wallet |
| [`mcp/`](mcp) | MCP config for **Claude Desktop, Cursor, Cline** and Claude Code, using [`x402-trading-signals-mcp`](https://www.npmjs.com/package/x402-trading-signals-mcp) | wallet |
| [`langchain/`](langchain) | LangChain `@tool`s (free key) and a LangGraph agent over the MCP server | key / wallet |
| [`openai-agents/`](openai-agents) | OpenAI Agents SDK with `function_tool`s, or `MCPServerStdio` | key / wallet |
| [`smoke-test.sh`](smoke-test.sh) | Checks the live API (402 handshake, and free-tier 200s if a key is set). Spends nothing. | none |

### JavaScript: pay per call with x402

```js
import { wrapFetchWithPaymentFromConfig } from "@x402/fetch";
import { ExactEvmScheme } from "@x402/evm/exact/client";
import { privateKeyToAccount } from "viem/accounts";

const account = privateKeyToAccount(process.env.X402_PRIVATE_KEY); // dedicated low-balance wallet
const fetchWithPay = wrapFetchWithPaymentFromConfig(fetch, {
  schemes: [{ network: "eip155:8453", client: new ExactEvmScheme(account) }],
  policies: [(_v, reqs) => reqs.filter((r) => BigInt(r.amount) <= 100000n)], // never above $0.10
});
const res = await fetchWithPay("https://signals.incomefather.com/ai/trade-brief?symbol=ES&window=30");
console.log(await res.json());
```

### Python: pay per call with x402

```python
import asyncio, os, httpx
from eth_account import Account
from x402 import x402Client, max_amount
from x402.http.clients import x402_httpx_transport
from x402.mechanisms.evm.exact.register import register_exact_evm_client

async def main():
    client = x402Client()
    register_exact_evm_client(client, Account.from_key(os.environ["X402_PRIVATE_KEY"]),
                              networks="eip155:8453", policies=[max_amount(100_000)])  # $0.10 cap
    async with httpx.AsyncClient(transport=x402_httpx_transport(client), timeout=60) as http:
        r = await http.get("https://signals.incomefather.com/sec/insider-clusters?days=7&minBuyers=3")
        print(r.json())

asyncio.run(main())
```

### Claude Desktop / Cursor / Cline (MCP)

```json
{
  "mcpServers": {
    "trading-signals": {
      "command": "npx",
      "args": ["-y", "x402-trading-signals-mcp"],
      "env": { "X402_PRIVATE_KEY": "0xYOUR_DEDICATED_WALLET_KEY", "MAX_USD_PER_CALL": "0.10" }
    }
  }
}
```

## Routes and prices

| Route | Price | Returns |
|---|---|---|
| `GET /ai/trade-brief?symbol=ES&window=30` | $0.08 | AI-written brief: headline, bias, confidence, key levels, risks, catalysts, trade plan |
| `GET /bundle/pre-trade-check?symbol=NQ&ticker=NVDA` | $0.10 | GO / CAUTION / NO_GO with reasons |
| `GET /futures/session-brief?symbol=ES&window=30` | $0.03 | Releases with latest/prior values, yields, CFTC COT percentile, holidays, verdict |
| `GET /futures/event-gate?window=30` | $0.01 | safeToTrade + next high-impact US release |
| `GET /futures/event-study?event=CPI&symbol=ES&lookback=12` | $0.02 | Moves +5/+15/+30/+60 min after past releases, percentiles, suggested stop |
| `GET /sec/insider-buys?ticker=AAPL&days=30` | $0.01 | Form 4 open-market purchases for one ticker |
| `GET /sec/insider-clusters?days=7&minBuyers=3` | $0.02 | Tickers with several distinct insiders buying |
| `GET /base/token-verdict?address=0x…` | $0.02 | A–F safety grade for a Base ERC-20 (owner, proxy, liquidity, honeypot sim) |
| `POST /quant/vwap-bands`, `/quant/orb`, `/quant/atr-stop` | $0.005 | Calculators on your own OHLCV bars |
| `POST /quant/backtest-orb` | $0.02 | Opening-range-breakout backtest stats |

Full machine-readable spec: [`/openapi.json`](https://signals.incomefather.com/openapi.json) · x402 discovery: [`/.well-known/x402`](https://signals.incomefather.com/.well-known/x402) · Guides: [signals.incomefather.com/guides](https://signals.incomefather.com/guides)

Failed calls (bad input, upstream outage) return 4xx/5xx and are **never charged**: x402 only settles on success.

## Safety notes for wallets

- Use a **dedicated** wallet with a few dollars of USDC on Base. Never a wallet that holds other funds.
- Keep a per-call cap (`MAX_USD_PER_CALL` / the `policies` filter above).
- Don't commit keys. Copy [`.env.example`](.env.example) to `.env` (git-ignored).

## Related

- MCP server source: [gdietsch/trading-signals-mcp](https://github.com/gdietsch/trading-signals-mcp) · npm: [`x402-trading-signals-mcp`](https://www.npmjs.com/package/x402-trading-signals-mcp)
- x402 protocol: [x402.org](https://www.x402.org/)

MIT licensed. Not affiliated with CME Group, the SEC or any data source. Not investment advice.
