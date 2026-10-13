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
      <h4>Betting & table controls</h4>
      <p>
        Select a chip and click a main or side-bet spot to add it. Main stakes
        are 1–200 whole demo credits. Each side stake must be no greater than
        its own main stake. Remove mode clears a selected spot; removing a main
        bet also clears its side bets. Undo reverses the last betting edit,
        Rebet restores the last starting bets, and Increase bets doubles all
        starting bets within limits. Clear bets empties the table.
      </p>
      <p>
        Normal dealing is the default. Turbo is optional and can be changed only
        between rounds. Sound, two-card play hints, fullscreen, and recent round
        history are available in the toolbar. Hints use only your current hand
        and the dealer’s visible card; they are a guide and never guarantee a
        win.
      </p>
      <p>
        All amounts use demo credits with no cash value. Profit odds exclude the
        original stake; displayed returns include it. Side results are
        calculated from initial cards and credited with main and insurance
        returns when the round ends. Leaving an unfinished round forfeits
        committed main bets; already resolved side-bet and surrender returns are
        retained. Cash wagering is disabled.
      </p>
    </div>
  );
}
