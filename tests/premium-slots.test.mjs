import test from "node:test";
import assert from "node:assert/strict";
import {
  premiumSpec,
  premiumSpin,
  premiumEvaluate,
  premiumRtp,
  vaultExpectation,
  vaultCoinPays,
  VAULT_BONUS,
  cascadeTrigger,
} from "../src/lib/premiumSlots.ts";
test("Cascade pays eight anywhere, includes only triggered stages, and applies 1/2/3 multipliers once", () => {
  const spec = premiumSpec("cascade");
  const all = premiumSpin(spec, () => 0);
  assert.equal(all.frames.length, 3);
  assert.deepEqual(
    all.frames.map((f) => f.multiplier),
    [1, 2, 3],
  );
  assert.equal(all.rate, spec.pays[0][22] * 6);
  assert.ok(all.frames.every((f) => f.wins[0].count === 30));
  const tickets = [0, 24, 44, 60, 74, 84, 93];
  let n = 0;
  const none = premiumSpin(spec, () => tickets[n++ % 7]);
  assert.equal(none.frames.length, 1);
  assert.equal(none.rate, 0);
  n = 0;
  const stopped = premiumSpin(spec, () =>
    n++ < 30 ? 0 : tickets[(n - 31) % 7],
  );
  assert.equal(stopped.frames.length, 2);
  assert.equal(stopped.rate, spec.pays[0][22]);
  const grid = Array.from({ length: 6 }, () => Array(5).fill(1));
  grid[0] = [0, 0, 0, 0, 0];
  grid[1] = [0, 0, 0, 1, 1];
  assert.ok(
    premiumEvaluate(grid, spec).some((w) => w.symbol === 0 && w.count === 8),
  );
});
test("Locked coins persist, new coins reset chances, and only the terminal coin sum is paid", () => {
  const tickets = [
    0,
    0,
    ...Array(8).fill(1),
    ...Array(8).fill(1),
    0,
    99,
    ...Array(7).fill(1),
    ...Array(21).fill(1),
  ];
  let used = 0;
  const result = premiumSpin(premiumSpec("vault"), (n) => {
    const ticket = tickets[used++];
    assert.ok(ticket < n);
    return ticket;
  });
  assert.equal(result.frames.length, 6);
  assert.deepEqual(
    result.frames.map((f) => f.remaining),
    [3, 2, 3, 2, 1, 0],
  );
  assert.ok(result.frames.every((f) => f.grid[0][0] === 1));
  assert.ok(result.frames.slice(2).every((f) => f.grid[0][1] === 6));
  assert.ok(result.frames.slice(0, -1).every((f) => f.rate === 0));
  assert.equal(result.rate, vaultCoinPays[0] + vaultCoinPays[5]);
  const full = premiumSpin(premiumSpec("vault"), () => 0);
  assert.equal(full.frames.length, 1);
  assert.equal(full.rate, vaultCoinPays[0] * 9 + VAULT_BONUS);
  const misses = premiumSpin(premiumSpec("vault"), () => 1);
  assert.equal(misses.frames.length, 3);
  assert.equal(misses.rate, 0);
});
test("Vault expectation agrees with an independent forward probability distribution", () => {
  const choose = (n, k) => {
    let x = 1;
    for (let i = 1; i <= k; i++) x = (x * (n - i + 1)) / i;
    return x;
  };
  let states = new Map([["9:3", 1]]),
    coins = 0,
    full = 0,
    total = 0;
  for (let step = 0; step < 8; step++) {
    const next = new Map();
    for (const [key, p] of states) {
      const [empty, misses] = key.split(":").map(Number);
      for (let hits = 0; hits <= empty; hits++) {
        const chance =
            p * choose(empty, hits) * 0.25 ** hits * 0.75 ** (empty - hits),
          e = empty - hits,
          m = hits ? 3 : misses - 1;
        if (!e || !m || step === 7) {
          total += chance;
          coins += chance * (9 - e);
          if (!e) full += chance;
        } else {
          const k = e + ":" + m;
          next.set(k, (next.get(k) || 0) + chance);
        }
      }
    }
    states = next;
  }
  assert.ok(Math.abs(total - 1) < 1e-12);
  const expected = vaultExpectation();
  assert.ok(Math.abs(coins - expected.coins) < 1e-12);
  assert.ok(Math.abs(full - expected.full) < 1e-12);
});
test("Nitro wilds pay one highest match, boosts cannot create a win, and exact weighted RTP enumerates all drum outcomes", () => {
  const spec = premiumSpec("nitro");
  assert.equal(premiumEvaluate([[6], [6], [6]], spec)[0].symbol, 5);
  assert.equal(premiumEvaluate([[0], [6], [0]], spec)[0].symbol, 0);
  assert.deepEqual(premiumEvaluate([[0], [1], [6]], spec), []);
  let expected = 0;
  for (let a = 0; a < 7; a++)
    for (let b = 0; b < 7; b++)
      for (let c = 0; c < 7; c++)
        expected +=
          (((spec.weights[a] * spec.weights[b] * spec.weights[c]) / 1e6) *
            premiumEvaluate([[a], [b], [c]], spec).reduce(
              (sum, w) => sum + w.rate,
              0,
            ) *
            1.3) /
          100;
  assert.ok(Math.abs(expected - premiumRtp("nitro")) < 1e-12);
  const seq = [0, 0, 0, 99];
  const boosted = premiumSpin(spec, () => seq.shift());
  assert.equal(boosted.frames[0].multiplier, 5);
  assert.equal(boosted.rate, spec.pays[0][0] * 5);
});
test("Seeded premium rounds have bounded stage counts, exact integer awards and theoretical return consistent with sampling", () => {
  let seed = 922;
  const rng = (n) => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return Math.floor((seed / 2 ** 32) * n);
  };
  for (const kind of ["cascade", "vault", "nitro"]) {
    const spec = premiumSpec(kind);
    let total = 0,
      triggered = 0;
    const samples = 30000;
    for (let i = 0; i < samples; i++) {
      const spin = premiumSpin(spec, rng);
      assert.ok(
        spin.frames.length <=
          (kind === "cascade" ? 3 : kind === "vault" ? 8 : 1),
      );
      assert.equal(
        spin.rate,
        spin.frames.reduce((s, f) => s + f.rate, 0),
      );
      assert.ok(Number.isSafeInteger(spin.rate));
      total += spin.rate;
      if (kind === "cascade" && spin.frames[0].wins.length) triggered++;
    }
    assert.ok(
      Math.abs(total / samples / 100 - premiumRtp(kind)) < 0.055,
      kind + " sample return",
    );
    if (kind === "cascade")
      assert.ok(Math.abs(triggered / samples - cascadeTrigger()) < 0.015);
  }
});
