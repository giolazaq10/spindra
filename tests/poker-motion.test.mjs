import test from "node:test";
import assert from "node:assert/strict";
import { pokerMotion } from "../src/components/pokerMotion.ts";
const card = (rank, suit = 0) => ({ rank, suit });
const fixture = (board = [], state = "open") => ({
  id: "poker",
  revision: 1,
  game: "royal-draw",
  state,
  balance_minor: 10000,
  view: {
    kind: "poker",
    stake_minor: 100,
    returned_minor: state === "settled" ? 200 : 0,
    allowed: { actor: 0, toCall: 20 },
    table: {
      street: state === "settled" ? "done" : "flop",
      board,
      players: [
        {
          name: "You",
          hole: [card(14), card(13)],
          stack: 100,
          action: "",
          folded: false,
        },
        {
          name: "Bot",
          hole: [null, null],
          stack: 100,
          action: "",
          folded: false,
        },
      ],
    },
  },
});
test("Poker deals only public hole cards, preserves hidden opponents and leaves the server response immutable", () => {
  const next = fixture(),
    copy = structuredClone(next),
    frames = pokerMotion(null, next);
  assert.deepEqual(
    frames[0].round.view.table.players.map((p) => p.hole.length),
    [0, 0],
  );
  for (const frame of frames.slice(0, -1)) {
    assert.equal(frame.round.view.returned_minor, 0);
    assert.deepEqual(frame.round.view.allowed, {});
    assert.ok(frame.round.view.table.players[1].hole.every((c) => c === null));
  }
  assert.equal(frames.at(-1).round, next);
  assert.deepEqual(next, copy);
});
test("Poker without new cards has no fixed pause; a turn deals only one new card", () => {
  const previous = fixture([card(2), card(3), card(4)]);
  assert.deepEqual(
    pokerMotion(previous, structuredClone(previous)).map((f) => f.at),
    [0],
  );
  const next = fixture([...previous.view.table.board, card(5)]),
    frames = pokerMotion(previous, next);
  assert.equal(frames[0].round.view.table.board.length, 3);
  assert.equal(frames[1].round.view.table.board.length, 4);
  assert.ok(frames.at(-1).at <= 500);
});
test("Poker showdown reveals only server-visible opponents after the community runout", () => {
  const previous = fixture([card(2), card(3), card(4)]),
    next = fixture([card(2), card(3), card(4), card(5), card(6)], "settled");
  next.view.table.players[1].hole = [card(7), card(8)];
  const frames = pokerMotion(previous, next);
  assert.deepEqual(frames[1].round.view.table.players[1].hole, [null, null]);
  assert.equal(frames[2].round.view.table.board.length, 5);
  assert.equal(frames[3].round.view.table.players[1].hole[0].rank, 7);
  assert.equal(frames.at(-1).round.state, "settled");
});
