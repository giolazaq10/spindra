# Slot probability audit

Complete paid rounds sampled: 12,500,000 (500,000 per game). Includes free spins, retriggers and signature stages.

Profit means the complete round returns more than its original $1 stake after cent rounding. Returning part of the stake is a loss. All percentages in the profit/break-even/loss columns are simulation estimates; the RTP and house-edge columns are exact model calculations before cash rounding.

| Game             | Theoretical RTP | House edge | Player profit at $1 | Profit 95% interval | Break-even |   Loss |
| ---------------- | --------------: | ---------: | ------------------: | ------------------: | ---------: | -----: |
| Astra Cascade    |          94.80% |      5.20% |              34.80% |       34.67%–34.94% |      0.24% | 64.96% |
| Copper Lock      |          93.83% |      6.17% |              35.61% |       35.48%–35.75% |      0.01% | 64.38% |
| Nitro Sevens     |          95.02% |      4.98% |               5.92% |         5.85%–5.98% |      0.00% | 94.08% |
| Solar Vault      |          94.08% |      5.92% |              30.13% |       30.01%–30.26% |      0.00% | 69.87% |
| Neon Drift       |          94.59% |      5.41% |              21.97% |       21.85%–22.08% |      0.00% | 78.03% |
| Jade Temple      |          94.55% |      5.45% |              27.65% |       27.53%–27.78% |      0.36% | 71.99% |
| Lunar Tides      |          95.03% |      4.97% |              22.17% |       22.05%–22.28% |      0.12% | 77.71% |
| Ember Crown      |          94.28% |      5.72% |              28.22% |       28.09%–28.34% |      0.00% | 71.78% |
| Velvet Orbit     |          94.45% |      5.55% |              27.54% |       27.42%–27.67% |      0.00% | 72.46% |
| Coral Cove       |          95.17% |      4.83% |              22.53% |       22.41%–22.64% |      0.00% | 77.47% |
| Midnight Express |          95.57% |      4.43% |              21.34% |       21.23%–21.46% |      0.44% | 78.21% |
| Saffron Sky      |          93.96% |      6.04% |              29.59% |       29.46%–29.72% |      0.09% | 70.32% |
| Frost Bloom      |          94.57% |      5.43% |              24.10% |       23.98%–24.22% |      0.00% | 75.90% |
| Obsidian Echo    |          95.37% |      4.63% |              29.09% |       28.96%–29.21% |      0.24% | 70.68% |
| Electric Garden  |          95.43% |      4.57% |              25.22% |       25.10%–25.34% |      0.00% | 74.77% |
| Ruby Rebellion   |          93.99% |      6.01% |              16.13% |       16.02%–16.23% |      0.00% | 83.87% |
| Copper Canyon    |          94.45% |      5.55% |              17.91% |       17.80%–18.01% |      0.00% | 82.09% |
| Aurora Arcade    |          94.83% |      5.17% |              19.42% |       19.31%–19.53% |      0.21% | 80.37% |
| Atlas of Gold    |          95.38% |      4.62% |              23.25% |       23.13%–23.36% |      0.00% | 76.75% |
| Thunder Aerie    |          94.25% |      5.75% |              26.79% |       26.67%–26.92% |      0.65% | 72.56% |
| Sugar Parade     |          94.25% |      5.75% |              23.42% |       23.30%–23.53% |      0.56% | 76.02% |
| Corsair Pearls   |          95.19% |      4.81% |              21.95% |       21.84%–22.07% |      0.00% | 78.05% |
| Amber Apiary     |          94.94% |      5.06% |              23.97% |       23.86%–24.09% |      0.00% | 76.03% |
| Clockwork Aurora |          93.65% |      6.35% |              24.24% |       24.13%–24.36% |      0.17% | 75.59% |
| Dragon Atelier   |          94.28% |      5.72% |              20.87% |       20.75%–20.98% |      0.01% | 79.12% |

Review threshold: RTP above 96%. Games flagged: 0. This is an internal review threshold, not an industry or licensing requirement.

A frequent winning round does not imply positive player expectation. The house edge is the long-run model average before payment fees, promotions and operating costs; it does not guarantee profit over any session. Monte Carlo RTP can vary substantially because rare large wins are not evenly represented in finite samples. Confidence intervals are individual 95% Wilson intervals, not simultaneous guarantees across all games.

The JSON report also contains $0.20/$100 stake comparisons, zero-return frequency, bonus frequency and nested 10×/25×/50× frequencies. Cent rounding can reduce effective RTP and profit frequency at smaller stakes.

Reproduce with: `node --import ./scripts/register-typescript.mjs scripts/audit-slots.mjs --rounds=500000`. The offline seeded sampler never affects production RNG.
