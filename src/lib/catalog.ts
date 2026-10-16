import { makeSlotSpec, modelRtp, type SlotSpec } from "./slotModels";
import { type SlotMath } from "./engine";
import type { MiniKind } from "./minigames";
export type Original = {
  slug: string;
  name: string;
  kind: "slots" | "blackjack" | "poker" | "roulette" | "instant";
  mini?: MiniKind;
  color: string;
  accent: string;
  emblem: string;
  symbols: string[];
  animation: string;
  tagline: string;
  math: SlotMath;
  slot?: SlotSpec;
};
const profiles: SlotMath[] = [
  { weights: [32, 24, 18, 12, 8, 4, 2], pays: [8, 16, 32, 80, 160, 400, 1600] },
  { weights: [28, 24, 20, 14, 8, 4, 2], pays: [8, 15, 30, 60, 150, 420, 1800] },
  {
    weights: [35, 25, 16, 10, 7, 5, 2],
    pays: [6, 14, 37, 100, 230, 740, 2300],
  },
  { weights: [30, 25, 20, 12, 7, 4, 2], pays: [8, 15, 30, 85, 200, 600, 2200] },
];
const themes = [
  [
    "solar-vault",
    "Solar Vault",
    "#392515",
    "#ffc663",
    "☀",
    "☀ ◈ ◆ ✦ ⬡ ☄ ♛",
    "orbit",
    "Gold at the edge of a star.",
  ],
  [
    "neon-drift",
    "Neon Drift",
    "#191342",
    "#a396ff",
    "ϟ",
    "ϟ ◆ ◈ ★ ✦ ☄ ♛",
    "glitch",
    "After dark. Beyond the limit.",
  ],
  [
    "jade-temple",
    "Jade Temple",
    "#0c342b",
    "#82edb5",
    "❖",
    "❖ ✿ ◈ ◆ ☯ ✦ ♛",
    "bloom",
    "A secret beneath the canopy.",
  ],
  [
    "lunar-tides",
    "Lunar Tides",
    "#122843",
    "#8edcff",
    "☾",
    "☾ ✧ ◇ ♓ ✦ ☄ ♛",
    "wave",
    "Follow the silver current.",
  ],
  [
    "ember-crown",
    "Ember Crown",
    "#451b20",
    "#ff9881",
    "♛",
    "♛ ♦ ♠ ♥ ♣ ✦ ϟ",
    "flare",
    "A kingdom forged in fire.",
  ],
  [
    "velvet-orbit",
    "Velvet Orbit",
    "#321b43",
    "#ecb1ff",
    "✦",
    "✦ ☾ ◈ ⬡ ☄ ★ ♛",
    "orbit",
    "Where constellations collide.",
  ],
  [
    "coral-cove",
    "Coral Cove",
    "#123943",
    "#83e9e0",
    "♓",
    "♓ ◇ ☀ ✿ ✦ ☾ ♛",
    "wave",
    "Treasures below the surface.",
  ],
  [
    "midnight-express",
    "Midnight Express",
    "#24283a",
    "#a8c1f5",
    "♠",
    "♠ ◈ ♦ ♣ ✦ ★ ♛",
    "glitch",
    "Your ticket to the unknown.",
  ],
  [
    "saffron-sky",
    "Saffron Sky",
    "#453013",
    "#ffe49a",
    "✺",
    "✺ ☀ ◇ ✿ ✦ ★ ♛",
    "bloom",
    "A little golden-hour magic.",
  ],
  [
    "frost-bloom",
    "Frost Bloom",
    "#22333e",
    "#c0eeff",
    "❄",
    "❄ ✧ ◇ ✿ ✦ ☾ ♛",
    "bloom",
    "Winter has a wild side.",
  ],
  [
    "obsidian-echo",
    "Obsidian Echo",
    "#262030",
    "#dfc7f7",
    "⬡",
    "⬡ ◈ ◆ ✧ ✦ ☄ ♛",
    "glitch",
    "Hidden deep. Shining bright.",
  ],
  [
    "electric-garden",
    "Electric Garden",
    "#253417",
    "#c9f790",
    "✿",
    "✿ ❖ ◈ ☀ ✦ ϟ ♛",
    "bloom",
    "Wild roots. Electric nights.",
  ],
  [
    "ruby-rebellion",
    "Ruby Rebellion",
    "#3d142b",
    "#ff8ebc",
    "♦",
    "♦ ♥ ◈ ◆ ✦ ★ ♛",
    "flare",
    "Make your own royal story.",
  ],
  [
    "copper-canyon",
    "Copper Canyon",
    "#3b261e",
    "#efbc90",
    "◈",
    "◈ ☀ ◆ ⬡ ✦ ★ ♛",
    "flare",
    "Echoes of the frontier.",
  ],
  [
    "aurora-arcade",
    "Aurora Arcade",
    "#162f37",
    "#9ef4da",
    "☄",
    "☄ ϟ ◈ ◆ ✦ ★ ♛",
    "wave",
    "Play under dancing lights.",
  ],
  [
    "atlas-of-gold",
    "Atlas of Gold",
    "#30321b",
    "#edee9c",
    "✧",
    "✧ ◈ ☀ ◆ ✦ ★ ♛",
    "orbit",
    "A world waiting to unfold.",
  ],
];
themes.push(
  [
    "thunder-aerie",
    "Thunder Aerie",
    "#112b52",
    "#89d7ff",
    "ϟ",
    "ϟ ☁ ◆ ✦ ♛ ☄ ★",
    "flare",
    "Storm-lit peaks. Twenty-five lightning paths.",
  ],
  [
    "sugar-parade",
    "Sugar Parade",
    "#6b2454",
    "#ffbadb",
    "✿",
    "✿ ♥ ◆ ✦ ★ ☀ ♛",
    "bloom",
    "A candy-colored carnival of 1,024 ways.",
  ],
  [
    "corsair-pearls",
    "Corsair Pearls",
    "#093d46",
    "#76efca",
    "⚓",
    "♓ ◆ ✦ ☀ ★ ♛ ◈",
    "wave",
    "Sail right to left into a hidden pirate lagoon.",
  ],
  [
    "amber-apiary",
    "Amber Apiary",
    "#593e0c",
    "#ffe385",
    "⬡",
    "⬡ ✿ ☀ ◆ ✦ ★ ♛",
    "bloom",
    "Sweet honey routes and golden hive treasures.",
  ],
  [
    "clockwork-aurora",
    "Clockwork Aurora",
    "#203b3a",
    "#99ffd4",
    "◷",
    "◷ ◈ ✦ ◆ ★ ☀ ♛",
    "orbit",
    "Four clockwork reels beneath dancing polar lights.",
  ],
  [
    "dragon-atelier",
    "Dragon Atelier",
    "#4b1832",
    "#ff9c79",
    "♜",
    "♜ ♦ ♛ ✦ ◆ ☄ ★",
    "flare",
    "A six-reel dragon workshop with 729 ways.",
  ],
);
export const originals: Original[] = themes.map((t, i) => ({
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
  slot: makeSlotSpec(i, profiles[i % 4]),
}));
originals.push(
  {
    slug: "noir-blackjack",
    name: "Noir Blackjack",
    kind: "blackjack",
    color: "#183128",
    accent: "#bae4c9",
    emblem: "♠",
    symbols: [],
    animation: "orbit",
    tagline: "Five hands. One dealer. Your table.",
    math: profiles[0],
  },
  {
    slug: "royal-draw",
    name: "Royal Hold’em",
    kind: "poker",
    color: "#31213d",
    accent: "#dcc0ff",
    emblem: "♣",
    symbols: [],
    animation: "bloom",
    tagline: "Your two cards. Five on the board. Make your move.",
    math: profiles[0],
  },
  {
    slug: "orbit-roulette",
    name: "Orbit Roulette",
    kind: "roulette",
    color: "#302b20",
    accent: "#ead197",
    emblem: "◉",
    symbols: [],
    animation: "orbit",
    tagline: "One wheel. Thirty-seven possibilities.",
    math: profiles[0],
  },
);
originals.push(
  ...(
    [
      [
        "prism-dice",
        "Prism Dice",
        "dice",
        "#12304f",
        "#68dfff",
        "⚄",
        "Pick your chance. Watch the prism roll.",
      ],
      [
        "meteor-plinko",
        "Meteor Plinko",
        "plinko",
        "#29164e",
        "#ddaeff",
        "✦",
        "Eight cosmic bounces. Nine landing zones.",
      ],
      [
        "festival-wheel",
        "Festival Wheel",
        "wheel",
        "#4c2037",
        "#ffd184",
        "◉",
        "Twenty lights. One festival prize.",
      ],
    ] as const
  ).map(([slug, name, mini, color, accent, emblem, tagline]) => ({
    slug,
    name,
    mini,
    color,
    accent,
    emblem,
    tagline,
    kind: "instant" as const,
    symbols: [],
    animation: "orbit",
    math: profiles[0],
  })),
);
export const rtpLabel = (g: Original) =>
  g.kind === "slots"
    ? "Up to " + (modelRtp(g.slot!) * 100).toFixed(2) + "% theoretical RTP"
    : g.mini
      ? g.mini === "plinko"
        ? "97.50% theoretical RTP"
        : g.mini === "dice"
          ? "Up to 97.00% theoretical RTP"
          : "97.00% theoretical RTP"
      : g.kind === "roulette"
        ? "97.30% theoretical RTP"
        : "Returns depend on decisions";
