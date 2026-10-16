import test from "node:test";
import assert from "node:assert/strict";
import { supabase } from "../src/lib/supabase.ts";
import { cashApi } from "../src/lib/walletApi.ts";
import {
  cashFeedSnapshot,
  subscribeCashFeed,
} from "../src/lib/cashSessionFeed.ts";
test("Simultaneous cash status reads share one authenticated request and are not retained after completion", async (t) => {
  let calls = 0,
    resolve;
  const reply = { enabled: true, balance_minor: 100, active: null };
  t.mock.method(supabase.auth, "getSession", async () => ({
    data: { session: { access_token: "status-test" } },
    error: null,
  }));
  t.mock.method(
    Object.getPrototypeOf(supabase.functions),
    "invoke",
    async () => {
      calls++;
      return await new Promise((r) => (resolve = r));
    },
  );
  const a = cashApi("status"),
    b = cashApi("status");
  await Promise.resolve();
  assert.equal(calls, 1);
  resolve({ data: reply, error: null });
  assert.deepEqual(await a, reply);
  assert.deepEqual(await b, reply);
  const c = cashApi("status");
  await Promise.resolve();
  assert.equal(calls, 2);
  resolve({ data: reply, error: null });
  await c;
});
test("Wager commands are never coalesced and confirmed rounds publish to their session owner immediately", async (t) => {
  const owner = crypto.randomUUID();
  const stop = subscribeCashFeed(owner, () => {
    throw new Error("View failed");
  });
  let calls = 0;
  t.mock.method(supabase.auth, "getSession", async () => ({
    data: { session: { access_token: "commands-test", user: { id: owner } } },
    error: null,
  }));
  t.mock.method(
    Object.getPrototypeOf(supabase.functions),
    "invoke",
    async () => ({
      data: {
        id: "round-" + ++calls,
        game: "prism-dice",
        revision: 0,
        state: "settled",
        balance_minor: 100,
        view: { stake_minor: 20, returned_minor: 40 },
      },
      error: null,
    }),
  );
  await Promise.all([
    cashApi("start", { request_key: "first" }),
    cashApi("start", { request_key: "second" }),
  ]);
  stop();
  assert.equal(calls, 2);
  assert.equal(cashFeedSnapshot(owner).rounds.length, 2);
  assert.equal(cashFeedSnapshot(owner).rounds[0].returned_minor, 40);
  assert.equal(cashFeedSnapshot("different-owner").rounds.length, 0);
});
