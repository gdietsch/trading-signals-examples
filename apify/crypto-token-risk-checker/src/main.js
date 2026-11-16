/**
 * Apify Actor entry: Crypto Token Risk Checker.
 */
import { Actor } from "apify";
import { normalizeTokens, checkToken } from "./lib.js";

async function maybeCharge(eventName) {
  if (typeof Actor.charge !== "function") return;
  try {
    const result = await Actor.charge({ eventName });
    if (result?.eventChargeLimitReached) return "limit";
  } catch (err) {
    // Local runs have no pricing config; don't fail the check.
    const msg = String(err?.message || err);
    if (/pay.?per.?event|pricing|not monetized|unknown event/i.test(msg)) return;
    throw err;
  }
}

await Actor.init();

try {
  const apiKey = String(process.env.TSK_API_KEY || "").trim();
  if (!apiKey) {
    throw new Error("TSK_API_KEY is not set. Add it as a secret environment variable on this Actor.");
  }

  const input = (await Actor.getInput()) || {};
  const tokens = normalizeTokens(input);
  if (!tokens.length) {
    throw new Error("Input is missing tokens. Provide at least one Solana mint or Base token address.");
  }

  for (const item of tokens) {
    const row = await checkToken(item, input, apiKey);
    const charged = row.charged || [];
    delete row.charged;

    // Charge per successful unit, then push. Failed tokens are not billed.
    let hitLimit = false;
    for (const eventName of charged) {
      const stop = await maybeCharge(eventName);
      if (stop === "limit") {
        hitLimit = true;
        break;
      }
    }
    await Actor.pushData(row);
    const label = row.ok ? row.verdict : `ERROR: ${row.error}`;
    console.log(`${item.chain || "unknown"} ${item.token} → ${label}`);
    if (hitLimit) {
      console.log("Pay-per-event charge limit reached; stopping.");
      break;
    }
  }
} finally {
  await Actor.exit();
}
