# Classic slot free spins

Rules version: `scatter-free-spins-v3`. Applies to the 22 classic reel slots.
The three signature games retain their separate published mechanics.

- Three or more scatters anywhere award 10 free spins, in addition to the scatter cash award.
- During free spins, three or more scatters grant five extra spins. At most 50 spins can be awarded in one bonus, including the initial 10.
- The triggering total stake, symbol probabilities, regular paytable and center-reel wild rules apply to every free spin. No additional wallet debit or bonus multiplier applies.
- The server resolves and stores all bonus frames with the paid round, and settles the combined return once. Playback, navigation, refresh and skipping animations cannot change the settled result.
- Cash is rounded down once to a cent after all base and bonus awards have been added. Individual displayed line values may not sum exactly because they are explanatory rounded amounts.

## Probability model

Each cell is an independent weighted draw. The middle reel includes wild weight; other reels do not. A Poisson-binomial distribution gives the probability p of at least three scatters.

Let E(q, a) be the expected spins played with q pending and a already awarded:

    E(0, a) = 0
    extra = min(5, 50 - a)
    E(q, a) = 1 + (1-p) E(q-1, a) + p E(q-1+extra, a+extra)

The complete paid-round expectation is the single-spin expectation multiplied by `1 + p * E(10, 10)`. Each bonus draw uses the same independent distribution; all retriggers are included. Regular payouts are calibrated after accounting for scatter awards and this factor. The UI reports the actual expectation after rounding the integer paytable, before cent rounding.

## Published rules reviewed

Reviewed on November 4, 2026:

- [BGaming Mice & Magic](https://bgaming.com/wp-content/uploads/2025/06/64f18ab3e6b212d8afdf1992_MiceMagic.pdf): three scatters award 10 free spins at the triggering stake; this particular game does not retrigger.
- [BGaming Jungle Queen](https://bgaming.com/wp-content/uploads/2025/06/68345cc489a9a520550164dd_JQ_GameRule.pdf): three scatters award 12 free spins, with additional spins tied to its level feature.

Provider games vary. Spindra uses its own explicitly disclosed 10-spin/+5-retrigger rules; it does not reproduce their assets, probabilities or certification claims.

## Compatible rollout

The updated client sends the v3 rules token. The endpoint selects the corresponding engine before drawing an outcome. Clients with the previous v2 token retain the preserved v2 paytable, and clients without a token retain v1. Unknown versions fail before RNG or wallet settlement. This prevents published older clients wagering under a paytable they cannot display.
