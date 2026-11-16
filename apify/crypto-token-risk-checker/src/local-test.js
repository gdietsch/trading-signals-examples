/**
 * Live-API smoke test for the Actor helpers (no Apify Cloud).
 * Reads TSK_API_KEY from the environment. Never prints the key.
 *
 *   TSK_API_KEY=tsk_... npm test
 */
import assert from "node:assert/strict";
import {
  detectChain,
  normalizeTokens,
  mapVerdict,
  apiGet,
  checkToken,
  USER_AGENT,
  API_BASE,
} from "./lib.js";

const BONK = "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263";
const BASE_USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

assert.equal(detectChain(BASE_USDC), "base");
assert.equal(detectChain(BONK), "solana");
assert.equal(detectChain("not-an-address"), null);

const tokens = normalizeTokens({ tokens: [BONK, BASE_USDC, BONK, ""] });
assert.equal(tokens.length, 2);
assert.equal(tokens[0].chain, "solana");
assert.equal(tokens[1].chain, "base");

assert.equal(mapVerdict({ verdict: { rating: "avoid", grade: "F", score: 10, reasons: ["x"] } }).verdict, "DANGER");
assert.equal(mapVerdict({ verdict: { rating: "safe", grade: "A", score: 95, reasons: [] } }).verdict, "SAFE");
assert.equal(mapVerdict({ verdict: { rating: "caution", grade: "C", score: 60, reasons: ["y"] } }).verdict, "CAUTION");

const apiKey = String(process.env.TSK_API_KEY || "").trim();
if (!apiKey) {
  console.log("helpers ok; skip live API (TSK_API_KEY not set)");
  process.exit(0);
}
if (!apiKey.startsWith("tsk_")) {
  console.error("TSK_API_KEY does not look like a toolkit key");
  process.exit(1);
}

console.log(`live API ${API_BASE}  ua=${USER_AGENT}`);

// 1) Key must skip x402 (no 401/402) on a cheap paid route first? Token verdict is the real test.
const sol = await checkToken({ token: BONK, chain: "solana" }, {}, apiKey);
assert.ok(sol.ok, `BONK verdict failed: ${sol.status} ${sol.error}`);
assert.ok(["SAFE", "CAUTION", "DANGER"].includes(sol.verdict), `unexpected verdict ${sol.verdict}`);
assert.ok(Array.isArray(sol.reasons), "reasons missing");
console.log(`solana BONK → ${sol.verdict} grade=${sol.grade} score=${sol.score} reasons=${sol.reasons.length}`);

const base = await checkToken({ token: BASE_USDC, chain: "base" }, {}, apiKey);
assert.ok(base.ok, `Base USDC verdict failed: ${base.status} ${base.error}`);
assert.ok(["SAFE", "CAUTION", "DANGER"].includes(base.verdict), `unexpected verdict ${base.verdict}`);
console.log(`base USDC → ${base.verdict} grade=${base.grade} score=${base.score} reasons=${base.reasons.length}`);

// 2) One add-on call (whale flow on BONK) to confirm the optional route works with the key.
const withWhale = await checkToken(
  { token: BONK, chain: "solana" },
  { includeWhaleFlow: true, hours: 24 },
  apiKey,
);
assert.ok(withWhale.ok, `BONK+whale verdict failed: ${withWhale.status} ${withWhale.error}`);
assert.ok(withWhale.whaleFlow && !withWhale.whaleFlow.error, `whale flow failed: ${JSON.stringify(withWhale.whaleFlow)?.slice(0, 200)}`);
const signal = withWhale.whaleFlow?.summary?.signal || withWhale.whaleFlow?.signal || "(no signal field)";
console.log(`solana BONK whale-flow ok  signal=${signal}`);

// 3) Invalid address is not billed (ok=false, no charged events).
const bad = await checkToken({ token: "0x123", chain: null }, {}, apiKey);
assert.equal(bad.ok, false);
assert.ok(bad.error);
assert.deepEqual(bad.charged, []);
console.log("invalid address correctly rejected, not charged");

console.log("live API smoke test passed");
