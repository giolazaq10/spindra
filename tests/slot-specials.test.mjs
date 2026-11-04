import test from "node:test";
import assert from "node:assert/strict";
import { originals } from "../src/lib/catalog.ts";
import { modelEvaluate, modelSpin, modelRtp, SLOT_RULES_VERSION } from "../src/lib/slotModels.ts";
import { slotWinTier } from "../src/lib/slotWinTier.ts";

function fixture(mode = "lines", direction = "left") {
  return {
    reels: 3, rows: 2, lines: [[0, 0, 0], [1, 1, 1]],
    mode, direction, minimum: 2,
    weights: [3, 2, 1, 1], pays: [[40, 200], [60, 300]],
    scatter: { symbol: 2, weight: 1, awards: [0, 0, 2, 5, 15, 15, 15] },
    wild: { symbol: 3, weight: 1, reel: 1 },
  };
}

test("all 22 classic games draw wilds only on the middle reel and retain scatter awards", () => {
  const slots = originals.filter((g) => g.slot && !g.slot.premium);
  assert.equal(slots.length, 22);
  for (const { slot: spec } of slots) {
    assert.notEqual(spec.scatter.symbol, spec.wild.symbol);
    const result = modelSpin(spec, (max) => max - 1);
    assert.equal(result.rules_version, SLOT_RULES_VERSION);
    result.grid.forEach((col, c) => assert.ok(col.every((s) =>
      s === (c === spec.wild.reel ? spec.wild.symbol : spec.scatter.symbol))));
    assert.ok(result.wins.some((w) => w.scatter));
    const invalid = result.grid.map((col) => [...col]);
    invalid[0][0] = spec.wild.symbol;
    assert.throws(() => modelEvaluate(invalid, spec), /Invalid slot grid/);
  }
});

test("wilds extend natural lines in either direction and do not substitute scatters", () => {
  for (const direction of ["left", "right"]) {
    const spec = fixture("lines", direction);
    const wins = modelEvaluate([[0, 2], [3, 3], [0, 2]], spec);
    assert.equal(wins.length, 2);
    assert.equal(wins[0].symbol, 0);
    assert.equal(wins[0].count, 3);
    assert.equal(wins[0].rate, 200);
    assert.equal(wins[1].scatter, true);
    assert.equal(wins[1].count, 2);
    assert.equal(wins[1].rate, 200);
  }
});

test("ways count every natural/wild combination once per symbol", () => {
  const wins = modelEvaluate([[0, 1], [3, 3], [0, 0]], fixture("ways"));
  assert.deepEqual(wins.map(({ symbol, count, ways, rate }) => ({ symbol, count, ways, rate })), [
    { symbol: 0, count: 3, ways: 4, rate: 800 },
    { symbol: 1, count: 2, ways: 2, rate: 120 },
  ]);
});

test("exact RTP agrees with independent exhaustive grid probabilities including scatters and wilds", () => {
  for (const mode of ["lines", "ways"]) for (const direction of ["left", "right"]) {
    const spec = fixture(mode, direction);
    let expected = 0, mass = 0, grids = 0;
    const grid = [[], [], []];
    function enumerate(cell, probability) {
      if (cell === 6) {
        expected += probability * modelEvaluate(grid, spec).reduce((s, w) => s + w.rate / 100, 0);
        mass += probability;
        grids++;
        return;
      }
      const col = Math.floor(cell / 2), row = cell % 2;
      const choices = col === 1 ? [0, 1, 2, 3] : [0, 1, 2];
      const total = choices.reduce((sum, s) => sum + spec.weights[s], 0);
      for (const symbol of choices) {
        grid[col][row] = symbol;
        enumerate(cell + 1, probability * spec.weights[symbol] / total);
      }
    }
    enumerate(0, 1);
    assert.equal(grids, 1296);
    assert.ok(Math.abs(mass - 1) < 1e-12);
    assert.ok(Math.abs(expected - modelRtp(spec)) < 1e-10, mode + direction);
  }
});

test("big win tiers use confirmed total returned and exact 10x/25x/50x thresholds", () => {
  assert.equal(slotWinTier(1.99, .2), "normal");
  assert.equal(slotWinTier(2, .2), "big");
  assert.equal(slotWinTier(4.99, .2), "big");
  assert.equal(slotWinTier(5, .2), "mega");
  assert.equal(slotWinTier(9.99, .2), "mega");
  assert.equal(slotWinTier(10, .2), "epic");
  assert.equal(slotWinTier(100, 0), "normal");
});
