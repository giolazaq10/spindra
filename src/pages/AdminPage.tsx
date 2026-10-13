import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "@/context/Auth";
import { supabase } from "@/lib/supabase";
import {
  walletApi,
  type Asset,
  type Withdrawal,
  type CashEvent,
} from "@/lib/walletApi";
import AccountSecurity from "@/components/AccountSecurity";
import "../bank.css";
type Player = {
  id: string;
  display_name: string;
  country: string;
  date_of_birth: string;
  account_status: string;
  kyc_status: string;
  wallets: { balance_minor: number }[];
};
type Settings = {
  deposits_enabled: boolean;
  withdrawals_enabled: boolean;
  automatic_withdrawals: boolean;
  auto_limit_minor: number;
  daily_withdrawal_limit_minor: number;
};
type Snapshot = {
  role: string;
  players: Player[];
  assets: Asset[];
  withdrawals: Withdrawal[];
  ledger: CashEvent[];
  addresses: {
    id: string;
    user_id: string;
    asset: string;
    status: string;
    address: string;
  }[];
  deposits: Record<string, unknown>[];
  audit: Record<string, unknown>[];
  settings: Settings;
  configuration: Record<string, unknown>;
  integrations: { slug: string; enabled: boolean }[];
  roles: { user_id: string; role: string }[];
};
export default function AdminPage() {
  const { user, loading } = useAuth();
  const [role, setRole] = useState<string | null | undefined>(undefined),
    [data, setData] = useState<Snapshot | null>(null),
    [tab, setTab] = useState("overview"),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  useEffect(() => {
    if (!user) return;
    let alive = true;
    supabase.rpc("my_admin_role").then(({ data, error }) => {
      if (alive) {
        setRole(data || null);
        if (error) setError(error.message);
      }
    });
    return () => {
      alive = false;
    };
  }, [user]);
  async function refresh() {
    setBusy(true);
    setError("");
    try {
      setData(await walletApi<Snapshot>("admin_snapshot"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Admin unavailable");
    } finally {
      setBusy(false);
    }
  }
  async function action(
    operation: string,
    target: string,
    details: Record<string, unknown>,
  ) {
    setBusy(true);
    setError("");
    try {
      await walletApi("admin_action", { operation, target, data: details });
      setMessage("Saved. The action has been recorded in the audit log.");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }
  async function reconcile(kind: "payout" | "address", target: string) {
    const id = window.prompt(
      "Provider payment / payout ID to verify (find it in NOWPayments):",
    );
    if (!id) return;
    setBusy(true);
    try {
      await walletApi(`admin_reconcile_${kind}`, { target, provider_id: id });
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Reconciliation failed");
    } finally {
      setBusy(false);
    }
  }
  function reason() {
    return window.prompt("Reason for this action (required for audit):") || "";
  }
  if (loading) return <div className="page">Loading…</div>;
  if (!user) return <Navigate to="/sign-in" replace />;
  if (role === undefined)
    return <div className="page">Checking permissions… {error}</div>;
  if (!role)
    return (
      <section className="page">
        <h1>Admin access required</h1>
        <Link to="/account">Back to account</Link>
      </section>
    );
  const owner = role === "owner",
    write = role !== "support";
  return (
    <section className="page bank-admin">
      <div className="section-heading">
        <div>
          <span className="eyebrow">SPINDRA OPERATIONS · {role}</span>
          <h1>Control center</h1>
          <p className="muted">
            Cash controls, verification, custody payments and immutable audit
            history.
          </p>
        </div>
        <button
          className="button primary"
          disabled={busy}
          onClick={() => void refresh()}
        >
          Refresh dashboard
        </button>
      </div>
      {error && (
        <p role="alert" className="error">
          {error === "MFA_REQUIRED"
            ? "Verify your authenticator to unlock admin controls."
            : error}
        </p>
      )}
      {message && <p role="status">{message}</p>}
      <AccountSecurity onVerified={() => void refresh()} />
      {!data ? (
        <p className="muted">
          Verify two-factor authentication, then load the dashboard.
        </p>
      ) : (
        <>
          <nav className="admin-toolbar">
            {[
              "overview",
              "players",
              "withdrawals",
              "deposits",
              "assets",
              "settings",
              "integrations",
              "ledger",
              "audit",
            ].map((t) => (
              <button
                className={`button ${tab === t ? "primary" : "secondary"}`}
                key={t}
                onClick={() => setTab(t)}
              >
                {t}
              </button>
            ))}
          </nav>
          {tab === "overview" && (
            <article className="panel">
              <h2>Payments overview</h2>
              <p>
                {data.players.length} latest players · $
                {(
                  data.players.reduce(
                    (s, p) =>
                      s +
                        (Array.isArray(p.wallets)
                          ? p.wallets[0]?.balance_minor
                          : (p.wallets as unknown as { balance_minor: number })
                              ?.balance_minor) || 0,
                    0,
                  ) / 100
                ).toFixed(2)}{" "}
                in displayed wallets
              </p>
              <p>
                {
                  data.withdrawals.filter(
                    (w) =>
                      !["finished", "rejected", "cancelled"].includes(w.status),
                  ).length
                }{" "}
                pending withdrawals
              </p>
              <p>
                Deposits:{" "}
                {data.settings.deposits_enabled ? "enabled" : "paused"} ·
                withdrawals:{" "}
                {data.settings.withdrawals_enabled ? "enabled" : "paused"}
              </p>
              <h3>Server configuration</h3>
              {Object.entries(data.configuration).map(([k, v]) => (
                <p key={k}>
                  {k.replace(/_/g, " ")}:{" "}
                  <strong>
                    {typeof v === "boolean"
                      ? v
                        ? "configured"
                        : "missing"
                      : String(v || "missing")}
                  </strong>
                </p>
              ))}
              <p>
                Set provider secrets in Supabase, complete sandbox validation,
                then enable payments in Settings.
              </p>
            </article>
          )}
          {tab === "players" &&
            data.players.map((p) => (
              <article className="panel" key={p.id}>
                <h3>{p.display_name || p.id}</h3>
                <code>{p.id}</code>
                <p>
                  {p.account_status} · KYC {p.kyc_status} ·{" "}
                  {p.country || "Country missing"} · born{" "}
                  {p.date_of_birth || "not recorded"}
                </p>
                {write && (
                  <>
                    <button
                      className="button secondary"
                      disabled={busy}
                      onClick={() =>
                        void action("player", p.id, {
                          account_status:
                            p.account_status === "active"
                              ? "suspended"
                              : "active",
                          reason: reason(),
                        })
                      }
                    >
                      Toggle suspension
                    </button>
                    <button
                      className="button secondary"
                      disabled={busy}
                      onClick={() => {
                        const status = window.prompt(
                          "Verified identity review result: pending, verified, rejected",
                        );
                        if (status)
                          void action("player", p.id, {
                            kyc_status: status,
                            reason: reason(),
                          });
                      }}
                    >
                      Set KYC status
                    </button>
                    <button
                      className="button secondary"
                      disabled={busy}
                      onClick={() => {
                        const dob = window.prompt(
                          "Verified date of birth (YYYY-MM-DD)",
                          p.date_of_birth || "",
                        );
                        const country = window.prompt(
                          "Verified two-letter country code",
                          p.country || "",
                        );
                        if (dob && country)
                          void action("player", p.id, {
                            date_of_birth: dob,
                            country: country.toUpperCase(),
                            reason: reason(),
                          });
                      }}
                    >
                      Record verified identity details
                    </button>
                  </>
                )}
                {owner && (
                  <>
                    <button
                      className="button secondary"
                      disabled={busy}
                      onClick={() => {
                        const delta = window.prompt(
                          "Cash adjustment in USD; negative to debit.",
                        );
                        if (delta && /^-?\d+(\.\d{1,2})?$/.test(delta))
                          void action("balance_adjustment", p.id, {
                            delta_minor: Math.round(Number(delta) * 100),
                            request_key: crypto.randomUUID(),
                            reason: reason(),
                          });
                      }}
                    >
                      Audited cash adjustment
                    </button>
                    <button
                      className="button secondary"
                      disabled={busy}
                      onClick={() => {
                        const r = window.prompt(
                          "Role: owner, operator, support, none",
                          data.roles.find((r) => r.user_id === p.id)?.role ||
                            "none",
                        );
                        if (r)
                          void action("role", p.id, {
                            role: r,
                            reason: reason(),
                          });
                      }}
                    >
                      Manage admin role
                    </button>
                  </>
                )}
              </article>
            ))}
          {tab === "withdrawals" && (
            <>
              <p className="muted">
                Unknown submissions require provider reconciliation. Do not send
                them again.
              </p>
              {data.withdrawals.map((w) => (
                <article className="panel" key={w.id}>
                  <h3>
                    ${(w.amount_minor / 100).toFixed(2)} · {w.asset} ·{" "}
                    {w.status}
                  </h3>
                  <code>{w.id}</code>
                  <code>{w.address}</code>
                  <p>{w.reason || "No review note"}</p>
                  {write && (
                    <>
                      {w.status === "review_required" && (
                        <button
                          className="button primary"
                          disabled={busy}
                          onClick={() =>
                            void action("approve_withdrawal", w.id, {
                              reason: reason(),
                            })
                          }
                        >
                          Approve
                        </button>
                      )}
                      {["queued", "review_required"].includes(w.status) && (
                        <button
                          className="button secondary"
                          disabled={busy}
                          onClick={() =>
                            void action("cancel_withdrawal", w.id, {
                              reason: reason(),
                            })
                          }
                        >
                          Cancel & refund
                        </button>
                      )}
                      {[
                        "submission_unknown",
                        "submitting",
                        "submitted",
                        "verification_required",
                      ].includes(w.status) && (
                        <button
                          className="button secondary"
                          disabled={busy}
                          onClick={() => void reconcile("payout", w.id)}
                        >
                          Reconcile provider payout
                        </button>
                      )}
                    </>
                  )}
                </article>
              ))}
            </>
          )}
          {tab === "deposits" && (
            <>
              <h2>Reusable addresses</h2>
              {data.addresses.map((a) => (
                <article key={a.id} className="panel">
                  <h3>
                    {a.asset} · {a.status}
                  </h3>
                  <code>{a.user_id}</code>
                  {a.address && <code>{a.address}</code>}
                  {write && a.status !== "ready" && (
                    <button
                      className="button secondary"
                      disabled={busy}
                      onClick={() => void reconcile("address", a.id)}
                    >
                      Reconcile provider payment
                    </button>
                  )}
                </article>
              ))}
              <h2>Verified receipts</h2>
              <pre>{JSON.stringify(data.deposits, null, 2)}</pre>
            </>
          )}
          {tab === "assets" &&
            data.assets.map((a) => (
              <article key={a.code} className="panel">
                <h3>
                  {a.symbol} · {a.network}
                </h3>
                <p>
                  Runtime support also requires this asset to be enabled in
                  NOWPayments.
                </p>
                {write ? (
                  <>
                    <label>
                      <input
                        type="checkbox"
                        checked={a.deposits_enabled}
                        disabled={busy}
                        onChange={(e) =>
                          void action("asset", a.code, {
                            deposits_enabled: e.target.checked,
                            withdrawals_enabled: a.withdrawals_enabled,
                          })
                        }
                      />
                      Deposits
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={a.withdrawals_enabled}
                        disabled={busy}
                        onChange={(e) =>
                          void action("asset", a.code, {
                            deposits_enabled: a.deposits_enabled,
                            withdrawals_enabled: e.target.checked,
                          })
                        }
                      />
                      Withdrawals
                    </label>
                  </>
                ) : (
                  <p>
                    Deposits {String(a.deposits_enabled)} · withdrawals{" "}
                    {String(a.withdrawals_enabled)}
                  </p>
                )}
              </article>
            ))}
          {tab === "settings" && (
            <SettingsForm
              key={JSON.stringify(data.settings)}
              settings={data.settings}
              disabled={busy || !owner}
              save={(s) => void action("settings", "platform", s)}
            />
          )}{" "}
          {tab === "integrations" &&
            data.integrations.map((i) => (
              <article key={i.slug} className="panel">
                <h3>{i.slug}</h3>
                <p>
                  Enabled: {String(i.enabled)}. Cash games require a separately
                  configured provider integration and platform cash gate.
                </p>
                {owner && (
                  <button
                    className="button secondary"
                    disabled={busy}
                    onClick={() =>
                      void action("integration", i.slug, {
                        enabled: !i.enabled,
                      })
                    }
                  >
                    Toggle integration
                  </button>
                )}
              </article>
            ))}
          {tab === "ledger" && (
            <article className="panel">
              <h2>Cash ledger (latest 150)</h2>
              <pre>{JSON.stringify(data.ledger, null, 2)}</pre>
            </article>
          )}
          {tab === "audit" && (
            <article className="panel">
              <h2>Admin audit (latest 100)</h2>
              <pre>{JSON.stringify(data.audit, null, 2)}</pre>
            </article>
          )}
        </>
      )}
    </section>
  );
}
function SettingsForm({
  settings,
  disabled,
  save,
}: {
  settings: Settings;
  disabled: boolean;
  save: (s: Settings & Record<string, unknown>) => void;
}) {
  const [s, set] = useState(settings),
    [ack, setAck] = useState(false);
  return (
    <form
      className="panel account-details"
      onSubmit={(e) => {
        e.preventDefault();
        save({ ...s });
      }}
    >
      <h2>Payment controls</h2>
      {(
        [
          "deposits_enabled",
          "withdrawals_enabled",
          "automatic_withdrawals",
        ] as const
      ).map((k) => (
        <label key={k}>
          <input
            type="checkbox"
            disabled={disabled}
            checked={s[k]}
            onChange={(e) => set({ ...s, [k]: e.target.checked })}
          />
          {k.replace(/_/g, " ")}
        </label>
      ))}
      <label>
        Automatic approval maximum (USD)
        <input
          type="number"
          min="0"
          step="0.01"
          disabled={disabled}
          value={s.auto_limit_minor / 100}
          onChange={(e) =>
            set({
              ...s,
              auto_limit_minor: Math.round(Number(e.target.value) * 100),
            })
          }
        />
      </label>
      <label>
        Daily withdrawal limit per player (USD, UTC)
        <input
          type="number"
          min="0.01"
          step="0.01"
          disabled={disabled}
          value={s.daily_withdrawal_limit_minor / 100}
          onChange={(e) =>
            set({
              ...s,
              daily_withdrawal_limit_minor: Math.round(
                Number(e.target.value) * 100,
              ),
            })
          }
        />
      </label>
      <label>
        <input
          type="checkbox"
          checked={ack}
          onChange={(e) => setAck(e.target.checked)}
        />
        I reviewed provider configuration and payment testing.
      </label>
      <button
        className="button primary"
        disabled={
          disabled || (!ack && (s.deposits_enabled || s.withdrawals_enabled))
        }
      >
        Save payment settings
      </button>
      <p className="muted">
        Pausing stops new addresses and payouts. Existing addresses can still
        receive on-chain funds, and completed deposits remain reconciled.
      </p>
    </form>
  );
}
