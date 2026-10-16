import { randomInt, type RandomInt } from "./engine";
import type { SlotSpec, SlotWin } from "./slotModels";
export type PremiumKind = "cascade" | "vault" | "nitro";
export type PremiumFrame = {
  grid: number[][];
  wins: SlotWin[];
  rate: number;
  multiplier: number;
  remaining?: number;
  label: string;
};
const factorial = (n: number) => {
  let x = 1;
  for (let i = 2; i <= n; i++) x *= i;
  return x;
};
function choose(n: number, k: number) {
  let x = 1;
  for (let i = 1; i <= k; i++) x = (x * (n - i + 1)) / i;
  return x;
}
function binomial(n: number, k: number, p: number) {
  return choose(n, k) * p ** k * (1 - p) ** (n - k);
}
function draw(weights: number[], rng: RandomInt) {
  let t = rng(weights.reduce((a, b) => a + b, 0));
  for (let i = 0; i < weights.length; i++) {
    t -= weights[i];
    if (t < 0) return i;
  }
  throw new Error("Invalid premium draw");
}
const cascadeWeights = [24, 20, 16, 14, 10, 9, 7];
/** Probability of at least eight matching symbols anywhere; exact occupancy polynomial. */
export function cascadeTrigger() {
  let coefficients = Array(31).fill(0);
  coefficients[0] = 1;
  for (const weight of cascadeWeights) {
    const next = Array(31).fill(0);
    for (let a = 0; a <= 30; a++)
      for (let b = 0; b <= 7 && a + b <= 30; b++)
        next[a + b] += (coefficients[a] * (weight / 100) ** b) / factorial(b);
    coefficients = next;
  }
  return Math.max(0, Math.min(1, 1 - factorial(30) * coefficients[30]));
}
const q = cascadeTrigger(),
  cascadeFactor = 1 + 2 * q + 3 * q * q;
function cascadeExpectation(pays: number[][]) {
  return (
    pays.reduce(
      (sum, row, symbol) =>
        sum +
        row.reduce(
          (a, pay, i) =>
            a + binomial(30, i + 8, cascadeWeights[symbol] / 100) * pay,
          0,
        ),
      0,
    ) * cascadeFactor
  );
}
const rawCascade = Array.from({ length: 7 }, (_, symbol) =>
  Array.from({ length: 23 }, (_, i) => (symbol + 1) ** 1.6 * (i + 1) ** 1.4),
);
const cascadeScale = 95 / cascadeExpectation(rawCascade);
const cascadePays = rawCascade.map((row) =>
  row.map((pay) => Math.max(1, Math.round(pay * cascadeScale))),
);
export const coinWeights = [50, 25, 15, 7, 2, 1];
/** Expected new coins and full-grid probability, including reset-on-hit and the eight-draw cap. */
export function vaultExpectation(
  empty = 9,
  misses = 3,
  draws = 8,
): { coins: number; full: number } {
  const memo = new Map<string, { coins: number; full: number }>();
  function visit(
    e: number,
    m: number,
    d: number,
  ): { coins: number; full: number } {
    if (e === 0) return { coins: 0, full: 1 };
    if (m === 0 || d === 0) return { coins: 0, full: 0 };
    const key = [e, m, d].join(":");
    const prior = memo.get(key);
    if (prior) return prior;
    const answer = { coins: 0, full: 0 };
    for (let hits = 0; hits <= e; hits++) {
      const p = binomial(e, hits, 0.25),
        tail = visit(e - hits, hits ? 3 : m - 1, d - 1);
      answer.coins += p * (hits + tail.coins);
      answer.full += p * tail.full;
    }
    memo.set(key, answer);
    return answer;
  }
  return visit(empty, misses, draws);
}
export const VAULT_BONUS = 200;
const vault = vaultExpectation(),
  rawCoins = [2, 3, 5, 10, 25, 100],
  coinMean = rawCoins.reduce(
    (s, pay, i) => s + (pay * coinWeights[i]) / 100,
    0,
  );
export const vaultCoinPays = rawCoins.map((pay) =>
  Math.max(
    1,
    Math.round(
      (pay * (95 - vault.full * VAULT_BONUS)) / (vault.coins * coinMean),
    ),
  ),
);
const nitroWeights = [28, 24, 18, 14, 9, 5, 2],
  rawNitro = [20, 35, 60, 110, 240, 650];
function nitroBest(grid: number[][], pays: number[]) {
  let symbol = -1,
    pay = 0;
  for (let i = 0; i < 6; i++)
    if (grid.every((col) => col[0] === i || col[0] === 6) && pays[i] > pay) {
      symbol = i;
      pay = pays[i];
    }
  return { symbol, pay };
}
function nitroExpectation(pays: number[]) {
  let sum = 0;
  for (let a = 0; a < 7; a++)
    for (let b = 0; b < 7; b++)
      for (let c = 0; c < 7; c++)
        sum +=
          ((nitroWeights[a] * nitroWeights[b] * nitroWeights[c]) / 1e6) *
          nitroBest([[a], [b], [c]], pays).pay;
  return sum * 1.3;
}
const nitroScale = 95 / nitroExpectation(rawNitro),
  nitroPays = rawNitro.map((pay) => Math.max(1, Math.round(pay * nitroScale)));
export function premiumSpec(kind: PremiumKind): SlotSpec {
  const common = {
    premium: kind,
    direction: "left" as const,
    mode: "lines" as const,
    scatter: undefined,
  };
  if (kind === "cascade")
    return {
      ...common,
      reels: 6,
      rows: 5,
      lines: [],
      minimum: 8,
      weights: cascadeWeights,
      pays: cascadePays,
      feature: "Portal cascades · 1× → 2× → 3×",
      description:
        "Eight matching crystals anywhere pay. Winning stages replace the whole board, up to three stages with rising multipliers.",
      scene: "astral",
      symbolNames: [
        "Opal",
        "Aqua",
        "Amethyst",
        "Citrine",
        "Ruby",
        "Emerald",
        "Nova",
      ],
      icons: ["opal", "aqua", "amethyst", "citrine", "ruby", "emerald", "nova"],
    };
  if (kind === "vault")
    return {
      ...common,
      reels: 3,
      rows: 3,
      lines: [],
      minimum: 1,
      weights: [75, ...coinWeights],
      pays: [[0], ...vaultCoinPays.map((p) => [p])],
      feature: "Lock coins · reset the respin counter",
      description:
        "Coins stay locked. New coins reset three chances; eight draws maximum. Fill all nine sockets for an extra 2×.",
      scene: "foundry",
      symbolNames: [
        "Empty",
        "Bronze",
        "Silver",
        "Ruby seal",
        "Gold",
        "Platinum",
        "Crown seal",
      ],
      icons: [
        "empty",
        "bronze",
        "silver",
        "ruby-seal",
        "gold",
        "platinum",
        "crown-seal",
      ],
    };
  return {
    ...common,
    reels: 3,
    rows: 1,
    lines: [[0, 0, 0]],
    minimum: 3,
    weights: nitroWeights,
    pays: [...nitroPays.map((p) => [p]), [0]],
    feature: "Wild gears · independent 1× / 2× / 5× boost",
    description:
      "Three matching symbols on one line, with gear wilds substituting. Only the highest award pays, multiplied by the boost.",
    scene: "motor",
    symbolNames: [
      "Cherry",
      "Lemon",
      "Bell",
      "BAR",
      "Diamond",
      "Seven",
      "Gear wild",
    ],
    icons: ["cherry", "lemon", "bell", "bar", "diamond", "seven", "gear-wild"],
  };
}
export function premiumRtp(kind: PremiumKind) {
  return kind === "cascade"
    ? cascadeExpectation(cascadePays) / 100
    : kind === "vault"
      ? (vault.coins *
          vaultCoinPays.reduce(
            (s, pay, i) => s + (pay * coinWeights[i]) / 100,
            0,
          ) +
          vault.full * VAULT_BONUS) /
        100
      : nitroExpectation(nitroPays) / 100;
}
export function premiumEvaluate(grid: number[][], spec: SlotSpec): SlotWin[] {
  if (
    grid.length !== spec.reels ||
    grid.some(
      (col) =>
        col.length !== spec.rows ||
        col.some((s) => !Number.isInteger(s) || s < 0 || s > 6),
    )
  )
    throw new Error("Invalid premium grid");
  const wins: SlotWin[] = [];
  if (spec.premium === "cascade")
    for (let symbol = 0; symbol < 7; symbol++) {
      const cells: [number, number][] = [];
      grid.forEach((col, x) =>
        col.forEach((s, y) => {
          if (s === symbol) cells.push([x, y]);
        }),
      );
      if (cells.length >= 8)
        wins.push({
          symbol,
          count: cells.length,
          rate: cascadePays[symbol][cells.length - 8],
          cells,
        });
    }
  else if (spec.premium === "vault") {
    let count = 0;
    grid.forEach((col, x) =>
      col.forEach((symbol, y) => {
        if (symbol > 0) {
          count++;
          wins.push({
            symbol,
            count: 1,
            rate: vaultCoinPays[symbol - 1],
            cells: [[x, y]],
          });
        }
      }),
    );
    if (count === 9)
      wins.push({
        symbol: 0,
        count: 9,
        rate: VAULT_BONUS,
        cells: [],
        scatter: true,
      });
  } else {
    const best = nitroBest(grid, nitroPays);
    if (best.pay)
      wins.push({
        symbol: best.symbol,
        count: 3,
        rate: best.pay,
        cells: [
          [0, 0],
          [1, 0],
          [2, 0],
        ],
        line: 0,
      });
  }
  return wins;
}
export function premiumSpin(spec: SlotSpec, rng: RandomInt = randomInt) {
  const frames: PremiumFrame[] = [];
  if (spec.premium === "cascade") {
    for (let stage = 1; stage <= 3; stage++) {
      const grid = Array.from({ length: 6 }, () =>
          Array.from({ length: 5 }, () => draw(cascadeWeights, rng)),
        ),
        wins = premiumEvaluate(grid, spec).map((w) => ({
          ...w,
          rate: w.rate * stage,
        })),
        rate = wins.reduce((s, w) => s + w.rate, 0);
      frames.push({
        grid,
        wins,
        rate,
        multiplier: stage,
        label: stage === 1 ? "Crystal drop" : "Portal cascade " + stage,
      });
      if (!wins.length) break;
    }
  } else if (spec.premium === "vault") {
    const grid = Array.from({ length: 3 }, () => Array(3).fill(0));
    let chances = 3;
    for (let round = 1; round <= 8; round++) {
      let hit = false;
      for (let x = 0; x < 3; x++)
        for (let y = 0; y < 3; y++)
          if (!grid[x][y] && rng(4) === 0) {
            grid[x][y] = 1 + draw(coinWeights, rng);
            hit = true;
          }
      chances = hit ? 3 : chances - 1;
      const full = grid.every((col) => col.every(Boolean)),
        done = full || !chances || round === 8,
        wins = done ? premiumEvaluate(grid, spec) : [];
      frames.push({
        grid: structuredClone(grid),
        wins,
        rate: wins.reduce((s, w) => s + w.rate, 0),
        multiplier: 1,
        remaining: chances,
        label: full
          ? "Vault completed"
          : done
            ? "Vault collected"
            : hit
              ? "New coin · chances reset"
              : "No new coin",
      });
      if (done) break;
    }
  } else {
    const grid = Array.from({ length: 3 }, () => [draw(nitroWeights, rng)]),
      boost = draw([85, 10, 5], rng),
      multiplier = [1, 2, 5][boost],
      wins = premiumEvaluate(grid, spec).map((w) => ({
        ...w,
        rate: w.rate * multiplier,
      }));
    frames.push({
      grid,
      wins,
      rate: wins.reduce((s, w) => s + w.rate, 0),
      multiplier,
      label:
        multiplier > 1 ? "Turbo boost " + multiplier + "×" : "Classic drive",
    });
  }
  const last = frames[frames.length - 1]!;
  return {
    grid: last.grid,
    wins: last.wins,
    rate: frames.reduce((s, f) => s + f.rate, 0),
    frames,
  };
}
