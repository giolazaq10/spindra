import { useEffect, useRef, useState } from "react";
import { User, Bot, Layers } from "lucide-react";
import {
  botAction,
  createHoldem,
  legalPoker,
  pokerAct,
  type HoldemState,
  type PokerAction,
} from "../lib/holdem";
import { credits } from "../context/Demo";
import PlayingCard from "./PlayingCard";
import GameControls from "./GameControls";
import type { Controls } from "./OriginalGame";

export default function TexasHoldem({ controls: c }: { controls: Controls }) {
  const [state, setState] = useState<HoldemState | null>(null),
    [raise, setRaise] = useState(0);
  const current = useRef<HoldemState | null>(null),
    handNumber = useRef(0),
    settled = useRef(false);
  function save(next: HoldemState) {
    current.current = next;
    setState(next);
    c.setLeaveReturn(next.players[0].stack);
    if (next.street === "done" && !settled.current) {
      settled.current = true;
      c.finish(next.players[0].stack);
    } else if (next.street !== "done") {
      c.setMessage(
        "Hand in progress · buy-in locked until settlement. Leaving folds committed chips and returns your remaining stack.",
      );
    }
  }
  function deal() {
    if ((current.current && current.current.street !== "done") || !c.start())
      return;
    settled.current = false;
    save(createHoldem(c.bet, handNumber.current++ % 3));
    setRaise(0);
  }
  function act(action: PokerAction) {
    const s = current.current;
    if (!s || legalPoker(s).actor !== 0) return;
    save(pokerAct(s, action));
    setRaise(0);
  }
  useEffect(() => {
    if (!state || state.street === "done") return;
    const legal = legalPoker(state);
    if (legal.actor <= 0) return;
    const timer = setTimeout(() => {
      const action = botAction(
        state.players[legal.actor].hole,
        state.board,
        legal,
        state.bigBlind,
      );
      // A stale timer cannot act on a newer hand or after navigation.
      if (current.current !== state) return;
      save(pokerAct(state, action));
    }, 650);
    return () => clearTimeout(timer);
    // Only a new game state schedules the next opponent action.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);
  const legal = state ? legalPoker(state) : null,
    done = state?.street === "done",
    yourTurn = legal?.actor === 0;
  const pot = state?.players.reduce((sum, p) => sum + p.contributed, 0) || 0;
  const raiseTo = legal
    ? Math.max(
        Math.min(raise || legal.minTo, legal.maxTo),
        Math.min(legal.minTo, legal.maxTo),
      )
    : 0;
  return (
    <div className="holdem-cabinet">
      <div className="holdem-title">
        <div>
          <small>SPINDRA POKER ROOM</small>
          <h2>Royal Hold’em</h2>
        </div>
        <span>
          NO LIMIT · 3 SEATS
          <br />
          COMPUTER OPPONENTS
        </span>
      </div>
      <div className="holdem-table">
        <div className="holdem-opponents">
          {[1, 2].map((i) => {
            const p = state?.players[i];
            return (
              <div
                className={
                  "poker-seat " +
                  (legal?.actor === i ? "seat-active " : "") +
                  (p?.folded ? "seat-folded" : "")
                }
                key={i}
              >
                <div className="seat-name">
                  <Bot size={16} />
                  {i === 1 ? "Mira" : "Atlas"}
                  {state?.dealer === i && <b className="dealer-button">D</b>}
                </div>
                <strong>
                  {credits(p?.stack ?? c.bet)} <small>chips</small>
                </strong>
                <div className="hole-cards">
                  {[0, 1].map((j) => (
                    <PlayingCard
                      key={j}
                      card={p?.hole[j]}
                      hidden={!state?.showdown || p?.folded}
                      delay={j * 100}
                    />
                  ))}
                </div>
                <span className="seat-action">
                  {done && p && !p.folded && state?.showdown
                    ? state.ranks[i]?.name
                    : p?.action || "Computer opponent"}
                </span>
                {done && state.awards[i] > 0 && (
                  <span className="seat-award">
                    Pot award {credits(state.awards[i])}
                  </span>
                )}
              </div>
            );
          })}
        </div>
        <div className="holdem-community">
          <div className="pot-display">
            <Layers size={16} />
            <span>{done ? "HAND POT" : "POT"}</span>
            <b>{credits(pot)}</b>
            <small>
              {state?.street === "done"
                ? "SHOWDOWN / SETTLED"
                : (state?.street || "waiting").toUpperCase()}
            </small>
          </div>
          <div className="community-cards">
            {Array.from({ length: 5 }, (_, i) => (
              <div className="community-position" key={i}>
                {state?.board[i] ? (
                  <PlayingCard
                    card={state.board[i]}
                    key={state.board[i].rank + ":" + state.board[i].suit}
                    delay={i < 3 ? i * 100 : 0}
                  />
                ) : (
                  <span className="card-placeholder">
                    {i < 3 ? "FLOP" : i === 3 ? "TURN" : "RIVER"}
                  </span>
                )}
              </div>
            ))}
          </div>
          <small className="blind-label">
            Blinds {credits(state?.smallBlind ?? c.bet / 20)} /{" "}
            {credits(state?.bigBlind ?? c.bet / 10)} · No rake
          </small>
        </div>
        <div
          className={
            "poker-seat player-seat " + (yourTurn ? "seat-active" : "")
          }
        >
          <div className="player-card-area">
            <div className="seat-name">
              <User size={16} />
              YOUR HAND{" "}
              {state?.dealer === 0 && <b className="dealer-button">D</b>}
            </div>
            <div
              className="hole-cards player-hole"
              aria-label="Your private cards"
            >
              {[0, 1].map((i) => (
                <PlayingCard
                  key={
                    state?.players[0].hole[i]
                      ? state.players[0].hole[i].rank +
                        ":" +
                        state.players[0].hole[i].suit
                      : i
                  }
                  card={state?.players[0].hole[i]}
                  delay={i * 100}
                />
              ))}
            </div>
          </div>
          <div className="player-stack">
            <small>YOUR STACK</small>
            <strong>{credits(state?.players[0].stack ?? c.bet)}</strong>
            <span>
              {done && state.showdown && !state.players[0].folded
                ? state.ranks[0]?.name
                : state?.players[0].folded
                  ? "Folded"
                  : yourTurn
                    ? "Your turn"
                    : ""}
            </span>
            {done && (
              <b className="seat-award">Pot award {credits(state.awards[0])}</b>
            )}
          </div>
        </div>
      </div>
      <div className="holdem-actionbar">
        {!state || done ? (
          <button className="button primary" onClick={deal}>
            {state ? "Deal next hand" : "Join & deal"}
          </button>
        ) : yourTurn && legal ? (
          <>
            <button
              className="button secondary"
              onClick={() => act({ kind: "fold" })}
            >
              Fold
            </button>
            <button
              className="button primary"
              onClick={() => act({ kind: legal.toCall ? "call" : "check" })}
            >
              {legal.toCall
                ? "Call " +
                  credits(Math.min(legal.toCall, state.players[0].stack))
                : "Check"}
            </button>
            <label className="raise-control">
              Raise to
              <input
                type="number"
                min={Math.min(legal.minTo, legal.maxTo) / 100}
                max={legal.maxTo / 100}
                step="0.01"
                value={raiseTo / 100}
                disabled={!legal.canRaise}
                onChange={(e) =>
                  setRaise(Math.round(Number(e.target.value) * 100))
                }
              />
            </label>
            <button
              className="button secondary"
              disabled={!legal.canRaise}
              onClick={() => act({ kind: "raise", to: raiseTo })}
            >
              Raise
            </button>
            <button
              className="button secondary"
              disabled={legal.maxTo > state.currentBet && !legal.canRaise}
              onClick={() =>
                act(
                  legal.maxTo <= state.currentBet
                    ? { kind: "call" }
                    : { kind: "raise", to: legal.maxTo },
                )
              }
            >
              All-in {credits(state.players[0].stack)}
            </button>
          </>
        ) : (
          <span className="opponent-thinking">
            {state.players[legal?.actor ?? 1]?.name} is thinking<span>•••</span>
          </span>
        )}
      </div>
      {state && (
        <div className="poker-commentary" role="status" aria-live="polite">
          {state.log[state.log.length - 1]}
          {done && state.pots.length > 1 && (
            <span> · {state.pots.length} pot layers settled separately</span>
          )}
        </div>
      )}
      <GameControls controls={c} />
    </div>
  );
}
