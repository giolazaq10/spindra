import { mkdirSync, writeFileSync } from "node:fs";
import { originals } from "../src/lib/catalog.ts";
import { modelRound, modelRtp } from "../src/lib/slotModels.ts";

const rounds = Number(
  process.argv.find((arg) => arg.startsWith("--rounds="))?.split("=")[1] ||
    250000,
);
if (!Number.isSafeInteger(rounds) || rounds < 1000 || rounds > 5000000)
  throw new Error("Use --rounds=1000 through --rounds=5000000");

// Reproducible, independent per-game streams for offline analysis only.
// Production continues using the crypto-backed RNG; this sampler is never bundled.
function sampler(seed) {
  let state = seed >>> 0;
  const word = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return (t ^ (t >>> 14)) >>> 0;
  };
  return (maximum) => {
    const limit = Math.floor(4294967296 / maximum) * maximum;
    let value;
    do {
      value = word();
    } while (value >= limit);
    return value % maximum;
  };
}
function wilson(successes, total) {
  const z = 1.959963984540054,
    p = successes / total;
  const denominator = 1 + (z * z) / total;
  const center = (p + (z * z) / (2 * total)) / denominator;
  const half =
    (z * Math.sqrt((p * (1 - p)) / total + (z * z) / (4 * total * total))) /
    denominator;
  return [center - half, center + half];
}
const pct = (value) => (value * 100).toFixed(2) + "%";
const games = [];
for (const [index, game] of originals.filter((g) => g.slot).entries()) {
  const rng = sampler(0x51a7cafe ^ Math.imul(index + 1, 0x9e3779b9));
  const stakes = [20, 100, 10000].map((stake_minor) => ({
    stake_minor,
    profitable: 0,
    break_even: 0,
    loss: 0,
    zero_return: 0,
    returned_minor: 0,
  }));
  let bonus = 0,
    big = 0,
    mega = 0,
    epic = 0;
  for (let n = 0; n < rounds; n++) {
    const result = modelRound(game.slot, rng);
    if (result.bonus) bonus++;
    // Nested thresholds, measured against the original paid stake, including bonus.
    if (result.rate >= 1000) big++;
    if (result.rate >= 2500) mega++;
    if (result.rate >= 5000) epic++;
    for (const s of stakes) {
      const returned = Math.floor((s.stake_minor * result.rate) / 100);
      s.profitable += Number(returned > s.stake_minor);
      s.break_even += Number(returned === s.stake_minor);
      s.loss += Number(returned < s.stake_minor);
      s.zero_return += Number(returned === 0);
      s.returned_minor += returned;
    }
  }
  const theoretical_rtp = modelRtp(game.slot);
  const row = {
    slug: game.slug,
    name: game.name,
    rounds,
    theoretical_rtp,
    theoretical_house_edge: 1 - theoretical_rtp,
    rtp_above_review_limit: theoretical_rtp > 0.96,
    bonus_probability_estimate: bonus / rounds,
    at_least_10x_estimate: big / rounds,
    at_least_25x_estimate: mega / rounds,
    at_least_50x_estimate: epic / rounds,
    stakes: stakes.map((s) => ({
      stake_minor: s.stake_minor,
      profit_probability_estimate: s.profitable / rounds,
      profit_probability_95pct_interval: wilson(s.profitable, rounds),
      break_even_probability_estimate: s.break_even / rounds,
      loss_probability_estimate: s.loss / rounds,
      zero_return_probability_estimate: s.zero_return / rounds,
      observed_rtp_after_cent_rounding:
        s.returned_minor / (s.stake_minor * rounds),
    })),
  };
  games.push(row);
  process.stdout.write(
    game.slug +
      ": theoretical RTP " +
      pct(theoretical_rtp) +
      ", profit probability at $1 " +
      pct(row.stakes[1].profit_probability_estimate) +
      "\n",
  );
}
const report = {
  generated_at: new Date().toISOString(),
  rounds_per_game: rounds,
  total_paid_rounds: rounds * games.length,
  rtp_review_limit: 0.96,
  methodology:
    "Exact model RTP before cent rounding; seeded offline Monte Carlo estimates for complete paid-round profit frequency, including all bonus spins. Wilson 95% intervals are per-game and per-stake, not simultaneous. Return > stake means profit; return = stake means break-even. Observed RTP is diagnostic, not a substitute for the exact expectation; rare payouts may be missed. Realized operator results also depend on volume, variance, fees, bonuses and costs.",
  games,
};
mkdirSync("docs", { recursive: true });
writeFileSync(
  "docs/slot-probability-audit.json",
  JSON.stringify(report, null, 2) + "\n",
);
const rows = games.map((g) => {
  const s = g.stakes[1];
  return (
    "| " +
    g.name +
    " | " +
    pct(g.theoretical_rtp) +
    " | " +
    pct(g.theoretical_house_edge) +
    " | " +
    pct(s.profit_probability_estimate) +
    " | " +
    s.profit_probability_95pct_interval.map(pct).join("–") +
    " | " +
    pct(s.break_even_probability_estimate) +
    " | " +
    pct(s.loss_probability_estimate) +
    " |"
  );
});
writeFileSync(
  "docs/slot-probability-audit.md",
  "# Slot probability audit\n\n" +
    "Complete paid rounds sampled: " +
    report.total_paid_rounds.toLocaleString("en-US") +
    " (" +
    rounds.toLocaleString("en-US") +
    " per game). Includes free spins, retriggers and signature stages.\n\n" +
    "Profit means the complete round returns more than its original $1 stake after cent rounding. Returning part of the stake is a loss. All percentages in the profit/break-even/loss columns are simulation estimates; the RTP and house-edge columns are exact model calculations before cash rounding.\n\n" +
    "| Game | Theoretical RTP | House edge | Player profit at $1 | Profit 95% interval | Break-even | Loss |\n" +
    "|---|---:|---:|---:|---:|---:|---:|\n" +
    rows.join("\n") +
    "\n\n" +
    "Review threshold: RTP above 96%. Games flagged: " +
    games.filter((g) => g.rtp_above_review_limit).length +
    ". This is an internal review threshold, not an industry or licensing requirement.\n\n" +
    "A frequent winning round does not imply positive player expectation. The house edge is the long-run model average before payment fees, promotions and operating costs; it does not guarantee profit over any session. Monte Carlo RTP can vary substantially because rare large wins are not evenly represented in finite samples. Confidence intervals are individual 95% Wilson intervals, not simultaneous guarantees across all games.\n\n" +
    "The JSON report also contains $0.20/$100 stake comparisons, zero-return frequency, bonus frequency and nested 10×/25×/50× frequencies. Cent rounding can reduce effective RTP and profit frequency at smaller stakes.\n\n" +
    "Reproduce with: `node --import ./scripts/register-typescript.mjs scripts/audit-slots.mjs --rounds=" +
    rounds +
    "`. The offline seeded sampler never affects production RNG.\n",
);
process.stdout.write("Saved docs/slot-probability-audit.{json,md}\n");
