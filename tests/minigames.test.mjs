import test from "node:test";
import assert from "node:assert/strict";
import { miniPlay, wheelPays, plinkoPays } from "../src/lib/minigames.ts";
import { newCashRound, publicCash } from "../src/lib/cashEngine.ts";
import { originals } from "../src/lib/catalog.ts";
test("Dice exact roll boundaries, both directions, 97% expectation and cent rounding", () => {
  for (const threshold of [500, 1733, 5000, 9500])
    for (const over of [false, true]) {
      let wins = 0,
        total = 0;
      for (let roll = 0; roll < 10000; roll++) {
        const r = miniPlay("dice", 100, { threshold, over }, () => roll);
        total += r.returned_minor;
        wins += Number(r.returned_minor > 0);
        assert.ok(Number.isSafeInteger(r.returned_minor));
        assert.equal(
          r.returned_minor > 0,
          over ? roll >= 10000 - threshold : roll < threshold,
        );
      }
      assert.equal(wins, threshold);
      assert.ok(total / 1000000 <= 0.97 && total / 1000000 > 0.96);
    }
});
test("Every Plinko path has one outcome and exact 97.5% RTP with a nonuniform landing distribution", () => {
  let total = 0;
  const frequencies = Array(9).fill(0);
  for (let ticket = 0; ticket < 256; ticket++) {
    let index = 0;
    const r = miniPlay("plinko", 100, {}, (n) => {
      assert.equal(n, 2);
      return (ticket >> index++) & 1;
    });
    assert.equal(r.path.length, 8);
    assert.equal(index, 8);
    assert.equal(
      r.bin,
      r.path.reduce((a, b) => a + b, 0),
    );
    assert.equal(r.returned_minor, plinkoPays[r.bin]);
    total += r.returned_minor;
    frequencies[r.bin]++;
  }
  assert.deepEqual(frequencies, [1, 8, 28, 56, 70, 56, 28, 8, 1]);
  assert.equal(total / 25600, 0.975);
});
test("Wheel uniform sectors match displayed payouts and exactly 97% RTP", () => {
  const returns = Array.from(
    { length: 20 },
    (_, sector) =>
      miniPlay("wheel", 100, {}, (n) => {
        assert.equal(n, 20);
        return sector;
      }).returned_minor,
  );
  assert.deepEqual(returns, wheelPays);
  assert.equal(returns.reduce((a, b) => a + b, 0) / 2000, 0.97);
});
test("Cash minigames ignore client wins and settle immediately with the existing authoritative round contract", () => {
  for (const game of originals.filter((g) => g.mini)) {
    const round = newCashRound(
      game.slug,
      { bet: 100, payout: 99999999, result: { returned_minor: 99999999 } },
      () => 0,
    );
    assert.equal(round.phase, "settled");
    assert.equal(round.kind, "instant");
    assert.equal(publicCash(round).result.returned_minor, round.returned_minor);
    assert.ok(round.returned_minor < 99999999);
  }
  for (const threshold of [-1, 0, 499, 9501, 10000, NaN, "5000", 1.5])
    assert.throws(() => miniPlay("dice", 100, { threshold }));
  assert.throws(() => miniPlay("dice", 100, { over: "true" }));
  for (const stake of [0, 99, 101, -100, 20001, Infinity])
    assert.throws(() => miniPlay("wheel", stake));
});
