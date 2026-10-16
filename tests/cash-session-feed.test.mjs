import test from "node:test";
import assert from "node:assert/strict";
import {
  recordCashSession,
  cashFeedSnapshot,
  subscribeCashFeed,
  loadCashFeed,
} from "../src/lib/cashSessionFeed.ts";
const round = (id, revision = 0, state = "settled", returned = 40) => ({
  id,
  revision,
  game: "prism-dice",
  state,
  view: { stake_minor: 20, returned_minor: returned },
});
test("Confirmed sessions publish immediately, stay owner-scoped, and ignore stale round revisions", () => {
  const owner = crypto.randomUUID(),
    other = crypto.randomUUID();
  let changes = 0;
  const stop = subscribeCashFeed(owner, () => changes++);
  recordCashSession(owner, round("r", 2));
  assert.equal(changes, 1);
  assert.equal(cashFeedSnapshot(owner).loading, false);
  assert.equal(cashFeedSnapshot(owner).rounds[0].returned_minor, 40);
  assert.equal(cashFeedSnapshot(other).rounds.length, 0);
  recordCashSession(owner, round("r", 1, "open", 0));
  assert.equal(changes, 1);
  assert.equal(cashFeedSnapshot(owner).rounds[0].state, "settled");
  stop();
});
test("Shared history loads once and an older fetch cannot overwrite a newly settled session", async () => {
  const owner = crypto.randomUUID();
  let resolve,
    calls = 0;
  const fetcher = () => {
    calls++;
    return new Promise((r) => (resolve = r));
  };
  const a = loadCashFeed(owner, fetcher),
    b = loadCashFeed(owner, fetcher);
  assert.equal(a, b);
  await Promise.resolve();
  assert.equal(calls, 1);
  recordCashSession(owner, round("live", 2));
  resolve({
    rounds: [
      {
        id: "live",
        game: "prism-dice",
        state: "open",
        stake_minor: 20,
        returned_minor: 0,
        created_at: "2026-01-01",
      },
    ],
  });
  await a;
  assert.equal(cashFeedSnapshot(owner).rounds[0].state, "settled");
  assert.equal(cashFeedSnapshot(owner).rounds[0].returned_minor, 40);
});
test("History retains only 50 sessions and replays do not invent a new recent round", () => {
  const owner = crypto.randomUUID();
  for (let i = 0; i < 80; i++) recordCashSession(owner, round("r" + i));
  assert.equal(cashFeedSnapshot(owner).rounds.length, 50);
  recordCashSession(owner, { ...round("unknown-old"), replayed: true });
  assert.equal(
    cashFeedSnapshot(owner).rounds.some((r) => r.id === "unknown-old"),
    false,
  );
});
