import {
  blackjackReturn,
  handValue,
  randomInt,
  type Card,
  type RandomInt,
} from "./engine";
export type ShoeCard = Card & { id: string };
export type SeatBet = { main: number; three: number; pair: number };
export type SideResult = { name: string; odds: number; returned: number };
export type BJHand = {
  id: string;
  seat: number;
  cards: ShoeCard[];
  bet: number;
  split: boolean;
  aces: boolean;
  done: boolean;
  surrendered: boolean;
};
export type BlackjackRound = {
  shoe: ShoeCard[];
  dealer: ShoeCard[];
  hands: BJHand[];
  bets: SeatBet[];
  insurance: number[];
  sideResults: { three: SideResult; pair: SideResult }[];
  active: number;
  phase: "insurance" | "playing" | "dealer" | "done";
  totalStake: number;
  returned: number;
};
export const MAIN_MAX = 20000;
export function validateBets(bets: SeatBet[]) {
  if (bets.length !== 5) throw new Error("Five betting spots required");
  for (const b of bets) {
    if (
      ![b.main, b.three, b.pair].every(
        (n) => Number.isSafeInteger(n) && n >= 0 && n % 100 === 0,
      )
    )
      throw new Error("Bets must use whole USD amounts");
    if (b.main && (b.main < 100 || b.main > MAIN_MAX))
      throw new Error("Main bet range is 1–200 credits");
    if (b.three > b.main || b.pair > b.main)
      throw new Error("Each side bet must not exceed its main bet");
  }
  if (!bets.some((b) => b.main)) throw new Error("Place at least one main bet");
  return bets.reduce((n, b) => n + b.main + b.three + b.pair, 0);
}
export function eightDeckShoe(rng: RandomInt = randomInt) {
  const cards = Array.from({ length: 416 }, (_, i) => ({
    rank: (i % 13) + 2,
    suit: Math.floor(i / 13) % 4,
    id: "card-" + i,
  }));
  for (let i = cards.length - 1; i > 0; i--) {
    const j = rng(i + 1);
    if (!Number.isInteger(j) || j < 0 || j > i)
      throw new Error("Invalid shuffle draw");
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}
const result = (name: string, odds: number, stake: number): SideResult => ({
  name,
  odds,
  returned: odds ? (odds + 1) * stake : 0,
});
export function perfectPair(cards: Card[], stake: number): SideResult {
  if (cards.length !== 2) throw new Error("Two initial cards required");
  const [a, b] = cards;
  if (a.rank !== b.rank) return result("No pair", 0, stake);
  if (a.suit === b.suit) return result("Perfect pair", 26, stake);
  if (a.suit % 2 === b.suit % 2) return result("Colored pair", 12, stake);
  return result("Mixed pair", 5, stake);
}
export function twentyOneThree(cards: Card[], stake: number): SideResult {
  if (cards.length !== 3)
    throw new Error("Two initial player cards and dealer up-card required");
  const ranks = cards.map((c) => c.rank).sort((a, b) => a - b),
    flush = cards.every((c) => c.suit === cards[0].suit),
    trips = ranks[0] === ranks[2];
  const straight =
    new Set(ranks).size === 3 &&
    (ranks[2] - ranks[0] === 2 || ranks.join() === "2,3,14");
  if (trips && flush) return result("Suited trips", 100, stake);
  if (straight && flush) return result("Straight flush", 40, stake);
  if (trips) return result("Three of a kind", 30, stake);
  if (straight) return result("Straight", 10, stake);
  if (flush) return result("Flush", 5, stake);
  return result("No combination", 0, stake);
}
export const sideReturn = (s: BlackjackRound) =>
  s.sideResults.reduce((n, r) => n + r.three.returned + r.pair.returned, 0);
export function createBlackjack(
  bets: SeatBet[],
  rng: RandomInt = randomInt,
): BlackjackRound {
  const totalStake = validateBets(bets),
    shoe = eightDeckShoe(rng),
    hands: BJHand[] = bets.flatMap((b, seat) =>
      b.main
        ? [
            {
              id: "seat-" + seat,
              seat,
              cards: [],
              bet: b.main,
              split: false,
              aces: false,
              done: false,
              surrendered: false,
            },
          ]
        : [],
    ),
    dealer: ShoeCard[] = [];
  for (let pass = 0; pass < 2; pass++) {
    for (const h of hands) h.cards.push(shoe.pop()!);
    dealer.push(shoe.pop()!);
  }
  const s: BlackjackRound = {
    shoe,
    dealer,
    hands,
    bets: bets.map((b) => ({ ...b })),
    insurance: Array(5).fill(0),
    sideResults: bets.map((b, seat) => {
      const h = hands.find((h) => h.seat === seat);
      return h
        ? {
            three: twentyOneThree([...h.cards, dealer[0]], b.three),
            pair: perfectPair(h.cards, b.pair),
          }
        : { three: result("No bet", 0, 0), pair: result("No bet", 0, 0) };
    }),
    active: 0,
    phase: dealer[0].rank === 14 ? "insurance" : "playing",
    totalStake,
    returned: 0,
  };
  return s.phase === "insurance" ? s : enterPlay(s);
}
export function copyRound(s: BlackjackRound): BlackjackRound {
  return {
    ...s,
    shoe: [...s.shoe],
    dealer: [...s.dealer],
    hands: s.hands.map((h) => ({ ...h, cards: [...h.cards] })),
    bets: s.bets.map((b) => ({ ...b })),
    insurance: [...s.insurance],
  };
}
const isNatural = (h: BJHand) =>
  !h.split && h.cards.length === 2 && handValue(h.cards).total === 21;
export function dealerBlackjack(s: BlackjackRound) {
  return s.dealer.length === 2 && handValue(s.dealer).total === 21;
}
function enterPlay(s: BlackjackRound) {
  if (dealerBlackjack(s)) return settleBlackjack(s);
  s.phase = "playing";
  for (const h of s.hands) if (isNatural(h)) h.done = true;
  return advance(s);
}
export function insuranceCost(s: BlackjackRound, seats: number[]) {
  if (s.phase !== "insurance")
    throw new Error("Insurance is only available before the ace peek");
  if (
    new Set(seats).size !== seats.length ||
    seats.some((i) => !Number.isInteger(i) || !s.bets[i]?.main)
  )
    throw new Error("Select occupied spots once");
  return seats.reduce((n, i) => n + s.bets[i].main / 2, 0);
}
export function chooseInsurance(round: BlackjackRound, seats: number[]) {
  const cost = insuranceCost(round, seats),
    s = copyRound(round);
  for (const i of seats) s.insurance[i] = s.bets[i].main / 2;
  s.totalStake += cost;
  return enterPlay(s);
}
function advance(s: BlackjackRound) {
  while (s.active < s.hands.length && s.hands[s.active].done) s.active++;
  if (s.active === s.hands.length) s.phase = "dealer";
  return s;
}
export function allowedActions(s: BlackjackRound) {
  const h = s.hands[s.active];
  if (s.phase !== "playing" || !h || h.done)
    return {
      hit: false,
      stand: false,
      double: false,
      split: false,
      surrender: false,
    };
  return {
    hit: !h.aces,
    stand: true,
    double: h.cards.length === 2 && !h.aces,
    split:
      h.cards.length === 2 && !h.split && h.cards[0].rank === h.cards[1].rank,
    surrender: h.cards.length === 2 && !h.split,
  };
}
export type BJAction = "hit" | "stand" | "double" | "split" | "surrender";
export function blackjackActionCost(s: BlackjackRound, action: BJAction) {
  if (!allowedActions(s)[action]) throw new Error("Action unavailable");
  return action === "double" || action === "split" ? s.hands[s.active].bet : 0;
}
export function actBlackjack(round: BlackjackRound, action: BJAction) {
  const cost = blackjackActionCost(round, action),
    s = copyRound(round),
    h = s.hands[s.active];
  s.totalStake += cost;
  if (action === "stand") h.done = true;
  if (action === "surrender") {
    h.surrendered = true;
    h.done = true;
  }
  if (action === "hit" || action === "double") {
    if (action === "double") h.bet *= 2;
    h.cards.push(s.shoe.pop()!);
    h.done = action === "double" || handValue(h.cards).total >= 21;
  }
  if (action === "split") {
    const aces = h.cards[0].rank === 14;
    const newHands = h.cards.map((card, i) => ({
      ...h,
      id: h.id + "-" + i,
      cards: [card, s.shoe.pop()!],
      split: true,
      aces,
      done: aces,
      surrendered: false,
    }));
    for (const split of newHands)
      if (handValue(split.cards).total === 21) split.done = true;
    s.hands.splice(s.active, 1, ...newHands);
  }
  return advance(s);
}
export function dealerShouldHit(s: BlackjackRound) {
  const value = handValue(s.dealer);
  return value.total < 17 || (value.total === 17 && value.soft);
}
export function dealerNeedsPlay(s: BlackjackRound) {
  return s.hands.some(
    (h) => !h.surrendered && !isNatural(h) && handValue(h.cards).total <= 21,
  );
}
export function drawDealer(round: BlackjackRound) {
  if (
    round.phase !== "dealer" ||
    !dealerShouldHit(round) ||
    !dealerNeedsPlay(round)
  )
    throw new Error("Dealer cannot draw");
  const s = copyRound(round);
  s.dealer.push(s.shoe.pop()!);
  return s;
}
export function mainReturn(h: BJHand, dealer: Card[]) {
  return h.surrendered
    ? h.bet / 2
    : blackjackReturn(h.cards, dealer, h.bet, !h.split);
}
export function settleBlackjack(round: BlackjackRound) {
  const s = copyRound(round);
  s.phase = "done";
  s.returned =
    sideReturn(s) +
    s.hands.reduce((n, h) => n + mainReturn(h, s.dealer), 0) +
    (dealerBlackjack(s) ? s.insurance.reduce((n, b) => n + b * 3, 0) : 0);
  return s;
}
// Eight-deck, H17, double-after-split two-card basic strategy. A guide, never a
// guarantee of a win; it uses the visible dealer card only.
export function blackjackHint(s: BlackjackRound): BJAction | null {
  const h = s.hands[s.active],
    legal = allowedActions(s);
  if (!h || h.cards.length !== 2 || !legal.hit) return null;
  const up = s.dealer[0].rank === 14 ? 14 : Math.min(10, s.dealer[0].rank),
    v = handValue(h.cards),
    pair = h.cards[0].rank === h.cards[1].rank ? h.cards[0].rank : 0;
  if (
    legal.split &&
    (pair === 14 ||
      pair === 8 ||
      (pair === 9 && [2, 3, 4, 5, 6, 8, 9].includes(up)) ||
      (pair === 7 && up <= 7) ||
      (pair === 6 && up <= 6) ||
      (pair === 4 && [5, 6].includes(up)) ||
      ([2, 3].includes(pair) && up <= 7))
  )
    return "split";
  if (
    legal.surrender &&
    !v.soft &&
    ((v.total === 16 && [9, 10, 14].includes(up)) ||
      (v.total === 15 && [10, 14].includes(up)) ||
      (v.total === 17 && up === 14))
  )
    return "surrender";
  if (v.soft) {
    const double =
      (v.total <= 14 && [5, 6].includes(up)) ||
      ([15, 16].includes(v.total) && up >= 4 && up <= 6) ||
      (v.total === 17 && up >= 3 && up <= 6) ||
      (v.total === 18 && up <= 6) ||
      (v.total === 19 && up === 6);
    if (double && legal.double) return "double";
    return v.total >= 19 || (v.total === 18 && [7, 8].includes(up))
      ? "stand"
      : "hit";
  }
  if (
    legal.double &&
    (v.total === 11 ||
      (v.total === 10 && up <= 9) ||
      (v.total === 9 && up >= 3 && up <= 6))
  )
    return "double";
  return v.total >= 17 ||
    (v.total >= 13 && up <= 6) ||
    (v.total === 12 && up >= 4 && up <= 6)
    ? "stand"
    : "hit";
}
