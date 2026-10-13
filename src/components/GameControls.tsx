import { Minus, Plus, BookOpen } from "lucide-react";
import { credits } from "../context/Demo";
import type { Controls } from "./OriginalGame";

export default function GameControls({ controls: c }: { controls: Controls }) {
  const index = c.stakes.indexOf(c.bet);
  return (
    <div className="integrated-controls">
      <div className="cabinet-wallet">
        <small>DEMO BALANCE</small>
        <strong>{credits(c.balance)}</strong>
      </div>
      <div className="stake-dial">
        <small>{c.poker ? "HAND BUY-IN" : "TOTAL STAKE"}</small>
        <div>
          <button
            aria-label="Decrease stake"
            disabled={c.busy || index <= 0}
            onClick={() => c.setBet(c.stakes[index - 1])}
          >
            <Minus size={16} />
          </button>
          <select
            aria-label={c.poker ? "Hand buy-in" : "Total stake"}
            disabled={c.busy}
            value={c.bet}
            onChange={(e) => c.setBet(Number(e.target.value))}
          >
            {c.stakes.map((stake) => (
              <option key={stake} value={stake}>
                {credits(stake)}
              </option>
            ))}
          </select>
          <button
            aria-label="Increase stake"
            disabled={c.busy || index === c.stakes.length - 1}
            onClick={() => c.setBet(c.stakes[index + 1])}
          >
            <Plus size={16} />
          </button>
        </div>
      </div>
      <button
        className="cabinet-rules"
        onClick={c.toggleRules}
        aria-expanded={c.rules}
      >
        <BookOpen size={16} /> Rules & payouts
      </button>
      <div className="cabinet-status" role="status" aria-live="polite">
        {c.message}
      </div>
    </div>
  );
}
