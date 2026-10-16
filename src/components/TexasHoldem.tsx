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
import { credits } from "../lib/money";
import useTableMotion from "./useTableMotion";
import PlayingCard from "./PlayingCard";
import GameControls from "./GameControls";
import type { Controls } from "./OriginalGame";

export default function TexasHoldem({ controls: c }: { controls: Controls }) {
  const [state, setState] = useState<HoldemState | null>(null),
    [raise, setRaise] = useState(0);
  const current = useRef<HoldemState | null>(null),
    handNumber = useRef(0),
    settled = useRef(false);
  const motion = useTableMotion();
  function save(next: HoldemState) {
    const previous = current.current;
    current.current = next;

    c.setLeaveReturn(next.players[0].stack);
    const finish = () => {
      setState(next);
      if (next.street === "done" && !settled.current) {
        settled.current = true;
        c.finish(next.players[0].stack);
      }
    };
    const oldBoard = previous?.board.length || 0;
    const added = next.board.length - oldBoard;
    if (!previous) {
      setState(next);
      motion.play([], 3200, finish);
    } else if (added > 0 || (next.showdown && !previous.showdown)) {
      const preview = {
        ...next,
        board: next.board.slice(0, oldBoard),
        showdown: false,
        street: previous.street,
        awards: [0, 0, 0],
        players: next.showdown
          ? next.players.map((p, i) => ({
              ...p,
              stack: p.stack - next.awards[i],
            }))
          : next.players,
      };
      setState(preview);
      const frames = [];
      let time = 500;
      for (let i = oldBoard; i < next.board.length; i++) {
        if (i === 3 || i === 4) time += 900;
        const frame = {
          ...preview,
          board: next.board.slice(0, i + 1),
          street: (i < 3
            ? "flop"
            : i === 3
              ? "turn"
              : "river") as HoldemState["street"],
        };
        frames.push({ at: time, show: () => setState(frame) });
        time += 650;
      }
      if (next.showdown)
        frames.push({ at: time + 400, show: () => setState(next) });
      motion.play(frames, time + (next.showdown ? 1400 : 400), finish);
    } else {
      setState(next);
      motion.play([], 750, finish);
    }
    if (next.street !== "done")
      c.setMessage(
        "Hand in progress · cards and actions play at a natural table pace. Leaving returns your remaining stack.",
      );
  }

  function deal() {
    if (
      motion.locked.current ||
      (current.current && current.current.street !== "done") ||
      !c.start()
    )
      return;
    settled.current = false;
    save(createHoldem(c.bet, handNumber.current++ % 3));
    setRaise(0);
  }
  function act(action: PokerAction) {
    const s = current.current;
    if (motion.locked.current || !s || legalPoker(s).actor !== 0) return;
    save(pokerAct(s, action));
    setRaise(0);
  }
  useEffect(() => {
    if (!state || state.street === "done" || motion.animating) return;
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
    }, 1500);
    return () => clearTimeout(timer);
    // Only a new game state schedules the next opponent action.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, motion.animating]);
  const legal = state ? legalPoker(state) : null,
    done = state?.street === "done",
    yourTurn = legal?.actor === 0 && !motion.animating;
  const pot = state?.players.reduce((sum, p) => sum + p.contributed, 0) || 0;
  const raiseTo = legal
    ? Math.max(
        Math.min(raise || legal.minTo, legal.maxTo),
        Math.min(legal.minTo, legal.maxTo),
      )
    : 0;
  return (
    <div
      className={"holdem-cabinet " + (motion.animating ? "table-dealing" : "")}
    >
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
                      key={
                        p?.hole[j] ? p.hole[j].rank + ":" + p.hole[j].suit : j
                      }
                      card={p?.hole[j]}
                      hidden={!state?.showdown || p?.folded}
                      delay={
                        !state?.board.length && !state?.showdown
                          ? (((i - (state?.dealer || 0) + 2) % 3) + j * 3) * 450
                          : j * 450
                      }
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
                    delay={0}
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
                  delay={
                    state && !state.board.length
                      ? (((2 - state.dealer) % 3) + i * 3) * 450
                      : 0
                  }
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
        {(!state || done) && !motion.animating ? (
          <button className="button primary" onClick={deal}>
            {state ? "Deal next hand" : "Join & deal"}
          </button>
        ) : yourTurn && legal && state ? (
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
            {motion.animating
              ? "Dealing & moving chips"
              : state?.players[legal?.actor ?? 1]?.name + " is thinking"}
            <span>•••</span>
          </span>
        )}
      </div>
      {state && (
        <div className="poker-commentary" role="status" aria-live="polite">
          {motion.animating
            ? "Watch the table · action resumes after cards and chips settle."
            : state.log[state.log.length - 1]}
          {done && state.pots.length > 1 && (
            <span> · {state.pots.length} pot layers settled separately</span>
          )}
        </div>
      )}
      <GameControls controls={c} />
    </div>
  );
}
