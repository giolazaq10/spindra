import { originals } from "./catalog";
import { miniPlay } from "./minigames";
import { modelSpin } from "./slotModels";
import {
  randomInt,
  rouletteReturn,
  type RandomInt,
  type RouletteBet,
} from "./engine";
import {
  createBlackjack,
  chooseInsurance,
  insuranceCost,
  allowedActions,
  blackjackActionCost,
  actBlackjack,
  dealerNeedsPlay,
  dealerShouldHit,
  drawDealer,
  settleBlackjack,
  type BlackjackRound,
  type BJAction,
  type SeatBet,
} from "./blackjack";
import {
  createHoldem,
  legalPoker,
  pokerAct,
  botAction,
  type HoldemState,
  type PokerAction,
} from "./holdem";
export const CASH_MODEL = "spindra-cash-v1";
export type CashState = {
  model: string;
  game: string;
  kind: string;
  phase: "open" | "settled";
  stake_minor: number;
  returned_minor: number;
  data: Record<string, unknown> | BlackjackRound | HoldemState;
};
export type CashCommand = { action: string; seats?: number[]; to?: number };
function amount(v: unknown) {
  if (
    !Number.isSafeInteger(v) ||
    Number(v) < 100 ||
    Number(v) > 20000 ||
    Number(v) % 100 !== 0
  )
    throw new Error("Stake must be a whole USD amount from $1 to $200");
  return Number(v);
}
function finishDealer(s: BlackjackRound) {
  let next = s;
  let count = 0;
  while (
    next.phase === "dealer" &&
    dealerNeedsPlay(next) &&
    dealerShouldHit(next)
  ) {
    if (count++ > 30) throw new Error("Dealer draw limit");
    next = drawDealer(next);
  }
  return next.phase === "dealer" ? settleBlackjack(next) : next;
}
function bots(s: HoldemState, rng: RandomInt) {
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
        rng,
      ),
    );
  }
  return next;
}
export function newCashRound(
  game: string,
  input: Record<string, unknown>,
  rng: RandomInt = randomInt,
): CashState {
  const g = originals.find((g) => g.slug === game);
  if (!g) throw new Error("Unknown game");
  let data: CashState["data"],
    stake = amount(input.bet),
    returned = 0,
    done = true;
  if (g.kind === "instant" && g.mini) {
    const result = miniPlay(g.mini, stake, input, rng);
    data = result;
    returned = result.returned_minor;
  } else if (g.kind === "slots") {
    const result = modelSpin(g.slot!, rng);
    returned = (stake / 100) * result.rate;
    data = result;
  } else if (g.kind === "roulette") {
    const kind = input.kind as RouletteBet;
    if (!["red", "black", "even", "odd", "straight"].includes(kind))
      throw new Error("Invalid roulette bet");
    const straight = Number(input.straight ?? 0);
    if (!Number.isInteger(straight) || straight < 0 || straight > 36)
      throw new Error("Invalid pocket");
    const pocket = rng(37);
    returned = rouletteReturn(pocket, kind, stake, straight);
    data = { pocket, kind, straight };
  } else if (g.kind === "blackjack") {
    const bets = input.bets as SeatBet[];
    if (
      !Array.isArray(bets) ||
      bets.some(
        (b) =>
          !b ||
          Object.keys(b).some((k) => !["main", "three", "pair"].includes(k)),
      )
    )
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
    data,
  };
}
export function nextCashRound(
  old: CashState,
  command: CashCommand,
  rng: RandomInt = randomInt,
): CashState {
  if (old.model !== CASH_MODEL || old.phase !== "open")
    throw new Error("Round is not open");
  const next = structuredClone(old);
  if (old.kind === "blackjack") {
    let s = next.data as BlackjackRound;
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
      const action = command.action as BJAction;
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
    let s = next.data as HoldemState;
    if (command.action === "abandon") {
      next.phase = "settled";
      next.returned_minor = s.players[0].stack;
      return next;
    }
    if (!["fold", "check", "call", "raise"].includes(command.action))
      throw new Error("Invalid poker action");
    const action = { kind: command.action, to: command.to } as PokerAction;
    s = bots(pokerAct(s, action), rng);
    next.data = s;
    next.phase = s.street === "done" ? "settled" : "open";
    next.returned_minor = s.street === "done" ? s.players[0].stack : 0;
  } else throw new Error("No actions for this game");
  if (
    !Number.isSafeInteger(next.returned_minor) ||
    next.returned_minor < 0 ||
    !Number.isSafeInteger(next.stake_minor)
  )
    throw new Error("Invalid settlement");
  return next;
}
export function publicCash(s: CashState) {
  const base = {
    model: s.model,
    game: s.game,
    kind: s.kind,
    phase: s.phase,
    stake_minor: s.stake_minor,
    returned_minor: s.returned_minor,
  };
  if (s.kind === "blackjack") {
    const b = s.data as BlackjackRound;
    return {
      ...base,
      table: {
        phase: b.phase,
        dealer: b.phase === "done" ? b.dealer : [b.dealer[0], null],
        hands: b.hands,
        bets: b.bets,
        sideResults: b.sideResults,
        insurance: b.insurance,
        active: b.active,
      },
      allowed: allowedActions(b),
    };
  }
  if (s.kind === "poker") {
    const p = s.data as HoldemState;
    return {
      ...base,
      table: {
        players: p.players.map((v, i) => ({
          ...v,
          hole:
            i === 0 || (p.street === "done" && p.showdown && !v.folded)
              ? v.hole
              : [null, null],
        })),
        board: p.board,
        dealer: p.dealer,
        street: p.street,
        pots: p.pots,
        log: p.log,
        showdown: p.showdown,
      },
      allowed: legalPoker(p),
    };
  }
  return { ...base, result: s.data };
}
