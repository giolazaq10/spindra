import { redNumbers } from "../lib/engine";
export default function RouletteBets({
  kind,
  number,
  disabled,
  onSelect,
}: {
  kind: string;
  number: number;
  disabled: boolean;
  onSelect: (kind: string, number?: number) => void;
}) {
  return (
    <section className="roulette-bets" aria-label="Roulette betting grid">
      <div className="roulette-numbers">
        <button
          className="roulette-zero"
          aria-label="Bet on number 0"
          aria-pressed={kind === "straight" && number === 0}
          disabled={disabled}
          onClick={() => onSelect("straight", 0)}
        >
          0
        </button>
        {[3, 2, 1]
          .flatMap((row) =>
            Array.from({ length: 12 }, (_, col) => row + col * 3),
          )
          .map((n) => (
            <button
              key={n}
              className={redNumbers.includes(n) ? "pocket-red" : "pocket-black"}
              aria-label={"Bet on number " + n}
              aria-pressed={kind === "straight" && number === n}
              disabled={disabled}
              onClick={() => onSelect("straight", n)}
            >
              {n}
            </button>
          ))}
      </div>
      <div className="roulette-outside">
        {["red", "black", "even", "odd"].map((k) => (
          <button
            key={k}
            className={
              k === "red" ? "pocket-red" : k === "black" ? "pocket-black" : ""
            }
            aria-pressed={kind === k}
            disabled={disabled}
            onClick={() => onSelect(k)}
          >
            {k[0].toUpperCase() + k.slice(1)} <small>1:1</small>
          </button>
        ))}
      </div>
      <p className="table-help">
        Single zero · Number pays 35:1 · Outside pays 1:1 · Zero loses outside
        bets.
      </p>
    </section>
  );
}
