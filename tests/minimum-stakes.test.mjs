import test from "node:test";
import assert from "node:assert/strict";
import { originals } from "../src/lib/catalog.ts";
import { newCashRound, nextCashRound } from "../src/lib/cashEngine.ts";
import { miniPlay } from "../src/lib/minigames.ts";
import { validateBets } from "../src/lib/blackjack.ts";
test("All 31 games accept twenty-cent stakes and settle in integer USD cents", () => {
  let seed = 91;
  const rng = (n) => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed % n;
  };
  for (const g of originals)
    for (let i = 0; i < 30; i++) {
      let state = newCashRound(
        g.slug,
        {
          bet: 20,
          kind: "red",
          bets: [
            { main: 20, three: 0, pair: 0 },
            ...Array.from({ length: 4 }, () => ({
              main: 0,
              three: 0,
              pair: 0,
            })),
          ],
        },
        rng,
      );
      assert.equal(state.stake_minor, 20, g.name);
      if (state.phase === "open")
        state = nextCashRound(state, { action: "abandon" }, rng);
      assert.equal(state.phase, "settled");
      assert.ok(Number.isSafeInteger(state.returned_minor), g.name);
      assert.ok(state.returned_minor >= 0, g.name);
      if (g.slot)
        assert.equal(
          state.returned_minor,
          Math.floor((20 * state.data.rate) / 100),
        );
    }
});
test("Minimum and increment checks reject malformed or subminimum bets while accepting twenty and fifty cents", () => {
  for (const stake of [0, 10, 19, 21, 25, 20010, NaN, "20"]) {
    assert.throws(() => newCashRound("solar-vault", { bet: stake }));
    assert.throws(() => miniPlay("dice", stake));
  }
  assert.equal(
    miniPlay("dice", 20, { threshold: 5000 }, () => 0).returned_minor,
    38,
  );
  assert.equal(
    miniPlay("dice", 50, { threshold: 5000 }, () => 0).returned_minor,
    97,
  );
  assert.equal(miniPlay("plinko", 20, {}, () => 0).returned_minor, 200);
  assert.equal(miniPlay("wheel", 20, {}, () => 19).returned_minor, 100);
  const bets = (main) => [
    { main, three: 20, pair: 20 },
    ...Array.from({ length: 4 }, () => ({ main: 0, three: 0, pair: 0 })),
  ];
  assert.equal(validateBets(bets(20)), 60);
  assert.equal(validateBets(bets(50)), 90);
  assert.throws(() => validateBets(bets(10)));
  assert.throws(() => validateBets(bets(21)));
});
