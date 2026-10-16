import test from "node:test";
import assert from "node:assert/strict";
import {
  merchantCurrencyCodes,
  catalogRows,
} from "../supabase/functions/_shared/asset-catalog.ts";
const btc = {
  code: "btc",
  symbol: "BTC",
  name: "Bitcoin",
  network: "Bitcoin",
  memo_required: false,
  deposits_enabled: true,
  withdrawals_enabled: true,
};
const eth = { ...btc, code: "eth", symbol: "ETH", network: "Ethereum" };
test("Merchant coin parser accepts selectedCurrencies, SDK legacy envelopes and uppercase codes", () => {
  for (const input of [
    { selectedCurrencies: ["BTC", "eth"] },
    { currencies: ["btc", "ETH"] },
    [{ code: "BTC" }, { currency: "eth" }],
  ])
    assert.deepEqual([...merchantCurrencyCodes(input)], ["btc", "eth"]);
  assert.equal(merchantCurrencyCodes({ selectedCurrencies: [] }).size, 0);
  assert.throws(
    () => merchantCurrencyCodes({ error: "unauthorized" }),
    /Unrecognized/,
  );
});
test("All configured coins remain visible while deposits are paused", () => {
  const r = catalogRows(
    [btc, eth],
    [btc],
    { deposits_enabled: false, withdrawals_enabled: false },
    { deposit: true, withdrawal: true },
  );
  assert.equal(r.length, 2);
  assert.equal(r[0].deposit_status, "Deposits paused");
  assert.equal(r[0].deposit_available, false);
  assert.equal(r[1].deposit_available, false);
});
test("Provider failures and missing secrets never turn catalog entries into enabled payment routes", () => {
  const settings = { deposits_enabled: true, withdrawals_enabled: true };
  let rows = catalogRows([btc], null, settings, {
    deposit: true,
    withdrawal: true,
  });
  assert.equal(rows[0].deposit_status, "Provider availability unavailable");
  assert.equal(rows[0].deposit_available, false);
  rows = catalogRows([btc], [btc], settings, {
    deposit: false,
    withdrawal: false,
  });
  assert.equal(rows[0].deposit_status, "Payment setup incomplete");
  assert.equal(rows[0].withdrawal_available, false);
});
test("Only provider-matched enabled networks permit deposits; provider memo requirements are retained", () => {
  const settings = { deposits_enabled: true, withdrawals_enabled: true };
  const r = catalogRows(
    [btc, eth],
    [{ ...btc, memo_required: true }],
    settings,
    { deposit: true, withdrawal: true },
  );
  assert.equal(r[0].deposit_available, true);
  assert.equal(r[0].memo_required, true);
  assert.equal(r[1].deposit_available, false);
  assert.equal(r[1].deposit_status, "Not enabled with payment provider");
  const paused = catalogRows(
    [{ ...btc, deposits_enabled: false }],
    [btc],
    settings,
    { deposit: true, withdrawal: true },
  );
  assert.equal(paused[0].deposit_status, "Network paused");
  assert.equal(paused[0].withdrawal_available, true);
});
