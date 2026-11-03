import { blackjackReturn, handValue, type Card } from "./engine";
import type { CashRound } from "../components/CashGame";
export function blackjackBreakdown(round: CashRound | null) {
  const table = round?.view.table;
  if (
    round?.state !== "settled" ||
    !table?.hands?.length ||
    !table.dealer?.length ||
    table.dealer.some((c) => c === null)
  )
    return null;
  const dealer = table.dealer as Card[];
  const hands = table.hands.map((h) => {
    const returned = h.surrendered
      ? h.bet / 2
      : blackjackReturn(h.cards, dealer, h.bet, !h.split);
    const total = handValue(h.cards).total;
    const outcome = h.surrendered
      ? "Surrender"
      : total > 21
        ? "Bust"
        : returned === h.bet
          ? "Push"
          : returned > h.bet
            ? !h.split && h.cards.length === 2 && total === 21
              ? "Blackjack"
              : "Win"
            : "Lost";
    return {
      id: h.id,
      seat: h.seat,
      stake: h.bet,
      returned,
      net: returned - h.bet,
      outcome,
    };
  });
  const items = [
    {
      key: "main",
      label: "Main hands",
      stake: hands.reduce((n, h) => n + h.stake, 0),
      returned: hands.reduce((n, h) => n + h.returned, 0),
    },
  ];
  for (const [key, label] of [
    ["three", "21+3"],
    ["pair", "Perfect Pair"],
  ] as const) {
    const stake = table.bets?.reduce((n, b) => n + b[key], 0) || 0;
    if (stake)
      items.push({
        key,
        label,
        stake,
        returned:
          table.sideResults?.reduce((n, s) => n + s[key].returned, 0) || 0,
      });
  }
  const insurance = table.insurance?.reduce((n, b) => n + b, 0) || 0;
  if (insurance)
    items.push({
      key: "insurance",
      label: "Insurance",
      stake: insurance,
      returned:
        dealer.length === 2 && handValue(dealer).total === 21
          ? insurance * 3
          : 0,
    });
  const reconciled =
    items.reduce((n, r) => n + r.stake, 0) === round.view.stake_minor &&
    items.reduce((n, r) => n + r.returned, 0) === round.view.returned_minor;
  return {
    hands,
    items: items.map((r) => ({ ...r, net: r.returned - r.stake })),
    reconciled,
  };
}
