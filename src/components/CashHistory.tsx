import { useCashHistory } from "@/lib/useCashHistory";
import { credits } from "@/lib/money";
import { originals } from "@/lib/catalog";
export default function CashHistory() {
  const { rounds, loading, error } = useCashHistory();
  return (
    <div className="panel history">
      <h2>Cash game history</h2>
      <p className="muted">
        USD amounts. Returns include the stake. Open hands are awaiting
        settlement.
      </p>
      {loading ? (
        <p role="status">Loading game history…</p>
      ) : error ? (
        <p role="alert">{error}</p>
      ) : rounds.length ? (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Game</th>
                <th>Stake</th>
                <th>Returned</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rounds.map((r) => (
                <tr key={r.id}>
                  <td>{new Date(r.created_at).toLocaleString()}</td>
                  <td>
                    {originals.find((g) => g.slug === r.game)?.name || r.game}
                  </td>
                  <td>{credits(r.stake_minor)}</td>
                  <td>
                    {r.state === "open" ? "Pending" : credits(r.returned_minor)}
                  </td>
                  <td>{r.state}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="muted">No cash rounds yet.</p>
      )}
    </div>
  );
}
