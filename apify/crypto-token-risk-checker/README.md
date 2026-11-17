# Rug Pull & Honeypot Checker: Solana, Pump.fun & Base Token Scanner

**Is this token a rug?** Paste one Solana mint (including pump.fun and Raydium memecoins) or one Base ERC-20 address, or a whole watchlist, and get a **SAFE / CAUTION / DANGER** verdict in seconds. Every verdict comes with an A–F grade, a 0–100 score and the plain-language reasons behind it.

It checks mint and freeze authority, LP lock or burn, liquidity, holder, sniper and bundle concentration, Token-2022 traps and a live **sell-route / honeypot test**. You pay **$0.02 per token checked**, and failed lookups are free.

> Informational only. Automated heuristic checks, not financial advice and not a security audit.

## Why use this rug checker

- **One verdict, not 40 raw fields.** You get SAFE, CAUTION or DANGER plus the reasons, ready to drop into a bot rule (`if verdict == "DANGER": skip`).
- **Two chains in one Actor.** It covers Solana (SPL and Token-2022, pump.fun and Raydium launches) and Base. The chain is detected from the address automatically.
- **Real honeypot tests.** On Base it simulates a buy and then a sell, including taxes. On Solana it looks for a real sell route through Jupiter and measures how much a $1,000 sell would lose to price impact.
- **Sniper and bundle detection.** It flags launch-window snipers, same-block bundles, linked insider wallets and creator holdings.
- **Built for bots and agents.** Run it from the Apify API, a schedule, Make, Zapier or n8n, or from an AI agent through Apify's MCP server.
- **Pay per token.** Bulk-check 1,000 tokens for $20, with no subscription and nothing charged for bad addresses.

## What it checks

| Check | Solana (SPL, Token-2022, pump.fun) | Base (ERC-20) |
|---|---|---|
| Mint authority / owner | ✅ mint authority renounced or ACTIVE | ✅ owner, renounced or active |
| Freeze authority / blacklist / pause | ✅ freeze authority | ✅ blacklist, pause and mint flags |
| Honeypot / can you sell? | ✅ live Jupiter sell route + price impact | ✅ buy-then-sell simulation + buy/sell tax |
| Liquidity and LP lock or burn | ✅ | ✅ across DEXes |
| Top holders and creator wallet | ✅ | ✅ top-10 wallets, deployer share |
| Snipers, bundles and insiders | ✅ launch snipers, linked insiders | ✅ launch snipers, same-block bundles |
| Token-2022 traps | ✅ permanent delegate, transfer fees and hooks, pausable | — |
| Upgradeable proxy | — | ✅ |
| Pool age | ✅ | ✅ |

**Optional add-ons**, billed only when they succeed:

- **Whale flow** shows large DEX buys and sells, net flow, accumulation or distribution, and the top wallets. Useful for copy-trading and smart-money alerts.
- **Pre-trade pack** gives one **GO / CAUTION / STOP** decision. It combines the verdict with an OFAC sanctions screen of the token's authorities and, optionally, a USDC pay-readiness check on your counterparty wallet.

## Example input

```json
{
  "tokens": [
    "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
    "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
  ],
  "includeWhaleFlow": false,
  "includePreTradePack": false
}
```

| Field | Required | Description |
|---|---|---|
| `tokens` | yes | Solana mints (base58) and/or Base `0x…` addresses. The chain is auto-detected. |
| `includeWhaleFlow` | no | Add whale flow (`false` by default, +$0.02 per token). |
| `includePreTradePack` | no | Add the GO / CAUTION / STOP pre-trade pack (`false` by default, +$0.015 per token). |
| `hours` | no | Whale-flow lookback, 1–24 hours (default 24). |
| `minUsd` | no | Minimum whale trade size in USD. |
| `wallet` | no | Counterparty wallet for the pre-trade pack. |
| `amount` | no | USDC the wallet should be able to pay (default `1`). |

## Example output

One dataset row per token. These are real results from November 2026. The last row is a fresh Solana memecoin launch, address shortened:

| token | chain | verdict | grade | score | top reasons |
|---|---|---|---|---|---|
| BONK `DezXAZ8z…B263` | solana | **SAFE** | A | 95 | Largest non-pool holder owns 10.4% of supply |
| USDC `0x8335…2913` | base | **SAFE** | A | 90 | Active owner: privileged functions may exist (expected for a regulated stablecoin) |
| new memecoin `AmhZx5…` | solana | **DANGER** | F | 10 | Very thin liquidity (~$1.7k) · selling $1,000 loses ~37% · pool 0.5 h old · ~0% of LP locked or burned: liquidity can be pulled |

The same row as JSON:

```json
{
  "token": "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
  "chain": "solana",
  "verdict": "SAFE",
  "rating": "safe",
  "grade": "A",
  "score": 95,
  "reasons": ["-5: Largest non-pool holder owns 10.4% of supply"],
  "ok": true,
  "error": null,
  "tokenVerdict": { "authorities": { "...": "..." }, "market": { "...": "..." }, "holders": { "...": "..." }, "snipers": { "...": "..." } }
}
```

`tokenVerdict` holds the full API response: authorities, market and liquidity, LP lock, holders, creator, insiders, snipers, risk flags and data sources. When requested, `whaleFlow` and `preTradePack` are added to the row. You can export the results as JSON, CSV or Excel, or read them through the API.

In a test on 17 Nov 2026, **all 6 of the newest Solana tokens listed on DexScreener scored DANGER**. The reasons were thin liquidity, 6–37% loss on a $1,000 sell, pools under 3 hours old, or no sell route at all. That is exactly what a pre-buy check should catch.

## Use cases

- **Sniper and trading bots.** Call the Actor before every buy and skip anything that comes back DANGER or has no sell route.
- **Telegram and Discord bots.** Power a `/check <address>` command. The `reasons` field is already written for humans.
- **Due diligence and research.** Bulk-scan a watchlist, a launchpad feed or a DexScreener export, then sort by score in Excel.
- **AI agents (MCP).** Let Claude, ChatGPT or Cursor agents check a token before they trade or recommend it.
- **Alerts and monitoring.** Schedule hourly runs on your holdings and use a webhook to get pinged when a verdict gets worse.
- **Wallets, dashboards and communities.** Show a safety badge next to each token.

## Pricing

Pay per event. You are only charged for successful results.

| Event | When | Price |
|---|---|---|
| `token-checked` (primary) | A verdict is returned | **$0.02 per token** ($20 per 1,000) |
| `whale-flow` | The optional add-on succeeds | $0.02 per token |
| `pre-trade-pack` | The optional add-on succeeds | $0.015 per token |

- Checking 50 tokens costs **$1.00**. Adding whale flow and the pre-trade pack to all 50 costs $2.75.
- Invalid addresses, unsupported tokens and failed lookups cost $0.
- Apify's free plan includes monthly credits, which covers up to about 250 checks before you pay anything.

## How to call it from your code

**cURL (run and wait for results):**

```bash
curl -X POST "https://api.apify.com/v2/acts/tradingsignals~crypto-token-risk-checker/run-sync-get-dataset-items?token=$APIFY_TOKEN" \
  -H 'content-type: application/json' \
  -d '{"tokens":["DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263"]}'
```

**Python:**

```python
from apify_client import ApifyClient

client = ApifyClient("<APIFY_TOKEN>")
run = client.actor("tradingsignals/crypto-token-risk-checker").call(
    run_input={"tokens": ["DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263"]}
)
for row in client.dataset(run["defaultDatasetId"]).iterate_items():
    if row["verdict"] == "DANGER":
        print("skip", row["token"], row["reasons"])
```

**JavaScript / Node.js:**

```js
import { ApifyClient } from 'apify-client';

const client = new ApifyClient({ token: process.env.APIFY_TOKEN });
const run = await client.actor('tradingsignals/crypto-token-risk-checker').call({
  tokens: ['0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'],
});
const { items } = await client.dataset(run.defaultDatasetId).listItems();
console.log(items[0].verdict, items[0].reasons);
```

**AI agents through MCP (Claude Desktop, Cursor, VS Code):** add Apify's hosted MCP server with this Actor as a tool.

```json
{
  "mcpServers": {
    "token-risk": {
      "url": "https://mcp.apify.com/?tools=tradingsignals/crypto-token-risk-checker",
      "headers": { "Authorization": "Bearer <APIFY_TOKEN>" }
    }
  }
}
```

Then ask: *"Is DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263 a rug?"*

**No-code:** use the Apify integrations for Make, Zapier, n8n, Google Sheets, Slack or webhooks to run a check whenever a new token lands in your sheet or feed.

## FAQ

**How accurate is it?** It is a fast, rules-based risk screen built on public on-chain and market data. It catches the common rug patterns: active mint or freeze authority, unlocked LP, no sell route, high taxes, concentrated or sniped supply and very new or thin pools. It cannot predict a team dumping a token that looks clean, so treat SAFE as "no red flags found", not as a guarantee.

**Which chains does it support?** Solana (SPL and Token-2022, including pump.fun and Raydium launches) and Base. The chain is auto-detected from the address format.

**Does it detect honeypots?** Yes. On Base it simulates a buy and a sell and reports the taxes. On Solana it looks for a real sell route through Jupiter and the price impact of a $1,000 sell, and flags Token-2022 transfer hooks, fees and permanent delegates.

**Why is USDC not shown as perfectly safe?** Regulated stablecoins legitimately keep an owner, or mint and freeze authority. The verdict still says SAFE, and the reason line explains the flag. Always read the reasons, not just the label.

**How fast is it?** Usually 2–10 seconds per token. A batch of tokens runs in a single Actor run.

**Can I use it in a commercial bot or app?** Yes. Call it through the Apify API under your own Apify account.

**Is there a plain REST API or a monthly plan?** Yes. The same engine is available as an HTTP and MCP API from the [Trading Signals Toolkit](https://signals.incomefather.com/pricing), with a free key (100 calls a month) and plans from $19 a month for 5,000 checks. It is also on [RapidAPI](https://rapidapi.com/tradingsignals/api/crypto-token-risk-market-data). You can also try a single token free in the browser at [signals.incomefather.com/check](https://signals.incomefather.com/check).

**Need it built into your bot?** We review bot and agent setups ($149) and wire in token risk checks, whale alerts and payments. See [services](https://signals.incomefather.com/services).

## Source and support

The source is in [gdietsch/trading-signals-examples](https://github.com/gdietsch/trading-signals-examples) under `apify/crypto-token-risk-checker`. The API docs are at [signals.incomefather.com](https://signals.incomefather.com) and [llms.txt](https://signals.incomefather.com/llms.txt). For issues and feature requests, open the **Issues** tab on this Actor.

Related searches: rug pull checker, rug checker, rugcheck alternative, honeypot checker, honeypot token detector, Solana token scanner, pump.fun rug checker, memecoin safety check, Base token scanner, token security scanner, crypto scam token checker, mint authority checker, LP lock checker, token sniper detection, Solana token analyzer, pre-trade token check.

## Disclaimer

These are automated, heuristic checks. They are not financial advice, not a guarantee, and not a substitute for your own research or a professional smart contract audit.
