import { useState } from "react";
import { validateBets, type SeatBet } from "../lib/blackjack";
const money = (n: number) => "$" + (n / 100).toFixed(2);
export default function BlackjackBetting({
  bets,
  previous,
  onChange,
  balance,
  disabled,
}: {
  bets: SeatBet[];
  previous: SeatBet[] | null;
  onChange: (bets: SeatBet[]) => void;
  balance: number;
  disabled: boolean;
}) {
  const [chip, setChip] = useState(20),
    [remove, setRemove] = useState(false),
    [history, setHistory] = useState<SeatBet[][]>([]),
    [notice, setNotice] = useState("");
  const total = bets.reduce((n, b) => n + b.main + b.three + b.pair, 0);
  function change(next: SeatBet[]) {
    if (disabled) return;
    try {
      if (next.some((b) => b.main || b.three || b.pair)) validateBets(next);
      const sum = next.reduce((n, b) => n + b.main + b.three + b.pair, 0);
      if (sum > 20000)
        throw Error("Maximum opening stake is $200 across all hands.");
      if (sum > balance)
        throw Error("This bet exceeds your available balance.");
      setHistory((h) => [...h.slice(-29), bets.map((b) => ({ ...b }))]);
      onChange(next);
      setNotice("");
    } catch (e) {
      setNotice((e as Error).message);
    }
  }
  function place(seat: number, kind: keyof SeatBet) {
    const next = bets.map((b) => ({ ...b }));
    if (remove) {
      next[seat][kind] = 0;
      if (kind === "main") next[seat].three = next[seat].pair = 0;
    } else {
      if (kind !== "main" && !next[seat].main) {
        setNotice("Place a main bet on this hand first.");
        return;
      }
      next[seat][kind] += chip;
    }
    change(next);
  }
  return (
    <section className="blackjack-betting" aria-label="Blackjack betting table">
      <h3>Place your chips</h3>
      <p className="table-help">
        Choose a chip, then tap a main bet or side bet. Play up to five hands.
        Side bets are optional and independent.
      </p>
      <div className="blackjack-chip-rack" aria-label="Choose chip value">
        {[20, 50, 100, 500, 1000, 2500].map((n) => (
          <button
            key={n}
            disabled={disabled}
            className="blackjack-chip"
            aria-pressed={!remove && chip === n}
            onClick={() => {
              setChip(n);
              setRemove(false);
            }}
          >
            {money(n)}
          </button>
        ))}
        <button
          disabled={disabled}
          aria-pressed={remove}
          onClick={() => setRemove((v) => !v)}
        >
          Remove chips
        </button>
      </div>
      <div className="blackjack-bet-spots">
        {bets.map((b, i) => (
          <article key={i} className={b.main ? "bet-spot-funded" : ""}>
            <h4>Hand {i + 1}</h4>
            <button
              className="blackjack-main-bet"
              disabled={disabled}
              aria-label={"Main bet for hand " + (i + 1)}
              onClick={() => place(i, "main")}
            >
              <span>Main bet</span>
              <strong>{b.main ? money(b.main) : "+ Add chip"}</strong>
            </button>
            <div className="blackjack-side-bets">
              {(["three", "pair"] as const).map((kind) => (
                <button
                  key={kind}
                  disabled={disabled}
                  aria-label={
                    (kind === "three" ? "21+3" : "Perfect Pair") +
                    " bet for hand " +
                    (i + 1)
                  }
                  onClick={() => place(i, kind)}
                >
                  <span>{kind === "three" ? "21+3" : "Perfect Pair"}</span>
                  <strong>{b[kind] ? money(b[kind]) : "+ Add"}</strong>
                </button>
              ))}
            </div>
          </article>
        ))}
      </div>
      <div className="blackjack-bet-tools">
        <button
          disabled={disabled || !history.length}
          onClick={() => {
            const last = history[history.length - 1];
            onChange(last);
            setHistory((h) => h.slice(0, -1));
            setNotice("");
          }}
        >
          Undo
        </button>
        <button
          disabled={disabled || !total}
          onClick={() =>
            change(bets.map(() => ({ main: 0, three: 0, pair: 0 })))
          }
        >
          Clear bets
        </button>
        <button
          disabled={disabled || !previous}
          onClick={() => previous && change(previous.map((b) => ({ ...b })))}
        >
          Rebet
        </button>
        <button
          disabled={disabled || !total}
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
          Double bets
        </button>
        <strong>Total stake {money(total)}</strong>
      </div>
      {notice && (
        <p className="blackjack-bet-notice" role="status">
          {notice}
        </p>
      )}
      <details className="blackjack-side-guide">
        <summary>Side bet payouts & table rules</summary>
        <p>
          21+3 uses your first two cards and the dealer’s up-card: flush 5:1,
          straight 10:1, trips 30:1, straight flush 40:1, suited trips 100:1.
        </p>
        <p>
          Perfect Pair uses your first two cards: mixed pair 5:1, colored pair
          12:1, perfect pair 26:1. Highest matching category pays once. Returns
          include stake.
        </p>
        <p>
          Blackjack pays 3:2 · Dealer hits soft 17 · Insurance pays 2:1 · Double
          after split · One split per original hand · Late surrender. Minimum
          $0.20 in $0.10 increments; each side bet cannot exceed its main bet.
          Maximum $200 for the full round, including additional actions.
        </p>
      </details>
    </section>
  );
}
