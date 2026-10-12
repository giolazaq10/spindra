import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, RotateCw, Info } from "lucide-react";
import { type Original, rtpLabel } from "@/lib/catalog";
import {
  blackjackReturn,
  deck,
  handValue,
  pokerPays,
  pokerRank,
  randomInt,
  rouletteReturn,
  slotSpin,
  type Card,
  type RouletteBet,
} from "@/lib/engine";
import { credits, useDemo } from "@/context/Demo";
type Controls = {
  bet: number;
  start: (extra?: number) => boolean;
  finish: (returned: number) => void;
  setMessage: (message: string) => void;
};
function PlayingCard({
  card,
  hidden = false,
}: {
  card?: Card;
  hidden?: boolean;
}) {
  if (hidden || !card)
    return (
      <div className="playing-card card-back">
        <span>✦</span>
      </div>
    );
  const rank =
    ({ 11: "J", 12: "Q", 13: "K", 14: "A" } as Record<number, string>)[
      card.rank
    ] || card.rank;
  const suit = ["♠", "♥", "♣", "♦"][card.suit];
  return (
    <div className={"playing-card " + (card.suit % 2 === 1 ? "red-card" : "")}>
      <small>
        {rank}
        <br />
        {suit}
      </small>
      <strong>{suit}</strong>
      <small>{rank}</small>
    </div>
  );
}
export default function OriginalGame({ game }: { game: Original }) {
  const demo = useDemo(),
    [bet, setBet] = useState(100),
    [message, setMessage] = useState("Choose your stake and enjoy the demo."),
    [rules, setRules] = useState(false),
    [busy, setBusy] = useState(false);
  const wager = useRef(0),
    settler = useRef(demo.settle);
  settler.current = demo.settle;
  useEffect(
    () => () => {
      if (wager.current) {
        settler.current(game.name, wager.current, 0);
        wager.current = 0;
      }
    },
    [game.name],
  );
  function start(extra = bet) {
    if (!demo.reserve(extra)) {
      setMessage(
        demo.blocked
          ? "Demo play is paused for this session."
          : "Not enough demo credits, or your session loss limit has been reached.",
      );
      return false;
    }
    wager.current += extra;
    setBusy(true);
    return true;
  }
  function finish(returned: number) {
    if (!wager.current) return;
    demo.settle(game.name, wager.current, returned);
    wager.current = 0;
    setBusy(false);
    setMessage(
      returned > 0
        ? "Returned " + credits(returned) + " credits (includes stake)."
        : "No return this round. Take your time.",
    );
  }
  const c = { bet, start, finish, setMessage };
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
        <button
          className="button secondary"
          onClick={() => setRules(!rules)}
          aria-expanded={rules}
        >
          <Info size={17} /> Rules & payouts
        </button>
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
          <Slots game={game} controls={c} />
        ) : game.kind === "blackjack" ? (
          <Blackjack controls={c} />
        ) : game.kind === "poker" ? (
          <Poker controls={c} />
        ) : (
          <Roulette controls={c} />
        )}
        <div className="game-bottom">
          <div>
            <span className="eyebrow">DEMO BALANCE</span>
            <strong>{credits(demo.balance)}</strong>
          </div>
          <label>
            Stake
            <select
              disabled={busy}
              value={bet}
              onChange={(e) => setBet(Number(e.target.value))}
            >
              {[100, 200, 500, 1000, 2000].map((n) => (
                <option key={n} value={n}>
                  {credits(n)} credits
                </option>
              ))}
            </select>
          </label>
          <div className="game-result" role="status" aria-live="polite">
            {message}
          </div>
        </div>
      </div>
      {rules && (
        <div className="panel rules">
          <h2>Know your game</h2>
          <p>
            All wagers and payouts shown here use demo credits. Returns include
            the original stake. Original game engines run in your browser and
            are disabled for cash wagering. Leaving an unfinished round forfeits
            its demo stake.
          </p>
          {game.kind === "slots" ? (
            <>
              <p>
                Three independent weighted reels, one center payline. Match all
                three symbols on that line. No wilds, scatters, bonus rounds or
                progressive jackpots. Top and bottom symbols are decoration.
                Theoretical RTP is calculated from the published weights and
                payouts; it does not predict a session result.
              </p>
              <div className="paytable">
                {game.symbols.map((s, i) => (
                  <div key={i}>
                    <b>
                      {s} {s} {s}
                    </b>
                    <span>{game.math.pays[i]}× stake</span>
                    <small>Reel weight {game.math.weights[i]}/100</small>
                  </div>
                ))}
              </div>
            </>
          ) : game.kind === "blackjack" ? (
            <p>
              Single shuffled 52-card deck each round. Dealer peeks for
              blackjack and stands on all 17s, including soft 17. Natural
              blackjack pays 3:2; other wins pay 1:1; ties push. Double on any
              first two cards, including after a split. Split equal ranks up to
              four hands; split aces get one card each and cannot be resplit. A
              split 21 pays 1:1. No insurance or surrender. All hands settle
              together.
            </p>
          ) : game.kind === "poker" ? (
            <>
              <p>
                Jacks or Better video poker, one 52-card deck per round. Deal
                five cards, hold any selection, then draw once. Discarded cards
                cannot return. Aces play high, or low in A–2–3–4–5. Fixed
                single-credit paytable; royal flush returns 250× at every stake.
                This is video poker, not multiplayer poker.
              </p>
              <div className="paytable">
                {Object.entries(pokerPays).map(([name, n]) => (
                  <div key={name}>
                    <b>{name}</b>
                    <span>{n}× stake</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p>
              European single-zero roulette: 37 equally likely pockets (0–36).
              Straight bets pay 35:1 (36× returned); red, black, odd, even, 1–18
              and 19–36 pay 1:1 (2× returned). Zero loses every outside bet. No
              la partage or en prison. One bet per spin. Wheel colors and final
              pocket follow the same result.
            </p>
          )}
        </div>
      )}
      <div className="notice">
        Real-money play is unavailable while the platform is being prepared.{" "}
        <Link to="/responsible-gaming">Set your demo limits</Link> or{" "}
        <Link to="/account">view account status</Link>.
      </div>
    </section>
  );
}
function Slots({ game, controls: c }: { game: Original; controls: Controls }) {
  const [reels, setReels] = useState([0, 1, 2]),
    [spinning, setSpinning] = useState(false),
    [win, setWin] = useState(false);
  const lock = useRef(false),
    timer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(timer.current), []);
  function spin() {
    if (lock.current || !c.start()) return;
    lock.current = true;
    setSpinning(true);
    setWin(false);
    const result = slotSpin(game.math),
      stake = c.bet;
    timer.current = setTimeout(() => {
      setReels(result.reels);
      setSpinning(false);
      setWin(result.multiplier > 0);
      c.finish(stake * result.multiplier);
      lock.current = false;
    }, 1100);
  }
  return (
    <div className="slot-machine">
      <span className="slot-title">{game.name.toUpperCase()}</span>
      <div
        className={
          "reels " + (spinning ? "spinning " : "") + (win ? "win" : "")
        }
      >
        {reels.map((r, i) => (
          <div
            className="reel"
            key={i}
            style={{ animationDelay: i * 0.1 + "s" }}
          >
            <span className="ghost-symbol">{game.symbols[(r + 6) % 7]}</span>
            <span className="pay-symbol">{game.symbols[r]}</span>
            <span className="ghost-symbol">{game.symbols[(r + 1) % 7]}</span>
          </div>
        ))}
      </div>
      <div className="payline-label">01 — CENTER PAYLINE</div>
      <button
        className="button primary play-button"
        disabled={spinning}
        onClick={spin}
      >
        <RotateCw size={19} />
        {spinning ? "Spinning…" : "Spin reels"}
      </button>
    </div>
  );
}
type BJHand = {
  cards: Card[];
  bet: number;
  split: boolean;
  done: boolean;
  aces: boolean;
};
type BJ = {
  shoe: Card[];
  dealer: Card[];
  hands: BJHand[];
  active: number;
  done: boolean;
};
function Blackjack({ controls: c }: { controls: Controls }) {
  const [state, setState] = useState<BJ | null>(null);
  const stateRef = useRef<BJ | null>(null);
  function save(s: BJ) {
    stateRef.current = s;
    setState({ ...s });
  }
  function complete(s: BJ) {
    while (handValue(s.dealer).total < 17) s.dealer.push(s.shoe.pop()!);
    s.done = true;
    save(s);
    c.finish(
      s.hands.reduce(
        (sum, h) => sum + blackjackReturn(h.cards, s.dealer, h.bet, !h.split),
        0,
      ),
    );
  }
  function advance(s: BJ) {
    while (s.active < s.hands.length && s.hands[s.active].done) s.active++;
    if (s.active === s.hands.length) complete(s);
    else save(s);
  }
  function deal() {
    if ((stateRef.current && !stateRef.current.done) || !c.start()) return;
    const shoe = deck(),
      s: BJ = {
        shoe,
        dealer: [shoe.pop()!, shoe.pop()!],
        hands: [
          {
            cards: [shoe.pop()!, shoe.pop()!],
            bet: c.bet,
            split: false,
            done: false,
            aces: false,
          },
        ],
        active: 0,
        done: false,
      };
    if (
      handValue(s.dealer).total === 21 ||
      handValue(s.hands[0].cards).total === 21
    ) {
      s.done = true;
      s.hands[0].done = true;
      save(s);
      c.finish(blackjackReturn(s.hands[0].cards, s.dealer, c.bet));
    } else save(s);
  }
  function act(action: "hit" | "stand" | "double" | "split") {
    const current = stateRef.current;
    if (!current || current.done) return;
    const s: BJ = {
      ...current,
      shoe: [...current.shoe],
      dealer: [...current.dealer],
      hands: current.hands.map((h) => ({ ...h, cards: [...h.cards] })),
    };
    const h = s.hands[s.active];
    if (h.done) return;
    if (action === "stand") h.done = true;
    if (action === "hit") {
      h.cards.push(s.shoe.pop()!);
      if (handValue(h.cards).total >= 21) h.done = true;
    }
    if (action === "double") {
      if (h.cards.length !== 2 || h.aces || !c.start(h.bet)) return;
      h.bet *= 2;
      h.cards.push(s.shoe.pop()!);
      h.done = true;
    }
    if (action === "split") {
      if (
        h.cards.length !== 2 ||
        h.cards[0].rank !== h.cards[1].rank ||
        s.hands.length >= 4 ||
        h.aces ||
        !c.start(h.bet)
      )
        return;
      const aces = h.cards[0].rank === 14;
      const a: BJHand = {
        cards: [h.cards[0], s.shoe.pop()!],
        bet: h.bet,
        split: true,
        done: aces,
        aces,
      };
      const b: BJHand = {
        cards: [h.cards[1], s.shoe.pop()!],
        bet: h.bet,
        split: true,
        done: aces,
        aces,
      };
      if (handValue(a.cards).total === 21) a.done = true;
      if (handValue(b.cards).total === 21) b.done = true;
      s.hands.splice(s.active, 1, a, b);
    }
    advance(s);
  }
  const hand = state && !state.done ? state.hands[state.active] : null;
  return (
    <div className="table-game">
      <p className="table-inscription">
        BLACKJACK PAYS 3:2 · DEALER STANDS ON SOFT 17
      </p>
      <div className="hand-label">
        Dealer {state?.done ? "· " + handValue(state.dealer).total : ""}
      </div>
      <div className="cards-row">
        {state ? (
          state.dealer.map((card, i) => (
            <PlayingCard key={i} card={card} hidden={!state.done && i === 1} />
          ))
        ) : (
          <>
            <PlayingCard hidden />
            <PlayingCard hidden />
          </>
        )}
      </div>
      <div className="blackjack-hands">
        {state?.hands.map((h, i) => (
          <div
            className={
              "blackjack-hand " +
              (!state.done && i === state.active ? "active-hand" : "")
            }
            key={i}
          >
            <span className="hand-label">
              Hand {i + 1} · {handValue(h.cards).total} · {credits(h.bet)}{" "}
              credits
            </span>
            <div className="cards-row">
              {h.cards.map((card, j) => (
                <PlayingCard card={card} key={j} />
              ))}
            </div>
            {state.done && (
              <span className="hand-label">
                Returned{" "}
                {credits(
                  blackjackReturn(h.cards, state.dealer, h.bet, !h.split),
                )}
              </span>
            )}
          </div>
        ))}
      </div>
      <div className="game-actions">
        {!state || state.done ? (
          <button className="button primary" onClick={deal}>
            Deal cards
          </button>
        ) : (
          <>
            <button className="button primary" onClick={() => act("hit")}>
              Hit
            </button>
            <button className="button secondary" onClick={() => act("stand")}>
              Stand
            </button>
            <button
              className="button secondary"
              disabled={!hand || hand.cards.length !== 2 || hand.aces}
              onClick={() => act("double")}
            >
              Double
            </button>
            <button
              className="button secondary"
              disabled={
                !hand ||
                hand.cards.length !== 2 ||
                hand.cards[0].rank !== hand.cards[1].rank ||
                state.hands.length >= 4 ||
                hand.aces
              }
              onClick={() => act("split")}
            >
              Split
            </button>
          </>
        )}
      </div>
    </div>
  );
}
function Poker({ controls: c }: { controls: Controls }) {
  const [cards, setCards] = useState<Card[]>([]),
    [held, setHeld] = useState<boolean[]>(Array(5).fill(false)),
    [phase, setPhase] = useState<"ready" | "hold" | "done">("ready"),
    [rank, setRank] = useState("");
  const shoe = useRef<Card[]>([]),
    stake = useRef(0),
    phaseRef = useRef(phase);
  function deal() {
    if (phaseRef.current === "hold" || !c.start()) return;
    shoe.current = deck();
    stake.current = c.bet;
    setCards(shoe.current.splice(0, 5));
    setHeld(Array(5).fill(false));
    phaseRef.current = "hold";
    setPhase("hold");
    setRank("Select cards to hold, then draw.");
  }
  function draw() {
    if (phaseRef.current !== "hold") return;
    phaseRef.current = "done";
    const final = cards.map((card, i) =>
      held[i] ? card : shoe.current.pop()!,
    );
    const result = pokerRank(final);
    setCards(final);
    setRank(result);
    setPhase("done");
    c.finish(stake.current * pokerPays[result]);
  }
  return (
    <div className="table-game poker">
      <p className="table-inscription">
        JACKS OR BETTER · 9/6 PAYTABLE · ONE DRAW
      </p>
      <div className="cards-row poker-cards">
        {Array.from({ length: 5 }, (_, i) => (
          <button
            key={i}
            className={"hold-card " + (held[i] ? "held" : "")}
            disabled={phase !== "hold"}
            onClick={() => setHeld((h) => h.map((v, j) => (i === j ? !v : v)))}
            aria-label={"Card " + (i + 1) + (held[i] ? " held" : " not held")}
            aria-pressed={held[i]}
          >
            <PlayingCard card={cards[i]} />
            <span>{held[i] ? "HELD" : "HOLD"}</span>
          </button>
        ))}
      </div>
      <p className="hand-label" aria-live="polite">
        {rank || "Five cards. Choose your hand."}
      </p>
      <div className="game-actions">
        <button
          className="button primary"
          onClick={phase === "hold" ? draw : deal}
        >
          {phase === "hold" ? "Draw cards" : "Deal hand"}
        </button>
        {phase === "hold" && (
          <button
            className="button secondary"
            onClick={() => setHeld(Array(5).fill(true))}
          >
            Hold all
          </button>
        )}
      </div>
    </div>
  );
}
function Roulette({ controls: c }: { controls: Controls }) {
  const [kind, setKind] = useState<RouletteBet>("red"),
    [straight, setStraight] = useState(0),
    [number, setNumber] = useState<number | null>(null),
    [spinning, setSpinning] = useState(false),
    [turn, setTurn] = useState(0);
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
      setSpinning(false);
      c.finish(rouletteReturn(n, kind, stake, straight));
      lock.current = false;
    }, 1800);
  }
  return (
    <div className="roulette-game">
      <div className="wheel-holder">
        <span className="wheel-pointer">▼</span>
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
        <p className="eyebrow">PLACE ONE BET</p>
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
        <button className="button primary" disabled={spinning} onClick={spin}>
          {spinning ? "Wheel spinning…" : "Spin wheel"}
        </button>
      </div>
    </div>
  );
}
