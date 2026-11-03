import test from "node:test";
import assert from "node:assert/strict";
import { blackjackBreakdown } from "../src/lib/blackjackBreakdown.ts";
import {
  newCashRound,
  nextCashRound,
  publicCash,
} from "../src/lib/cashEngine.ts";
const card = (rank, suit = 1) => ({ rank, suit });
const fixture = (
  hands,
  dealer,
  bets,
  sideResults,
  insurance,
  stake,
  returned,
) => ({
  id: "round",
  state: "settled",
  view: {
    stake_minor: stake,
    returned_minor: returned,
    table: { hands, dealer, bets, sideResults, insurance },
  },
});
test("A winning side bet does not turn a losing main hand into a main win", () => {
  const r = fixture(
    [{ id: "one", seat: 0, bet: 100, cards: [card(10), card(8)] }],
    [card(10), card(10)],
    [{ main: 100, three: 20, pair: 0 }],
    [{ three: { returned: 120 }, pair: { returned: 0 } }],
    [],
    120,
    120,
  );
  const b = blackjackBreakdown(r);
  assert.equal(b.reconciled, true);
  assert.equal(b.hands[0].outcome, "Lost");
  assert.equal(b.items[0].returned, 0);
  assert.equal(b.items[0].net, -100);
  assert.equal(b.items[1].returned, 120);
  assert.equal(b.items[1].net, 100);
});
test("Insurance return is separate from a pushed natural, and mismatch data is rejected", () => {
  const r = fixture(
    [{ id: "one", seat: 0, bet: 100, cards: [card(14), card(10)] }],
    [card(14), card(10)],
    [{ main: 100, three: 0, pair: 0 }],
    [],
    [50],
    150,
    250,
  );
  const b = blackjackBreakdown(r);
  assert.equal(b.reconciled, true);
  assert.equal(b.items[0].returned, 100);
  assert.equal(b.items[1].key, "insurance");
  assert.equal(b.items[1].returned, 150);
  r.view.returned_minor++;
  assert.equal(blackjackBreakdown(r).reconciled, false);
  r.view.table.dealer[1] = null;
  assert.equal(blackjackBreakdown(r), null);
});
test("Main and side breakdowns reconcile with 300 actual server-engine rounds including extra actions", () => {
  let seed = 7951;
  const rng = (max) => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed % max;
  };
  const bets = Array.from({ length: 5 }, (_, i) => ({
    main: i < 2 ? 100 : 0,
    three: i < 2 ? 20 : 0,
    pair: i < 2 ? 20 : 0,
  }));
  const seen = new Set();
  for (let i = 0; i < 300; i++) {
    let state = newCashRound("noir-blackjack", { bet: 100, bets }, rng),
      guard = 0;
    while (state.phase === "open") {
      assert.ok(guard++ < 100);
      const view = publicCash(state);
      let command;
      if (view.table.phase === "insurance")
        command = { action: "insurance", seats: i % 2 ? [0, 1] : [] };
      else {
        const actions = Object.entries(view.allowed)
          .filter(([, legal]) => legal)
          .map(([a]) => a);
        command = { action: actions[rng(actions.length)] };
      }
      seen.add(command.action);
      state = nextCashRound(state, command, rng);
    }
    const b = blackjackBreakdown({
      id: "round-" + i,
      state: state.phase,
      view: publicCash(state),
    });
    assert.equal(b.reconciled, true, "round " + i);
    assert.equal(
      b.items.reduce((n, v) => n + v.returned, 0),
      state.returned_minor,
    );
  }
  for (const action of ["double", "split", "surrender", "insurance"])
    assert.ok(seen.has(action), action + " exercised");
});
