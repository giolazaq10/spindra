import test from "node:test";
import assert from "node:assert/strict";
import { supabase } from "../src/lib/supabase.ts";
import { walletApi } from "../src/lib/walletApi.ts";
test("Wallet API uses the current user token and cannot invoke without a session", async (t) => {
  let calls = 0;
  t.mock.method(supabase.auth, "getSession", async () => ({
    data: { session: null },
    error: null,
  }));
  t.mock.method(
    Object.getPrototypeOf(supabase.functions),
    "invoke",
    async () => {
      calls++;
      return { data: { ok: true }, error: null };
    },
  );
  await assert.rejects(
    walletApi("deposit_address", { coin: "btc" }),
    /Sign in/,
  );
  assert.equal(calls, 0);
  t.mock.method(supabase.auth, "getSession", async () => ({
    data: { session: { access_token: "test-user-token" } },
    error: null,
  }));
  t.mock.method(
    Object.getPrototypeOf(supabase.functions),
    "invoke",
    async (name, options) => {
      calls++;
      assert.equal(name, "wallet-api");
      assert.equal(options.headers.Authorization, "Bearer test-user-token");
      assert.equal(options.body.action, "deposit_address");
      assert.equal(options.body.coin, "btc");
      assert.equal(options.body.userId, undefined);
      return { data: { address: "test-route" }, error: null };
    },
  );
  assert.equal(
    (await walletApi("deposit_address", { coin: "btc" })).address,
    "test-route",
  );
  assert.equal(calls, 1);
});
test("Wallet API preserves server MFA and payment-pause errors", async (t) => {
  t.mock.method(supabase.auth, "getSession", async () => ({
    data: { session: { access_token: "test-user-token" } },
    error: null,
  }));
  t.mock.method(
    Object.getPrototypeOf(supabase.functions),
    "invoke",
    async () => ({
      data: null,
      error: {
        message: "Non-2xx response",
        context: { json: async () => ({ error: "MFA_REQUIRED" }) },
      },
    }),
  );
  await assert.rejects(walletApi("withdrawal_request"), /MFA_REQUIRED/);
  t.mock.method(
    Object.getPrototypeOf(supabase.functions),
    "invoke",
    async () => ({ data: { error: "Deposits paused" }, error: null }),
  );
  await assert.rejects(walletApi("deposit_address"), /Deposits paused/);
});
