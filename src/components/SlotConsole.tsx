import { BookOpen, RotateCw, Square } from "lucide-react";
import type { Controls } from "./OriginalGame";
import { credits } from "../lib/money";
import StakeControl from "./StakeControl";
export default function SlotConsole({
  controls: c,
  returned,
  running,
  waiting,
  disabled,
  onPress,
  signature = false,
}: {
  controls: Controls;
  returned: number;
  running: boolean;
  waiting: boolean;
  disabled: boolean;
  onPress: () => void;
  signature?: boolean;
}) {
  const quiet = /^(Round settled|Server-authorized|Checking cash session)/.test(
    c.message,
  );
  return (
    <div
      className={
        (signature ? "signature-console" : "slot-console") +
        " slot-control-deck"
      }
    >
      <div className="slot-deck-metrics">
        <div>
          <small>
            BALANCE <span>USD</span>
          </small>
          <strong>{credits(c.balance)}</strong>
        </div>
        <div
          className={returned > 0 ? "deck-return has-return" : "deck-return"}
        >
          <small>LAST RETURN</small>
          <strong>{credits(returned)}</strong>
        </div>
      </div>
      <div className="slot-wager-action">
        <StakeControl controls={c} />
        <button
          className={"spin-control" + (running ? " spin-can-stop" : "")}
          aria-label={
            waiting
              ? "Waiting for spin result"
              : running
                ? "Stop spin"
                : "Spin reels"
          }
          title={
            running
              ? "Stop the animation once the result is confirmed"
              : "Spin at the selected stake"
          }
          disabled={disabled || waiting}
          onClick={onPress}
        >
          {running ? (
            <Square size={25} fill="currentColor" />
          ) : (
            <RotateCw size={28} />
          )}
          <span>{waiting ? "WAITING" : running ? "STOP" : "SPIN"}</span>
        </button>
      </div>
      <div className="slot-deck-footer">
        <button
          className="slot-deck-rules"
          onClick={c.toggleRules}
          aria-expanded={c.rules}
        >
          <BookOpen size={15} /> Rules & payouts
        </button>
        <span className="slot-deck-status" role="status">
          {waiting
            ? "Finishing your accepted spin…"
            : !quiet && c.message
              ? c.message
              : running
                ? "Press Stop to reveal the confirmed result"
                : "Select your bet · Spin when ready"}
        </span>
      </div>
    </div>
  );
}
