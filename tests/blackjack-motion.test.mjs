import test from "node:test";
import assert from "node:assert/strict";
import { blackjackMotion } from "../src/components/blackjackMotion.ts";
const card = (rank, id) => ({ rank, suit: 0, id });
const fixture = (hands, dealer, state = "open") => ({
  id: "round",
  revision: 1,
  game: "noir-blackjack",
  state,
  balance_minor: 9900,
  view: {
    kind: "blackjack",
    stake_minor: 100,
    returned_minor: state === "settled" ? 200 : 0,
    phase: state,
    allowed: { hit: true },
    table: {
      phase: state === "settled" ? "done" : "playing",
      active: 0,
      hands,
      dealer,
    },
  },
});
const hand = (cards, id = "hand") => ({ id, seat: 0, cards, bet: 100 });
test("Opening deal travels clockwise and hides totals and awards until their confirmed cards arrive", () => {
  const result = fixture(
    [
      hand([card(10, "a"), card(8, "b")]),
      { ...hand([card(9, "c"), card(7, "d")], "other"), seat: 1 },
    ],
    [card(6, "e"), null],
  );
  const before = structuredClone(result);
  const frames = blackjackMotion(null, result);
  assert.deepEqual(
    frames
      .slice(0, 4)
      .map((f) => f.round.view.table.hands.map((h) => h.cards.length)),
    [
      [0, 0],
      [1, 0],
      [1, 1],
      [1, 1],
    ],
  );
  for (const f of frames.slice(0, -1)) {
    assert.deepEqual(f.round.view.allowed, {});
    assert.equal(f.round.view.returned_minor, 0);
    assert.equal(
      f.round.view.table.dealer.some((c) => c?.id === "secret"),
      false,
    );
  }
  assert.equal(frames.at(-1).round, result);
  assert.deepEqual(result, before);
});
test("Single-card hit has no full-table pause; a stand with no new cards finishes immediately", () => {
  const a = card(2, "a"),
    b = card(3, "b");
  const previous = fixture([hand([a, b])], [card(6, "dealer"), null]);
  const hit = fixture([hand([a, b, card(4, "c")])], previous.view.table.dealer);
  const frames = blackjackMotion(previous, hit);
  assert.ok(frames.at(-1).at <= 500);
  assert.equal(frames[0].round.view.table.hands[0].cards.length, 2);
  assert.equal(frames[1].round.view.table.hands[0].cards.length, 3);
  assert.deepEqual(
    blackjackMotion(hit, structuredClone(hit)).map((f) => f.at),
    [0],
  );
});
test("Split cards retain physical identity, and the dealer reveals before drawing", () => {
  const a = card(8, "a"),
    b = card(8, "b"),
    c = card(8, "c");
  const previous = fixture([hand([a, b])], [card(6, "up"), null]);
  const split = fixture(
    [
      { ...hand([a, c]), split: true },
      { ...hand([b, card(2, "d")], "split"), split: true },
    ],
    previous.view.table.dealer,
  );
  const splitFrames = blackjackMotion(previous, split);
  assert.deepEqual(
    splitFrames[0].round.view.table.hands.map((h) => h.cards.map((c) => c.id)),
    [["a"], ["b"]],
  );
  const done = fixture(
    split.view.table.hands,
    [card(6, "up"), card(10, "hole"), card(2, "draw")],
    "settled",
  );
  const frames = blackjackMotion(split, done);
  assert.equal(frames[0].round.view.table.dealer[1], null);
  assert.equal(frames[1].round.view.table.dealer[1].id, "hole");
  assert.equal(frames[1].round.view.table.dealer.length, 2);
  assert.equal(frames[2].round.view.table.dealer[2].id, "draw");
  assert.equal(frames.at(-1).round.state, "settled");
});
