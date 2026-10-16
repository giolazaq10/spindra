import { handValue, type Card } from "../lib/engine";

export default function BlackjackScore({
  cards,
  label,
  split = false,
  surrendered = false,
  active = false,
}: {
  cards: (Card | null)[];
  label: string;
  split?: boolean;
  surrendered?: boolean;
  active?: boolean;
}) {
  const visible = cards.filter((card): card is Card => card !== null);
  const hidden = cards.some((card) => card === null);
  const { total, soft } = handValue(visible);
  const value = visible.length
    ? soft && !hidden
      ? total - 10 + " / " + total
      : String(total)
    : "—";
  const detail = hidden
    ? "Visible cards · hole card hidden"
    : surrendered
      ? "Surrendered"
      : total > 21
        ? "Bust"
        : total === 21 && visible.length === 2 && !split
          ? "Blackjack"
          : soft
            ? "Soft total · ace counts as 1 or 11"
            : visible.length
              ? "Hand total"
              : "Waiting for cards";
  return (
    <div
      className={"blackjack-score " + (total > 21 ? "score-bust" : "")}
      aria-label={label + ": " + value + ". " + detail}
    >
      <div>
        <span className="blackjack-score-label">{label}</span>
        <small>{detail}</small>
      </div>
      <strong>{value}</strong>
      {active && <b className="blackjack-turn">Your turn</b>}
    </div>
  );
}
