import type { Card } from "../lib/engine";
import type { CashRound } from "./CashGame";

function sameCard(a: Card & { id?: string }, b: Card & { id?: string }) {
  return a.id && b.id ? a.id === b.id : a.rank === b.rank && a.suit === b.suit;
}

// Animate only confirmed server cards; initial cards travel clockwise.
export function blackjackMotion(previous: CashRound | null, next: CashRound) {
  const target = next.view.table;
  if (!target?.hands || !target.dealer) return [];
  const old = previous?.id === next.id ? previous.view.table : undefined;
  const staged = structuredClone(next);
  const table = staged.view.table!;
  staged.state = "open";
  staged.view.returned_minor = 0;
  staged.view.allowed = {};
  table.phase = "dealing";
  table.sideResults = undefined;
  table.dealer = old?.dealer ? structuredClone(old.dealer) : [];
  table.hands = target.hands.map((h) => {
    const before = old?.hands?.find((p) => p.id === h.id)?.cards;
    let count = 0;
    if (before)
      while (
        count < before.length &&
        count < h.cards.length &&
        sameCard(before[count], h.cards[count])
      )
        count++;
    else if (h.split) count = 1;
    return { ...h, cards: structuredClone(h.cards.slice(0, count)) };
  });
  const frames = [{ at: 0, round: structuredClone(staged) }];
  let at = 100;
  const capture = () => {
    frames.push({ at, round: structuredClone(staged) });
    at += 350;
  };
  if (!old) {
    for (let pass = 0; pass < 2; pass++) {
      target.hands.forEach((hand, i) => {
        if (hand.cards[pass]) {
          table.hands![i].cards.push(hand.cards[pass]);
          capture();
        }
      });
      if (pass < target.dealer.length) {
        table.dealer.push(target.dealer[pass]);
        capture();
      }
    }
  } else {
    target.hands.forEach((hand, i) => {
      for (let j = table.hands![i].cards.length; j < hand.cards.length; j++) {
        table.hands![i].cards.push(hand.cards[j]);
        capture();
      }
    });
    target.dealer.forEach((card, i) => {
      if (
        i >= table.dealer!.length ||
        (table.dealer![i] === null && card !== null)
      ) {
        table.dealer![i] = card;
        capture();
      }
    });
  }
  if (frames.length === 1) return [{ at: 0, round: next }];
  frames.push({ at, round: next });
  return frames;
}
