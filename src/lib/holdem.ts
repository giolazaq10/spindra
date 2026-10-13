import { deck, randomInt, type Card, type RandomInt } from "./engine";
export type HandRank = {
  category: number;
  kickers: number[];
  name: string;
  cards: Card[];
};
const names = [
  "High card",
  "Pair",
  "Two pair",
  "Three of a kind",
  "Straight",
  "Flush",
  "Full house",
  "Four of a kind",
  "Straight flush",
];
export function compareRanks(a: HandRank, b: HandRank) {
  if (a.category !== b.category) return a.category - b.category;
  for (let i = 0; i < Math.max(a.kickers.length, b.kickers.length); i++) {
    const difference = (a.kickers[i] || 0) - (b.kickers[i] || 0);
    if (difference) return difference;
  }
  return 0;
}
export function rankFive(cards: Card[]): HandRank {
  if (
    cards.length !== 5 ||
    new Set(cards.map((c) => c.rank + ":" + c.suit)).size !== 5
  )
    throw new Error("Five unique cards required");
  const ranks = cards.map((c) => c.rank).sort((a, b) => b - a),
    groups = [...new Set(ranks)]
      .map((rank) => ({ rank, count: ranks.filter((r) => r === rank).length }))
      .sort((a, b) => b.count - a.count || b.rank - a.rank);
  const flush = cards.every((c) => c.suit === cards[0].suit);
  const straight =
    new Set(ranks).size === 5 &&
    (ranks[0] - ranks[4] === 4 || ranks.join() === "14,5,4,3,2");
  const high = ranks.join() === "14,5,4,3,2" ? 5 : ranks[0];
  let category = 0,
    kickers = ranks;
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
    cards,
  };
}
export function bestHand(cards: Card[]) {
  if (
    cards.length < 5 ||
    cards.length > 7 ||
    new Set(cards.map((c) => c.rank + ":" + c.suit)).size !== cards.length
  )
    throw new Error("Five to seven unique cards required");
  let best: HandRank | null = null;
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
              cards[e],
            ]);
            if (!best || compareRanks(candidate, best) > 0) best = candidate;
          }
  return best!;
}
export type Seat = {
  name: string;
  hole: Card[];
  stack: number;
  contributed: number;
  streetBet: number;
  folded: boolean;
  action: string;
};
export type Pot = { amount: number; eligible: number[]; winners: number[] };
export type HoldemState = {
  players: Seat[];
  board: Card[];
  shoe: Card[];
  dealer: number;
  smallBlind: number;
  bigBlind: number;
  street: "preflop" | "flop" | "turn" | "river" | "done";
  currentBet: number;
  minRaise: number;
  pending: number[];
  actedAt: number[];
  pots: Pot[];
  awards: number[];
  ranks: (HandRank | null)[];
  showdown: boolean;
  log: string[];
};
export type PokerAction = {
  kind: "fold" | "check" | "call" | "raise";
  to?: number;
};
const around = (start: number) =>
  Array.from({ length: 3 }, (_, i) => (start + i) % 3);
const active = (s: HoldemState) =>
  s.players.flatMap((p, i) => (!p.folded && p.stack > 0 ? [i] : []));
const commit = (p: Seat, amount: number) => {
  const paid = Math.min(p.stack, amount);
  p.stack -= paid;
  p.streetBet += paid;
  p.contributed += paid;
  return paid;
};
export function createHoldem(
  buyIn: number,
  dealer = 0,
  rng: RandomInt = randomInt,
): HoldemState {
  if (!Number.isSafeInteger(buyIn) || buyIn < 100 || buyIn % 20 !== 0)
    throw new Error("Invalid buy-in");
  const shoe = deck(rng),
    players: Seat[] = ["You", "Mira", "Atlas"].map((name) => ({
      name,
      hole: [],
      stack: buyIn,
      contributed: 0,
      streetBet: 0,
      folded: false,
      action: "",
    }));
  // Deal one card at a time, beginning left of the dealer.
  for (let round = 0; round < 2; round++)
    around((dealer + 1) % 3).forEach((i) => players[i].hole.push(shoe.pop()!));
  const smallBlind = buyIn / 20,
    bigBlind = buyIn / 10;
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
    log: ["Blinds posted. Preflop betting."],
  };
}
export function legalPoker(s: HoldemState) {
  const actor = s.pending[0],
    p = s.players[actor];
  if (s.street === "done" || !p)
    return { actor: -1, toCall: 0, minTo: 0, maxTo: 0, canRaise: false };
  const toCall = Math.max(0, s.currentBet - p.streetBet),
    maxTo = p.streetBet + p.stack,
    minTo = s.currentBet + s.minRaise;
  const reopened =
    s.actedAt[actor] < 0 || s.currentBet - s.actedAt[actor] >= s.minRaise;
  return {
    actor,
    toCall,
    minTo,
    maxTo,
    canRaise:
      reopened && maxTo > s.currentBet && active(s).some((i) => i !== actor),
  };
}
export function distributePots(players: Seat[], board: Card[], dealer: number) {
  const levels = [
    ...new Set(players.map((p) => p.contributed).filter((n) => n > 0)),
  ].sort((a, b) => a - b);
  const ranks = players.map((p) =>
    p.folded || board.length !== 5 ? null : bestHand([...p.hole, ...board]),
  );
  const awards = [0, 0, 0],
    pots: Pot[] = [];
  let previous = 0;
  const live = players.flatMap((p, i) => (p.folded ? [] : [i]));
  levels.forEach((level) => {
    const members = players.flatMap((p, i) =>
        p.contributed >= level ? [i] : [],
      ),
      amount = (level - previous) * members.length;
    previous = level;
    const eligible = members.filter((i) => !players[i].folded);
    let winners: number[];
    // A layer funded by one seat is an uncalled bet and returns to that seat.
    if (members.length === 1) winners = members;
    else if (live.length === 1) winners = live;
    else {
      if (!eligible.length) throw new Error("Pot has no eligible player");
      winners = [eligible[0]];
      eligible.slice(1).forEach((i) => {
        const comparison = compareRanks(ranks[i]!, ranks[winners[0]]!);
        if (comparison > 0) winners = [i];
        else if (!comparison) winners.push(i);
      });
    }
    const share = Math.floor(amount / winners.length);
    winners.forEach((i) => (awards[i] += share));
    let remainder = amount - share * winners.length;
    around((dealer + 1) % 3)
      .filter((i) => winners.includes(i))
      .forEach((i) => {
        if (remainder > 0) {
          awards[i]++;
          remainder--;
        }
      });
    pots.push({ amount, eligible, winners });
  });
  return { pots, awards, ranks };
}
function finish(s: HoldemState) {
  s.showdown = s.players.filter((p) => !p.folded).length > 1;
  const result = distributePots(s.players, s.board, s.dealer);
  Object.assign(s, result);
  s.players.forEach((p, i) => (p.stack += s.awards[i]));
  s.street = "done";
  s.pending = [];
  s.log.push(
    s.showdown
      ? "Showdown. Pots awarded to the best eligible hands."
      : "All opponents folded. Pot awarded.",
  );
}
function nextStreet(s: HoldemState) {
  if (s.street === "river") {
    finish(s);
    return;
  }
  // Burn one card before every community-card street.
  s.shoe.pop();
  const count = s.street === "preflop" ? 3 : 1;
  for (let i = 0; i < count; i++) s.board.push(s.shoe.pop()!);
  s.street =
    s.board.length === 3 ? "flop" : s.board.length === 4 ? "turn" : "river";
  s.currentBet = 0;
  s.minRaise = s.bigBlind;
  s.actedAt = [-1, -1, -1];
  s.players.forEach((p) => (p.streetBet = 0));
  s.pending = around((s.dealer + 1) % 3).filter((i) => active(s).includes(i));
  s.log.push(s.street[0].toUpperCase() + s.street.slice(1) + " dealt.");
  if (active(s).length <= 1) {
    s.pending = [];
    nextStreet(s);
  }
}
export function pokerAct(
  current: HoldemState,
  action: PokerAction,
): HoldemState {
  const legal = legalPoker(current);
  if (legal.actor < 0) throw new Error("Hand is complete");
  const s: HoldemState = {
    ...current,
    players: current.players.map((p) => ({ ...p, hole: [...p.hole] })),
    board: [...current.board],
    shoe: [...current.shoe],
    pending: [...current.pending],
    actedAt: [...current.actedAt],
    log: [...current.log],
  };
  const actor = legal.actor,
    p = s.players[actor];
  s.pending.shift();
  if (action.kind === "fold") {
    p.folded = true;
    p.action = "Fold";
  } else if (action.kind === "check") {
    if (legal.toCall > 0) throw new Error("Cannot check facing a bet");
    p.action = "Check";
  } else if (action.kind === "call") {
    const amount = commit(p, legal.toCall);
    p.action =
      p.stack === 0 ? "All-in call" : "Call " + (amount / 100).toFixed(2);
  } else {
    const to = action.to!;
    if (
      !legal.canRaise ||
      !Number.isSafeInteger(to) ||
      to > s.players[actor].streetBet + p.stack ||
      to <= s.currentBet ||
      (to < legal.minTo && to !== legal.maxTo)
    )
      throw new Error("Illegal raise");
    const raise = to - s.currentBet,
      full = raise >= s.minRaise;
    commit(p, to - p.streetBet);
    s.currentBet = to;
    p.action = p.stack === 0 ? "All-in" : "Raise to " + (to / 100).toFixed(2);
    if (full) {
      s.minRaise = raise;
      s.actedAt = [-1, -1, -1];
    }
    s.pending = around((actor + 1) % 3).filter(
      (i) =>
        i !== actor &&
        !s.players[i].folded &&
        s.players[i].stack > 0 &&
        (full ||
          s.pending.includes(i) ||
          s.players[i].streetBet < s.currentBet),
    );
  }
  s.actedAt[actor] = s.currentBet;
  s.pending = s.pending.filter(
    (i) => !s.players[i].folded && s.players[i].stack > 0,
  );
  s.log.push(p.name + ": " + p.action + ".");
  s.log = s.log.slice(-12);
  if (s.players.filter((p) => !p.folded).length === 1) finish(s);
  else if (!s.pending.length) nextStreet(s);
  return s;
}
/** Bots deliberately receive no opponent hole cards or undealt deck. */
export function botAction(
  hole: Card[],
  board: Card[],
  legal: ReturnType<typeof legalPoker>,
  bigBlind: number,
  rng: RandomInt = randomInt,
): PokerAction {
  const strength =
    board.length >= 3
      ? bestHand([...hole, ...board]).category
      : hole[0].rank === hole[1].rank
        ? 2
        : Math.max(...hole.map((c) => c.rank)) >= 12
          ? 1
          : 0;
  const roll = rng(100);
  if (
    legal.toCall > 0 &&
    strength === 0 &&
    legal.toCall > bigBlind &&
    roll < 55
  )
    return { kind: "fold" };
  if (legal.canRaise && (strength >= 2 ? roll < 45 : roll < 12))
    return {
      kind: "raise",
      to: Math.min(
        legal.maxTo,
        legal.minTo + bigBlind * (strength >= 3 ? 2 : 0),
      ),
    };
  return { kind: legal.toCall ? "call" : "check" };
}
