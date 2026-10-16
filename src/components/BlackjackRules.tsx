export default function BlackjackRules() {
  return (
    <div className="bj-rulebook">
      <h3>Spindra Multihand Blackjack</h3>
      <p>
        Eight 52-card decks are shuffled before every round. Play one to five
        main hands against one dealer. The dealer hits soft 17 and stands on
        hard 17 or higher. Aces count as 1 or 11. A natural blackjack is an ace
        plus a ten-value card in the original two-card hand.
      </p>
      <p>
        Main wins pay 1:1, natural blackjack pays 3:2, and equal totals push.
        Dealer blackjack beats every non-natural hand; two naturals push. The
        dealer checks for blackjack with an ace or ten-value up-card before
        player actions. No six-card automatic win.
      </p>
      <p>
        Hit, stand, or double on any initial two cards, including after
        splitting. Double adds an equal main stake, deals exactly one card, and
        ends that hand. Equal ranks may be split once per original hand into two
        equal-stake hands; no resplitting. Split aces receive one card each.
        Split 21 is a regular 21 and pays 1:1. Late surrender is available only
        on an unsplit two-card hand after the dealer check; it returns half that
        main stake.
      </p>
      <h4>Insurance</h4>
      <p>
        An ace up-card opens insurance before the dealer check. Select
        individual hands or insure all: the cost is half each selected original
        main stake. Dealer blackjack pays 2:1 profit (3× the insurance stake
        returned). Otherwise insurance loses. Insurance does not change any main
        or side bet.
      </p>
      <h4>21+3</h4>
      <p>
        Your original two cards plus the dealer’s up-card. The highest matching
        category pays once. A–2–3 and Q–K–A are straights; K–A–2 is not.
      </p>
      <table>
        <thead>
          <tr>
            <th>Combination</th>
            <th>Profit odds</th>
            <th>Total return</th>
          </tr>
        </thead>
        <tbody>
          {[
            ["Suited trips", "100:1", "101×"],
            ["Straight flush", "40:1", "41×"],
            ["Three of a kind", "30:1", "31×"],
            ["Straight", "10:1", "11×"],
            ["Flush", "5:1", "6×"],
          ].map((r) => (
            <tr key={r[0]}>
              {r.map((c) => (
                <td key={c}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <h4>Perfect Pair</h4>
      <p>
        Only the original two player cards count. Identical rank and suit is a
        perfect pair; identical rank and color with different suits is a colored
        pair; identical rank with opposite colors is a mixed pair. Eight decks
        allow identical cards. Split cards and later draws do not create extra
        side bets.
      </p>
      <table>
        <thead>
          <tr>
            <th>Pair</th>
            <th>Profit odds</th>
            <th>Total return</th>
          </tr>
        </thead>
        <tbody>
          {[
            ["Perfect pair", "26:1", "27×"],
            ["Colored pair", "12:1", "13×"],
            ["Mixed pair", "5:1", "6×"],
          ].map((r) => (
            <tr key={r[0]}>
              {r.map((c) => (
                <td key={c}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <h4>Cash stakes and settlement</h4>
      <p>
        Main and side stakes start at $0.20, in $0.10 increments. Each side stake must not
        exceed its own main stake. Total stakes across the round, including
        insurance, doubles and splits, are limited to $200. Extra stakes require
        sufficient wallet funds and available daily loss budget.
      </p>
      <p>
        Side results use the initial cards and are credited with main and
        insurance returns when the round settles. Returns include stake. Your
        dealer and hidden cards remain on the server. Leaving the page does not
        cancel or refund a wager; the saved round can be resumed. After 15
        minutes the server stands remaining hands and completes the dealer.
      </p>
    </div>
  );
}
