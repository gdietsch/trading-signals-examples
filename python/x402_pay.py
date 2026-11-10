"""Pay-per-call over x402 from Python: no account, no API key.

The wallet pays USDC on Base for each request. Use a DEDICATED low-balance wallet
(a few dollars of USDC on Base; no ETH needed, the facilitator pays gas).

    pip install -r requirements.txt
    X402_PRIVATE_KEY=0x... python x402_pay.py
"""
import asyncio
import os
import sys

import httpx
from eth_account import Account
from x402 import x402Client, max_amount
from x402.http.clients import x402_httpx_transport
from x402.mechanisms.evm.exact.register import register_exact_evm_client

BASE = os.environ.get("TRADING_SIGNALS_BASE_URL", "https://signals.incomefather.com")
MAX_USD = float(os.environ.get("MAX_USD_PER_CALL", "0.10"))


async def main() -> None:
    pk = os.environ.get("X402_PRIVATE_KEY")
    if not pk:
        sys.exit("Set X402_PRIVATE_KEY to a dedicated low-balance Base wallet key")
    client = x402Client()
    # Only USDC "exact" on Base mainnet, never above MAX_USD_PER_CALL (USDC has 6 decimals).
    register_exact_evm_client(
        client,
        Account.from_key(pk),
        networks="eip155:8453",
        policies=[max_amount(int(MAX_USD * 1_000_000))],
    )
    async with httpx.AsyncClient(transport=x402_httpx_transport(client), timeout=60) as http:
        r = await http.get(f"{BASE}/sec/insider-clusters?days=7&minBuyers=3")  # $0.02
        print("status", r.status_code)
        print("settlement header:", r.headers.get("payment-response"))
        print(r.text[:1500])


asyncio.run(main())
