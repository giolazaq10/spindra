import { useEffect, useState, type CSSProperties } from "react";
import { Trophy, ShieldMinus, Equal, X } from "lucide-react";
import type { BlackjackRound } from "../lib/blackjack";
import { credits } from "../context/Demo";
import AnimatedCredits from "./AnimatedCredits";

export default function BlackjackResults({ round }: { round: BlackjackRound }) {
  const [expanded, setExpanded] = useState(true);
  const net = round.returned - round.totalStake;
  const kind = net > 0 ? "win" : net < 0 ? "loss" : "push";
  const title =
    net > 0
      ? round.returned >= round.totalStake * 10
        ? "MEGA WIN"
        : round.returned >= round.totalStake * 5
          ? "BIG WIN"
          : "YOU WIN"
      : net < 0
        ? "ROUND LOST"
        : "ROUND PUSH";
  useEffect(() => {
    const timer = setTimeout(() => setExpanded(false), 4800);
    return () => clearTimeout(timer);
  }, []);
  const Icon = net > 0 ? Trophy : net < 0 ? ShieldMinus : Equal;
  return (
    <div
      className={
        "bj-result-layer result-" +
        kind +
        (expanded ? " result-expanded" : " result-compact")
      }
    >
      <div className="bj-result-fx" aria-hidden="true">
        <div className="result-shockwave" />
        {Array.from({ length: net > 0 ? 36 : 18 }, (_, i) => (
          <i
            key={i}
            style={
              {
                "--piece": i,
                "--lane": (i * 37) % 100,
                "--drift": (i % 2 ? 1 : -1) * (25 + (i % 7) * 12),
              } as CSSProperties
            }
          >
            {net > 0 ? "✦" : net < 0 ? "−" : "◇"}
          </i>
        ))}
      </div>
      <section className="bj-result-hero" aria-label="Round result">
        <button
          className="result-dismiss"
          aria-label="Dismiss result animation"
          onClick={() => setExpanded(false)}
        >
          <X size={18} />
        </button>
        <Icon className="result-emblem" aria-hidden="true" />
        <div className="result-headline">{title}</div>
        <div className="result-net">
          <span>{net > 0 ? "+" : net < 0 ? "−" : ""}</span>
          <AnimatedCredits amount={Math.abs(net)} />
        </div>
        <div className="result-net-label">
          {net > 0 ? "NET PROFIT" : net < 0 ? "NET LOSS" : "STAKES RETURNED"}
        </div>
        <p className="result-accounting">
          Total return <b>{credits(round.returned)}</b>
          <span>·</span>Total stake <b>{credits(round.totalStake)}</b>
        </p>
        <p className="sr-only" role="status">
          {title}.{" "}
          {net > 0 ? "Net profit" : net < 0 ? "Net loss" : "Net change"}{" "}
          {credits(Math.abs(net))}. Total return {credits(round.returned)}.
          Total stake {credits(round.totalStake)}.
        </p>
      </section>
    </div>
  );
}
