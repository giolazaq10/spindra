import { randomInt, type RandomInt, type SlotMath } from "./engine";
import {
  premiumSpin,
  premiumRtp,
  premiumEvaluate,
  type PremiumKind,
} from "./premiumSlots";

export type SlotSpec = {
  premium?: PremiumKind;
  reels: number;
  rows: number;
  lines: number[][];
  mode: "lines" | "ways";
  direction: "left" | "right";
  minimum: number;
  weights: number[];
  pays: number[][];
  scatter?: { name: string; weight: number; awards: number[] };
  feature: string;
  description: string;
  scene: string;
  symbolNames: string[];
  icons: string[];
};
type Setup = [
  number,
  number,
  number,
  "left" | "right",
  number,
  string,
  string,
  string,
  string,
  string?,
  number?,
];
// Zero line count means adjacent-reel ways. Each cabinet has an independent specification.
const setups: Setup[] = [
  [
    5,
    3,
    10,
    "left",
    3,
    "Sun-token treasures",
    "Ten solar paths plus sun-token awards anywhere on the reels.",
    "solar",
    "sun,flame,orbit,gem,rocket,star,crown",
    "Sun token",
    3,
  ],
  [
    5,
    3,
    20,
    "right",
    3,
    "Reverse gear",
    "Twenty neon routes pay from the rightmost reel toward the left.",
    "city",
    "zap,car,disc,headphones,radio,trophy,flag",
  ],
  [
    5,
    4,
    0,
    "left",
    3,
    "1,024 temple ways",
    "Four rows open 1,024 adjacent-reel ways; every matching combination counts.",
    "temple",
    "leaf,flower,tree,gem,bird,key,crown",
  ],
  [
    5,
    3,
    0,
    "right",
    3,
    "243 moonlit ways",
    "Adjacent-reel combinations begin on the right beneath a lunar sea.",
    "moon",
    "moon,waves,fish,shell,anchor,star,ship",
  ],
  [
    5,
    3,
    25,
    "left",
    3,
    "Crown-fire awards",
    "Twenty-five royal lines with crown-fire scatter treasures.",
    "castle",
    "flame,sword,shield,gem,key,tower,crown",
    "Crown fire",
    3,
  ],
  [
    4,
    3,
    9,
    "left",
    3,
    "Four-reel constellation",
    "A compact four-reel cabinet with nine paths and constellation scatters.",
    "cosmos",
    "orbit,moon,star,rocket,telescope,gem,crown",
    "Constellation",
    3,
  ],
  [
    5,
    3,
    15,
    "right",
    3,
    "Pearl-diver paths",
    "Fifteen right-to-left reef paths; four pearls anywhere unlock a scatter award.",
    "reef",
    "fish,shell,waves,anchor,turtle,ship,gem",
    "Pearl",
    4,
  ],
  [
    3,
    3,
    5,
    "left",
    2,
    "Classic express",
    "Three reels and five tracks; two matching symbols can already pay.",
    "train",
    "ticket,clock,lamp,train,key,gem,trophy",
  ],
  [
    4,
    4,
    0,
    "left",
    3,
    "256 lantern ways",
    "Four reels of four rows with 256 ways and four-lantern awards.",
    "desert",
    "sun,flower,lamp,wind,bird,gem,crown",
    "Lantern",
    4,
  ],
  [
    5,
    4,
    20,
    "left",
    3,
    "Glacier grid",
    "Four tall rows, twenty icy paths and a five-symbol premium finish.",
    "ice",
    "snowflake,flower,mountain,moon,gem,star,crown",
  ],
  [
    4,
    3,
    0,
    "right",
    3,
    "81 echo ways",
    "Four reels pay adjacent matches from the right, with echo-stone scatter awards.",
    "cave",
    "hexagon,gem,mountain,key,eye,star,crown",
    "Echo stone",
    3,
  ],
  [
    5,
    3,
    30,
    "left",
    3,
    "Charged garden",
    "Thirty botanical circuits; five energy cells anywhere earn a separate award.",
    "garden",
    "flower,leaf,zap,tree,butterfly,sun,crown",
    "Energy cell",
    5,
  ],
  [
    3,
    3,
    3,
    "left",
    3,
    "Three royal rows",
    "Three straight rows, three reels and high-value ruby crowns. No diagonal lines.",
    "royal",
    "heart,diamond,spade,club,gem,sword,crown",
  ],
  [
    5,
    2,
    0,
    "left",
    3,
    "32 frontier ways",
    "Two rows create 32 adjacent-reel ways plus sheriff-badge awards.",
    "canyon",
    "mountain,sun,compass,axe,gem,star,trophy",
    "Sheriff badge",
    3,
  ],
  [
    4,
    3,
    12,
    "right",
    2,
    "Retro reverse",
    "Twelve arcade paths start on the right, with awards from two matching symbols.",
    "arcade",
    "gamepad,zap,disc,ghost,rocket,star,trophy",
  ],
  [
    5,
    4,
    40,
    "left",
    3,
    "Cartographer's forty",
    "Forty map routes on four rows; four compasses anywhere reveal extra treasure.",
    "map",
    "compass,map,key,ship,mountain,gem,crown",
    "Compass",
    4,
  ],
];

setups.push(
  [
    5,
    3,
    25,
    "left",
    3,
    "Lightning trails",
    "Twenty-five storm paths with three storm crystals anywhere paying an extra award.",
    "storm",
    "zap,bird,mountain,shield,gem,star,crown",
    "Storm crystal",
    3,
  ],
  [
    5,
    4,
    0,
    "left",
    3,
    "Sugar rushways",
    "Four rows open 1,024 adjacent ways. Four parade tickets anywhere add a scatter award.",
    "candy",
    "heart,flower,disc,gem,star,trophy,crown",
    "Parade ticket",
    4,
  ],
  [
    5,
    3,
    20,
    "right",
    3,
    "Corsair crossings",
    "Twenty right-to-left sea routes. Four black pearls anywhere earn an extra return.",
    "pirate",
    "ship,anchor,shell,compass,key,gem,crown",
    "Black pearl",
    4,
  ],
  [
    5,
    3,
    30,
    "left",
    3,
    "Golden hive",
    "Thirty honeycomb routes and three hive tokens anywhere.",
    "honey",
    "hexagon,flower,leaf,sun,gem,star,crown",
    "Hive token",
    3,
  ],
  [
    4,
    4,
    16,
    "right",
    2,
    "Aurora clockwork",
    "Sixteen reverse clockwork paths with wins from two matches. No scatter awards.",
    "aurora",
    "clock,wind,snowflake,moon,key,gem,crown",
  ],
  [
    6,
    3,
    0,
    "left",
    3,
    "729 dragon ways",
    "Six reels open 729 adjacent ways. Five dragon seals anywhere add an extra award.",
    "dragon",
    "flame,shield,sword,tower,key,gem,crown",
    "Dragon seal",
    5,
  ],
);
function paths(reels: number, rows: number, count: number, seed: number) {
  if (!count) return [];
  const result: number[][] = [];
  const add = (path: number[]) => {
    if (!result.some((p) => p.join() === path.join())) result.push(path);
  };
  add(Array(reels).fill(Math.floor(rows / 2)));
  for (let row = 0; row < rows; row++) add(Array(reels).fill(row));
  for (let offset = 0; offset < rows; offset++) {
    add(Array.from({ length: reels }, (_, i) => (i + offset) % rows));
    add(
      Array.from(
        { length: reels },
        (_, i) => (rows - 1 - (i % rows) + offset) % rows,
      ),
    );
  }
  // A coprime traversal yields reproducible unique paths without randomizing rules.
  const total = rows ** reels;
  let step = seed * 2 + 1;
  const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
  while (gcd(step, total) !== 1) step++;
  for (let n = 0; result.length < count && n < total; n++) {
    let ticket = (n * step + seed) % total;
    add(
      Array.from({ length: reels }, () => {
        const row = ticket % rows;
        ticket = Math.floor(ticket / rows);
        return row;
      }),
    );
  }
  return result.slice(0, count);
}
function binomial(n: number, k: number, p: number) {
  let coefficient = 1;
  for (let i = 1; i <= k; i++) coefficient = (coefficient * (n - i + 1)) / i;
  return coefficient * p ** k * (1 - p) ** (n - k);
}
function scatterExpectation(spec: SlotSpec) {
  if (!spec.scatter) return 0;
  const p = spec.scatter.weight / spec.weights.reduce((a, b) => a + b, 0),
    n = spec.reels * spec.rows;
  return Array.from(
    { length: n + 1 },
    (_, count) => binomial(n, count, p) * (spec.scatter!.awards[count] || 0),
  ).reduce((a, b) => a + b, 0);
}
function symbolExpectation(spec: SlotSpec, symbol: number, awards: number[]) {
  const p = spec.weights[symbol] / spec.weights.reduce((a, b) => a + b, 0);
  return awards.reduce((sum, pay, index) => {
    const count = index + spec.minimum;
    const probability =
      spec.mode === "ways"
        ? (spec.rows * p) ** count *
          (count === spec.reels ? 1 : (1 - p) ** spec.rows)
        : p ** count * (count === spec.reels ? 1 : 1 - p) * spec.lines.length;
    return sum + (probability * pay) / 100;
  }, 0);
}
export function makeSlotSpec(index: number, math: SlotMath): SlotSpec {
  const [
    reels,
    rows,
    lineCount,
    direction,
    minimum,
    feature,
    description,
    scene,
    icons,
    scatterName,
    threshold,
  ] = setups[index];
  const weights = math.weights.map((w, i) =>
    Math.max(1, w + ((index % 3) - 1) * (i % 2 ? 1 : -1)),
  );
  const spec: SlotSpec = {
    reels,
    rows,
    lines: paths(reels, rows, lineCount, index + 1),
    mode: lineCount ? "lines" : "ways",
    direction,
    minimum,
    weights,
    pays: [],
    feature,
    description,
    scene,
    icons: icons.split(","),
    symbolNames: icons
      .split(",")
      .map((name) => name[0].toUpperCase() + name.slice(1)),
  };
  if (scatterName) {
    const weight = 2 + (index % 2);
    spec.weights.push(weight);
    spec.scatter = {
      name: scatterName,
      weight,
      awards: Array.from({ length: reels * rows + 1 }, (_, count) =>
        count < (threshold || 3)
          ? 0
          : count === (threshold || 3)
            ? 2
            : count === (threshold || 3) + 1
              ? 5
              : 15,
      ),
    };
  }
  // Awards are hundredths of TOTAL stake. Cash settlement multiplies integer
  // minor stakes and floors the combined return once to a USD cent.
  const raw = math.pays.map((pay, symbol) =>
    Array.from(
      { length: reels - minimum + 1 },
      (_, j) =>
        pay *
        (1 + j) ** (1.3 + (index % 4) * 0.35) *
        (1 + symbol * index * 0.002),
    ),
  );
  const expected = raw.reduce(
    (sum, awards, symbol) => sum + symbolExpectation(spec, symbol, awards),
    0,
  );
  const target = 0.94 + (index % 4) * 0.005 - scatterExpectation(spec);
  spec.pays = raw.map((awards) =>
    awards.map((pay) => Math.max(1, Math.round((pay * target) / expected))),
  );
  return spec;
}
export function modelRtp(spec: SlotSpec) {
  if (spec.premium) return premiumRtp(spec.premium);
  return (
    spec.pays.reduce(
      (sum, awards, symbol) => sum + symbolExpectation(spec, symbol, awards),
      0,
    ) + scatterExpectation(spec)
  );
}
export type SlotWin = {
  symbol: number;
  count: number;
  rate: number;
  cells: [number, number][];
  line?: number;
  ways?: number;
  scatter?: boolean;
};
export function modelEvaluate(grid: number[][], spec: SlotSpec): SlotWin[] {
  if (spec.premium) return premiumEvaluate(grid, spec);
  if (
    grid.length !== spec.reels ||
    grid.some(
      (col) =>
        col.length !== spec.rows ||
        col.some(
          (s) => !Number.isInteger(s) || s < 0 || s >= spec.weights.length,
        ),
    )
  )
    throw new Error("Invalid slot grid");
  const order = Array.from({ length: spec.reels }, (_, i) =>
      spec.direction === "left" ? i : spec.reels - 1 - i,
    ),
    wins: SlotWin[] = [];
  if (spec.mode === "lines")
    spec.lines.forEach((rows, line) => {
      const symbol = grid[order[0]][rows[order[0]]];
      if (symbol >= spec.pays.length) return;
      let count = 1;
      while (
        count < spec.reels &&
        grid[order[count]][rows[order[count]]] === symbol
      )
        count++;
      if (count >= spec.minimum)
        wins.push({
          symbol,
          count,
          rate: spec.pays[symbol][count - spec.minimum],
          line,
          cells: order.slice(0, count).map((col) => [col, rows[col]]),
        });
    });
  else
    spec.pays.forEach((awards, symbol) => {
      let count = 0,
        ways = 1;
      const cells: [number, number][] = [];
      for (const col of order) {
        const matches = grid[col].flatMap((s, row) =>
          s === symbol ? [row] : [],
        );
        if (!matches.length) break;
        count++;
        ways *= matches.length;
        matches.forEach((row) => cells.push([col, row]));
      }
      if (count >= spec.minimum)
        wins.push({
          symbol,
          count,
          ways,
          rate: awards[count - spec.minimum] * ways,
          cells,
        });
    });
  if (spec.scatter) {
    const symbol = spec.weights.length - 1,
      cells: [number, number][] = [];
    grid.forEach((col, c) =>
      col.forEach((s, r) => {
        if (s === symbol) cells.push([c, r]);
      }),
    );
    const award = spec.scatter.awards[cells.length];
    if (award)
      wins.push({
        symbol,
        count: cells.length,
        rate: award * 100,
        cells,
        scatter: true,
      });
  }
  return wins;
}
export function modelSpin(spec: SlotSpec, rng: RandomInt = randomInt) {
  if (spec.premium) return premiumSpin(spec, rng);
  const total = spec.weights.reduce((a, b) => a + b, 0);
  const grid = Array.from({ length: spec.reels }, () =>
    Array.from({ length: spec.rows }, () => {
      let ticket = rng(total);
      for (let i = 0; i < spec.weights.length; i++) {
        ticket -= spec.weights[i];
        if (ticket < 0) return i;
      }
      throw new Error("Invalid weights");
    }),
  );
  const wins = modelEvaluate(grid, spec);
  return { grid, wins, rate: wins.reduce((sum, w) => sum + w.rate, 0) };
}
