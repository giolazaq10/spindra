import test from "node:test";
import assert from "node:assert/strict";
import {
  newCashRound,
  nextCashRound,
  publicCash,
} from "../src/lib/cashEngine.ts";
import { originals } from "../src/lib/catalog.ts";
import { modelEvaluate } from "../src/lib/slotModels.ts";
import { allowedActions } from "../src/lib/blackjack.ts";
import { legalPoker } from "../src/lib/holdem.ts";
let seed = 47;
const rng = (n) => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed % n;
};
test("All catalog cash slots use the published math and ignore client payout/result claims", () => {
  for (const g of originals.filter((g) => g.kind === "slots")) {
    const s = newCashRound(
      g.slug,
      { bet: 200, returned_minor: 999999999, grid: [[0]] },
      rng,
    );
    const data = s.data;
    assert.equal(s.phase, "settled");
    if (g.slot.premium)
      assert.equal(
        data.rate,
        data.frames.reduce((sum, f) => sum + f.rate, 0),
      );
    else assert.deepEqual(data.wins, modelEvaluate(data.grid, g.slot));
    assert.equal(s.returned_minor, 2 * data.rate);
    assert.ok(Number.isSafeInteger(s.returned_minor));
  }
  assert.throws(() => newCashRound("solar-vault", { bet: -1 }, rng));
  assert.throws(() => newCashRound("unknown", { bet: 100 }, rng));
  assert.throws(() => newCashRound("solar-vault", { bet: 101 }, rng));
});
test("Cash blackjack keeps undealt cards and dealer hole card private and settles all legal actions on the server", () => {
  for (let i = 0; i < 100; i++) {
    let s = newCashRound(
      "noir-blackjack",
      {
        bet: 100,
        bets: [
          { main: 100, three: 100, pair: 100 },
          ...Array.from({ length: 4 }, () => ({ main: 0, three: 0, pair: 0 })),
        ],
      },
      rng,
    );
    let count = 0;
    while (s.phase === "open") {
      const view = publicCash(s);
      assert.equal("shoe" in view.table, false);
      if (s.data.phase !== "done") assert.equal(view.table.dealer[1], null);
      const action =
        s.data.phase === "insurance"
          ? { action: "insurance", seats: [] }
          : {
              action:
                allowedActions(s.data).hit && count % 2 === 0 ? "hit" : "stand",
            };
      s = nextCashRound(s, action, rng);
      if (count++ > 30) throw Error("Round stuck");
    }
    assert.ok(Number.isSafeInteger(s.returned_minor));
    assert.throws(() => nextCashRound(s, { action: "hit" }, rng), /not open/);
  }
});
test("Cash hold’em hides opponents and deck, preserves chips and permits only actual legal actions", () => {
  for (let i = 0; i < 50; i++) {
    let s = newCashRound("royal-draw", { bet: 1000, dealer: i % 3 }, rng);
    let n = 0;
    while (s.phase === "open") {
      const view = publicCash(s);
      assert.equal("shoe" in view.table, false);
      assert.equal("ranks" in view.table, false);
      assert.equal(view.table.players[0].hole.filter(Boolean).length, 2);
      assert.deepEqual(view.table.players[1].hole, [null, null]);
      const legal = legalPoker(s.data);
      assert.equal(legal.actor, 0);
      s = nextCashRound(s, { action: legal.toCall ? "call" : "check" }, rng);
      if (n++ > 30) throw Error("Poker stuck");
    }
    assert.equal(
      s.data.players.reduce((v, p) => v + p.stack, 0),
      3000,
    );
    assert.equal(s.returned_minor, s.data.players[0].stack);
  }
});
test("Abandoning a persisted hand settles blackjack and returns only uncommitted poker chips", () => {
  let s = newCashRound(
    "noir-blackjack",
    {
      bet: 100,
      bets: [
        { main: 100, three: 0, pair: 0 },
        ...Array.from({ length: 4 }, () => ({ main: 0, three: 0, pair: 0 })),
      ],
    },
    rng,
  );
  if (s.phase === "open") {
    s = nextCashRound(s, { action: "abandon" }, rng);
    assert.equal(s.phase, "settled");
  }
  const p = newCashRound("royal-draw", { bet: 1000 }, rng);
  if (p.phase === "open") {
    const left = p.data.players[0].stack;
    const done = nextCashRound(p, { action: "abandon" }, rng);
    assert.equal(done.returned_minor, left);
    assert.equal(done.phase, "settled");
  }
});
