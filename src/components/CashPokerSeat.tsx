import { memo } from "react";
import type { Card } from "../lib/engine";
import { bestHand } from "../lib/holdem";
import PlayingCard from "./PlayingCard";
const money = (n: number) => "$" + (n / 100).toFixed(2);
function CashPokerSeat({
  player: p,
  board,
  self = false,
}: {
  player: {
    name: string;
    hole: (Card | null)[];
    stack: number;
    streetBet?: number;
    folded: boolean;
    action: string;
  };
  board: Card[];
  self?: boolean;
}) {
  const visible = p.hole.length === 2 && p.hole.every((card) => card !== null);
  const rank = !p.hole.length
    ? "Waiting for cards"
    : !p.folded && visible && board.length + p.hole.length >= 5
      ? bestHand([...(p.hole as Card[]), ...board]).name
      : self
        ? "Your private cards"
        : "Cards hidden";
  return (
    <article
      className={
        "cash-hand poker-seat " +
        (self ? "poker-you " : "") +
        (p.folded ? "poker-folded" : "")
      }
    >
      <h3>
        {self ? "You · Your cards" : p.name}
        {p.folded ? " · Folded" : ""}
      </h3>
      <div className="cash-cards">
        {p.hole.map((card, i) => (
          <PlayingCard
            key={i + ":" + (card?.rank ?? "hidden")}
            card={card || undefined}
            hidden={!card}
            delay={0}
          />
        ))}
      </div>
      <dl className="poker-chip-totals">
        <div>
          <dt>Chips</dt>
          <dd>{p.hole.length ? money(p.stack) : "—"}</dd>
        </div>
        <div>
          <dt>Bet this street</dt>
          <dd>{p.hole.length ? money(p.streetBet || 0) : "—"}</dd>
        </div>
      </dl>
      <p className="poker-hand-name">{p.folded ? "Folded" : rank}</p>
      <small className="poker-player-action">{p.action}</small>
    </article>
  );
}
export default memo(CashPokerSeat);
