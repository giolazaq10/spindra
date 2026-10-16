// @ts-self-types="./cash-engine.d.ts"
// Generated from src/lib/cashEngine.ts; run npm run cash:bundle after math changes.
// src/lib/engine.ts
var randomInt = (max) => {
  if (!Number.isSafeInteger(max) || max < 1 || max > 4294967296)
    throw new Error("Invalid random range");
  const limit = Math.floor(4294967296 / max) * max;
  const value = new Uint32Array(1);
  do {
    crypto.getRandomValues(value);
  } while (value[0] >= limit);
  return value[0] % max;
};
function deck(rng = randomInt) {
  const cards = Array.from({ length: 52 }, (_, i) => ({
    rank: i % 13 + 2,
    suit: Math.floor(i / 13)
  }));
  for (let i = cards.length - 1; i > 0; i--) {
    const j = rng(i + 1);
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}
function handValue(cards) {
  let total = cards.reduce(
    (n, c) => n + (c.rank === 14 ? 11 : Math.min(c.rank, 10)),
    0
  );
  let aces = cards.filter((c) => c.rank === 14).length;
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  return { total, soft: aces > 0 };
}
function blackjackReturn(player, dealer, bet, naturalAllowed = true) {
  const p = handValue(player).total, d = handValue(dealer).total;
  const pn = naturalAllowed && player.length === 2 && p === 21, dn = dealer.length === 2 && d === 21;
  if (p > 21) return 0;
  if (dn) return pn ? bet : 0;
  if (pn) return bet * 2.5;
  return d > 21 || p > d ? bet * 2 : p === d ? bet : 0;
}
var redNumbers = [
  1,
  3,
  5,
  7,
  9,
  12,
  14,
  16,
  18,
  19,
  21,
  23,
  25,
  27,
  30,
  32,
  34,
  36
];
function rouletteReturn(number, kind, stake, straight = 0) {
  if (!Number.isInteger(number) || number < 0 || number > 36)
    throw new Error("Invalid pocket");
  if (kind === "straight") return number === straight ? stake * 36 : 0;
  if (number === 0) return 0;
  const win = kind === "red" ? redNumbers.includes(number) : kind === "black" ? !redNumbers.includes(number) : kind === "odd" ? number % 2 === 1 : kind === "even" ? number % 2 === 0 : kind === "low" ? number <= 18 : number >= 19;
  return win ? stake * 2 : 0;
}

// src/lib/slotModels.ts
var setups = [
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
    3
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
    "zap,car,disc,headphones,radio,trophy,flag"
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
    "leaf,flower,tree,gem,bird,key,crown"
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
    "moon,waves,fish,shell,anchor,star,ship"
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
    3
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
    3
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
    4
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
    "ticket,clock,lamp,train,key,gem,trophy"
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
    4
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
    "snowflake,flower,mountain,moon,gem,star,crown"
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
    3
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
    5
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
    "heart,diamond,spade,club,gem,sword,crown"
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
    3
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
    "gamepad,zap,disc,ghost,rocket,star,trophy"
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
    4
  ]
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
    3
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
    4
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
    4
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
    3
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
    "clock,wind,snowflake,moon,key,gem,crown"
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
    5
  ]
);
function paths(reels, rows, count, seed) {
  if (!count) return [];
  const result2 = [];
  const add = (path) => {
    if (!result2.some((p) => p.join() === path.join())) result2.push(path);
  };
  add(Array(reels).fill(Math.floor(rows / 2)));
  for (let row = 0; row < rows; row++) add(Array(reels).fill(row));
  for (let offset = 0; offset < rows; offset++) {
    add(Array.from({ length: reels }, (_, i) => (i + offset) % rows));
    add(
      Array.from(
        { length: reels },
        (_, i) => (rows - 1 - i % rows + offset) % rows
      )
    );
  }
  const total = rows ** reels;
  let step = seed * 2 + 1;
  const gcd = (a, b) => b ? gcd(b, a % b) : a;
  while (gcd(step, total) !== 1) step++;
  for (let n = 0; result2.length < count && n < total; n++) {
    let ticket = (n * step + seed) % total;
    add(
      Array.from({ length: reels }, () => {
        const row = ticket % rows;
        ticket = Math.floor(ticket / rows);
        return row;
      })
    );
  }
  return result2.slice(0, count);
}
function binomial(n, k, p) {
  let coefficient = 1;
  for (let i = 1; i <= k; i++) coefficient = coefficient * (n - i + 1) / i;
  return coefficient * p ** k * (1 - p) ** (n - k);
}
function scatterExpectation(spec) {
  if (!spec.scatter) return 0;
  const p = spec.scatter.weight / spec.weights.reduce((a, b) => a + b, 0), n = spec.reels * spec.rows;
  return Array.from(
    { length: n + 1 },
    (_, count) => binomial(n, count, p) * (spec.scatter.awards[count] || 0)
  ).reduce((a, b) => a + b, 0);
}
function symbolExpectation(spec, symbol, awards) {
  const p = spec.weights[symbol] / spec.weights.reduce((a, b) => a + b, 0);
  return awards.reduce((sum, pay, index) => {
    const count = index + spec.minimum;
    const probability = spec.mode === "ways" ? (spec.rows * p) ** count * (count === spec.reels ? 1 : (1 - p) ** spec.rows) : p ** count * (count === spec.reels ? 1 : 1 - p) * spec.lines.length;
    return sum + probability * pay / 100;
  }, 0);
}
function makeSlotSpec(index, math) {
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
    threshold
  ] = setups[index];
  const weights = math.weights.map(
    (w, i) => Math.max(1, w + (index % 3 - 1) * (i % 2 ? 1 : -1))
  );
  const spec = {
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
    symbolNames: icons.split(",").map((name) => name[0].toUpperCase() + name.slice(1))
  };
  if (scatterName) {
    const weight = 2 + index % 2;
    spec.weights.push(weight);
    spec.scatter = {
      name: scatterName,
      weight,
      awards: Array.from(
        { length: reels * rows + 1 },
        (_, count) => count < (threshold || 3) ? 0 : count === (threshold || 3) ? 2 : count === (threshold || 3) + 1 ? 5 : 15
      )
    };
  }
  const raw = math.pays.map(
    (pay, symbol) => Array.from(
      { length: reels - minimum + 1 },
      (_, j) => pay * (1 + j) ** (1.3 + index % 4 * 0.35) * (1 + symbol * index * 2e-3)
    )
  );
  const expected = raw.reduce(
    (sum, awards, symbol) => sum + symbolExpectation(spec, symbol, awards),
    0
  );
  const target = 0.94 + index % 4 * 5e-3 - scatterExpectation(spec);
  spec.pays = raw.map(
    (awards) => awards.map((pay) => Math.max(1, Math.round(pay * target / expected)))
  );
  return spec;
}
function modelEvaluate(grid, spec) {
  if (grid.length !== spec.reels || grid.some(
    (col) => col.length !== spec.rows || col.some(
      (s) => !Number.isInteger(s) || s < 0 || s >= spec.weights.length
    )
  ))
    throw new Error("Invalid slot grid");
  const order = Array.from(
    { length: spec.reels },
    (_, i) => spec.direction === "left" ? i : spec.reels - 1 - i
  ), wins = [];
  if (spec.mode === "lines")
    spec.lines.forEach((rows, line) => {
      const symbol = grid[order[0]][rows[order[0]]];
      if (symbol >= spec.pays.length) return;
      let count = 1;
      while (count < spec.reels && grid[order[count]][rows[order[count]]] === symbol)
        count++;
      if (count >= spec.minimum)
        wins.push({
          symbol,
          count,
          rate: spec.pays[symbol][count - spec.minimum],
          line,
          cells: order.slice(0, count).map((col) => [col, rows[col]])
        });
    });
  else
    spec.pays.forEach((awards, symbol) => {
      let count = 0, ways = 1;
      const cells = [];
      for (const col of order) {
        const matches = grid[col].flatMap(
          (s, row) => s === symbol ? [row] : []
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
          cells
        });
    });
  if (spec.scatter) {
    const symbol = spec.weights.length - 1, cells = [];
    grid.forEach(
      (col, c) => col.forEach((s, r) => {
        if (s === symbol) cells.push([c, r]);
      })
    );
    const award = spec.scatter.awards[cells.length];
    if (award)
      wins.push({
        symbol,
        count: cells.length,
        rate: award * 100,
        cells,
        scatter: true
      });
  }
  return wins;
}
function modelSpin(spec, rng = randomInt) {
  const total = spec.weights.reduce((a, b) => a + b, 0);
  const grid = Array.from(
    { length: spec.reels },
    () => Array.from({ length: spec.rows }, () => {
      let ticket = rng(total);
      for (let i = 0; i < spec.weights.length; i++) {
        ticket -= spec.weights[i];
        if (ticket < 0) return i;
      }
      throw new Error("Invalid weights");
    })
  );
  const wins = modelEvaluate(grid, spec);
  return { grid, wins, rate: wins.reduce((sum, w) => sum + w.rate, 0) };
}

// src/lib/catalog.ts
var profiles = [
  { weights: [32, 24, 18, 12, 8, 4, 2], pays: [8, 16, 32, 80, 160, 400, 1600] },
  { weights: [28, 24, 20, 14, 8, 4, 2], pays: [8, 15, 30, 60, 150, 420, 1800] },
  {
    weights: [35, 25, 16, 10, 7, 5, 2],
    pays: [6, 14, 37, 100, 230, 740, 2300]
  },
  { weights: [30, 25, 20, 12, 7, 4, 2], pays: [8, 15, 30, 85, 200, 600, 2200] }
];
var themes = [
  [
    "solar-vault",
    "Solar Vault",
    "#392515",
    "#ffc663",
    "\u2600",
    "\u2600 \u25C8 \u25C6 \u2726 \u2B21 \u2604 \u265B",
    "orbit",
    "Gold at the edge of a star."
  ],
  [
    "neon-drift",
    "Neon Drift",
    "#191342",
    "#a396ff",
    "\u03DF",
    "\u03DF \u25C6 \u25C8 \u2605 \u2726 \u2604 \u265B",
    "glitch",
    "After dark. Beyond the limit."
  ],
  [
    "jade-temple",
    "Jade Temple",
    "#0c342b",
    "#82edb5",
    "\u2756",
    "\u2756 \u273F \u25C8 \u25C6 \u262F \u2726 \u265B",
    "bloom",
    "A secret beneath the canopy."
  ],
  [
    "lunar-tides",
    "Lunar Tides",
    "#122843",
    "#8edcff",
    "\u263E",
    "\u263E \u2727 \u25C7 \u2653 \u2726 \u2604 \u265B",
    "wave",
    "Follow the silver current."
  ],
  [
    "ember-crown",
    "Ember Crown",
    "#451b20",
    "#ff9881",
    "\u265B",
    "\u265B \u2666 \u2660 \u2665 \u2663 \u2726 \u03DF",
    "flare",
    "A kingdom forged in fire."
  ],
  [
    "velvet-orbit",
    "Velvet Orbit",
    "#321b43",
    "#ecb1ff",
    "\u2726",
    "\u2726 \u263E \u25C8 \u2B21 \u2604 \u2605 \u265B",
    "orbit",
    "Where constellations collide."
  ],
  [
    "coral-cove",
    "Coral Cove",
    "#123943",
    "#83e9e0",
    "\u2653",
    "\u2653 \u25C7 \u2600 \u273F \u2726 \u263E \u265B",
    "wave",
    "Treasures below the surface."
  ],
  [
    "midnight-express",
    "Midnight Express",
    "#24283a",
    "#a8c1f5",
    "\u2660",
    "\u2660 \u25C8 \u2666 \u2663 \u2726 \u2605 \u265B",
    "glitch",
    "Your ticket to the unknown."
  ],
  [
    "saffron-sky",
    "Saffron Sky",
    "#453013",
    "#ffe49a",
    "\u273A",
    "\u273A \u2600 \u25C7 \u273F \u2726 \u2605 \u265B",
    "bloom",
    "A little golden-hour magic."
  ],
  [
    "frost-bloom",
    "Frost Bloom",
    "#22333e",
    "#c0eeff",
    "\u2744",
    "\u2744 \u2727 \u25C7 \u273F \u2726 \u263E \u265B",
    "bloom",
    "Winter has a wild side."
  ],
  [
    "obsidian-echo",
    "Obsidian Echo",
    "#262030",
    "#dfc7f7",
    "\u2B21",
    "\u2B21 \u25C8 \u25C6 \u2727 \u2726 \u2604 \u265B",
    "glitch",
    "Hidden deep. Shining bright."
  ],
  [
    "electric-garden",
    "Electric Garden",
    "#253417",
    "#c9f790",
    "\u273F",
    "\u273F \u2756 \u25C8 \u2600 \u2726 \u03DF \u265B",
    "bloom",
    "Wild roots. Electric nights."
  ],
  [
    "ruby-rebellion",
    "Ruby Rebellion",
    "#3d142b",
    "#ff8ebc",
    "\u2666",
    "\u2666 \u2665 \u25C8 \u25C6 \u2726 \u2605 \u265B",
    "flare",
    "Make your own royal story."
  ],
  [
    "copper-canyon",
    "Copper Canyon",
    "#3b261e",
    "#efbc90",
    "\u25C8",
    "\u25C8 \u2600 \u25C6 \u2B21 \u2726 \u2605 \u265B",
    "flare",
    "Echoes of the frontier."
  ],
  [
    "aurora-arcade",
    "Aurora Arcade",
    "#162f37",
    "#9ef4da",
    "\u2604",
    "\u2604 \u03DF \u25C8 \u25C6 \u2726 \u2605 \u265B",
    "wave",
    "Play under dancing lights."
  ],
  [
    "atlas-of-gold",
    "Atlas of Gold",
    "#30321b",
    "#edee9c",
    "\u2727",
    "\u2727 \u25C8 \u2600 \u25C6 \u2726 \u2605 \u265B",
    "orbit",
    "A world waiting to unfold."
  ]
];
themes.push(
  [
    "thunder-aerie",
    "Thunder Aerie",
    "#112b52",
    "#89d7ff",
    "\u03DF",
    "\u03DF \u2601 \u25C6 \u2726 \u265B \u2604 \u2605",
    "flare",
    "Storm-lit peaks. Twenty-five lightning paths."
  ],
  [
    "sugar-parade",
    "Sugar Parade",
    "#6b2454",
    "#ffbadb",
    "\u273F",
    "\u273F \u2665 \u25C6 \u2726 \u2605 \u2600 \u265B",
    "bloom",
    "A candy-colored carnival of 1,024 ways."
  ],
  [
    "corsair-pearls",
    "Corsair Pearls",
    "#093d46",
    "#76efca",
    "\u2693",
    "\u2653 \u25C6 \u2726 \u2600 \u2605 \u265B \u25C8",
    "wave",
    "Sail right to left into a hidden pirate lagoon."
  ],
  [
    "amber-apiary",
    "Amber Apiary",
    "#593e0c",
    "#ffe385",
    "\u2B21",
    "\u2B21 \u273F \u2600 \u25C6 \u2726 \u2605 \u265B",
    "bloom",
    "Sweet honey routes and golden hive treasures."
  ],
  [
    "clockwork-aurora",
    "Clockwork Aurora",
    "#203b3a",
    "#99ffd4",
    "\u25F7",
    "\u25F7 \u25C8 \u2726 \u25C6 \u2605 \u2600 \u265B",
    "orbit",
    "Four clockwork reels beneath dancing polar lights."
  ],
  [
    "dragon-atelier",
    "Dragon Atelier",
    "#4b1832",
    "#ff9c79",
    "\u265C",
    "\u265C \u2666 \u265B \u2726 \u25C6 \u2604 \u2605",
    "flare",
    "A six-reel dragon workshop with 729 ways."
  ]
);
var originals = themes.map((t, i) => ({
  slug: t[0],
  name: t[1],
  color: t[2],
  accent: t[3],
  emblem: t[4],
  symbols: t[5].split(" "),
  animation: t[6],
  tagline: t[7],
  kind: "slots",
  math: profiles[i % 4],
  slot: makeSlotSpec(i, profiles[i % 4])
}));
originals.push(
  {
    slug: "noir-blackjack",
    name: "Noir Blackjack",
    kind: "blackjack",
    color: "#183128",
    accent: "#bae4c9",
    emblem: "\u2660",
    symbols: [],
    animation: "orbit",
    tagline: "Five hands. One dealer. Your table.",
    math: profiles[0]
  },
  {
    slug: "royal-draw",
    name: "Royal Hold\u2019em",
    kind: "poker",
    color: "#31213d",
    accent: "#dcc0ff",
    emblem: "\u2663",
    symbols: [],
    animation: "bloom",
    tagline: "Your two cards. Five on the board. Make your move.",
    math: profiles[0]
  },
  {
    slug: "orbit-roulette",
    name: "Orbit Roulette",
    kind: "roulette",
    color: "#302b20",
    accent: "#ead197",
    emblem: "\u25C9",
    symbols: [],
    animation: "orbit",
    tagline: "One wheel. Thirty-seven possibilities.",
    math: profiles[0]
  }
);
originals.push(
  ...[
    [
      "prism-dice",
      "Prism Dice",
      "dice",
      "#12304f",
      "#68dfff",
      "\u2684",
      "Pick your chance. Watch the prism roll."
    ],
    [
      "meteor-plinko",
      "Meteor Plinko",
      "plinko",
      "#29164e",
      "#ddaeff",
      "\u2726",
      "Eight cosmic bounces. Nine landing zones."
    ],
    [
      "festival-wheel",
      "Festival Wheel",
      "wheel",
      "#4c2037",
      "#ffd184",
      "\u25C9",
      "Twenty lights. One festival prize."
    ]
  ].map(([slug, name, mini, color, accent, emblem, tagline]) => ({
    slug,
    name,
    mini,
    color,
    accent,
    emblem,
    tagline,
    kind: "instant",
    symbols: [],
    animation: "orbit",
    math: profiles[0]
  }))
);

// src/lib/minigames.ts
var wheelPays = [
  0,
  100,
  0,
  150,
  0,
  100,
  0,
  200,
  0,
  340,
  0,
  100,
  0,
  150,
  0,
  200,
  0,
  100,
  0,
  500
];
var plinkoPays = [1e3, 350, 140, 60, 40, 60, 140, 350, 1e3];
function miniPlay(type, stake, input = {}, rng = randomInt) {
  if (!Number.isSafeInteger(stake) || stake < 100 || stake > 2e4 || stake % 100)
    throw new Error("Invalid minigame stake");
  if (type === "dice") {
    const threshold = input.threshold ?? 5e3;
    if (!Number.isInteger(threshold) || Number(threshold) < 500 || Number(threshold) > 9500 || input.over !== void 0 && typeof input.over !== "boolean")
      throw new Error("Invalid dice chance");
    const target = Number(threshold), over = input.over === true, roll = rng(1e4);
    const win = over ? roll >= 1e4 - target : roll < target;
    const returned_minor = win ? Math.floor(stake * 9700 / target) : 0;
    return {
      type,
      roll,
      threshold: target,
      over,
      multiplier: returned_minor / stake,
      returned_minor
    };
  }
  if (type === "plinko") {
    const path = Array.from({ length: 8 }, () => rng(2));
    const bin = path.reduce((a, b) => a + b, 0), rate = plinkoPays[bin];
    return {
      type,
      path,
      bin,
      multiplier: rate / 100,
      returned_minor: stake / 100 * rate
    };
  }
  if (type === "wheel") {
    const sector = rng(20), rate = wheelPays[sector];
    return {
      type,
      sector,
      multiplier: rate / 100,
      returned_minor: stake / 100 * rate
    };
  }
  throw new Error("Unknown minigame");
}

// src/lib/blackjack.ts
var MAIN_MAX = 2e4;
function validateBets(bets) {
  if (bets.length !== 5) throw new Error("Five betting spots required");
  for (const b of bets) {
    if (![b.main, b.three, b.pair].every(
      (n) => Number.isSafeInteger(n) && n >= 0 && n % 100 === 0
    ))
      throw new Error("Bets must use whole demo credits");
    if (b.main && (b.main < 100 || b.main > MAIN_MAX))
      throw new Error("Main bet range is 1\u2013200 credits");
    if (b.three > b.main || b.pair > b.main)
      throw new Error("Each side bet must not exceed its main bet");
  }
  if (!bets.some((b) => b.main)) throw new Error("Place at least one main bet");
  return bets.reduce((n, b) => n + b.main + b.three + b.pair, 0);
}
function eightDeckShoe(rng = randomInt) {
  const cards = Array.from({ length: 416 }, (_, i) => ({
    rank: i % 13 + 2,
    suit: Math.floor(i / 13) % 4,
    id: "card-" + i
  }));
  for (let i = cards.length - 1; i > 0; i--) {
    const j = rng(i + 1);
    if (!Number.isInteger(j) || j < 0 || j > i)
      throw new Error("Invalid shuffle draw");
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}
var result = (name, odds, stake) => ({
  name,
  odds,
  returned: odds ? (odds + 1) * stake : 0
});
function perfectPair(cards, stake) {
  if (cards.length !== 2) throw new Error("Two initial cards required");
  const [a, b] = cards;
  if (a.rank !== b.rank) return result("No pair", 0, stake);
  if (a.suit === b.suit) return result("Perfect pair", 26, stake);
  if (a.suit % 2 === b.suit % 2) return result("Colored pair", 12, stake);
  return result("Mixed pair", 5, stake);
}
function twentyOneThree(cards, stake) {
  if (cards.length !== 3)
    throw new Error("Two initial player cards and dealer up-card required");
  const ranks = cards.map((c) => c.rank).sort((a, b) => a - b), flush = cards.every((c) => c.suit === cards[0].suit), trips = ranks[0] === ranks[2];
  const straight = new Set(ranks).size === 3 && (ranks[2] - ranks[0] === 2 || ranks.join() === "2,3,14");
  if (trips && flush) return result("Suited trips", 100, stake);
  if (straight && flush) return result("Straight flush", 40, stake);
  if (trips) return result("Three of a kind", 30, stake);
  if (straight) return result("Straight", 10, stake);
  if (flush) return result("Flush", 5, stake);
  return result("No combination", 0, stake);
}
var sideReturn = (s) => s.sideResults.reduce((n, r) => n + r.three.returned + r.pair.returned, 0);
function createBlackjack(bets, rng = randomInt) {
  const totalStake = validateBets(bets), shoe = eightDeckShoe(rng), hands = bets.flatMap(
    (b, seat) => b.main ? [
      {
        id: "seat-" + seat,
        seat,
        cards: [],
        bet: b.main,
        split: false,
        aces: false,
        done: false,
        surrendered: false
      }
    ] : []
  ), dealer = [];
  for (let pass = 0; pass < 2; pass++) {
    for (const h of hands) h.cards.push(shoe.pop());
    dealer.push(shoe.pop());
  }
  const s = {
    shoe,
    dealer,
    hands,
    bets: bets.map((b) => ({ ...b })),
    insurance: Array(5).fill(0),
    sideResults: bets.map((b, seat) => {
      const h = hands.find((h2) => h2.seat === seat);
      return h ? {
        three: twentyOneThree([...h.cards, dealer[0]], b.three),
        pair: perfectPair(h.cards, b.pair)
      } : { three: result("No bet", 0, 0), pair: result("No bet", 0, 0) };
    }),
    active: 0,
    phase: dealer[0].rank === 14 ? "insurance" : "playing",
    totalStake,
    returned: 0
  };
  return s.phase === "insurance" ? s : enterPlay(s);
}
function copyRound(s) {
  return {
    ...s,
    shoe: [...s.shoe],
    dealer: [...s.dealer],
    hands: s.hands.map((h) => ({ ...h, cards: [...h.cards] })),
    bets: s.bets.map((b) => ({ ...b })),
    insurance: [...s.insurance]
  };
}
var isNatural = (h) => !h.split && h.cards.length === 2 && handValue(h.cards).total === 21;
function dealerBlackjack(s) {
  return s.dealer.length === 2 && handValue(s.dealer).total === 21;
}
function enterPlay(s) {
  if (dealerBlackjack(s)) return settleBlackjack(s);
  s.phase = "playing";
  for (const h of s.hands) if (isNatural(h)) h.done = true;
  return advance(s);
}
function insuranceCost(s, seats) {
  if (s.phase !== "insurance")
    throw new Error("Insurance is only available before the ace peek");
  if (new Set(seats).size !== seats.length || seats.some((i) => !Number.isInteger(i) || !s.bets[i]?.main))
    throw new Error("Select occupied spots once");
  return seats.reduce((n, i) => n + s.bets[i].main / 2, 0);
}
function chooseInsurance(round, seats) {
  const cost = insuranceCost(round, seats), s = copyRound(round);
  for (const i of seats) s.insurance[i] = s.bets[i].main / 2;
  s.totalStake += cost;
  return enterPlay(s);
}
function advance(s) {
  while (s.active < s.hands.length && s.hands[s.active].done) s.active++;
  if (s.active === s.hands.length) s.phase = "dealer";
  return s;
}
function allowedActions(s) {
  const h = s.hands[s.active];
  if (s.phase !== "playing" || !h || h.done)
    return {
      hit: false,
      stand: false,
      double: false,
      split: false,
      surrender: false
    };
  return {
    hit: !h.aces,
    stand: true,
    double: h.cards.length === 2 && !h.aces,
    split: h.cards.length === 2 && !h.split && h.cards[0].rank === h.cards[1].rank,
    surrender: h.cards.length === 2 && !h.split
  };
}
function blackjackActionCost(s, action) {
  if (!allowedActions(s)[action]) throw new Error("Action unavailable");
  return action === "double" || action === "split" ? s.hands[s.active].bet : 0;
}
function actBlackjack(round, action) {
  const cost = blackjackActionCost(round, action), s = copyRound(round), h = s.hands[s.active];
  s.totalStake += cost;
  if (action === "stand") h.done = true;
  if (action === "surrender") {
    h.surrendered = true;
    h.done = true;
  }
  if (action === "hit" || action === "double") {
    if (action === "double") h.bet *= 2;
    h.cards.push(s.shoe.pop());
    h.done = action === "double" || handValue(h.cards).total >= 21;
  }
  if (action === "split") {
    const aces = h.cards[0].rank === 14;
    const newHands = h.cards.map((card, i) => ({
      ...h,
      id: h.id + "-" + i,
      cards: [card, s.shoe.pop()],
      split: true,
      aces,
      done: aces,
      surrendered: false
    }));
    for (const split of newHands)
      if (handValue(split.cards).total === 21) split.done = true;
    s.hands.splice(s.active, 1, ...newHands);
  }
  return advance(s);
}
function dealerShouldHit(s) {
  const value = handValue(s.dealer);
  return value.total < 17 || value.total === 17 && value.soft;
}
function dealerNeedsPlay(s) {
  return s.hands.some(
    (h) => !h.surrendered && !isNatural(h) && handValue(h.cards).total <= 21
  );
}
function drawDealer(round) {
  if (round.phase !== "dealer" || !dealerShouldHit(round) || !dealerNeedsPlay(round))
    throw new Error("Dealer cannot draw");
  const s = copyRound(round);
  s.dealer.push(s.shoe.pop());
  return s;
}
function mainReturn(h, dealer) {
  return h.surrendered ? h.bet / 2 : blackjackReturn(h.cards, dealer, h.bet, !h.split);
}
function settleBlackjack(round) {
  const s = copyRound(round);
  s.phase = "done";
  s.returned = sideReturn(s) + s.hands.reduce((n, h) => n + mainReturn(h, s.dealer), 0) + (dealerBlackjack(s) ? s.insurance.reduce((n, b) => n + b * 3, 0) : 0);
  return s;
}

// src/lib/holdem.ts
var names = [
  "High card",
  "Pair",
  "Two pair",
  "Three of a kind",
  "Straight",
  "Flush",
  "Full house",
  "Four of a kind",
  "Straight flush"
];
function compareRanks(a, b) {
  if (a.category !== b.category) return a.category - b.category;
  for (let i = 0; i < Math.max(a.kickers.length, b.kickers.length); i++) {
    const difference = (a.kickers[i] || 0) - (b.kickers[i] || 0);
    if (difference) return difference;
  }
  return 0;
}
function rankFive(cards) {
  if (cards.length !== 5 || new Set(cards.map((c) => c.rank + ":" + c.suit)).size !== 5)
    throw new Error("Five unique cards required");
  const ranks = cards.map((c) => c.rank).sort((a, b) => b - a), groups = [...new Set(ranks)].map((rank) => ({ rank, count: ranks.filter((r) => r === rank).length })).sort((a, b) => b.count - a.count || b.rank - a.rank);
  const flush = cards.every((c) => c.suit === cards[0].suit);
  const straight = new Set(ranks).size === 5 && (ranks[0] - ranks[4] === 4 || ranks.join() === "14,5,4,3,2");
  const high = ranks.join() === "14,5,4,3,2" ? 5 : ranks[0];
  let category = 0, kickers = ranks;
  if (flush && straight) {
    category = 8;
    kickers = [high];
  } else if (groups[0].count === 4) {
    category = 7;
    kickers = groups.map((g) => g.rank);
  } else if (groups[0].count === 3 && groups[1].count === 2) {
    category = 6;
    kickers = groups.map((g) => g.rank);
  } else if (flush) category = 5;
  else if (straight) {
    category = 4;
    kickers = [high];
  } else if (groups[0].count === 3) {
    category = 3;
    kickers = groups.map((g) => g.rank);
  } else if (groups[0].count === 2 && groups[1].count === 2) {
    category = 2;
    kickers = groups.map((g) => g.rank);
  } else if (groups[0].count === 2) {
    category = 1;
    kickers = groups.map((g) => g.rank);
  }
  return {
    category,
    kickers,
    name: category === 8 && high === 14 ? "Royal flush" : names[category],
    cards
  };
}
function bestHand(cards) {
  if (cards.length < 5 || cards.length > 7 || new Set(cards.map((c) => c.rank + ":" + c.suit)).size !== cards.length)
    throw new Error("Five to seven unique cards required");
  let best = null;
  for (let a = 0; a < cards.length - 4; a++)
    for (let b = a + 1; b < cards.length - 3; b++)
      for (let c = b + 1; c < cards.length - 2; c++)
        for (let d = c + 1; d < cards.length - 1; d++)
          for (let e = d + 1; e < cards.length; e++) {
            const candidate = rankFive([
              cards[a],
              cards[b],
              cards[c],
              cards[d],
              cards[e]
            ]);
            if (!best || compareRanks(candidate, best) > 0) best = candidate;
          }
  return best;
}
var around = (start) => Array.from({ length: 3 }, (_, i) => (start + i) % 3);
var active = (s) => s.players.flatMap((p, i) => !p.folded && p.stack > 0 ? [i] : []);
var commit = (p, amount2) => {
  const paid = Math.min(p.stack, amount2);
  p.stack -= paid;
  p.streetBet += paid;
  p.contributed += paid;
  return paid;
};
function createHoldem(buyIn, dealer = 0, rng = randomInt) {
  if (!Number.isSafeInteger(buyIn) || buyIn < 100 || buyIn % 20 !== 0)
    throw new Error("Invalid buy-in");
  const shoe = deck(rng), players = ["You", "Mira", "Atlas"].map((name) => ({
    name,
    hole: [],
    stack: buyIn,
    contributed: 0,
    streetBet: 0,
    folded: false,
    action: ""
  }));
  for (let round = 0; round < 2; round++)
    around((dealer + 1) % 3).forEach((i) => players[i].hole.push(shoe.pop()));
  const smallBlind = buyIn / 20, bigBlind = buyIn / 10;
  commit(players[(dealer + 1) % 3], smallBlind);
  players[(dealer + 1) % 3].action = "Small blind";
  commit(players[(dealer + 2) % 3], bigBlind);
  players[(dealer + 2) % 3].action = "Big blind";
  return {
    players,
    board: [],
    shoe,
    dealer,
    smallBlind,
    bigBlind,
    street: "preflop",
    currentBet: bigBlind,
    minRaise: bigBlind,
    pending: around(dealer),
    actedAt: [-1, -1, -1],
    pots: [],
    awards: [0, 0, 0],
    ranks: [null, null, null],
    showdown: false,
    log: ["Blinds posted. Preflop betting."]
  };
}
function legalPoker(s) {
  const actor = s.pending[0], p = s.players[actor];
  if (s.street === "done" || !p)
    return { actor: -1, toCall: 0, minTo: 0, maxTo: 0, canRaise: false };
  const toCall = Math.max(0, s.currentBet - p.streetBet), maxTo = p.streetBet + p.stack, minTo = s.currentBet + s.minRaise;
  const reopened = s.actedAt[actor] < 0 || s.currentBet - s.actedAt[actor] >= s.minRaise;
  return {
    actor,
    toCall,
    minTo,
    maxTo,
    canRaise: reopened && maxTo > s.currentBet && active(s).some((i) => i !== actor)
  };
}
function distributePots(players, board, dealer) {
  const levels = [
    ...new Set(players.map((p) => p.contributed).filter((n) => n > 0))
  ].sort((a, b) => a - b);
  const ranks = players.map(
    (p) => p.folded || board.length !== 5 ? null : bestHand([...p.hole, ...board])
  );
  const awards = [0, 0, 0], pots = [];
  let previous = 0;
  const live = players.flatMap((p, i) => p.folded ? [] : [i]);
  levels.forEach((level) => {
    const members = players.flatMap(
      (p, i) => p.contributed >= level ? [i] : []
    ), amount2 = (level - previous) * members.length;
    previous = level;
    const eligible = members.filter((i) => !players[i].folded);
    let winners;
    if (members.length === 1) winners = members;
    else if (live.length === 1) winners = live;
    else {
      if (!eligible.length) throw new Error("Pot has no eligible player");
      winners = [eligible[0]];
      eligible.slice(1).forEach((i) => {
        const comparison = compareRanks(ranks[i], ranks[winners[0]]);
        if (comparison > 0) winners = [i];
        else if (!comparison) winners.push(i);
      });
    }
    const share = Math.floor(amount2 / winners.length);
    winners.forEach((i) => awards[i] += share);
    let remainder = amount2 - share * winners.length;
    around((dealer + 1) % 3).filter((i) => winners.includes(i)).forEach((i) => {
      if (remainder > 0) {
        awards[i]++;
        remainder--;
      }
    });
    pots.push({ amount: amount2, eligible, winners });
  });
  return { pots, awards, ranks };
}
function finish(s) {
  s.showdown = s.players.filter((p) => !p.folded).length > 1;
  const result2 = distributePots(s.players, s.board, s.dealer);
  Object.assign(s, result2);
  s.players.forEach((p, i) => p.stack += s.awards[i]);
  s.street = "done";
  s.pending = [];
  s.log.push(
    s.showdown ? "Showdown. Pots awarded to the best eligible hands." : "All opponents folded. Pot awarded."
  );
}
function nextStreet(s) {
  if (s.street === "river") {
    finish(s);
    return;
  }
  s.shoe.pop();
  const count = s.street === "preflop" ? 3 : 1;
  for (let i = 0; i < count; i++) s.board.push(s.shoe.pop());
  s.street = s.board.length === 3 ? "flop" : s.board.length === 4 ? "turn" : "river";
  s.currentBet = 0;
  s.minRaise = s.bigBlind;
  s.actedAt = [-1, -1, -1];
  s.players.forEach((p) => p.streetBet = 0);
  s.pending = around((s.dealer + 1) % 3).filter((i) => active(s).includes(i));
  s.log.push(s.street[0].toUpperCase() + s.street.slice(1) + " dealt.");
  if (active(s).length <= 1) {
    s.pending = [];
    nextStreet(s);
  }
}
function pokerAct(current, action) {
  const legal = legalPoker(current);
  if (legal.actor < 0) throw new Error("Hand is complete");
  const s = {
    ...current,
    players: current.players.map((p2) => ({ ...p2, hole: [...p2.hole] })),
    board: [...current.board],
    shoe: [...current.shoe],
    pending: [...current.pending],
    actedAt: [...current.actedAt],
    log: [...current.log]
  };
  const actor = legal.actor, p = s.players[actor];
  s.pending.shift();
  if (action.kind === "fold") {
    p.folded = true;
    p.action = "Fold";
  } else if (action.kind === "check") {
    if (legal.toCall > 0) throw new Error("Cannot check facing a bet");
    p.action = "Check";
  } else if (action.kind === "call") {
    const amount2 = commit(p, legal.toCall);
    p.action = p.stack === 0 ? "All-in call" : "Call " + (amount2 / 100).toFixed(2);
  } else {
    const to = action.to;
    if (!legal.canRaise || !Number.isSafeInteger(to) || to > s.players[actor].streetBet + p.stack || to <= s.currentBet || to < legal.minTo && to !== legal.maxTo)
      throw new Error("Illegal raise");
    const raise = to - s.currentBet, full = raise >= s.minRaise;
    commit(p, to - p.streetBet);
    s.currentBet = to;
    p.action = p.stack === 0 ? "All-in" : "Raise to " + (to / 100).toFixed(2);
    if (full) {
      s.minRaise = raise;
      s.actedAt = [-1, -1, -1];
    }
    s.pending = around((actor + 1) % 3).filter(
      (i) => i !== actor && !s.players[i].folded && s.players[i].stack > 0 && (full || s.pending.includes(i) || s.players[i].streetBet < s.currentBet)
    );
  }
  s.actedAt[actor] = s.currentBet;
  s.pending = s.pending.filter(
    (i) => !s.players[i].folded && s.players[i].stack > 0
  );
  s.log.push(p.name + ": " + p.action + ".");
  s.log = s.log.slice(-12);
  if (s.players.filter((p2) => !p2.folded).length === 1) finish(s);
  else if (!s.pending.length) nextStreet(s);
  return s;
}
function botAction(hole, board, legal, bigBlind, rng = randomInt) {
  const strength = board.length >= 3 ? bestHand([...hole, ...board]).category : hole[0].rank === hole[1].rank ? 2 : Math.max(...hole.map((c) => c.rank)) >= 12 ? 1 : 0;
  const roll = rng(100);
  if (legal.toCall > 0 && strength === 0 && legal.toCall > bigBlind && roll < 55)
    return { kind: "fold" };
  if (legal.canRaise && (strength >= 2 ? roll < 45 : roll < 12))
    return {
      kind: "raise",
      to: Math.min(
        legal.maxTo,
        legal.minTo + bigBlind * (strength >= 3 ? 2 : 0)
      )
    };
  return { kind: legal.toCall ? "call" : "check" };
}

// src/lib/cashEngine.ts
var CASH_MODEL = "spindra-cash-v1";
function amount(v) {
  if (!Number.isSafeInteger(v) || Number(v) < 100 || Number(v) > 2e4 || Number(v) % 100 !== 0)
    throw new Error("Stake must be a whole USD amount from $1 to $200");
  return Number(v);
}
function finishDealer(s) {
  let next = s;
  let count = 0;
  while (next.phase === "dealer" && dealerNeedsPlay(next) && dealerShouldHit(next)) {
    if (count++ > 30) throw new Error("Dealer draw limit");
    next = drawDealer(next);
  }
  return next.phase === "dealer" ? settleBlackjack(next) : next;
}
function bots(s, rng) {
  let next = s;
  let count = 0;
  while (next.street !== "done" && legalPoker(next).actor !== 0) {
    if (count++ > 150) throw new Error("Computer action limit");
    const actor = legalPoker(next).actor;
    if (actor < 0) throw new Error("Invalid turn");
    next = pokerAct(
      next,
      botAction(
        next.players[actor].hole,
        next.board,
        legalPoker(next),
        next.bigBlind,
        rng
      )
    );
  }
  return next;
}
function newCashRound(game, input, rng = randomInt) {
  const g = originals.find((g2) => g2.slug === game);
  if (!g) throw new Error("Unknown game");
  let data, stake = amount(input.bet), returned = 0, done = true;
  if (g.kind === "instant" && g.mini) {
    const result2 = miniPlay(g.mini, stake, input, rng);
    data = result2;
    returned = result2.returned_minor;
  } else if (g.kind === "slots") {
    const result2 = modelSpin(g.slot, rng);
    returned = stake / 100 * result2.rate;
    data = result2;
  } else if (g.kind === "roulette") {
    const kind = input.kind;
    if (!["red", "black", "even", "odd", "straight"].includes(kind))
      throw new Error("Invalid roulette bet");
    const straight = Number(input.straight ?? 0);
    if (!Number.isInteger(straight) || straight < 0 || straight > 36)
      throw new Error("Invalid pocket");
    const pocket = rng(37);
    returned = rouletteReturn(pocket, kind, stake, straight);
    data = { pocket, kind, straight };
  } else if (g.kind === "blackjack") {
    const bets = input.bets;
    if (!Array.isArray(bets) || bets.some(
      (b) => !b || Object.keys(b).some((k) => !["main", "three", "pair"].includes(k))
    ))
      throw new Error("Invalid blackjack bets");
    const s = finishDealer(createBlackjack(bets, rng));
    data = s;
    stake = s.totalStake;
    returned = s.returned;
    done = s.phase === "done";
  } else {
    const dealer = Number(input.dealer ?? 0);
    if (!Number.isInteger(dealer) || dealer < 0 || dealer > 2)
      throw new Error("Invalid dealer");
    const s = bots(createHoldem(stake, dealer, rng), rng);
    data = s;
    done = s.street === "done";
    returned = done ? s.players[0].stack : 0;
  }
  if (!Number.isSafeInteger(returned) || returned < 0)
    throw new Error("Invalid game return");
  return {
    model: CASH_MODEL,
    game,
    kind: g.kind,
    phase: done ? "settled" : "open",
    stake_minor: stake,
    returned_minor: returned,
    data
  };
}
function nextCashRound(old, command, rng = randomInt) {
  if (old.model !== CASH_MODEL || old.phase !== "open")
    throw new Error("Round is not open");
  const next = structuredClone(old);
  if (old.kind === "blackjack") {
    let s = next.data;
    if (command.action === "abandon") {
      if (s.phase === "insurance") s = chooseInsurance(s, []);
      let guard = 0;
      while (s.phase === "playing") {
        if (guard++ > 12) throw new Error("Hand limit");
        s = actBlackjack(s, "stand");
      }
    } else if (command.action === "insurance") {
      const seats = command.seats ?? [];
      insuranceCost(s, seats);
      s = chooseInsurance(s, seats);
    } else {
      const action = command.action;
      if (!["hit", "stand", "double", "split", "surrender"].includes(action))
        throw new Error("Invalid blackjack action");
      blackjackActionCost(s, action);
      s = actBlackjack(s, action);
    }
    s = finishDealer(s);
    next.data = s;
    next.stake_minor = s.totalStake;
    next.returned_minor = s.returned;
    next.phase = s.phase === "done" ? "settled" : "open";
  } else if (old.kind === "poker") {
    let s = next.data;
    if (command.action === "abandon") {
      next.phase = "settled";
      next.returned_minor = s.players[0].stack;
      return next;
    }
    if (!["fold", "check", "call", "raise"].includes(command.action))
      throw new Error("Invalid poker action");
    const action = { kind: command.action, to: command.to };
    s = bots(pokerAct(s, action), rng);
    next.data = s;
    next.phase = s.street === "done" ? "settled" : "open";
    next.returned_minor = s.street === "done" ? s.players[0].stack : 0;
  } else throw new Error("No actions for this game");
  if (!Number.isSafeInteger(next.returned_minor) || next.returned_minor < 0 || !Number.isSafeInteger(next.stake_minor))
    throw new Error("Invalid settlement");
  return next;
}
function publicCash(s) {
  const base = {
    model: s.model,
    game: s.game,
    kind: s.kind,
    phase: s.phase,
    stake_minor: s.stake_minor,
    returned_minor: s.returned_minor
  };
  if (s.kind === "blackjack") {
    const b = s.data;
    return {
      ...base,
      table: {
        phase: b.phase,
        dealer: b.phase === "done" ? b.dealer : [b.dealer[0], null],
        hands: b.hands,
        bets: b.bets,
        sideResults: b.sideResults,
        insurance: b.insurance,
        active: b.active
      },
      allowed: allowedActions(b)
    };
  }
  if (s.kind === "poker") {
    const p = s.data;
    return {
      ...base,
      table: {
        players: p.players.map((v, i) => ({
          ...v,
          hole: i === 0 || p.street === "done" && p.showdown && !v.folded ? v.hole : [null, null]
        })),
        board: p.board,
        dealer: p.dealer,
        street: p.street,
        pots: p.pots,
        log: p.log,
        showdown: p.showdown
      },
      allowed: legalPoker(p)
    };
  }
  return { ...base, result: s.data };
}
export {
  CASH_MODEL,
  newCashRound,
  nextCashRound,
  publicCash
};
