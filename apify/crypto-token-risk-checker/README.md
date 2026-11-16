# Crypto Token Risk Checker (Solana + Base)

Rug check and token scanner for **Solana** and **Base**. Paste a mint or ERC-20 address and get a **SAFE / CAUTION / DANGER** verdict with plain-language reasons: mint and freeze authority, LP lock or burn, holder and sniper concentration, and a sell-route or honeypot test.

Powered by the [Trading Signals Toolkit](https://signals.incomefather.com) token-risk API. Informational only, not financial advice and not a security audit.

## What you get

For every token in the input:

- **Verdict**: SAFE, CAUTION or DANGER (mapped from the API's safe / caution / avoid rating), plus an A–F grade, a 0–100 score and the reasons behind it.
- **Solana (SPL and Token-2022)**: mint authority, freeze authority, Token-2022 extensions (transfer fees, hooks, permanent delegate), liquidity and LP lock/burn, a live sell-route test, top holders, creator holdings, launch-window snipers and bundled wallets.
- **Base (ERC-20)**: buy-then-sell honeypot simulation with taxes, owner / mint / proxy / blacklist / pause flags, liquidity across DEXes and LP lock, top-10 holders, snipers and same-block bundles.

Optional add-ons, billed only when they succeed:

- **Whale flow** — large DEX buys vs sells, net flow, accumulation or distribution, top wallets.
- **Pre-trade pack** — one GO / CAUTION / STOP decision that combines the token verdict with an OFAC screen of the token's authorities and, if you provide a wallet, that wallet's USDC pay-readiness.

Batch a watchlist in one run. Failed or unrecognized addresses are returned with an error and are **not charged**.

## Input

| Field | Required | Description |
|---|---|---|
| `tokens` | yes | List of Solana mints (base58) and/or Base `0x…` addresses. Chain is auto-detected. |
| `includeWhaleFlow` | no | Also fetch whale flow (`false` by default). |
| `includePreTradePack` | no | Also fetch the pre-trade pack (`false` by default). |
| `hours` | no | Whale-flow lookback, 1–24 hours (default 24). |
| `minUsd` | no | Optional minimum whale trade size in USD. |
| `wallet` | no | Optional counterparty wallet for the pre-trade pack. |
| `amount` | no | USDC the wallet should be able to pay (default `1`). |

Example input:

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

The prefill examples are BONK on Solana and USDC on Base. A centralized stablecoin such as USDC can legitimately keep mint or freeze authority; read the reasons, not just the flags.

## Output

One dataset item per token, including `verdict`, `grade`, `score`, `reasons`, and the full API body in `tokenVerdict`. When requested, `whaleFlow` and `preTradePack` are included too.

## Pricing

Pay-per-event. You are charged only for successful results, not for invalid addresses or failed lookups.

| Event | When | Price |
|---|---|---|
| `token-checked` (primary) | A verdict is returned | **$0.02** per token ($20 / 1,000) |
| `whale-flow` | Optional add-on succeeds | $0.02 per token |
| `pre-trade-pack` | Optional add-on succeeds | $0.015 per token |

A verdict-only run of 50 tokens costs $1.00. Adding whale flow and the pre-trade pack to each of those 50 tokens costs $2.75.

**Why this price:** On Apify Store, comparable crypto rug-check Actors (as of 16 Nov 2026) range from about **$0.002 to $0.02 per token**. The cheapest scanners are $2–$5 per 1,000 results. Deeper due-diligence and honeypot Actors charge $15–$20 per 1,000 ($0.015–$0.02). This Actor is priced at the premium end of that range ($0.02) because it returns an opinionated SAFE / CAUTION / DANGER verdict with holders, snipers, LP lock and a sell-route or honeypot test on both Solana and Base — in line with Token Honeypot Detector at $0.02 and Token Risk Scanner at $0.015, and well under a typical monthly token-scanner subscription when you only check a handful of tokens.

Apify keeps 20% of event revenue and deducts platform compute from the creator payout. This Actor is a small Node.js job (default 512 MB) that only makes a few HTTP calls, so compute cost per token is a fraction of a cent.

## How to run

In [Apify Console](https://console.apify.com), open the Actor, paste one or more token addresses, and click Start. Results appear in the Output dataset.

Via the Apify API (replace `tradingsignals` with the published Actor owner if different):

```bash
curl "https://api.apify.com/v2/acts/tradingsignals~crypto-token-risk-checker/runs?token=$APIFY_TOKEN" \
  -H 'content-type: application/json' \
  -d '{"tokens":["DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263"]}'
```

## Source

This Actor lives in the [Trading Signals examples](https://github.com/gdietsch/trading-signals-examples) repo, folder `apify/crypto-token-risk-checker`. The underlying API is documented at [signals.incomefather.com](https://signals.incomefather.com) and [llms.txt](https://signals.incomefather.com/llms.txt).

To run the Actor logic locally against the live API (needs a toolkit API key in `TSK_API_KEY`):

```bash
cd apify/crypto-token-risk-checker
npm install
TSK_API_KEY=tsk_... npm test
```

## Keywords

crypto rug check, token scanner, Solana token safety, Base honeypot checker, mint authority, LP lock, whale flow, memecoin scanner, Token-2022, SPL token audit, pre-trade token check

## Disclaimer

Automated, heuristic checks. Not financial advice, not a guarantee, and not a substitute for your own research or a professional audit.
