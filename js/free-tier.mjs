// Free tier quickstart: no wallet, no card. 100 calls/month.
// 1) Get a key:  curl -X POST https://signals.incomefather.com/billing/free -H 'content-type: application/json' -d '{"email":"you@example.com"}'
// 2) Run:        TRADING_SIGNALS_API_KEY=tsk_... node free-tier.mjs
const BASE = process.env.TRADING_SIGNALS_BASE_URL || "https://signals.incomefather.com";
const KEY = process.env.TRADING_SIGNALS_API_KEY;
if (!KEY) {
  console.error("Set TRADING_SIGNALS_API_KEY (free key from POST /billing/free)");
  process.exit(1);
}

async function call(path) {
  const res = await fetch(BASE + path, { headers: { "x-api-key": KEY } });
  const body = await res.json();
  if (!res.ok) throw new Error(`${res.status} ${JSON.stringify(body)}`);
  return body;
}

// Is it safe to trade ES in the next 30 minutes? Next high-impact US release?
const gate = await call("/futures/event-gate?window=30");
console.log("safeToTrade:", gate.verdict.safeToTrade, "-", gate.verdict.reasons.join("; ") || "no blockers");
console.log("next high-impact event:", gate.nextHighImpactEvent?.title, "at", gate.nextHighImpactEvent?.timeEt);

// Tickers where 3+ different insiders bought on the open market in the last 7 days (SEC Form 4)
const clusters = await call("/sec/insider-clusters?days=7&minBuyers=3");
console.log(JSON.stringify(clusters, null, 2).slice(0, 800));
