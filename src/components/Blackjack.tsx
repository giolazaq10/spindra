import { useRef, useState } from "react";
import { blackjackReturn, deck, handValue, type Card } from "../lib/engine";
import { credits } from "../context/Demo";
import type { Controls } from "./OriginalGame";
import PlayingCard from "./PlayingCard";
import GameControls from "./GameControls";
import useTableMotion from "./useTableMotion";
type Hand = {
  cards: Card[];
  bet: number;
  split: boolean;
  done: boolean;
  aces: boolean;
};
type BJ = {
  shoe: Card[];
  dealer: Card[];
  hands: Hand[];
  active: number;
  done: boolean;
  reveal: boolean;
};
export default function Blackjack({ controls: c }: { controls: Controls }) {
  const [state, setState] = useState<BJ | null>(null),
    [caption, setCaption] = useState("Take your seat. The dealer is ready.");
  const current = useRef<BJ | null>(null),
    motion = useTableMotion();
  const clone = (s: BJ): BJ => ({
    ...s,
    shoe: [...s.shoe],
    dealer: [...s.dealer],
    hands: s.hands.map((h) => ({ ...h, cards: [...h.cards] })),
  });
  function show(s: BJ) {
    current.current = s;
    setState(clone(s));
  }
  function settle(s: BJ) {
    s.done = true;
    s.reveal = true;
    show(s);
    c.finish(
      s.hands.reduce(
        (sum, h) => sum + blackjackReturn(h.cards, s.dealer, h.bet, !h.split),
        0,
      ),
    );
    setCaption("Hand settled. Take your time before the next deal.");
  }
  function complete(s: BJ) {
    const frames: { at: number; show: () => void }[] = [];
    let time = 400;
    s.reveal = true;
    const reveal = clone(s);
    frames.push({
      at: time,
      show: () => {
        show(reveal);
        setCaption("Dealer reveals the hole card.");
      },
    });
    const live = s.hands.some((h) => handValue(h.cards).total <= 21);
    if (live)
      while (handValue(s.dealer).total < 17) {
        s.dealer.push(s.shoe.pop()!);
        time += 1100;
        const next = clone(s);
        frames.push({
          at: time,
          show: () => {
            show(next);
            setCaption("Dealer draws · " + handValue(next.dealer).total);
          },
        });
      }
    motion.play(frames, time + 1100, () => settle(s));
  }
  function advance(s: BJ) {
    while (s.active < s.hands.length && s.hands[s.active].done) s.active++;
    if (s.active === s.hands.length) complete(s);
    else {
      show(s);
      setCaption("Your turn · choose your next move.");
    }
  }
  function deal() {
    if (
      motion.locked.current ||
      (current.current && !current.current.done) ||
      !c.start()
    )
      return;
    const shoe = deck(),
      playerFirst = shoe.pop()!,
      dealerFirst = shoe.pop()!,
      playerSecond = shoe.pop()!,
      dealerSecond = shoe.pop()!;
    const final: BJ = {
      shoe,
      dealer: [dealerFirst, dealerSecond],
      hands: [
        {
          cards: [playerFirst, playerSecond],
          bet: c.bet,
          split: false,
          done: false,
          aces: false,
        },
      ],
      active: 0,
      done: false,
      reveal: false,
    };
    const initial = clone(final);
    initial.dealer = [];
    initial.hands[0].cards = [];
    show(initial);
    setCaption("Dealing · one card at a time");
    const frames: { at: number; show: () => void }[] = [];
    const staged = clone(initial);
    for (const [i, target] of [
      "player",
      "dealer",
      "player",
      "dealer",
    ].entries()) {
      if (target === "player")
        staged.hands[0].cards.push(i === 0 ? playerFirst : playerSecond);
      else staged.dealer.push(i === 1 ? dealerFirst : dealerSecond);
      const frame = clone(staged);
      frames.push({ at: 200 + i * 650, show: () => show(frame) });
    }
    motion.play(frames, 2800, () => {
      show(final);
      if (
        handValue(final.dealer).total === 21 ||
        handValue(final.hands[0].cards).total === 21
      ) {
        setCaption("Checking for blackjack…");
        final.hands[0].done = true;
        final.reveal = true;
        motion.play([{ at: 350, show: () => show(final) }], 1400, () =>
          settle(final),
        );
      } else setCaption("Your turn · choose your next move.");
    });
  }
  function act(action: "hit" | "stand" | "double" | "split") {
    if (motion.locked.current || !current.current || current.current.done)
      return;
    const s = clone(current.current),
      h = s.hands[s.active];
    if (h.done) return;
    if (action === "stand") {
      h.done = true;
      setCaption("Standing · dealer will complete the hand.");
      advance(s);
      return;
    }
    if (
      action === "double" &&
      (h.cards.length !== 2 || h.aces || !c.start(h.bet))
    )
      return;
    if (action === "split") {
      if (
        h.cards.length !== 2 ||
        h.cards[0].rank !== h.cards[1].rank ||
        s.hands.length >= 4 ||
        h.aces ||
        !c.start(h.bet)
      )
        return;
      const aces = h.cards[0].rank === 14;
      const a: Hand = {
          ...h,
          cards: [h.cards[0]],
          split: true,
          done: aces,
          aces,
        },
        b: Hand = { ...h, cards: [h.cards[1]], split: true, done: aces, aces };
      s.hands.splice(s.active, 1, a, b);
      show(s);
      a.cards.push(s.shoe.pop()!);
      a.done = aces || handValue(a.cards).total === 21;
      const first = clone(s);
      b.cards.push(s.shoe.pop()!);
      b.done = aces || handValue(b.cards).total === 21;
      setCaption("Splitting · dealing to each hand");
      motion.play(
        [
          { at: 350, show: () => show(first) },
          { at: 1200, show: () => show(s) },
        ],
        2100,
        () => advance(s),
      );
      return;
    }
    if (action === "double") h.bet *= 2;
    h.cards.push(s.shoe.pop()!);
    h.done = action === "double" || handValue(h.cards).total >= 21;
    setCaption("Dealer sends your next card.");
    motion.play([{ at: 200, show: () => show(s) }], 1100, () => advance(s));
  }
  const hand = state && !state.done ? state.hands[state.active] : null;
  return (
    <div
      className={
        "table-game premium-felt blackjack " +
        (motion.animating ? "table-dealing" : "")
      }
    >
      <div className="felt-brand">
        SPINDRA <span>NOIR CLUB</span>
      </div>
      <div className="dealer-shoe" aria-hidden="true">
        <i />
        <i />
        <b>♠</b>
      </div>
      <p className="table-inscription">
        BLACKJACK PAYS 3:2 · DEALER STANDS ON SOFT 17
      </p>
      <div className="hand-label">
        Dealer {state?.reveal ? "· " + handValue(state.dealer).total : ""}
      </div>
      <div className="cards-row">
        {state ? (
          state.dealer.map((card, i) => (
            <PlayingCard
              key={card.rank + ":" + card.suit}
              card={card}
              hidden={!state.reveal && i === 1}
            />
          ))
        ) : (
          <>
            <PlayingCard hidden />
            <PlayingCard hidden />
          </>
        )}
      </div>
      <div className="blackjack-hands">
        {state?.hands.map((h, i) => (
          <div
            className={
              "blackjack-hand " +
              (!state.done && i === state.active ? "active-hand" : "")
            }
            key={i}
          >
            <span className="hand-label">
              Hand {i + 1} · {handValue(h.cards).total} · {credits(h.bet)}{" "}
              credits
            </span>
            <div className="cards-row">
              {h.cards.map((card) => (
                <PlayingCard card={card} key={card.rank + ":" + card.suit} />
              ))}
            </div>
            {state.done && (
              <span className="hand-label">
                Returned{" "}
                {credits(
                  blackjackReturn(h.cards, state.dealer, h.bet, !h.split),
                )}
              </span>
            )}
          </div>
        ))}
      </div>
      <p className="dealing-caption" role="status">
        {caption}
      </p>
      <GameControls controls={c} />
      <div className="game-actions">
        {!state || state.done ? (
          <button
            className="button primary"
            onClick={deal}
            disabled={motion.animating}
          >
            Deal cards
          </button>
        ) : (
          <>
            <button
              className="button primary"
              disabled={motion.animating}
              onClick={() => act("hit")}
            >
              Hit
            </button>
            <button
              className="button secondary"
              disabled={motion.animating}
              onClick={() => act("stand")}
            >
              Stand
            </button>
            <button
              className="button secondary"
              disabled={
                motion.animating ||
                !hand ||
                hand.cards.length !== 2 ||
                hand.aces
              }
              onClick={() => act("double")}
            >
              Double
            </button>
            <button
              className="button secondary"
              disabled={
                motion.animating ||
                !hand ||
                hand.cards.length !== 2 ||
                hand.cards[0].rank !== hand.cards[1].rank ||
                state.hands.length >= 4 ||
                hand.aces
              }
              onClick={() => act("split")}
            >
              Split
            </button>
          </>
        )}
      </div>
    </div>
  );
}
