import { useEffect, useState, type CSSProperties } from "react";
import { slotWinTier } from "../lib/slotWinTier";
import AnimatedCredits from "./AnimatedCredits";
import CinematicEffects from "./CinematicEffects";
export default function SlotWinCelebration({
  returned,
  stake,
  scatter = false,
  signature = false,
  bonus = false,
}: {
  returned: number;
  stake: number;
  scatter?: boolean;
  signature?: boolean;
  bonus?: boolean;
}) {
  const [visible, setVisible] = useState(true),
    tier = slotWinTier(returned, stake),
    big = tier !== "normal";
  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), big ? 4200 : 2300);
    return () => clearTimeout(timer);
  }, [big]);
  if (!visible || returned <= 0) return null;
  const title =
    tier === "epic"
      ? "EPIC WIN"
      : tier === "mega"
        ? "MEGA WIN"
        : tier === "big"
          ? "BIG WIN"
          : bonus
            ? returned > stake
              ? "BONUS WIN"
              : "BONUS RETURN"
            : scatter
              ? returned > stake
                ? "SCATTER WIN"
                : "SCATTER RETURN"
              : returned > stake
                ? "YOU WIN"
                : "RETURN";
  return (
    <div
      className={
        (signature ? "signature-award " : "win-celebration ") +
        "slot-win-overlay tier-" +
        tier
      }
      data-win-tier={tier}
    >
      {(big || returned > stake) && (
        <CinematicEffects cue={big ? tier : "win"} />
      )}
      {returned > stake && <div className="slot-win-rays" aria-hidden="true" />}
      {(big || returned > stake) && (
        <div className="slot-win-particles" aria-hidden="true">
          {Array.from(
            { length: tier === "epic" ? 42 : big ? 30 : 14 },
            (_, i) => (
              <i
                key={i}
                style={
                  {
                    "--piece": i,
                    "--lane": (i * 37) % 100,
                    "--drift": (i % 2 ? 1 : -1) * (25 + (i % 7) * 12),
                    "--confetti-hue": (i * 47) % 360,
                  } as CSSProperties
                }
              >
                {i % 3 ? "✦" : "●"}
              </i>
            ),
          )}
        </div>
      )}
      <section className="slot-win-card" aria-label="Confirmed slot return">
        <button
          aria-label="Dismiss win celebration"
          onClick={() => setVisible(false)}
        >
          ×
        </button>
        {returned > stake && (
          <div className="slot-award-crown" aria-hidden="true">
            ✧ <span>♛</span> ✧
          </div>
        )}
        <small>
          {bonus
            ? "BONUS ROUND SETTLED"
            : big
              ? "SPINDRA CELEBRATES"
              : "CONFIRMED RESULT"}
        </small>
        <strong>{title}</strong>
        <div className="slot-win-amount">
          <AnimatedCredits amount={returned} />
        </div>
        <span>
          {stake > 0 ? (returned / stake).toFixed(2) + "× stake · " : ""}Total
          returned
        </span>
      </section>
    </div>
  );
}
