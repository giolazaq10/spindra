import test from "node:test";
import assert from "node:assert/strict";
import { originals, rtpLabel } from "../src/lib/catalog.ts";
import { modelEvaluate, modelRtp, modelSpin } from "../src/lib/slotModels.ts";
import {
  bestHand,
  compareRanks,
  rankFive,
  createHoldem,
  legalPoker,
  pokerAct,
  distributePots,
  botAction,
} from "../src/lib/holdem.ts";
import { DemoLedger } from "./fixtures/demoLedger.ts";
const card = (rank, suit = 0) => ({ rank, suit });

test("all twenty-five slots have distinct artwork, mechanics, paytables and valid exact RTP", () => {
  const slots = originals.filter((g) => g.slot);
  assert.equal(slots.length, 25);
  assert.equal(new Set(slots.map((g) => g.slot.scene)).size, 25);
  assert.equal(
    new Set(
      slots.map((g) =>
        JSON.stringify([
          g.slot.reels,
          g.slot.rows,
          g.slot.lines,
          g.slot.minimum,
          g.slot.direction,
          g.slot.scatter,
          g.slot.pays,
        ]),
      ),
    ).size,
    25,
  );
  assert.equal(new Set(slots.map((g) => g.slot.icons.join())).size, 25);
  for (const game of slots) {
    const s = game.slot;
    assert.ok(modelRtp(s) > 0.9 && modelRtp(s) < 1, game.name);
    assert.equal(
      rtpLabel(game),
      "Up to " + (modelRtp(s) * 100).toFixed(2) + "% theoretical RTP",
    );
    if(s.premium)continue;
    assert.equal(new Set(s.lines.map((p) => p.join())).size, s.lines.length);
    assert.ok(
      s.lines.every(
        (p) =>
          p.length === s.reels && p.every((row) => row >= 0 && row < s.rows),
      ),
    );
    for (const ticket of [0, s.weights.reduce((a, b) => a + b, 0) - 1]) {
      const result = modelSpin(s, () => ticket);
      assert.ok(Number.isSafeInteger((100 / 100) * result.rate));
      assert.deepEqual(result.wins, modelEvaluate(result.grid, s));
    }
  }
});
test("reverse paylines start on the right, stop at the first mismatch, and do not pay scattered matches", () => {
  const spec = originals.find((g) => g.slug === "neon-drift").slot;
  const s = { ...spec, lines: [[1, 1, 1, 1, 1]] },
    grid = Array.from({ length: 5 }, () => [1, 0, 2]);
  grid[0][1] = 2;
  grid[1][1] = 3;
  const win = modelEvaluate(grid, s)[0];
  assert.equal(win.count, 3);
  assert.deepEqual(win.cells, [
    [4, 1],
    [3, 1],
    [2, 1],
  ]);
  grid[3][1] = 2;
  assert.equal(modelEvaluate(grid, s).length, 0);
});
test("ways pay every row combination once and longest adjacent matches only", () => {
  const s = originals.find((g) => g.slug === "jade-temple").slot;
  const grid = Array.from({ length: 5 }, () => [0, 0, 0, 0]);
  const wins = modelEvaluate(grid, s);
  assert.equal(wins.length, 1);
  assert.equal(wins[0].ways, 1024);
  assert.equal(wins[0].count, 5);
  grid[3] = [1, 1, 1, 1];
  const short = modelEvaluate(grid, s).find((w) => w.symbol === 0);
  assert.equal(short.ways, 64);
  assert.equal(short.count, 3);
});
test("scatter awards count anywhere and never substitute in regular wins", () => {
  const s = originals.find((g) => g.slug === "solar-vault").slot;
  const grid = Array.from({ length: 5 }, (_, col) =>
    Array.from({ length: 3 }, (_, row) => (col + row) % 7),
  );
  grid[0][0] = 7;
  grid[2][2] = 7;
  grid[4][1] = 7;
  const wins = modelEvaluate(grid, s);
  const scatter = wins.find((w) => w.scatter);
  assert.equal(scatter.count, 3);
  assert.equal(scatter.rate, 200);
  assert.ok(wins.filter((w) => !w.scatter).every((w) => w.symbol !== 7));
});
test("each slot's regular-symbol RTP matches complete single-pattern enumeration", () => {
  for (const game of originals.filter((g) => g.slot && !g.slot.premium)) {
    const s = game.slot,
      total = s.weights.reduce((a, b) => a + b, 0);
    // Enumerate every symbol sequence for one line, then multiply by line count.
    if (s.mode !== "lines") continue;
    let expected = 0;
    for (let n = 0; n < s.weights.length ** s.reels; n++) {
      let ticket = n,
        prob = 1;
      const sequence = [];
      for (let col = 0; col < s.reels; col++) {
        const symbol = ticket % s.weights.length;
        ticket = Math.floor(ticket / s.weights.length);
        sequence.push(symbol);
        prob *= s.weights[symbol] / total;
      }
      if (s.direction === "right") sequence.reverse();
      const symbol = sequence[0];
      if (symbol >= 7) continue;
      let count = 1;
      while (count < s.reels && sequence[count] === symbol) count++;
      if (count >= s.minimum)
        expected +=
          ((prob * s.pays[symbol][count - s.minimum]) / 100) * s.lines.length;
    }
    const withoutScatter = { ...s, scatter: undefined };
    assert.ok(Math.abs(expected - modelRtp(withoutScatter)) < 1e-10, game.slug);
  }
});
test("hold'em hand ranking includes low pairs, kickers, wheel straights and best five of seven", () => {
  const pair = bestHand([
    card(2),
    card(2, 1),
    card(14, 2),
    card(13, 3),
    card(8, 1),
    card(6, 2),
    card(4, 3),
  ]);
  assert.equal(pair.name, "Pair");
  assert.deepEqual(pair.kickers, [2, 14, 13, 8]);
  const wheel = bestHand([
    card(14),
    card(2, 1),
    card(3, 2),
    card(4),
    card(5, 3),
    card(13),
    card(12),
  ]);
  assert.equal(wheel.name, "Straight");
  assert.deepEqual(wheel.kickers, [5]);
  const full = bestHand([
    card(14),
    card(14, 1),
    card(14, 2),
    card(13),
    card(13, 1),
    card(13, 2),
    card(2),
  ]);
  assert.equal(full.name, "Full house");
  assert.deepEqual(full.kickers, [14, 13]);
  assert.ok(
    compareRanks(
      rankFive([card(10), card(10, 1), card(14), card(8), card(4)]),
      rankFive([card(10), card(10, 1), card(13), card(8), card(4)]),
    ) > 0,
  );
  assert.throws(() => bestHand(Array(7).fill(card(14))));
});
test("community royal flush ties regardless of hole cards or suit", () => {
  const board = [10, 11, 12, 13, 14].map((r) => card(r, 2));
  assert.equal(
    compareRanks(
      bestHand([...board, card(2), card(3)]),
      bestHand([...board, card(4), card(5)]),
    ),
    0,
  );
});
test("blinds, preflop order, big blind option and flop/turn/river order follow hold'em", () => {
  let s = createHoldem(1000, 0, (n) => n - 1);
  assert.deepEqual(
    s.players.map((p) => p.streetBet),
    [0, 50, 100],
  );
  assert.equal(legalPoker(s).actor, 0);
  assert.throws(() => pokerAct(s, { kind: "check" }));
  s = pokerAct(s, { kind: "call" });
  s = pokerAct(s, { kind: "call" });
  assert.equal(legalPoker(s).actor, 2);
  assert.equal(s.street, "preflop");
  s = pokerAct(s, { kind: "check" });
  assert.equal(s.street, "flop");
  assert.equal(s.board.length, 3);
  assert.equal(legalPoker(s).actor, 1);
  for (const street of ["turn", "river", "done"]) {
    for (let i = 0; i < 3; i++) s = pokerAct(s, { kind: "check" });
    assert.equal(s.street, street);
  }
  assert.equal(s.board.length, 5);
  assert.equal(
    s.players.reduce((sum, p) => sum + p.stack, 0),
    3000,
  );
});
test("short all-in raises do not reopen action; full raises do", () => {
  let s = createHoldem(1000);
  s = pokerAct(s, { kind: "raise", to: 300 });
  s = pokerAct(s, { kind: "call" });
  // Big blind has only enough to raise all-in to 400 (short of a 200 raise).
  s.players[2].stack = 300;
  s = pokerAct(s, { kind: "raise", to: 400 });
  assert.equal(legalPoker(s).actor, 0);
  assert.equal(legalPoker(s).canRaise, false);
  assert.throws(() => pokerAct(s, { kind: "raise", to: 600 }));
  s = pokerAct(s, { kind: "call" });
  assert.equal(legalPoker(s).canRaise, false);
});
test("side pots exclude folded seats, refund uncalled chips, and split odd chips clockwise", () => {
  const board = [card(2), card(3, 1), card(7, 2), card(9, 3), card(11)];
  const seats = [
    [[card(14), card(14, 1)], 100, false],
    [[card(13), card(13, 1)], 300, false],
    [[card(12), card(12, 1)], 500, false],
  ].map(([hole, contributed, folded], i) => ({
    name: String(i),
    hole,
    contributed,
    folded,
    stack: 0,
    streetBet: 0,
    action: "",
  }));
  const result = distributePots(seats, board, 0);
  assert.deepEqual(result.awards, [300, 400, 200]);
  assert.equal(
    result.awards.reduce((a, b) => a + b),
    900,
  );
  const royal = [10, 11, 12, 13, 14].map((r) => card(r, 3));
  seats.forEach((p) => (p.contributed = 101));
  seats[2].folded = true;
  const tied = distributePots(seats, royal, 0);
  assert.deepEqual(tied.awards, [151, 152, 0]);
});
test("computer-opponent rounds preserve every chip across raises, folds and all-ins", () => {
  let seed = 654321;
  const rng = (max) => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed % max;
  };
  for (let round = 0; round < 300; round++) {
    let s = createHoldem(1000, round % 3, rng),
      steps = 0;
    while (s.street !== "done" && steps++ < 150) {
      const legal = legalPoker(s),
        p = s.players[legal.actor];
      s = pokerAct(s, botAction(p.hole, s.board, legal, s.bigBlind, rng));
    }
    assert.equal(s.street, "done");
    assert.equal(
      s.players.reduce((sum, p) => sum + p.stack, 0),
      3000,
    );
    assert.ok(
      s.players.every((p) => Number.isSafeInteger(p.stack) && p.stack >= 0),
    );
  }
});
test("abandoned rounds and stale callbacks settle once and cannot corrupt the next round", () => {
  const ledger = new DemoLedger();
  assert.equal(ledger.reserve(100, "spin-1"), true);
  assert.equal(ledger.settle("spin-1", 0), 100);
  assert.equal(ledger.settle("spin-1", 10000), null);
  assert.equal(ledger.balance, 99900);
  assert.equal(ledger.reserve(100, "spin-2"), true);
  assert.equal(ledger.settle("spin-1", 10000), null);
  assert.equal(ledger.pending.id, "spin-2");
  assert.equal(ledger.settle("spin-2", 200), 100);
  assert.equal(ledger.balance, 100000);
  assert.equal(ledger.reserve(100, "spin-1"), false);
});

test("Hold’em evaluator matches all 2,598,960 standard five-card category counts", () => {
  const cards = Array.from({ length: 52 }, (_, i) =>
    card((i % 13) + 2, Math.floor(i / 13)),
  );
  const counts = Array(9).fill(0);
  for (let a = 0; a < 48; a++)
    for (let b = a + 1; b < 49; b++)
      for (let c = b + 1; c < 50; c++)
        for (let d = c + 1; d < 51; d++)
          for (let e = d + 1; e < 52; e++)
            counts[
              rankFive([cards[a], cards[b], cards[c], cards[d], cards[e]])
                .category
            ]++;
  assert.deepEqual(
    counts,
    [1302540, 1098240, 123552, 54912, 10200, 5108, 3744, 624, 40],
  );
});
test("adjacent-reel ways RTP agrees with exhaustive per-symbol row-count distributions", () => {
  for (const game of originals.filter((g) => g.slot?.mode === "ways")) {
    const s = game.slot,
      total = s.weights.reduce((a, b) => a + b, 0);
    let expected = 0;
    for (let symbol = 0; symbol < 7; symbol++) {
      const p = s.weights[symbol] / total;
      const distribution = Array.from({ length: s.rows + 1 }, (_, k) => {
        let c = 1;
        for (let j = 1; j <= k; j++) c = (c * (s.rows - j + 1)) / j;
        return c * p ** k * (1 - p) ** (s.rows - k);
      });
      for (let n = 0; n < (s.rows + 1) ** s.reels; n++) {
        let ticket = n,
          probability = 1,
          counts = [];
        for (let col = 0; col < s.reels; col++) {
          const count = ticket % (s.rows + 1);
          ticket = Math.floor(ticket / (s.rows + 1));
          counts.push(count);
          probability *= distribution[count];
        }
        if (s.direction === "right") counts.reverse();
        let count = 0,
          ways = 1;
        while (count < s.reels && counts[count] > 0) {
          ways *= counts[count];
          count++;
        }
        if (count >= s.minimum)
          expected +=
            (probability * ways * s.pays[symbol][count - s.minimum]) / 100;
      }
    }
    assert.ok(
      Math.abs(expected - modelRtp({ ...s, scatter: undefined })) < 1e-10,
      game.slug,
    );
  }
});
