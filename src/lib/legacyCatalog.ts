import { originals } from "./catalog";
import { modelRtp } from "./slotModels";
import type { Game, GameCategory, Promotion } from "./types";
export const categories: GameCategory[] = [
  ["slots", "Slots", "Coins"],
  ["instant", "Minigames", "Zap"],
  ["live-casino", "Live Casino", "Radio"],
  ["roulette", "Roulette", "Disc3"],
  ["blackjack", "Blackjack", "Spade"],
  ["poker", "Poker", "Diamond"],
  ["jackpots", "Jackpots", "Trophy"],
].map(([slug, name, icon], i) => ({
  id: slug,
  slug,
  name,
  icon,
  sort_order: i,
  created_at: "",
}));
const provider = {
  id: "spindra",
  name: "Spindra Originals",
  slug: "spindra",
  logo_url: null,
  description: "Original Spindra games.",
  status: "active" as const,
  created_at: "",
};
export const games: Game[] = originals.map((g, i) => {
  const image =
    '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><defs><radialGradient id="bg"><stop stop-color="' +
    g.color +
    '"/><stop offset="1" stop-color="#0a0a14"/></radialGradient><filter id="glow"><feGaussianBlur stdDeviation="16"/></filter></defs><rect width="800" height="600" fill="url(#bg)"/><circle cx="400" cy="275" r="170" fill="none" stroke="' +
    g.accent +
    '" stroke-opacity=".18" stroke-width="2"/><circle cx="400" cy="275" r="130" fill="none" stroke="' +
    g.accent +
    '" stroke-opacity=".12" stroke-width="12"/><text x="400" y="337" text-anchor="middle" fill="' +
    g.accent +
    '" font-size="200" font-family="Georgia,serif" filter="url(#glow)" opacity=".5">' +
    g.emblem +
    '</text><text x="400" y="337" text-anchor="middle" fill="' +
    g.accent +
    '" font-size="200" font-family="Georgia,serif">' +
    g.emblem +
    '</text><text x="36" y="42" fill="' +
    g.accent +
    '" font-size="15" font-family="sans-serif" letter-spacing="3">SPINDRA ORIGINALS</text><text x="400" y="490" text-anchor="middle" fill="' +
    g.accent +
    '" font-size="36" font-family="Georgia,serif" letter-spacing="3">' +
    g.name.toUpperCase() +
    "</text></svg>";
  return {
    id: g.slug,
    title: g.name,
    slug: g.slug,
    provider_id: provider.id,
    category_id: g.kind,
    image_url: g.slot
      ? "/originals/" + g.slug + ".svg"
      : "data:image/svg+xml," + encodeURIComponent(image),
    rtp:
      g.kind === "slots"
        ? "up to " + (modelRtp(g.slot!) * 100).toFixed(2) + "%"
        : g.kind === "roulette"
          ? "97.30%"
          : null,
    status: "active",
    tag: i < 4 ? "NEW" : "ORIGINAL",
    players_online: 0,
    sort_order: i,
    created_at: "",
    provider,
    category: categories.find((c) => c.slug === g.kind),
  };
});
export const promotions: Promotion[] = [
  {
    title: "Welcome Bonus",
    subtitle: "Welcome offers coming soon",
    description:
      "Deposit bonuses will be available only after payments and approved offer terms are connected.",
    badge: "PLANNED",
    icon: "Gift",
    gradient: "from-amber-500 via-orange-500 to-rose-500",
  },
  {
    title: "Free Spins Friday",
    subtitle: "Original games to explore",
    description:
      "Explore Spindra originals with your real USD wallet. Published offer terms will appear here when available.",
    badge: "PLAY",
    icon: "Sparkles",
    gradient: "from-cyan-400 via-blue-500 to-indigo-500",
  },
  {
    title: "Cashback Weekend",
    subtitle: "Rewards coming soon",
    description:
      "Cashback is not active. Full eligibility and wagering conditions will be published before launch.",
    badge: "PLANNED",
    icon: "RefreshCw",
    gradient: "from-pink-500 via-rose-500 to-red-500",
  },
].map((p, i) => ({
  ...p,
  id: String(i),
  status: "scheduled",
  sort_order: i,
  created_at: "",
}));
