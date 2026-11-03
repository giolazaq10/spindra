import type { CashRound } from "./CashGame";
import { blackjackBreakdown } from "../lib/blackjackBreakdown";
const money = (n: number) => "$" + (Math.abs(n) / 100).toFixed(2);
const signed = (n: number) => (n > 0 ? "+" : n < 0 ? "−" : "") + money(n);
export default function BlackjackSettlement({ round }: { round: CashRound }) {
  const result = blackjackBreakdown(round),
    net = round.view.returned_minor - round.view.stake_minor;
  return (
    <section
      className="bj-settlement"
      aria-label="Blackjack round returns"
      key={round.id}
    >
      <header>
        <div>
          <small>ROUND COMPLETE</small>
          <h3>
            {net > 0 ? "You won" : net < 0 ? "Round complete" : "Round pushed"}
          </h3>
        </div>
        <div>
          <span>Total returned</span>
          <strong>{money(round.view.returned_minor)}</strong>
          <small>
            {signed(net)} net · stake {money(round.view.stake_minor)}
          </small>
        </div>
      </header>
      {result?.reconciled ? (
        <div className="bj-payout-grid">
          {result.items.map((item) => (
            <article
              key={item.key}
              className={
                item.net > 0
                  ? "payout-win"
                  : item.net < 0
                    ? "payout-loss"
                    : "payout-push"
              }
              aria-label={item.label + " result"}
            >
              <h4>{item.label}</h4>
              <dl>
                <div>
                  <dt>Staked</dt>
                  <dd>{money(item.stake)}</dd>
                </div>
                <div>
                  <dt>Returned</dt>
                  <dd>{money(item.returned)}</dd>
                </div>
                <div>
                  <dt>
                    {item.net > 0 ? "Profit" : item.net < 0 ? "Loss" : "Net"}
                  </dt>
                  <dd>{signed(item.net)}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      ) : (
        <p>Confirmed return shown above. Detailed breakdown unavailable.</p>
      )}
      <p className="bj-return-note">
        Returned amounts include your stake. Side bets are settled separately
        from main hands.
      </p>
    </section>
  );
}
