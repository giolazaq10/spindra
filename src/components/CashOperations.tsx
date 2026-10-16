import { useEffect, useState } from "react";
import { cashApi } from "@/lib/walletApi";
type Setup = {
  real_money_enabled: boolean;
  operator_name: string;
  license_authority: string;
  license_reference: string;
  allowed_countries: string[];
};
export default function CashOperations() {
  const [setup, setSetup] = useState<Setup | null>(null),
    [countries, setCountries] = useState(""),
    [reviewed, setReviewed] = useState(false),
    [reason, setReason] = useState(""),
    [role, setRole] = useState(""),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  useEffect(() => {
    let active = true;
    cashApi<{ role: string; platform: Setup }>("admin_status")
      .then((r) => {
        if (active) {
          setSetup(r.platform);
          setCountries(r.platform.allowed_countries.join(", "));
          setRole(r.role);
        }
      })
      .catch((e) => {
        if (active) setMessage(e.message);
      });
    return () => {
      active = false;
    };
  }, []);
  async function save() {
    if (!setup) return;
    setBusy(true);
    try {
      await cashApi("admin_settings", {
        data: {
          enabled: setup.real_money_enabled,
          operator_name: setup.operator_name,
          license_authority: setup.license_authority,
          license_reference: setup.license_reference,
          allowed_countries: countries
            .split(/[\s,]+/)
            .filter(Boolean)
            .map((c) => c.toUpperCase()),
          policy_reviewed: reviewed,
          reason,
        },
      });
      setMessage("Cash settings saved and audited.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Cash settings failed");
    } finally {
      setBusy(false);
    }
  }
  return (
    <article className="panel account-details">
      <h2>Original cash games</h2>
      <p>
        Server-authorized slots, blackjack, Hold’em and roulette. Deposits and
        withdrawals have separate controls.
      </p>
      {message && <p role="status">{message}</p>}
      {setup && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
        >
          <label>
            <input
              type="checkbox"
              checked={setup.real_money_enabled}
              disabled={busy || role !== "owner"}
              onChange={(e) =>
                setSetup({ ...setup, real_money_enabled: e.target.checked })
              }
            />
            Enable original cash wagering
          </label>
          {(
            ["operator_name", "license_authority", "license_reference"] as const
          ).map((k) => (
            <label key={k}>
              {k.replace(/_/g, " ")}
              <input
                value={setup[k] || ""}
                disabled={busy || role !== "owner"}
                onChange={(e) => setSetup({ ...setup, [k]: e.target.value })}
              />
            </label>
          ))}
          <label>
            Approved country codes (comma separated)
            <input
              value={countries}
              disabled={busy || role !== "owner"}
              onChange={(e) => setCountries(e.target.value)}
              placeholder="Only countries approved by your operator policy"
            />
          </label>
          <p>
            AU, KM, FR, NL, ES, GB and US are blocked. Only explicitly allowed,
            verified account countries can wager. Review FATF, sanctions, local
            restrictions and any additional authority exclusions before adding a
            country. Both verified account country and the signed location
            gateway must permit a new wager. The gateway must be deployed before
            activation.
          </p>
          <label>
            <input
              type="checkbox"
              checked={reviewed}
              disabled={busy || role !== "owner"}
              onChange={(e) => setReviewed(e.target.checked)}
            />
            The operator has reviewed these countries and the cash-game release
            requirements.
          </label>
          <label>
            Audit reason
            <input
              value={reason}
              minLength={10}
              required
              disabled={busy || role !== "owner"}
              onChange={(e) => setReason(e.target.value)}
            />
          </label>
          <button
            className="button primary"
            disabled={
              busy ||
              role !== "owner" ||
              (setup.real_money_enabled && !reviewed)
            }
          >
            Save cash-game settings
          </button>
          <p>
            Max total stake per round: $200. Account loss limits, verified adult
            identity, confirmed email, exclusions and sufficient balance remain
            mandatory. A paused game can finish an existing round but cannot
            accept a new wager or extra stake.
          </p>
        </form>
      )}
    </article>
  );
}
