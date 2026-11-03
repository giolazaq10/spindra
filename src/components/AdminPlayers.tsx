import { useMemo, useState, type FormEvent } from "react";
import { Search } from "lucide-react";
import "./admin-players.css";

export type Player = {
  id: string;
  display_name: string;
  country: string;
  date_of_birth: string | null;
  account_status: string;
  kyc_status: string;
  excluded_until: string | null;
  daily_loss_limit_minor: number | null;
  terms_version: string | null;
  terms_accepted_at: string | null;
  created_at: string;
  wallets: { currency: string; balance_minor: number; updated_at: string }[];
};

export type Account = {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  banned_until: string | null;
};

export type Role = { user_id: string; role: string };

type Props = {
  players: Player[];
  accounts: Account[];
  roles: Role[];
  owner: boolean;
  write: boolean;
  busy: boolean;
  onAction: (
    operation: string,
    target: string,
    details: Record<string, unknown>,
  ) => void;
  askReason: () => string;
};

const ACCOUNT_STATUSES = ["active", "suspended"];
const KYC_STATUSES = ["pending", "verified", "rejected"];

function formatDate(value: string | null | undefined) {
  return value ? new Date(value).toLocaleString() : "Not recorded";
}

function formatUsd(minor: number) {
  return `$${(minor / 100).toFixed(2)}`;
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="admin-detail-field">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

export default function AdminPlayers({
  players,
  accounts,
  roles,
  owner,
  write,
  busy,
  onAction,
  askReason,
}: Props) {
  const [query, setQuery] = useState(""),
    [selectedId, setSelectedId] = useState<string | null>(null),
    [editing, setEditing] = useState(false);
  const accountById = useMemo(
    () => new Map(accounts.map((a) => [a.id, a])),
    [accounts],
  );
  const roleById = useMemo(
    () => new Map(roles.map((r) => [r.user_id, r.role])),
    [roles],
  );
  const needle = query.trim().toLowerCase();
  const visible = players.filter((p) => {
    if (!needle) return true;
    const email = accountById.get(p.id)?.email ?? "";
    return [p.display_name, p.id, p.country, email].some((v) =>
      (v || "").toLowerCase().includes(needle),
    );
  });
  const selected = players.find((p) => p.id === selectedId) ?? null;
  const account = selected ? accountById.get(selected.id) : undefined;
  const wallet = selected?.wallets?.[0];
  const selectedRole = selected ? roleById.get(selected.id) : undefined;

  function choose(id: string) {
    setSelectedId(id);
    setEditing(false);
  }

  return (
    <div className="admin-players">
      <div className="admin-players-list">
        <label className="admin-players-search">
          <Search className="w-4 h-4" aria-hidden="true" />
          <input
            type="search"
            placeholder="Search name, email, ID or country"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <p className="muted">
          Showing {visible.length} of {players.length} users
        </p>
        <ul className="admin-player-list">
          {visible.map((p) => {
            const a = accountById.get(p.id);
            return (
              <li key={p.id}>
                <button
                  type="button"
                  className={`admin-player-row${p.id === selectedId ? " active" : ""}`}
                  aria-pressed={p.id === selectedId}
                  onClick={() => choose(p.id)}
                >
                  <span className="admin-player-name">
                    {p.display_name || "Unnamed player"}
                  </span>
                  <span className="admin-player-email">{a?.email || p.id}</span>
                  <span className={`admin-badge ${p.account_status}`}>
                    {p.account_status}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        {visible.length === 0 && (
          <p className="muted">No users match your search.</p>
        )}
      </div>

      <div className="admin-player-detail">
        {!selected ? (
          <p className="muted">Select a user to see every detail on file.</p>
        ) : (
          <>
            <header className="admin-player-header">
              <div>
                <h2>{selected.display_name || "Unnamed player"}</h2>
                <p className="muted">{account?.email || "No email on file"}</p>
              </div>
              <span className={`admin-badge ${selected.account_status}`}>
                {selected.account_status}
              </span>
            </header>

            {editing && write ? (
              <PlayerEditForm
                key={selected.id}
                player={selected}
                busy={busy}
                onCancel={() => setEditing(false)}
                onSave={(details) => {
                  onAction("player", selected.id, details);
                  setEditing(false);
                }}
              />
            ) : (
              <>
                <dl className="admin-detail-grid">
                  <Detail label="User ID" value={selected.id} />
                  <Detail label="Email" value={account?.email || "Not on file"} />
                  <Detail
                    label="Email verified"
                    value={
                      account?.email_confirmed_at
                        ? formatDate(account.email_confirmed_at)
                        : "Not verified"
                    }
                  />
                  <Detail label="Account status" value={selected.account_status} />
                  <Detail label="Identity (KYC)" value={selected.kyc_status} />
                  <Detail
                    label="Date of birth"
                    value={selected.date_of_birth || "Not recorded"}
                  />
                  <Detail
                    label="Country"
                    value={selected.country || "Missing"}
                  />
                  <Detail
                    label="Wallet balance"
                    value={
                      wallet
                        ? `${formatUsd(wallet.balance_minor)} ${wallet.currency}`
                        : "No wallet"
                    }
                  />
                  <Detail
                    label="Wallet updated"
                    value={formatDate(wallet?.updated_at)}
                  />
                  <Detail
                    label="Daily loss limit"
                    value={
                      selected.daily_loss_limit_minor == null
                        ? "None"
                        : formatUsd(selected.daily_loss_limit_minor)
                    }
                  />
                  <Detail
                    label="Self-exclusion until"
                    value={
                      selected.excluded_until
                        ? formatDate(selected.excluded_until)
                        : "None"
                    }
                  />
                  <Detail
                    label="Login blocked until"
                    value={
                      account?.banned_until
                        ? formatDate(account.banned_until)
                        : "None"
                    }
                  />
                  <Detail
                    label="Terms version"
                    value={selected.terms_version || "Not accepted"}
                  />
                  <Detail
                    label="Terms accepted"
                    value={formatDate(selected.terms_accepted_at)}
                  />
                  <Detail label="Joined" value={formatDate(selected.created_at)} />
                  <Detail
                    label="Last sign-in"
                    value={formatDate(account?.last_sign_in_at)}
                  />
                  <Detail label="Admin role" value={selectedRole || "None"} />
                </dl>

                {write && (
                  <div className="admin-player-actions">
                    <button
                      className="button primary"
                      disabled={busy}
                      onClick={() => setEditing(true)}
                    >
                      Edit information
                    </button>
                  </div>
                )}

                {owner && (
                  <div className="admin-player-owner">
                    <h3>Owner controls</h3>
                    <div className="admin-player-actions">
                      <button
                        className="button secondary"
                        disabled={busy}
                        onClick={() => {
                          const delta = window.prompt(
                            "Cash adjustment in USD; negative to debit.",
                          );
                          if (delta && /^-?\d+(\.\d{1,2})?$/.test(delta))
                            onAction("balance_adjustment", selected.id, {
                              delta_minor: Math.round(Number(delta) * 100),
                              request_key: crypto.randomUUID(),
                              reason: askReason(),
                            });
                        }}
                      >
                        Audited cash adjustment
                      </button>
                      <button
                        className="button secondary"
                        disabled={busy}
                        onClick={() => {
                          const role = window.prompt(
                            "Role: owner, operator, support, none",
                            selectedRole || "none",
                          );
                          if (role)
                            onAction("role", selected.id, {
                              role,
                              reason: askReason(),
                            });
                        }}
                      >
                        Manage admin role
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function PlayerEditForm({
  player,
  busy,
  onSave,
  onCancel,
}: {
  player: Player;
  busy: boolean;
  onSave: (details: Record<string, unknown>) => void;
  onCancel: () => void;
}) {
  const [accountStatus, setAccountStatus] = useState(player.account_status),
    [kycStatus, setKycStatus] = useState(player.kyc_status),
    [dob, setDob] = useState(player.date_of_birth ?? ""),
    [country, setCountry] = useState(player.country ?? ""),
    [error, setError] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
    const code = country.trim().toUpperCase();
    if (code && !/^[A-Z]{2}$/.test(code)) {
      setError("Country must be a two-letter code, such as US.");
      return;
    }
    const details: Record<string, unknown> = {
      account_status: accountStatus,
      kyc_status: kycStatus,
    };
    if (dob) details.date_of_birth = dob;
    if (code) details.country = code;
    setError("");
    onSave(details);
  }

  return (
    <form className="admin-player-edit" onSubmit={submit}>
      <label>
        Account status
        <select
          value={accountStatus}
          disabled={busy}
          onChange={(e) => setAccountStatus(e.target.value)}
        >
          {Array.from(new Set([accountStatus, ...ACCOUNT_STATUSES])).map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>
      <label>
        Identity (KYC)
        <select
          value={kycStatus}
          disabled={busy}
          onChange={(e) => setKycStatus(e.target.value)}
        >
          {Array.from(new Set([kycStatus, ...KYC_STATUSES])).map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>
      <label>
        Date of birth
        <input
          type="date"
          value={dob}
          disabled={busy}
          onChange={(e) => setDob(e.target.value)}
        />
      </label>
      <label>
        Country (two-letter code)
        <input
          value={country}
          maxLength={2}
          disabled={busy}
          onChange={(e) => setCountry(e.target.value)}
        />
      </label>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <div className="admin-player-actions">
        <button className="button primary" disabled={busy}>
          Save changes
        </button>
        <button
          type="button"
          className="button secondary"
          disabled={busy}
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
