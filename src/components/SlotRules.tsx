import type { Original } from "../lib/catalog";
import PremiumSlotRules from "./PremiumSlotRules";
export default function SlotRules({ game }: { game: Original }) {
  const s = game.slot!;
  if (s.premium) return <PremiumSlotRules game={game} />;
  return (
    <div className="slot-rulebook">
      <h3>{s.feature}</h3>
      <p>{s.description}</p>
      <p>
        {s.reels} independent weighted reels × {s.rows} rows.{" "}
        {s.mode === "lines"
          ? s.lines.length + " fixed lines"
          : s.rows ** s.reels + " adjacent-reel ways"}{" "}
        pay from the {s.direction === "left" ? "leftmost" : "rightmost"} reel.
        Match at least {s.minimum} identical symbols on consecutive reels. Only
        the longest match pays on a line or symbol combination.{" "}
        {s.mode === "ways" &&
          "Every matching row combination is counted; symbols need not be on a straight line."}{" "}
        All awards below are multiples of the TOTAL stake, including stake,
        rather than line stake.
      </p>
      {s.scatter ? (
        <p>
          <b>{s.scatter.name}:</b> counted anywhere, separately from line or
          ways wins.{" "}
          {s.scatter.awards
            .flatMap((award, count) =>
              !award || s.scatter!.awards[count - 1] === award
                ? []
                : [
                    `${count}${s.scatter!.awards[count + 1] === award ? "+" : ""}: ${award}×`,
                  ],
            )
            .join(" · ")}
          . Scatter symbols never substitute for other symbols. Scatter and
          regular awards add together.
        </p>
      ) : (
        <p>No scatter symbols in this game.</p>
      )}
      {s.wild && (
        <p>
          <b>WILD:</b> appears only on reel {s.wild.reel + 1} (counted from the
          left), and substitutes for regular symbols only. It never substitutes
          for a scatter and has no separate payout. Line wins pay their longest
          match once; ways count each distinct row combination once. The outer
          reels never contain wilds, so an all-wild combination cannot occur.
        </p>
      )}
      <p>
        Big, Mega and Epic win celebrations start at 10×, 25× and 50× the stake
        returned. Celebrations do not add a payout or place another bet.
      </p>
      <p>
        No progressive jackpot, bonus purchase or free-spin feature. Every spin
        is independent; past results do not affect the next spin. Theoretical
        RTP is computed from these exact symbol weights and payouts before cash
        rounding. Cash returns are rounded down once to a USD cent after adding
        all awards. This can reduce the effective RTP at smaller stakes. Minimum
        stake: $0.20, in $0.10 increments.
      </p>
      <div className="slot-paytable">
        <div>
          <b>SYMBOL</b>
          {Array.from({ length: s.reels - s.minimum + 1 }, (_, i) => (
            <b key={i}>{i + s.minimum} MATCH</b>
          ))}
          <b>WEIGHT</b>
        </div>
        {s.pays.map((awards, symbol) => (
          <div key={symbol}>
            <b>{s.symbolNames[symbol]}</b>
            {awards.map((pay, i) => (
              <span key={i}>{(pay / 100).toFixed(2)}×</span>
            ))}
            <small>{s.weights[symbol]}</small>
          </div>
        ))}
        {s.scatter && (
          <p>
            {s.scatter.name} weight: {s.scatter.weight}.
          </p>
        )}
      </div>
      {s.wild && (
        <p>
          Wild weight on reel {s.wild.reel + 1}: {s.wild.weight}. Total weight
          on that reel: {s.weights.reduce((a, b) => a + b, 0)}; other reels:{" "}
          {s.weights.reduce((a, b) => a + b, 0) - s.wild.weight}. Each cell is
          drawn independently.
        </p>
      )}
      {s.mode === "lines" && (
        <div className="payline-guide">
          {s.lines.map((rows, i) => (
            <div key={i}>
              <small>LINE {i + 1}</small>
              <svg viewBox={`0 0 ${s.reels * 20} ${s.rows * 20}`}>
                <polyline
                  points={rows
                    .map((r, c) => `${c * 20 + 10},${r * 20 + 10}`)
                    .join(" ")}
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="2"
                />
                {rows.map((r, c) => (
                  <circle
                    key={c}
                    cx={c * 20 + 10}
                    cy={r * 20 + 10}
                    r="3"
                    fill="var(--accent)"
                  />
                ))}
              </svg>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
