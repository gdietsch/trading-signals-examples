/**
 * Crypto Token Risk Checker — Apify Actor.
 *
 * Calls the Trading Signals Toolkit API (https://signals.incomefather.com)
 * with a Team API key (TSK_API_KEY) so requests skip x402 and are billed
 * on Apify pay-per-event instead.
 *
 * Events charged only after a successful response:
 *   token-checked   $0.02   SAFE / CAUTION / DANGER verdict
 *   whale-flow      $0.02   optional large DEX flow
 *   pre-trade-pack  $0.015  optional GO / CAUTION / STOP pack
 */
export const API_BASE = (process.env.TSK_API_BASE || "https://signals.incomefather.com").replace(/\/$/, "");
export const USER_AGENT = "TradingSignals-Apify/0.1";

const RATING_TO_VERDICT = { safe: "SAFE", caution: "CAUTION", avoid: "DANGER" };

const BASE_RE = /^0x[a-fA-F0-9]{40}$/;
// Solana addresses are base58, 32-44 chars, no 0/O/I/l.
const SOLANA_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

export function detectChain(address) {
  const a = String(address || "").trim();
  if (BASE_RE.test(a)) return "base";
  if (SOLANA_RE.test(a)) return "solana";
  return null;
}

export function normalizeTokens(input = {}) {
  const raw = Array.isArray(input.tokens) ? input.tokens : [];
  const out = [];
  const seen = new Set();
  for (const item of raw) {
    const token = typeof item === "string"
      ? item.trim()
      : String(item?.address || item?.token || item?.mint || "").trim();
    if (!token) continue;
    const key = token.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    const hinted = String(item?.chain || "").toLowerCase();
    const chain = hinted === "base" || hinted === "solana" ? hinted : detectChain(token);
    out.push({ token, chain });
  }
  return out;
}

export function mapVerdict(body) {
  const v = body?.verdict || body || {};
  const rating = String(v.rating || "").toLowerCase();
  return {
    verdict: RATING_TO_VERDICT[rating] || null,
    rating: v.rating || null,
    grade: v.grade || null,
    score: typeof v.score === "number" ? v.score : null,
    reasons: Array.isArray(v.reasons) ? v.reasons : [],
  };
}

export async function apiGet(pathWithQuery, apiKey, fetchImpl = fetch) {
  const url = pathWithQuery.startsWith("http") ? pathWithQuery : `${API_BASE}${pathWithQuery}`;
  const res = await fetchImpl(url, {
    method: "GET",
    headers: {
      "x-api-key": apiKey,
      accept: "application/json",
      "user-agent": USER_AGENT,
    },
  });
  const text = await res.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = { error: "invalid_json", raw: text.slice(0, 300) }; }
  return { status: res.status, body, ok: res.status >= 200 && res.status < 300 };
}

function errorMessage(status, body) {
  if (body && typeof body === "object") {
    return body.message || body.error || `HTTP ${status}`;
  }
  return `HTTP ${status}`;
}

function qs(params) {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v == null || v === "") continue;
    u.set(k, String(v));
  }
  const s = u.toString();
  return s ? `?${s}` : "";
}

export async function checkToken(item, input, apiKey, fetchImpl = fetch) {
  const row = {
    token: item.token,
    chain: item.chain,
    verdict: null,
    rating: null,
    grade: null,
    score: null,
    reasons: [],
    ok: false,
    error: null,
    status: null,
    whaleFlow: null,
    preTradePack: null,
    tokenVerdict: null,
    charged: [],
  };

  if (!item.chain) {
    row.error = "Unrecognized address. Expected a Base 0x… ERC-20 address or a Solana mint (base58).";
    return row;
  }

  const verdictPath = item.chain === "base"
    ? `/base/token-verdict${qs({ address: item.token })}`
    : `/solana/token-verdict${qs({ mint: item.token })}`;

  const verdictRes = await apiGet(verdictPath, apiKey, fetchImpl);
  row.status = verdictRes.status;
  if (!verdictRes.ok) {
    row.error = errorMessage(verdictRes.status, verdictRes.body);
    return row;
  }

  const mapped = mapVerdict(verdictRes.body);
  Object.assign(row, mapped);
  row.tokenVerdict = verdictRes.body;
  row.ok = Boolean(row.verdict);
  if (!row.ok) {
    row.error = "API returned no rating";
    return row;
  }
  row.charged.push("token-checked");

  if (input.includeWhaleFlow) {
    const whaleRes = await apiGet(`/crypto/whale-flow${qs({
      token: item.token,
      chain: item.chain,
      hours: input.hours || 24,
      minUsd: input.minUsd,
    })}`, apiKey, fetchImpl);
    if (whaleRes.ok) {
      row.whaleFlow = whaleRes.body;
      row.charged.push("whale-flow");
    } else {
      row.whaleFlow = { error: errorMessage(whaleRes.status, whaleRes.body), status: whaleRes.status };
    }
  }

  if (input.includePreTradePack) {
    const packRes = await apiGet(`/bundle/token-pre-trade${qs({
      token: item.token,
      chain: item.chain,
      wallet: input.wallet,
      amount: input.amount || "1",
    })}`, apiKey, fetchImpl);
    if (packRes.ok) {
      row.preTradePack = packRes.body;
      row.charged.push("pre-trade-pack");
    } else {
      row.preTradePack = { error: errorMessage(packRes.status, packRes.body), status: packRes.status };
    }
  }

  return row;
}

