export type Card = { rank: number; suit: number };
export type RandomInt = (max: number) => number;
// Rejection sampling avoids modulo bias.
export const randomInt: RandomInt = (max) => {
  if (!Number.isSafeInteger(max) || max < 1 || max > 0x100000000)
    throw new Error("Invalid random range");
  const limit = Math.floor(0x100000000 / max) * max;
  const value = new Uint32Array(1);
  do {
    crypto.getRandomValues(value);
  } while (value[0] >= limit);
  return value[0] % max;
};
export function deck(rng: RandomInt = randomInt): Card[] {
  const cards = Array.from({ length: 52 }, (_, i) => ({
    rank: (i % 13) + 2,
    suit: Math.floor(i / 13),
  }));
  for (let i = cards.length - 1; i > 0; i--) {
    const j = rng(i + 1);
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}
export function handValue(cards: Card[]) {
  let total = cards.reduce(
    (n, c) => n + (c.rank === 14 ? 11 : Math.min(c.rank, 10)),
    0,
  );
  let aces = cards.filter((c) => c.rank === 14).length;
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  return { total, soft: aces > 0 };
}
export function blackjackReturn(
  player: Card[],
  dealer: Card[],
  bet: number,
  naturalAllowed = true,
) {
  const p = handValue(player).total,
    d = handValue(dealer).total;
  const pn = naturalAllowed && player.length === 2 && p === 21,
    dn = dealer.length === 2 && d === 21;
  if (p > 21) return 0;
  if (dn) return pn ? bet : 0;
  if (pn) return bet * 2.5;
  return d > 21 || p > d ? bet * 2 : p === d ? bet : 0;
}
export const pokerPays: Record<string, number> = {
  "Royal flush": 250,
  "Straight flush": 50,
  "Four of a kind": 25,
  "Full house": 9,
  Flush: 6,
  Straight: 4,
  "Three of a kind": 3,
  "Two pair": 2,
  "Jacks or better": 1,
  "No winning hand": 0,
};
export function pokerRank(cards: Card[]): string {
  if (
    cards.length !== 5 ||
    new Set(cards.map((c) => c.rank + ":" + c.suit)).size !== 5
  )
    throw new Error("Five unique cards required");
  const ranks = cards.map((c) => c.rank).sort((a, b) => a - b);
  const counts = ranks.reduce<Record<number, number>>((a, r) => {
    a[r] = (a[r] || 0) + 1;
    return a;
  }, {});
  const groups = Object.values(counts).sort((a, b) => b - a);
  const flush = cards.every((c) => c.suit === cards[0].suit);
  const straight =
    new Set(ranks).size === 5 &&
    (ranks[4] - ranks[0] === 4 || ranks.join(",") === "2,3,4,5,14");
  if (flush && straight)
    return ranks[0] === 10 ? "Royal flush" : "Straight flush";
  if (groups[0] === 4) return "Four of a kind";
  if (groups[0] === 3 && groups[1] === 2) return "Full house";
  if (flush) return "Flush";
  if (straight) return "Straight";
  if (groups[0] === 3) return "Three of a kind";
  if (groups[0] === 2 && groups[1] === 2) return "Two pair";
  if (Object.entries(counts).some(([r, n]) => n === 2 && Number(r) >= 11))
    return "Jacks or better";
  return "No winning hand";
}
export const redNumbers = [
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
];
export type RouletteBet =
  "red" | "black" | "odd" | "even" | "low" | "high" | "straight";
export function rouletteReturn(
  number: number,
  kind: RouletteBet,
  stake: number,
  straight = 0,
) {
  if (!Number.isInteger(number) || number < 0 || number > 36)
    throw new Error("Invalid pocket");
  if (kind === "straight") return number === straight ? stake * 36 : 0;
  if (number === 0) return 0;
  const win =
    kind === "red"
      ? redNumbers.includes(number)
      : kind === "black"
        ? !redNumbers.includes(number)
        : kind === "odd"
          ? number % 2 === 1
          : kind === "even"
            ? number % 2 === 0
            : kind === "low"
              ? number <= 18
              : number >= 19;
  return win ? stake * 2 : 0;
}
export type SlotMath = { weights: number[]; pays: number[] };
export function slotRtp(math: SlotMath) {
  const total = math.weights.reduce((a, b) => a + b, 0);
  return math.weights.reduce(
    (a, w, i) => a + (w / total) ** 3 * math.pays[i],
    0,
  );
}
export function slotSpin(math: SlotMath, rng: RandomInt = randomInt) {
  const total = math.weights.reduce((a, b) => a + b, 0);
  const reels = Array.from({ length: 3 }, () => {
    let ticket = rng(total);
    for (let i = 0; i < math.weights.length; i++) {
      ticket -= math.weights[i];
      if (ticket < 0) return i;
    }
    throw new Error("Invalid reel weights");
  });
  return {
    reels,
    multiplier: reels.every((r) => r === reels[0]) ? math.pays[reels[0]] : 0,
  };
}

// Five independent columns, three visible rows, ten fixed left-to-right lines.
export const slotLines = [
  [1, 1, 1, 1, 1],
  [0, 0, 0, 0, 0],
  [2, 2, 2, 2, 2],
  [0, 1, 2, 1, 0],
  [2, 1, 0, 1, 2],
  [0, 0, 1, 2, 2],
  [2, 2, 1, 0, 0],
  [1, 0, 0, 0, 1],
  [1, 2, 2, 2, 1],
  [0, 1, 1, 1, 0],
];
export function linePays(math: SlotMath) {
  const total = math.weights.reduce((a, b) => a + b, 0);
  const unscaled = math.weights.reduce((sum, w, i) => {
    const p = w / total;
    return (
      sum +
      math.pays[i] * (p ** 3 * (1 - p) + 2 * p ** 4 * (1 - p) + 5 * p ** 5)
    );
  }, 0);
  const scale = slotRtp(math) / unscaled;
  return math.pays.map((pay) => {
    const three = Math.max(1, Math.floor(pay * scale));
    return [three, three * 2, three * 5];
  });
}
export function fiveReelRtp(math: SlotMath) {
  const total = math.weights.reduce((a, b) => a + b, 0),
    pays = linePays(math);
  return math.weights.reduce((sum, w, i) => {
    const p = w / total;
    return (
      sum +
      p ** 3 * (1 - p) * pays[i][0] +
      p ** 4 * (1 - p) * pays[i][1] +
      p ** 5 * pays[i][2]
    );
  }, 0);
}
export function evaluateLines(grid: number[][], math: SlotMath) {
  if (
    grid.length !== 5 ||
    grid.some(
      (column) =>
        column.length !== 3 ||
        column.some(
          (s) => !Number.isInteger(s) || s < 0 || s >= math.weights.length,
        ),
    )
  )
    throw new Error("Five columns of three valid symbols required");
  const pays = linePays(math);
  return slotLines.flatMap((rows, line) => {
    const symbol = grid[0][rows[0]];
    let count = 1;
    while (count < 5 && grid[count][rows[count]] === symbol) count++;
    return count >= 3
      ? [{ line, rows, symbol, count, multiplier: pays[symbol][count - 3] }]
      : [];
  });
}
export function fiveReelSpin(math: SlotMath, rng: RandomInt = randomInt) {
  const total = math.weights.reduce((a, b) => a + b, 0);
  const grid = Array.from({ length: 5 }, () =>
    Array.from({ length: 3 }, () => {
      let ticket = rng(total);
      for (let i = 0; i < math.weights.length; i++) {
        ticket -= math.weights[i];
        if (ticket < 0) return i;
      }
      throw new Error("Invalid reel weights");
    }),
  );
  const wins = evaluateLines(grid, math);
  return {
    grid,
    wins,
    multiplier:
      wins.reduce((sum, w) => sum + w.multiplier, 0) / slotLines.length,
  };
}
