import type { CSSProperties } from "react";
import CinematicEffects from "./CinematicEffects";
export default function ScatterCelebration({
  onStart,
  onSkip,
}: {
  onStart: () => void;
  onSkip: () => void;
}) {
  return (
    <section
      className="scatter-celebration"
      aria-label="Scatter free-spins celebration"
    >
      <CinematicEffects cue="bonus" />
      <div className="scatter-energy-gate" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </div>
      <div className="scatter-portal-art" aria-hidden="true">
        <i className="scatter-portal-ring portal-outer" />
        <i className="scatter-portal-ring portal-inner" />
        <div className="scatter-token-trio">
          {[0, 1, 2].map((i) => (
            <span key={i} style={{ "--token": i } as CSSProperties}>
              <svg viewBox="0 0 40 40">
                <path d="M20 2l5 11 12 2-9 9 2 13-10-6-11 6 2-13-9-9 13-2Z" />
              </svg>
            </span>
          ))}
        </div>
        {Array.from({ length: 24 }, (_, i) => (
          <i
            className="scatter-confetti"
            key={i}
            style={
              {
                "--burst": i,
                "--burst-x": (i * 31 + 5) % 100,
                "--burst-drift": (i % 2 ? 1 : -1) * (20 + (i % 5) * 15),
              } as CSSProperties
            }
          />
        ))}
      </div>
      <div className="scatter-bonus-card">
        <span className="scatter-kicker">SCATTER PORTAL UNLOCKED</span>
        <strong className="scatter-award-number">10</strong>
        <h3>FREE SPINS</h3>
        <p>Your bonus is ready</p>
        <button className="scatter-start" onClick={onStart}>
          Start free spins <span aria-hidden="true">✦</span>
        </button>
        <button className="scatter-skip" onClick={onSkip}>
          Skip bonus animations
        </button>
      </div>
    </section>
  );
}
