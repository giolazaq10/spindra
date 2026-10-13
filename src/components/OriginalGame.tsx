import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { type Original, rtpLabel } from "@/lib/catalog";
import {
  randomInt,
  rouletteReturn,
  redNumbers,
  type RouletteBet,
} from "@/lib/engine";
import TexasHoldem from "./TexasHoldem";
import BlackjackRules from "./BlackjackRules";
import Blackjack from "./Blackjack";
import GameControls from "./GameControls";
import SlotRules from "./SlotRules";
import { demoRoundId } from "../lib/demoLedger";
import AdvancedSlots from "./AdvancedSlots";
import { credits, useDemo } from "@/context/Demo";
export type Controls = {
  bet: number;
  start: (extra?: number) => boolean;
  finish: (returned: number) => void;
  setMessage: (message: string) => void;
  balance: number;
  busy: boolean;
  setBet: (bet: number) => void;
  stakes: number[];
  message: string;
  rules: boolean;
  toggleRules: () => void;
  poker: boolean;
  setLeaveReturn: (returned: number) => void;
};
export default function OriginalGame({ game }: { game: Original }) {
  const demo = useDemo(),
    [bet, setBet] = useState(game.kind === "poker" ? 5000 : 100),
    [message, setMessage] = useState("Choose your stake and enjoy the demo."),
    [rules, setRules] = useState(false),
    [busy, setBusy] = useState(false);
  const wager = useRef<{
      id: string;
      amount: number;
      leaveReturn: number;
    } | null>(null),
    settler = useRef(demo.settle);
  useEffect(() => {
    settler.current = demo.settle;
  }, [demo.settle]);
  useEffect(
    () => () => {
      if (wager.current) {
        const abandoned = wager.current;
        wager.current = null;
        settler.current(game.name, abandoned.id, abandoned.leaveReturn);
      }
    },
    [game.name],
  );
  function start(extra = bet) {
    const id = wager.current?.id || demoRoundId();
    if (!demo.reserve(extra, id)) {
      setMessage(
        demo.blocked
          ? "Demo play is paused for this session."
          : "Not enough demo credits, or your session loss limit has been reached.",
      );
      return false;
    }
    wager.current = {
      id,
      amount: (wager.current?.amount || 0) + extra,
      leaveReturn: 0,
    };
    setBusy(true);
    return true;
  }
  function finish(returned: number) {
    if (!wager.current) return;
    const completed = wager.current;
    wager.current = null;
    demo.settle(game.name, completed.id, returned);
    setBusy(false);
    setMessage(
      game.kind === "poker"
        ? "Hand settled · " +
            credits(returned) +
            " chips returned to your demo wallet."
        : returned > 0
          ? "Returned " + credits(returned) + " credits (includes stake)."
          : "No return this round. Take your time.",
    );
  }
  const c: Controls = {
    bet,
    start,
    finish,
    setMessage,
    balance: demo.balance,
    busy,
    setBet,
    stakes:
      game.kind === "poker"
        ? [1000, 2000, 5000, 10000, 20000]
        : [100, 200, 500, 1000, 2000],
    message,
    rules,
    toggleRules: () => setRules((r) => !r),
    poker: game.kind === "poker",
    setLeaveReturn: (returned) => {
      if (wager.current) wager.current.leaveReturn = returned;
    },
  };
  return (
    <section className="page game-page">
      <Link className="text-link" to="/games">
        <ArrowLeft size={16} /> Back to casino
      </Link>
      <div className="section-heading">
        <div>
          <span className="eyebrow">SPINDRA ORIGINAL / DEMO</span>
          <h1>{game.name}</h1>
          <p className="muted">{game.tagline}</p>
        </div>
      </div>
      <div
        className={"game-surface " + game.animation}
        style={
          { "--theme": game.color, "--accent": game.accent } as CSSProperties
        }
      >
        <div className="game-top">
          <span className="pill">DEMO CREDITS · NO CASH VALUE</span>
          <span>{rtpLabel(game)}</span>
        </div>
        {game.kind === "slots" ? (
          <AdvancedSlots game={game} controls={c} />
        ) : game.kind === "blackjack" ? (
          <Blackjack controls={c} />
        ) : game.kind === "poker" ? (
          <TexasHoldem controls={c} />
        ) : (
          <Roulette controls={c} />
        )}
        {rules && (
          <div className="panel rules embedded-rules">
            <h2>Know your game</h2>
            <p>
              All wagers and payouts shown here use demo credits. Returns
              include the original stake. Original game engines run in your
              browser and are disabled for cash wagering. Leaving an unfinished
              round forfeits committed demo chips; uncommitted poker chips are
              returned.
            </p>
            {game.kind === "slots" ? (
              <SlotRules game={game} />
            ) : game.kind === "blackjack" ? (
              <BlackjackRules />
            ) : game.kind === "poker" ? (
              <>
                <p>
                  No-limit Texas Hold’em against two computer opponents. Each
                  hand starts with equal stacks matching your hand buy-in.
                  Dealer button rotates; small blind is 1/20 of the buy-in and
                  big blind is 1/10. You receive two private cards, then a flop
                  (three cards), turn and river. Make the best five-card hand
                  from any combination of your two cards and five community
                  cards. Ace can be low only in A–2–3–4–5. Suits never break
                  ties.
                </p>
                <p>
                  Check, call, fold or raise on your turn. A minimum raise
                  equals the previous full bet or raise; short all-in raises do
                  not reopen action to players who already acted. All-ins create
                  separate side pots; folded hands cannot win. Ties split each
                  pot and odd minor chips go clockwise from the dealer. No rake,
                  antes, insurance or rebuy mid-hand. Leaving a hand folds your
                  committed bets and returns uncommitted chips. Computer
                  opponents use only their own cards and public information.
                </p>
                <p>
                  Hands rank: straight flush, four of a kind, full house, flush,
                  straight, three of a kind, two pair, pair, high card. A royal
                  flush is the highest straight flush. Higher ranks and then
                  kickers resolve ties.
                </p>
              </>
            ) : (
              <p>
                European single-zero roulette: 37 equally likely pockets (0–36).
                Straight bets pay 35:1 (36× returned); red, black, odd, even,
                1–18 and 19–36 pay 1:1 (2× returned). Zero loses every outside
                bet. No la partage or en prison. One bet per spin. Wheel colors
                and final pocket follow the same result.
              </p>
            )}
          </div>
        )}
      </div>
      <div className="notice">
        Real-money play is unavailable while the platform is being prepared.{" "}
        <Link to="/responsible-gaming">Set your demo limits</Link> or{" "}
        <Link to="/account">view account status</Link>.
      </div>
    </section>
  );
}
function Roulette({ controls: c }: { controls: Controls }) {
  const [kind, setKind] = useState<RouletteBet>("red"),
    [straight, setStraight] = useState(0),
    [number, setNumber] = useState<number | null>(null),
    [spinning, setSpinning] = useState(false),
    [turn, setTurn] = useState(0),
    [history, setHistory] = useState<number[]>([]);
  const lock = useRef(false),
    timer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(timer.current), []);
  const pockets = [
    0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5,
    24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
  ];
  function spin() {
    if (lock.current || !c.start()) return;
    lock.current = true;
    setSpinning(true);
    setNumber(null);
    const n = randomInt(37),
      stake = c.bet,
      index = pockets.indexOf(n),
      target = turn + 360 * 5 + (360 - (turn % 360)) - (index * 360) / 37;
    setTurn(target);
    timer.current = setTimeout(() => {
      setNumber(n);
      setHistory((h) => [n, ...h].slice(0, 10));
      setSpinning(false);
      c.finish(rouletteReturn(n, kind, stake, straight));
      lock.current = false;
    }, 4200);
  }
  return (
    <div className="roulette-game">
      <div className="wheel-holder">
        <span className="wheel-pointer">▼</span>
        <span
          className={"roulette-ball " + (spinning ? "ball-spinning" : "")}
          aria-hidden="true"
        />
        <div className="wheel" style={{ transform: "rotate(" + turn + "deg)" }}>
          {pockets.map((n, i) => (
            <span
              key={n}
              className={
                n === 0 ? "green-pocket" : i % 2 === 1 ? "red-pocket" : ""
              }
              style={{ transform: "rotate(" + (i * 360) / 37 + "deg)" }}
            >
              <b>{n}</b>
            </span>
          ))}
          <div className="wheel-hub">✦</div>
        </div>
        <div className="wheel-result">{number ?? "·"}</div>
      </div>
      <div className="roulette-controls">
        <p className="eyebrow">EUROPEAN ROULETTE · PLACE ONE BET</p>
        <div className="roulette-history" aria-label="Recent results">
          {history.map((n, i) => (
            <span
              key={i}
              className={
                n === 0 ? "zero" : redNumbers.includes(n) ? "red" : "black"
              }
            >
              {n}
            </span>
          ))}
        </div>
        <div className="roulette-board">
          {Array.from({ length: 37 }, (_, n) => (
            <button
              key={n}
              disabled={spinning}
              aria-pressed={kind === "straight" && straight === n}
              className={
                (n === 0 ? "zero" : redNumbers.includes(n) ? "red" : "black") +
                (kind === "straight" && straight === n ? " chosen" : "") +
                (number === n ? " landed" : "")
              }
              onClick={() => {
                setStraight(n);
                setKind("straight");
              }}
            >
              {n}
            </button>
          ))}
        </div>
        <div className="bet-options">
          {(
            [
              "red",
              "black",
              "odd",
              "even",
              "low",
              "high",
              "straight",
            ] as RouletteBet[]
          ).map((k) => (
            <button
              key={k}
              disabled={spinning}
              className={"button " + (kind === k ? "selected" : "secondary")}
              onClick={() => setKind(k)}
            >
              {k === "low"
                ? "1–18"
                : k === "high"
                  ? "19–36"
                  : k === "straight"
                    ? "Single number"
                    : k}
            </button>
          ))}
        </div>
        {kind === "straight" && (
          <label>
            Number (0–36)
            <input
              type="number"
              min={0}
              max={36}
              step={1}
              disabled={spinning}
              value={straight}
              onChange={(e) =>
                setStraight(
                  Math.max(0, Math.min(36, Math.floor(Number(e.target.value)))),
                )
              }
            />
          </label>
        )}
        <GameControls controls={c} />
        <button className="button primary" disabled={spinning} onClick={spin}>
          {spinning ? "Wheel spinning…" : "Spin wheel"}
        </button>
      </div>
    </div>
  );
}
