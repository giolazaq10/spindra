import test from "node:test";
import assert from "node:assert/strict";
import { settlementCurrency } from "../supabase/functions/_shared/payment-rules.ts";
test("Custody settlements accept primary or merchant-approved currency and preserve the actual valuation currency", () => {
  const merchant = new Set(["btc", "eth", "ltc"]);
  assert.equal(settlementCurrency("trx", "trx", merchant), "trx");
  assert.equal(settlementCurrency("ETH", "trx", merchant), "eth");
  assert.equal(settlementCurrency("btc", "trx", merchant), "btc");
  for (const value of [
    "unexpected",
    undefined,
    "usd",
    "eth;drop table wallets",
    "",
  ])
    assert.throws(
      () => settlementCurrency(value, "trx", merchant),
      /Unexpected/,
    );
});
