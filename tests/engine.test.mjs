import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";
const source = await readFile(
  new URL("../src/lib/engine.ts", import.meta.url),
  "utf8",
);
const code = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const engine = await import(
  "data:text/javascript;base64," + Buffer.from(code).toString("base64")
);
const {
  deck,
  handValue,
  blackjackReturn,
  pokerRank,
  pokerPays,
  rouletteReturn,
  slotSpin,
  slotRtp,
  randomInt,
} = engine;
const card = (rank, suit = 0) => ({ rank, suit });
test("deck has exactly 52 unique cards, with injected deterministic shuffle", () => {
  const d = deck((n) => n - 1);
  assert.equal(d.length, 52);
  assert.equal(new Set(d.map((c) => c.rank + ":" + c.suit)).size, 52);
});
test("aces adapt and dealer soft 17 is recognized", () => {
  assert.deepEqual(handValue([card(14), card(6)]), { total: 17, soft: true });
  assert.deepEqual(handValue([card(14), card(14), card(9)]), {
    total: 21,
    soft: true,
  });
  assert.deepEqual(handValue([card(14), card(14), card(9), card(10)]), {
    total: 21,
    soft: false,
  });
});
test("blackjack handles natural 3:2, dealer natural, pushes, busts and split 21", () => {
  const natural = [card(14), card(13)],
    twenty = [card(10), card(10, 1)];
  assert.equal(blackjackReturn(natural, twenty, 100), 250);
  assert.equal(blackjackReturn(natural, natural, 100), 100);
  assert.equal(blackjackReturn(twenty, natural, 100), 0);
  assert.equal(blackjackReturn(natural, twenty, 100, false), 200);
  assert.equal(blackjackReturn(natural, natural, 100, false), 0);
  assert.equal(blackjackReturn(twenty, twenty, 200), 200);
  assert.equal(blackjackReturn([card(10), card(8), card(5)], twenty, 100), 0);
  assert.equal(blackjackReturn(twenty, [card(10), card(8), card(5)], 200), 400);
});
test("poker wheel, royal and high pair rules", () => {
  assert.equal(
    pokerRank([14, 2, 3, 4, 5].map((r) => card(r))),
    "Straight flush",
  );
  assert.equal(
    pokerRank([10, 11, 12, 13, 14].map((r) => card(r))),
    "Royal flush",
  );
  assert.equal(
    pokerRank([card(11), card(11, 1), card(3), card(8), card(14)]),
    "Jacks or better",
  );
  assert.equal(
    pokerRank([card(10), card(10, 1), card(3), card(8), card(14)]),
    "No winning hand",
  );
  assert.throws(() => pokerRank(Array(5).fill(card(14))), /unique/);
});
test("exhaustive poker categories match all 2,598,960 standard five-card hands", () => {
  const cards = deck((n) => n - 1),
    counts = {};
  let total = 0;
  for (let a = 0; a < 48; a++)
    for (let b = a + 1; b < 49; b++)
      for (let c = b + 1; c < 50; c++)
        for (let d = c + 1; d < 51; d++)
          for (let e = d + 1; e < 52; e++) {
            const rank = pokerRank([
              cards[a],
              cards[b],
              cards[c],
              cards[d],
              cards[e],
            ]);
            counts[rank] = (counts[rank] || 0) + 1;
            total++;
          }
  assert.equal(total, 2598960);
  for (const [rank, n] of Object.entries({
    "Royal flush": 4,
    "Straight flush": 36,
    "Four of a kind": 624,
    "Full house": 3744,
    Flush: 5108,
    Straight: 10200,
    "Three of a kind": 54912,
    "Two pair": 123552,
    "Jacks or better": 337920,
  }))
    assert.equal(counts[rank], n, rank);
  assert.equal(pokerPays["Royal flush"], 250);
});
test("roulette outside bets lose on zero; straight pays 36 times stake", () => {
  for (const kind of ["red", "black", "odd", "even", "low", "high"])
    assert.equal(rouletteReturn(0, kind, 100), 0);
  assert.equal(rouletteReturn(0, "straight", 100, 0), 3600);
  assert.equal(rouletteReturn(1, "red", 100), 200);
  assert.equal(rouletteReturn(2, "black", 100), 200);
  assert.equal(rouletteReturn(36, "even", 100), 200);
  assert.equal(rouletteReturn(18, "low", 100), 200);
  assert.equal(rouletteReturn(19, "high", 100), 200);
  assert.throws(() => rouletteReturn(37, "red", 100));
});
test("roulette expected returns across every pocket are 36/37", () => {
  for (const kind of [
    "red",
    "black",
    "odd",
    "even",
    "low",
    "high",
    "straight",
  ]) {
    const total = Array.from({ length: 37 }, (_, i) =>
      rouletteReturn(i, kind, 100, 17),
    ).reduce((a, b) => a + b, 0);
    assert.equal(total, 3600);
  }
});
test("weighted reel boundaries and published RTP agree with complete enumeration", () => {
  const math = {
    weights: [32, 24, 18, 12, 8, 4, 2],
    pays: [8, 16, 32, 80, 160, 400, 1600],
  };
  assert.deepEqual(
    slotSpin(math, () => 0),
    { reels: [0, 0, 0], multiplier: 8 },
  );
  assert.deepEqual(
    slotSpin(math, () => 99),
    { reels: [6, 6, 6], multiplier: 1600 },
  );
  const seq = [0, 32, 56];
  assert.equal(slotSpin(math, () => seq.shift()).multiplier, 0);
  let sum = 0;
  for (let a = 0; a < 7; a++)
    for (let b = 0; b < 7; b++)
      for (let c = 0; c < 7; c++)
        if (a === b && b === c)
          sum +=
            math.weights[a] * math.weights[b] * math.weights[c] * math.pays[a];
  assert.equal(slotRtp(math), sum / 1000000);
});
test("all 16 slot themes have coherent, sub-100% math profiles", async () => {
  let catalog = await readFile(
    new URL("../src/lib/catalog.ts", import.meta.url),
    "utf8",
  );
  catalog = catalog.replace(
    /import[\s\S]*?from ["']\.\/engine["'];/,
    "const slotRtp=" + slotRtp.toString() + ";",
  );
  const js = ts.transpileModule(catalog, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const { originals } = await import(
    "data:text/javascript;base64," + Buffer.from(js).toString("base64")
  );
  assert.equal(originals.length, 19);
  assert.equal(originals.filter((g) => g.kind === "slots").length, 16);
  assert.equal(new Set(originals.map((g) => g.slug)).size, 19);
  for (const g of originals.filter((g) => g.kind === "slots")) {
    assert.equal(
      g.math.weights.reduce((a, b) => a + b),
      100,
    );
    assert.equal(g.symbols.length, g.math.pays.length);
    assert.ok(slotRtp(g.math) > 0.85 && slotRtp(g.math) < 1, g.name);
  }
});
test("random sampler validates range and cannot generate an out-of-range outcome", () => {
  for (const n of [0, -1, 1.5, 0x100000001]) assert.throws(() => randomInt(n));
  for (let i = 0; i < 100; i++) {
    const n = randomInt(37);
    assert.ok(Number.isInteger(n) && n >= 0 && n < 37);
  }
  assert.equal(randomInt(1), 0);
});
