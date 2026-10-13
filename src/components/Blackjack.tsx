import { useEffect, useRef, useState } from "react";
import {
  Lightbulb,
  Zap,
  Volume2,
  VolumeX,
  Menu,
  Maximize,
  RotateCcw,
  Undo2,
  Trash2,
  Shield,
  Play,
  Plus,
} from "lucide-react";
import { handValue } from "../lib/engine";
import {
  actBlackjack,
  allowedActions,
  blackjackActionCost,
  blackjackHint,
  chooseInsurance,
  copyRound,
  createBlackjack,
  dealerBlackjack,
  dealerNeedsPlay,
  dealerShouldHit,
  drawDealer,
  insuranceCost,
  mainReturn,
  settleBlackjack,
  sideReturn,
  validateBets,
  MAIN_MAX,
  type BlackjackRound,
  type BJAction,
  type SeatBet,
} from "../lib/blackjack";
import { credits } from "../context/Demo";
import type { Controls } from "./OriginalGame";
import PlayingCard from "./PlayingCard";
import useTableMotion from "./useTableMotion";
import BlackjackResults from "./BlackjackResults";
import AnimatedCredits from "./AnimatedCredits";
import BlackjackRules from "./BlackjackRules";
const chips = [100, 200, 500, 1000, 2500, 10000];
const initialBets = () =>
  Array.from({ length: 5 }, (_, i) => ({
    main: i === 2 ? 100 : 0,
    three: 0,
    pair: 0,
  }));
const copyBets = (bets: SeatBet[]) => bets.map((b) => ({ ...b }));
export default function Blackjack({ controls: c }: { controls: Controls }) {
  const [bets, setBets] = useState(initialBets),
    [chip, setChip] = useState(100),
    [erase, setErase] = useState(false),
    [undo, setUndo] = useState<SeatBet[][]>([]),
    [state, setState] = useState<BlackjackRound | null>(null),
    [caption, setCaption] = useState(
      "Select a chip, then tap a main bet or side bet.",
    ),
    [hints, setHints] = useState(false),
    [turbo, setTurbo] = useState(false),
    [sound, setSound] = useState(false),
    [menu, setMenu] = useState(false),
    [tab, setTab] = useState<"rules" | "history">("rules"),
    [insured, setInsured] = useState<number[]>([]),
    [history, setHistory] = useState<{ stake: number; returned: number }[]>([]);
  const [reveal, setReveal] = useState(false);
  const spotRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [previousBets, setPreviousBets] = useState<SeatBet[] | null>(null);
  const current = useRef<BlackjackRound | null>(null),
    audio = useRef<AudioContext | null>(null),
    table = useRef<HTMLDivElement>(null),
    motion = useTableMotion();
  useEffect(
    () => () => {
      void audio.current?.close();
    },
    [],
  );
  function tone(hz = 650, delay = 0, duration = 0.1) {
    if (!sound) return;
    try {
      audio.current ??= new AudioContext();
      const ctx = audio.current;
      void ctx.resume();
      const osc = ctx.createOscillator(),
        gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      const start = ctx.currentTime + delay;
      gain.gain.setValueAtTime(0.025, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
      osc.frequency.value = hz;
      osc.start(start);
      osc.stop(ctx.currentTime + 0.1);
    } catch {
      /* Audio is optional on browsers without Web Audio. */
    }
  }
  function toggleSound() {
    const enable = !sound;
    setSound(enable);
    if (enable)
      try {
        audio.current ??= new AudioContext();
        void audio.current.resume();
      } catch {
        /* Optional browser audio. */
      }
  }
  async function fullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen?.();
      else await table.current?.requestFullscreen?.();
    } catch {
      setCaption("Fullscreen is unavailable in this browser.");
    }
  }
  const speed = turbo ? 0.5 : 1;
  function play(
    frames: { at: number; show: () => void }[],
    duration: number,
    done: () => void,
  ) {
    motion.play(
      frames.map((f) => ({ ...f, at: f.at * speed })),
      duration * speed,
      done,
    );
  }
  function display(s: BlackjackRound) {
    setState(copyRound(s));
  }
  function finish(s: BlackjackRound) {
    const final = s.phase === "done" ? s : settleBlackjack(s);
    current.current = final;
    setReveal(true);
    display(final);
    c.setLeaveReturn(final.returned);
    c.finish(final.returned);
    setHistory((h) =>
      [{ stake: final.totalStake, returned: final.returned }, ...h].slice(
        0,
        20,
      ),
    );
    setCaption(
      "Round settled · " +
        credits(final.returned) +
        " returned. Rebet or change your chips.",
    );
    const net = final.returned - final.totalStake;
    (net > 0
      ? [523, 659, 784, 1046]
      : net < 0
        ? [330, 220, 146]
        : [440, 440]
    ).forEach((hz, i) => tone(hz, i * 0.16, 0.24));
  }
  function dealer(s: BlackjackRound) {
    let next = copyRound(s),
      time = 400;
    const frames: { at: number; show: () => void }[] = [];
    frames.push({
      at: time,
      show: () => {
        display({ ...next, phase: "dealer" });
        setCaption("Dealer turns over the hole card.");
        tone(420);
      },
    });
    // Capture each immutable snapshot, including the reveal, before later draws.
    const reveal = copyRound(next);
    frames[0].show = () => {
      setReveal(true);
      display({ ...reveal, phase: "dealer" });
      setCaption("Dealer turns over the hole card.");
      tone(420);
    };
    if (next.phase !== "done" && dealerNeedsPlay(next))
      while (dealerShouldHit(next)) {
        next = drawDealer(next);
        time += 1100;
        const frame = copyRound(next);
        frames.push({
          at: time,
          show: () => {
            display(frame);
            setCaption("Dealer draws · " + handValue(frame.dealer).total);
            tone(420);
          },
        });
      }
    current.current = next;
    const final = settleBlackjack(next);
    c.setLeaveReturn(final.returned);
    play(frames, time + 1100, () => finish(final));
  }
  function ready(s: BlackjackRound) {
    current.current = s;
    display(s);
    c.setLeaveReturn(
      sideReturn(s) +
        s.hands.reduce((n, h) => n + (h.surrendered ? h.bet / 2 : 0), 0),
    );
    if (s.phase === "done" || s.phase === "dealer") {
      dealer(s);
      return;
    }
    if (s.phase === "insurance") {
      setInsured([]);
      setCaption(
        "Dealer shows an ace · choose insurance for individual hands or skip.",
      );
    } else setCaption("Hand " + (s.hands[s.active].seat + 1) + " · your turn.");
  }
  function deal() {
    if (
      motion.locked.current ||
      (current.current && current.current.phase !== "done")
    )
      return;
    let total: number;
    try {
      total = validateBets(bets);
    } catch (e) {
      setCaption((e as Error).message);
      return;
    }
    if (!c.start(total)) {
      setCaption(
        "Cannot place this round. Check your demo balance and limits.",
      );
      return;
    }
    setPreviousBets(copyBets(bets));
    setUndo([]);
    setReveal(false);
    const final = createBlackjack(bets);
    current.current = final;
    const staged = copyRound(final);
    staged.dealer = [];
    staged.hands = staged.hands.map((h) => ({ ...h, cards: [] }));
    staged.phase = "playing";
    staged.returned = 0;
    display(staged);
    setCaption("Dealing clockwise · one card at a time");
    const frames: { at: number; show: () => void }[] = [];
    let i = 0;
    for (let pass = 0; pass < 2; pass++) {
      for (let j = 0; j < final.hands.length; j++) {
        staged.hands[j].cards.push(final.hands[j].cards[pass]);
        const frame = copyRound(staged);
        frames.push({
          at: 200 + i++ * 650,
          show: () => {
            display(frame);
            c.setLeaveReturn(
              frame.hands.reduce(
                (n, h) =>
                  n +
                  (h.cards.length === 2
                    ? frame.sideResults[h.seat].three.returned +
                      frame.sideResults[h.seat].pair.returned
                    : 0),
                0,
              ),
            );
            tone(500);
          },
        });
      }
      staged.dealer.push(final.dealer[pass]);
      const frame = copyRound(staged);
      frames.push({
        at: 200 + i++ * 650,
        show: () => {
          display(frame);
          tone(500);
        },
      });
    }
    play(frames, 200 + (i - 1) * 650 + 650, () => ready(final));
  }
  function insure(seats: number[]) {
    const s = current.current;
    if (!s || motion.locked.current || s.phase !== "insurance") return;
    const cost = insuranceCost(s, seats);
    if (cost && !c.start(cost)) {
      setCaption(
        "Not enough demo balance or session limit for that insurance selection.",
      );
      return;
    }
    const next = chooseInsurance(s, seats);
    c.setLeaveReturn(
      sideReturn(next) +
        (dealerBlackjack(next)
          ? next.insurance.reduce((n, b) => n + b * 3, 0)
          : 0),
    );
    ready(next);
  }
  function act(action: BJAction) {
    const s = current.current;
    if (!s || motion.locked.current || !allowedActions(s)[action]) return;
    const cost = blackjackActionCost(s, action);
    if (cost && !c.start(cost)) {
      setCaption("Not enough demo balance or session limit for that action.");
      return;
    }
    const next = actBlackjack(s, action);
    current.current = next;
    c.setLeaveReturn(
      sideReturn(next) +
        next.hands.reduce((n, h) => n + (h.surrendered ? h.bet / 2 : 0), 0),
    );
    const frames: { at: number; show: () => void }[] = [];
    if (action === "split") {
      const index = s.active,
        first = copyRound(next);
      first.hands[index + 1].cards = first.hands[index + 1].cards.slice(0, 1);
      frames.push(
        {
          at: 350,
          show: () => {
            display(first);
            tone(500);
          },
        },
        {
          at: 1200,
          show: () => {
            display(next);
            tone(500);
          },
        },
      );
    } else
      frames.push({
        at: action === "stand" || action === "surrender" ? 0 : 200,
        show: () => {
          display(next);
          tone(500);
        },
      });
    setCaption(
      action === "split"
        ? "Splitting · one extra card to each hand"
        : action === "surrender"
          ? "Surrender · half of the main stake returned"
          : action === "stand"
            ? "Standing · moving to the next hand"
            : "Dealing your next card",
    );
    play(
      frames,
      action === "split"
        ? 2100
        : action === "stand" || action === "surrender"
          ? 450
          : 1100,
      () => ready(next),
    );
  }
  const betting = !c.busy && !motion.animating,
    legal = state ? allowedActions(state) : null,
    active = state?.hands[state.active],
    hint = state && hints && !motion.animating ? blackjackHint(state) : null;
  const activeSeat =
    state?.phase === "playing"
      ? active?.seat
      : !state
        ? bets.findIndex((b) => b.main > 0)
        : undefined;
  useEffect(() => {
    if (
      activeSeat !== undefined &&
      activeSeat >= 0 &&
      window.matchMedia?.("(max-width: 650px)").matches
    )
      spotRefs.current[activeSeat]?.scrollIntoView?.({
        block: "nearest",
        inline: "center",
        behavior: "smooth",
      });
  }, [activeSeat, state?.phase]);
  const total = bets.reduce((n, b) => n + b.main + b.three + b.pair, 0);
  function change(next: SeatBet[]) {
    if (!betting) return;
    try {
      if (next.some((b) => b.main)) validateBets(next);
      else if (next.some((b) => b.three || b.pair))
        throw new Error("A side bet needs a main bet.");
    } catch (e) {
      setCaption((e as Error).message);
      return;
    }
    setUndo((u) => [...u.slice(-29), copyBets(bets)]);
    setBets(copyBets(next));
    setState(null);
    current.current = null;
    setCaption(
      "Betting open · total " +
        credits(next.reduce((n, b) => n + b.main + b.three + b.pair, 0)),
    );
    tone();
  }
  function place(seat: number, kind: keyof SeatBet) {
    if (!betting) return;
    const next = copyBets(bets);
    if (erase) {
      next[seat][kind] = 0;
      if (kind === "main") next[seat].three = next[seat].pair = 0;
    } else {
      if (kind !== "main" && !next[seat].main) {
        setCaption("Place a main bet on hand " + (seat + 1) + " first.");
        return;
      }
      next[seat][kind] += chip;
    }
    change(next);
  }
  const settled = state?.phase === "done" && !c.busy;
  const net = state ? state.returned - state.totalStake : 0;
  const uninsuredCost =
    state?.phase === "insurance" ? insuranceCost(state, insured) : 0;
  return (
    <div
      ref={table}
      className={
        "blackjack bj-pro " +
        (motion.animating ? "table-dealing " : "") +
        (settled
          ? net > 0
            ? "table-result-win"
            : net < 0
              ? "table-result-loss"
              : "table-result-push"
          : "")
      }
    >
      <header className="bj-pro-header">
        <span className="bj-monogram">S</span>
        <div className="bj-wordmark">
          <small>SPINDRA · MULTIHAND</small>
          <h2>
            BLACK<span>JACK</span>
            <b>NOIR</b>
          </h2>
        </div>
        <div className="bj-tools">
          <button
            aria-label="Strategy hints"
            aria-pressed={hints}
            onClick={() => setHints((h) => !h)}
          >
            <Lightbulb />
          </button>
          <button
            aria-label="Turbo dealing"
            aria-pressed={turbo}
            disabled={c.busy}
            onClick={() => setTurbo((t) => !t)}
          >
            <Zap />
          </button>
          <button
            aria-label={sound ? "Mute sound" : "Enable sound"}
            aria-pressed={sound}
            onClick={toggleSound}
          >
            {sound ? <Volume2 /> : <VolumeX />}
          </button>
          <button
            aria-label="Rules and history"
            aria-expanded={menu}
            onClick={() => setMenu((m) => !m)}
          >
            <Menu />
          </button>
          <button
            aria-label="Full screen table"
            onClick={() => void fullscreen()}
          >
            <Maximize />
          </button>
        </div>
      </header>
      <div className="bj-dealer">
        <span className="bj-seat-label">
          DEALER {state && reveal ? "· " + handValue(state.dealer).total : ""}
        </span>
        <div className="cards-row">
          {state?.dealer.map((card, i) => (
            <PlayingCard
              key={card.id}
              card={card}
              hidden={i === 1 && !reveal}
            />
          ))}
        </div>
      </div>
      <div className="bj-table-inscription">
        BLACKJACK PAYS 3:2 <span>·</span> DEALER HITS SOFT 17 <span>·</span>{" "}
        INSURANCE PAYS 2:1
      </div>
      <nav className="bj-hand-nav" aria-label="View betting hands">
        {bets.map((_, i) => (
          <button
            key={i}
            aria-label={"View hand " + (i + 1)}
            aria-pressed={active?.seat === i && state?.phase === "playing"}
            onClick={() =>
              spotRefs.current[i]?.scrollIntoView?.({
                block: "nearest",
                inline: "center",
                behavior: "smooth",
              })
            }
          >
            {i + 1}
          </button>
        ))}
      </nav>
      <div className="bj-spots">
        {bets.map((b, seat) => {
          const hands = state?.hands.filter((h) => h.seat === seat) || [],
            selected = active?.seat === seat && state?.phase === "playing",
            results = state?.sideResults[seat];
          return (
            <div
              key={seat}
              ref={(node) => {
                spotRefs.current[seat] = node;
              }}
              className={
                "bj-spot " +
                (b.main ? "spot-occupied " : "") +
                (selected ? "spot-active" : "")
              }
            >
              <div className="bj-side-zones">
                {(["three", "pair"] as const).map((kind) => (
                  <button
                    key={kind}
                    className={"bj-side-zone " + (b[kind] ? "zone-funded" : "")}
                    disabled={!betting}
                    aria-label={
                      (kind === "three" ? "21+3" : "Perfect Pair") +
                      " bet for hand " +
                      (seat + 1)
                    }
                    onClick={() => place(seat, kind)}
                  >
                    <b>{kind === "three" ? "21+3" : "PP"}</b>
                    <small>{b[kind] ? credits(b[kind]) : "SIDE BET"}</small>
                  </button>
                ))}
              </div>
              <div className="bj-player-cards">
                {hands.map((h) => (
                  <div
                    className={
                      "bj-subhand " +
                      (settled && state
                        ? "hand-result-" +
                          (h.surrendered
                            ? "surrender"
                            : mainReturn(h, state.dealer) > h.bet
                              ? "win"
                              : mainReturn(h, state.dealer) === h.bet
                                ? "push"
                                : "loss") +
                          " "
                        : "") +
                      (active?.id === h.id && state?.phase === "playing"
                        ? "subhand-active"
                        : "")
                    }
                    key={h.id}
                  >
                    <div className="cards-row">
                      {h.cards.map((card) => (
                        <PlayingCard key={card.id} card={card} />
                      ))}
                    </div>
                    {h.cards.length > 0 && (
                      <span
                        className={
                          "bj-hand-total " + (h.done ? "total-done" : "")
                        }
                      >
                        {h.surrendered
                          ? "Surrender"
                          : handValue(h.cards).total > 21
                            ? "Bust"
                            : !h.split &&
                                h.cards.length === 2 &&
                                handValue(h.cards).total === 21
                              ? "Blackjack"
                              : handValue(h.cards).total}
                        {h.split && <small> · SPLIT</small>}
                      </span>
                    )}
                    {settled && state && (
                      <div className="bj-hand-verdict">
                        <b>
                          {h.surrendered
                            ? "SURRENDER"
                            : mainReturn(h, state.dealer) > h.bet
                              ? !h.split &&
                                h.cards.length === 2 &&
                                handValue(h.cards).total === 21
                                ? "BLACKJACK!"
                                : "WINNER"
                              : mainReturn(h, state.dealer) === h.bet
                                ? "PUSH"
                                : handValue(h.cards).total > 21
                                  ? "BUST"
                                  : "LOST"}
                        </b>
                        <small>
                          Total return{" "}
                          <AnimatedCredits
                            amount={mainReturn(h, state.dealer)}
                          />
                        </small>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <button
                className={"bj-main-zone " + (b.main ? "zone-funded" : "")}
                disabled={!betting}
                aria-label={"Main bet for hand " + (seat + 1)}
                onClick={() => place(seat, "main")}
              >
                {b.main ? (
                  <span className="bj-chip-on-table">{credits(b.main)}</span>
                ) : (
                  <Plus size={20} />
                )}
              </button>
              <span className="bj-seat-label">HAND {seat + 1}</span>
              {c.busy &&
                results &&
                state?.hands.some(
                  (h) => h.cards.length === 2 && h.seat === seat,
                ) && (
                  <div className="bj-side-outcomes">
                    {b.three > 0 && (
                      <span>
                        21+3: {results.three.name} ·{" "}
                        {credits(results.three.returned)}
                      </span>
                    )}
                    {b.pair > 0 && (
                      <span>
                        PP: {results.pair.name} ·{" "}
                        {credits(results.pair.returned)}
                      </span>
                    )}
                  </div>
                )}
              {state?.phase === "done" && results && (
                <div className="bj-side-outcomes">
                  {b.three > 0 && (
                    <span>21+3 return {credits(results.three.returned)}</span>
                  )}
                  {b.pair > 0 && (
                    <span>PP return {credits(results.pair.returned)}</span>
                  )}
                  {state.insurance[seat] > 0 && (
                    <span>
                      Insurance return{" "}
                      {credits(
                        dealerBlackjack(state) ? state.insurance[seat] * 3 : 0,
                      )}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {settled && state && <BlackjackResults round={state} />}
      <p className="bj-status" role="status">
        {caption}
      </p>
      {state?.phase === "insurance" && !motion.animating && (
        <section className="bj-insurance" aria-label="Insurance offer">
          <Shield />
          <div>
            <b>Dealer shows an ace</b>
            <p>
              Insurance costs half of each selected main bet and pays 2:1 if the
              dealer has blackjack.
            </p>
            <div className="insurance-choices">
              {state.bets.map(
                (b, i) =>
                  b.main > 0 && (
                    <label key={i}>
                      <input
                        type="checkbox"
                        checked={insured.includes(i)}
                        onChange={() =>
                          setInsured((s) =>
                            s.includes(i)
                              ? s.filter((n) => n !== i)
                              : [...s, i],
                          )
                        }
                      />
                      Hand {i + 1} · {credits(b.main / 2)}
                    </label>
                  ),
              )}
            </div>
          </div>
          <button
            className="button primary"
            disabled={!insured.length || uninsuredCost > c.balance}
            onClick={() => insure(insured)}
          >
            Insure selected · {credits(uninsuredCost)}
          </button>
          <button
            className="button secondary"
            disabled={
              state.bets.reduce((n, b) => n + b.main / 2, 0) > c.balance
            }
            onClick={() =>
              insure(state.bets.flatMap((b, i) => (b.main ? [i] : [])))
            }
          >
            Insure all
          </button>
          <button className="button secondary" onClick={() => insure([])}>
            Skip insurance
          </button>
        </section>
      )}
      {state?.phase === "playing" && (
        <div className="bj-play-actions">
          {(["hit", "stand", "double", "split", "surrender"] as BJAction[]).map(
            (action) => (
              <button
                key={action}
                className={
                  "button " + (hint === action ? "hint-action" : "secondary")
                }
                disabled={
                  motion.animating ||
                  !legal?.[action] ||
                  ((action === "double" || action === "split") &&
                    (active?.bet || 0) > c.balance)
                }
                onClick={() => act(action)}
              >
                {action === "double"
                  ? "Double down"
                  : action[0].toUpperCase() + action.slice(1)}
                {hint === action && <Lightbulb size={14} />}
              </button>
            ),
          )}
          {hint && <small>Two-card guide: {hint}. Your choice.</small>}
        </div>
      )}
      <div className="bj-betting-toolbar">
        <button
          className="bj-round-tool"
          disabled={!betting || !previousBets}
          onClick={() => change(copyBets(previousBets!))}
        >
          <RotateCcw />
          <span>Rebet</span>
        </button>
        <button
          className="bj-round-tool"
          disabled={!betting || !undo.length}
          onClick={() => {
            setBets(undo[undo.length - 1]);
            setUndo((u) => u.slice(0, -1));
            tone();
          }}
        >
          <Undo2 />
          <span>Undo</span>
        </button>
        <div className="bj-chip-rack" aria-label="Chip denominations">
          {chips.map((value, i) => (
            <button
              key={value}
              className={
                "bj-betting-chip chip-color-" +
                i +
                (!erase && chip === value ? " chip-selected" : "")
              }
              disabled={!betting}
              aria-pressed={!erase && chip === value}
              onClick={() => {
                setChip(value);
                setErase(false);
                tone();
              }}
            >
              <span>{credits(value).replace(".00", "")}</span>
            </button>
          ))}
          <button
            className={"bj-erase " + (erase ? "chip-selected" : "")}
            disabled={!betting}
            aria-label="Remove bet mode"
            aria-pressed={erase}
            onClick={() => setErase((e) => !e)}
          >
            <Trash2 />
          </button>
        </div>
        <button
          className="bj-round-tool"
          disabled={
            !betting ||
            !total ||
            bets.some((b) => b.main * 2 > MAIN_MAX) ||
            total * 2 > c.balance
          }
          onClick={() =>
            change(
              bets.map((b) => ({
                main: b.main * 2,
                three: b.three * 2,
                pair: b.pair * 2,
              })),
            )
          }
        >
          <b>2×</b>
          <span>Increase bets</span>
        </button>
        <button
          className="bj-deal-button"
          disabled={!betting || !total || total > c.balance}
          aria-label="Deal cards"
          onClick={deal}
        >
          <Play fill="currentColor" />
          <span>Play</span>
        </button>
      </div>
      <div className="bj-hud">
        <span>
          BET AMOUNT{" "}
          <b>{credits(c.busy ? state?.totalStake || total : total)}</b>
        </span>
        <span>
          DEMO BALANCE <b>{credits(c.balance)}</b>
        </span>
        <span>
          LAST RETURN <b>{credits(history[0]?.returned || 0)}</b>
        </span>
        <button
          disabled={!betting || !total}
          onClick={() =>
            change(
              Array.from({ length: 5 }, () => ({ main: 0, three: 0, pair: 0 })),
            )
          }
        >
          Clear bets
        </button>
        <button
          onClick={() => {
            setMenu(true);
            setTab("rules");
          }}
        >
          Rules & payouts
        </button>
      </div>
      <small className="bj-limit-note">
        Main bets 1–200 · each side bet 1–main bet · demo credits, no cash value{" "}
        {turbo ? "· TURBO ON" : ""}
      </small>
      {menu && (
        <section className="bj-menu-panel">
          <div className="bj-menu-tabs">
            <button
              aria-pressed={tab === "rules"}
              onClick={() => setTab("rules")}
            >
              Rules & paytables
            </button>
            <button
              aria-pressed={tab === "history"}
              onClick={() => setTab("history")}
            >
              Round history
            </button>
            <button onClick={() => setMenu(false)}>Close</button>
          </div>
          {tab === "rules" ? (
            <BlackjackRules />
          ) : (
            <div>
              <h3>Recent rounds</h3>
              {history.length ? (
                <table>
                  <thead>
                    <tr>
                      <th>Round</th>
                      <th>Total stake</th>
                      <th>Total return</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((h, i) => (
                      <tr key={i}>
                        <td>{history.length - i}</td>
                        <td>{credits(h.stake)}</td>
                        <td>{credits(h.returned)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No completed rounds in this table session.</p>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
