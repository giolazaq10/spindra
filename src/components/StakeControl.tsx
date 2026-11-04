import { Minus, Plus } from "lucide-react";
import type { Controls } from "./OriginalGame";
import { credits } from "../lib/money";
import { useId } from "react";
export default function StakeControl({ controls: c }: { controls: Controls }) {
  const index = c.stakes.indexOf(c.bet);
  const id = useId();
  return (
    <div className="slot-stake-control">
      <label htmlFor={id}>
        TOTAL BET <span>USD</span>
      </label>
      <div className="slot-stake-stepper">
        <button
          type="button"
          aria-label="Decrease stake"
          disabled={c.busy || index <= 0}
          onClick={() => c.setBet(c.stakes[index - 1])}
        >
          <Minus size={16} />
        </button>
        <select
          id={id}
          aria-label="Total stake"
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
          type="button"
          aria-label="Increase stake"
          disabled={c.busy || index < 0 || index >= c.stakes.length - 1}
          onClick={() => c.setBet(c.stakes[index + 1])}
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}
