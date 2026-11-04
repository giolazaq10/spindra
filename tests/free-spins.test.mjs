import test from "node:test";
import assert from "node:assert/strict";
import { originals } from "../src/lib/catalog.ts";
import {
  modelRound,
  modelEvaluate,
  modelRtp,
  expectedBonusSpins,
} from "../src/lib/slotModels.ts";
import { newCashRound, publicCash } from "../src/lib/cashEngine.ts";

function sequence(spec, counts) {
  let cell = 0;
  const cells = spec.reels * spec.rows;
  return () => {
    const spin = Math.floor(cell / cells),
      position = cell++ % cells;
    return position < (counts[spin] || 0)
      ? spec.weights.slice(0, spec.scatter.symbol).reduce((a, b) => a + b, 0)
      : 0;
  };
}

test("three scatters trigger ten free spins on all 22 classic games, two never trigger", () => {
  for (const game of originals.filter((g) => g.slot && !g.slot.premium)) {
    const s = game.slot;
    assert.equal(modelRound(s, sequence(s, [2])).bonus, undefined);
    const round = modelRound(s, sequence(s, [3]));
    assert.equal(round.bonus.initial, 10);
    assert.equal(round.bonus.frames.length, 10);
    assert.equal(round.bonus.awarded, 10);
    assert.equal(round.bonus.frames[9].remaining, 0);
    assert.equal(
      round.rate,
      round.base_rate + round.bonus.frames.reduce((sum, f) => sum + f.rate, 0),
    );
    for (const frame of round.bonus.frames)
      assert.deepEqual(frame.wins, modelEvaluate(frame.grid, s));
  }
});

test("bonus scatters grant five extra spins and repeated retriggers stop at fifty", () => {
  const spec = originals.find((g) => g.slug === "solar-vault").slot;
  const retrigger = modelRound(spec, sequence(spec, [3, 3]));
  assert.equal(retrigger.bonus.frames.length, 15);
  assert.equal(retrigger.bonus.frames[0].added, 5);
  assert.equal(retrigger.bonus.frames[0].remaining, 14);
  const capped = modelRound(spec, sequence(spec, Array(51).fill(3)));
  assert.equal(capped.bonus.awarded, 50);
  assert.equal(capped.bonus.frames.length, 50);
  assert.equal(
    capped.bonus.frames.reduce((sum, f) => sum + f.added, 10),
    50,
  );
  assert.equal(capped.bonus.frames[49].remaining, 0);
  assert.equal(capped.bonus.frames[49].added, 0);
});

test("cash bonus stakes once, ignores client bonus claims and floors the combined return once", () => {
  const game = originals.find((g) => g.slug === "solar-vault");
  const state = newCashRound(
    game.slug,
    { bet: 20, free_spins: 99999, returned_minor: 999999 },
    sequence(game.slot, [3]),
  );
  assert.equal(state.phase, "settled");
  assert.equal(state.stake_minor, 20);
  assert.equal(state.data.bonus.frames.length, 10);
  assert.equal(state.returned_minor, Math.floor((20 * state.data.rate) / 100));
  assert.deepEqual(publicCash(state).result.bonus, state.data.bonus);
  assert.equal(state.data.rules_version, "scatter-free-spins-v3");
});

test("capped retrigger expectation agrees with an independent forward probability process", () => {
  for (const probability of [0, 0.01, 0.2, 0.7, 1]) {
    const initial = 3,
      extra = 2,
      maximum = 9;
    let states = new Map([["3:3", 1]]),
      expected = 0;
    for (let played = 0; played < maximum; played++) {
      const next = new Map();
      for (const [key, mass] of states) {
        const [pending, granted] = key.split(":").map(Number);
        if (!pending) continue;
        expected += mass;
        for (const [hit, chance] of [
          [false, 1 - probability],
          [true, probability],
        ]) {
          const added = hit ? Math.min(extra, maximum - granted) : 0;
          const k = pending - 1 + added + ":" + (granted + added);
          next.set(k, (next.get(k) || 0) + mass * chance);
        }
      }
      states = next;
    }
    assert.ok(
      Math.abs(
        expected - expectedBonusSpins(probability, initial, extra, maximum),
      ) < 1e-10,
    );
  }
});

test("published overall RTP includes the probability and value of free spins", () => {
  for (const game of originals.filter((g) => g.slot && !g.slot.premium)) {
    const s = game.slot;
    // Independent Poisson-binomial count distribution across all actual reel cells.
    let distribution = [1];
    for (let c = 0; c < s.reels; c++)
      for (let r = 0; r < s.rows; r++) {
        const total =
          s.weights.reduce((a, b) => a + b, 0) -
          (c === s.wild.reel ? 0 : s.wild.weight);
        const p = s.scatter.weight / total,
          next = Array(distribution.length + 1).fill(0);
        distribution.forEach((v, k) => {
          next[k] += v * (1 - p);
          next[k + 1] += v * p;
        });
        distribution = next;
      }
    const p = distribution.slice(3).reduce((a, b) => a + b, 0);
    const base = modelRtp({ ...s, freeSpins: undefined });
    const expected = base * (1 + p * expectedBonusSpins(p, 10, 5, 50));
    assert.ok(Math.abs(expected - modelRtp(s)) < 1e-10);
    assert.ok(modelRtp(s) > 0.9 && modelRtp(s) < 0.98);
  }
});
