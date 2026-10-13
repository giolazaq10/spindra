import test from "node:test";
import assert from "node:assert/strict";
import {
  createBlackjack,
  eightDeckShoe,
  perfectPair,
  twentyOneThree,
  chooseInsurance,
  insuranceCost,
  allowedActions,
  actBlackjack,
  blackjackActionCost,
  dealerShouldHit,
  dealerNeedsPlay,
  drawDealer,
  settleBlackjack,
  sideReturn,
  validateBets,
  mainReturn,
} from "../src/lib/blackjack.ts";
const c = (rank, suit = 0) => ({ rank, suit });
const bets = (filled = 1) =>
  Array.from({ length: 5 }, (_, i) => ({
    main: i < filled ? 100 : 0,
    three: 0,
    pair: 0,
  }));
function rig(draws, plan = bets()) {
  const remaining = Array.from({ length: 416 }, (_, i) => i);
  let turn = 0;
  return createBlackjack(plan, (max) => {
    const j = turn < draws.length ? remaining.indexOf(draws[turn]) : max - 1;
    turn++;
    [remaining[max - 1], remaining[j]] = [remaining[j], remaining[max - 1]];
    return j;
  });
}
const index = (rank, suit = 0, deck = 0) => deck * 52 + suit * 13 + rank - 2;
test("eight-deck shoe has 416 unique physical cards and eight of every rank and suit", () => {
  const shoe = eightDeckShoe((n) => n - 1);
  assert.equal(shoe.length, 416);
  assert.equal(new Set(shoe.map((c) => c.id)).size, 416);
  for (let rank = 2; rank <= 14; rank++)
    for (let suit = 0; suit < 4; suit++)
      assert.equal(
        shoe.filter((c) => c.rank === rank && c.suit === suit).length,
        8,
      );
});
test("Perfect Pair pays only the correct highest category, including identical multi-deck cards", () => {
  assert.deepEqual(perfectPair([c(7), c(7)], 100), {
    name: "Perfect pair",
    odds: 26,
    returned: 2700,
  });
  assert.equal(perfectPair([c(7), c(7, 2)], 100).returned, 1300);
  assert.equal(perfectPair([c(7), c(7, 1)], 100).returned, 600);
  assert.equal(perfectPair([c(7), c(8)], 100).returned, 0);
});
test("21+3 implements all five categories, ace-low and ace-high straights without wrapping", () => {
  for (const [cards, odds] of [
    [[c(7), c(7), c(7)], 100],
    [[c(7), c(8), c(9)], 40],
    [[c(7), c(7, 1), c(7, 2)], 30],
    [[c(7), c(8, 1), c(9)], 10],
    [[c(2), c(6), c(10)], 5],
    [[c(2), c(6, 1), c(10)], 0],
  ])
    assert.equal(
      twentyOneThree(cards, 100).returned,
      odds ? (odds + 1) * 100 : 0,
    );
  assert.equal(twentyOneThree([c(14), c(2, 1), c(3)], 100).odds, 10);
  assert.equal(twentyOneThree([c(12), c(13, 1), c(14)], 100).odds, 10);
  assert.equal(twentyOneThree([c(13), c(14, 1), c(2)], 100).odds, 0);
});
test("bet validation requires five spots and prevents orphan side bets or partial invalid reserves", () => {
  assert.equal(validateBets(bets(5)), 500);
  assert.throws(() =>
    validateBets(bets().map((b, i) => (i === 1 ? { ...b, pair: 100 } : b))),
  );
  assert.throws(() => validateBets([{ main: 100, three: 0, pair: 0 }]));
  assert.throws(() => validateBets(bets().map((b) => ({ ...b, main: 100.5 }))));
  assert.throws(() => validateBets(bets().map((b) => ({ ...b, main: 20100 }))));
});
test("five hands deal clockwise in two passes against one dealer and preserve side results", () => {
  const plan = bets(5);
  plan[0].pair = 100;
  const s = rig(
    [
      index(7),
      index(3),
      index(4),
      index(5),
      index(6),
      index(9),
      index(7, 0, 1),
      index(8),
      index(10),
      index(11),
      index(12),
      index(13),
    ],
    plan,
  );
  assert.equal(s.hands.length, 5);
  assert.deepEqual(
    s.hands[0].cards.map((c) => c.rank),
    [7, 7],
  );
  assert.deepEqual(
    s.dealer.map((c) => c.rank),
    [9, 13],
  );
  assert.equal(s.sideResults[0].pair.returned, 2700);
  assert.equal(s.totalStake, 600);
});
test("insurance costs exactly half the selected hands and pays 2:1 only on dealer blackjack", () => {
  const s = rig([index(10), index(14), index(9), index(13)]);
  assert.equal(s.phase, "insurance");
  assert.equal(insuranceCost(s, [0]), 50);
  assert.throws(() => insuranceCost(s, [0, 0]));
  const next = chooseInsurance(s, [0]);
  assert.equal(next.phase, "done");
  assert.equal(next.totalStake, 150);
  assert.equal(next.returned, 150);
  assert.throws(() => chooseInsurance(next, [0]));
  const losing = rig([index(10), index(14), index(9), index(6)]),
    passed = chooseInsurance(losing, [0]);
  assert.equal(passed.phase, "playing");
  assert.equal(passed.totalStake, 150);
  assert.equal(passed.insurance[0], 50);
});
test("insurance with two naturals pushes the main bet and returns the winning insurance", () => {
  const s = rig([index(14), index(14, 1), index(13), index(12)]);
  const next = chooseInsurance(s, [0]);
  assert.equal(next.returned, 250);
  const skipped = chooseInsurance(s, []);
  assert.equal(skipped.returned, 100);
});
test("dealer hits soft 17, stands on hard 17, and uses paced individual draws", () => {
  let s = rig([
    index(10),
    index(14),
    index(8),
    index(6),
    index(2),
    index(10, 1),
  ]);
  s = chooseInsurance(s, []);
  s = actBlackjack(s, "stand");
  assert.equal(dealerShouldHit(s), true);
  s = drawDealer(s);
  assert.equal(dealerShouldHit(s), false);
  assert.equal(s.dealer.length, 3);
  const hard = { ...s, dealer: [c(10), c(7)] };
  assert.equal(dealerShouldHit(hard), false);
});
test("split once per original hand, double after split, and split 21 is not a natural", () => {
  let s = rig([
    index(8),
    index(9),
    index(8, 1),
    index(7),
    index(3),
    index(4),
    index(10),
  ]);
  assert.equal(blackjackActionCost(s, "split"), 100);
  s = actBlackjack(s, "split");
  assert.equal(s.hands.length, 2);
  assert.equal(s.totalStake, 200);
  assert.equal(allowedActions(s).split, false);
  assert.equal(allowedActions(s).double, true);
  s = actBlackjack(s, "double");
  assert.equal(s.totalStake, 300);
  assert.equal(s.hands[0].cards.length, 3);
  assert.equal(s.hands[0].done, true);
  assert.equal(
    mainReturn({ ...s.hands[1], cards: [c(14), c(13)], split: true }, [
      c(10),
      c(8),
    ]),
    200,
  );
});
test("split aces receive exactly one card each with no further action", () => {
  let s = rig([
    index(14),
    index(9),
    index(14, 1),
    index(7),
    index(10),
    index(6),
  ]);
  s = actBlackjack(s, "split");
  assert.equal(s.phase, "dealer");
  assert.ok(s.hands.every((h) => h.cards.length === 2 && h.done && h.aces));
  assert.equal(allowedActions(s).hit, false);
});
test("late surrender returns half the main stake and preserves independently won side bets", () => {
  const plan = bets();
  plan[0].pair = 100;
  let s = rig([index(8), index(10), index(8, 1), index(7)], plan);
  s = actBlackjack(s, "surrender");
  assert.equal(s.phase, "dealer");
  assert.equal(dealerNeedsPlay(s), false);
  const final = settleBlackjack(s);
  assert.equal(final.returned, sideReturn(s) + 50);
  const hit = actBlackjack(
    rig([index(5), index(10), index(7), index(7, 1), index(2)]),
    "hit",
  );
  assert.equal(allowedActions(hit).surrender, false);
});
test("seeded multihand rounds conserve all physical cards and produce integer settlement amounts", () => {
  let seed = 37;
  const rng = (n) => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed % n;
  };
  for (let round = 0; round < 150; round++) {
    const plan = bets(5).map((b) => ({ ...b, three: 100, pair: 100 }));
    let s = createBlackjack(plan, rng);
    if (s.phase === "insurance") s = chooseInsurance(s, [0, 2, 4]);
    while (s.phase === "playing") {
      const legal = allowedActions(s);
      s = actBlackjack(
        s,
        legal.split && round % 3 === 0
          ? "split"
          : legal.double && round % 4 === 0
            ? "double"
            : "stand",
      );
    }
    while (s.phase === "dealer" && dealerNeedsPlay(s) && dealerShouldHit(s))
      s = drawDealer(s);
    const final = settleBlackjack(s);
    const cards = [...s.shoe, ...s.dealer, ...s.hands.flatMap((h) => h.cards)];
    assert.equal(cards.length, 416);
    assert.equal(new Set(cards.map((c) => c.id)).size, 416);
    assert.ok(Number.isSafeInteger(final.returned));
    assert.ok(final.returned >= 0);
    assert.deepEqual(final.sideResults, s.sideResults);
  }
});
