// Pay-per-call with x402: no account, no API key. The wallet pays USDC on Base per request.
// Use a DEDICATED low-balance wallet (a few dollars of USDC on Base; no ETH needed, the facilitator pays gas).
//   npm install
//   X402_PRIVATE_KEY=0x... node x402-fetch.mjs
import { wrapFetchWithPaymentFromConfig, decodePaymentResponseHeader } from "@x402/fetch";
import { ExactEvmScheme } from "@x402/evm/exact/client";
import { privateKeyToAccount } from "viem/accounts";

const BASE = process.env.TRADING_SIGNALS_BASE_URL || "https://signals.incomefather.com";
const MAX_USD = Number(process.env.MAX_USD_PER_CALL || "0.10");
const pk = process.env.X402_PRIVATE_KEY;
if (!pk) {
  console.error("Set X402_PRIVATE_KEY to a dedicated low-balance Base wallet key");
  process.exit(1);
}
const account = privateKeyToAccount(pk);
const maxUnits = BigInt(Math.round(MAX_USD * 1e6)); // USDC has 6 decimals

const fetchWithPay = wrapFetchWithPaymentFromConfig(fetch, {
  schemes: [{ network: "eip155:8453", client: new ExactEvmScheme(account) }],
  // Spend guard: only USDC "exact" payments on Base, never above MAX_USD_PER_CALL.
  policies: [(_version, reqs) => reqs.filter((r) => r.network === "eip155:8453" && BigInt(r.amount) <= maxUnits)],
});

const url = `${BASE}/futures/event-gate?window=30`; // $0.01
const res = await fetchWithPay(url);
const receipt = res.headers.get("payment-response");
console.log("status", res.status);
if (receipt) console.log("settlement", decodePaymentResponseHeader(receipt));
console.log(await res.text());

// Other routes (same pattern):
//   /ai/trade-brief?symbol=ES&window=30          $0.08  AI-written structured trade brief
//   /bundle/pre-trade-check?symbol=NQ&ticker=NVDA $0.10 GO / CAUTION / NO_GO
//   /futures/session-brief?symbol=ES&window=30   $0.03
//   /futures/event-study?event=CPI&symbol=ES     $0.02
//   /sec/insider-buys?ticker=AAPL&days=30        $0.01
//   /base/token-verdict?address=0x...            $0.02
