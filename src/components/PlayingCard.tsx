import type { Card } from "../lib/engine";
function cardLabel(card: Card) {
  const ranks: Record<number, string> = {
    11: "Jack",
    12: "Queen",
    13: "King",
    14: "Ace",
  };
  return (
    (ranks[card.rank] || card.rank) +
    " of " +
    ["spades", "hearts", "clubs", "diamonds"][card.suit]
  );
}
export default function PlayingCard({
  card,
  hidden = false,
  delay = 0,
}: {
  card?: Card;
  hidden?: boolean;
  delay?: number;
}) {
  if (hidden || !card)
    return (
      <div className="playing-card card-back" aria-label="Face-down card">
        <span>✦</span>
      </div>
    );
  const rank =
    ({ 11: "J", 12: "Q", 13: "K", 14: "A" } as Record<number, string>)[
      card.rank
    ] || card.rank;
  const suit = ["♠", "♥", "♣", "♦"][card.suit];
  return (
    <div
      role="img"
      aria-label={cardLabel(card)}
      style={{ animationDelay: delay + "ms" }}
      className={
        "playing-card face-up " + (card.suit % 2 === 1 ? "red-card" : "")
      }
    >
      <small>
        {rank}
        <br />
        {suit}
      </small>
      <strong>{suit}</strong>
      <small>
        {rank}
        <br />
        {suit}
      </small>
    </div>
  );
}
