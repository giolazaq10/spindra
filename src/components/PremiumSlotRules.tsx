import type { Original } from "@/lib/catalog";
import { coinWeights, vaultCoinPays, VAULT_BONUS } from "@/lib/premiumSlots";
export default function PremiumSlotRules({ game }: { game: Original }) {
  const s = game.slot!,
    kind = s.premium;
  return (
    <div className="premium-rulebook">
      <h3>{s.feature}</h3>
      {kind === "cascade" ? (
        <>
          <p>
            Six columns × five rows. Eight or more of the same crystal anywhere
            pay once for that symbol’s total count, including nonadjacent cells.
            All winning symbols add together. Stage one pays 1× its awards. A
            winning stage replaces the entire board with independent new
            weighted symbols: stage two pays 2× and stage three pays 3×. A stage
            without an award stops the sequence. Three stages maximum, all
            included in the original stake. No paylines, wilds, scatter feature
            or extra debit.
          </p>
          <p>
            The first board and each replacement use the same symbol
            probabilities. The table gives base awards before the stage
            multiplier. Stages and multipliers reset for every spin.
          </p>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Crystal / weight</th>
                  {Array.from({ length: 23 }, (_, i) => (
                    <th key={i}>{i + 8}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {s.pays.map((row, i) => (
                  <tr key={i}>
                    <th>
                      {s.symbolNames[i]} / {s.weights[i]}%
                    </th>
                    {row.map((p, j) => (
                      <td key={j}>{(p / 100).toFixed(2)}×</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : kind === "vault" ? (
        <>
          <p>
            Nine empty sockets begin each round. Each empty socket independently
            has a 25% chance to lock a coin per draw. Locked coins remain in
            place and are never paid twice. Any new coin resets the chances
            counter to three; no new coin consumes one chance. Stop when the
            counter reaches zero, all sockets fill, or eight draws have
            completed. Full grid adds {VAULT_BONUS / 100}× total stake. The
            terminal sum of locked coin values plus any full-grid bonus is the
            return.
          </p>
          <p>
            Coin types are sampled independently when a socket hits. All eight
            possible draws are included in the original stake; there are no
            purchases or extra debits.
          </p>
          <table>
            <thead>
              <tr>
                <th>Coin</th>
                <th>Return</th>
                <th>Chance after a hit</th>
              </tr>
            </thead>
            <tbody>
              {vaultCoinPays.map((pay, i) => (
                <tr key={i}>
                  <td>{s.symbolNames[i + 1]}</td>
                  <td>{pay / 100}×</td>
                  <td>{coinWeights[i]}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : (
        <>
          <p>
            Three independent drums with one center payline. Three matching
            regular symbols pay. Gear wilds substitute for any regular symbol;
            only the highest qualifying award pays. Three gear wilds pay the
            Seven award. Every spin independently draws a boost: 1× with 85%
            probability, 2× with 10%, or 5× with 5%. The boost multiplies the
            line award and cannot create a win on a losing combination.
          </p>
          <table>
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Three-match return before boost</th>
                <th>Drum weight</th>
              </tr>
            </thead>
            <tbody>
              {s.symbolNames.map((name, i) => (
                <tr key={i}>
                  <td>{name}</td>
                  <td>{i === 6 ? "Substitutes" : s.pays[i][0] / 100 + "×"}</td>
                  <td>{s.weights[i]}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
      <p>
        Minimum $0.20; $0.10 stake increments. Awards are multiples of the total
        stake and include stake. The combined spin return is rounded down once
        to a USD cent. Theoretical RTP is computed from the exact rules and
        weights before cent rounding; small stakes can have a lower effective
        RTP. Outcomes and all included stages are determined on the server and
        settled once. Skipping animations changes no outcome.
      </p>
    </div>
  );
}
