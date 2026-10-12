import { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import {
  LogOut,
  Wallet,
  ShieldCheck,
  Clock,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/context/Auth";
import { credits, useDemo } from "@/context/Demo";
import { supabase } from "@/lib/supabase";
type Profile = {
  display_name: string;
  kyc_status: string;
  country: string;
  excluded_until: string | null;
  daily_loss_limit_minor: number;
};
type Balance = { balance_minor: number; currency: string };
type Entry = {
  id: string;
  kind: string;
  amount_minor: number;
  created_at: string;
};
export default function AccountPage() {
  const { user, loading } = useAuth(),
    demo = useDemo(),
    location = useLocation(),
    navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null),
    [wallet, setWallet] = useState<Balance | null>(null),
    [entries, setEntries] = useState<Entry[]>([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(true),
    [signingOut, setSigningOut] = useState(false);
  useEffect(() => {
    if (!user) return;
    let alive = true;
    (async () => {
      try {
        const [p, w, e] = await Promise.all([
          supabase
            .from("player_profiles")
            .select(
              "display_name,kyc_status,country,excluded_until,daily_loss_limit_minor",
            )
            .eq("id", user.id)
            .maybeSingle(),
          supabase
            .from("wallets")
            .select("balance_minor,currency")
            .eq("user_id", user.id)
            .maybeSingle(),
          supabase
            .from("wallet_events")
            .select("id,kind,amount_minor,created_at")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(50),
        ]);
        if (p.error || w.error || e.error)
          throw new Error(
            "Account data is unavailable. The operator must apply the platform migrations.",
          );
        if (alive) {
          setProfile(p.data);
          setWallet(w.data);
          setEntries(e.data || []);
        }
      } catch (e) {
        if (alive)
          setError(e instanceof Error ? e.message : "Unable to load account.");
      } finally {
        if (alive) setBusy(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [user]);
  if (loading)
    return (
      <div className="page empty-state" role="status">
        Loading account…
      </div>
    );
  if (!user)
    return (
      <Navigate to="/sign-in" state={{ from: location.pathname }} replace />
    );
  async function logout() {
    setSigningOut(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      setError(error.message);
      setSigningOut(false);
    } else navigate("/sign-in");
  }
  return (
    <section className="page">
      <div className="section-heading">
        <div>
          <span className="eyebrow">YOUR SPINDRA</span>
          <h1>
            Hello,{" "}
            {profile?.display_name ||
              user?.user_metadata?.display_name ||
              "player"}
            .
          </h1>
          <p className="muted">
            Manage your account and keep track of your play.
          </p>
        </div>
        <button
          className="button secondary"
          disabled={signingOut}
          onClick={logout}
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <div className="account-grid">
        <article className="panel account-tile">
          <Wallet />
          <span className="eyebrow">CASH WALLET</span>
          <h2>
            {wallet
              ? credits(wallet.balance_minor) + " " + wallet.currency
              : busy
                ? "Loading…"
                : "Not provisioned"}
          </h2>
          <p>
            Deposits, withdrawals and cash bets are disabled during preparation.
          </p>
          <button className="button secondary" disabled>
            Deposits unavailable
          </button>
        </article>
        <article className="panel account-tile">
          <ShieldCheck />
          <span className="eyebrow">VERIFICATION</span>
          <h2>
            {profile?.kyc_status === "verified"
              ? "Verified"
              : "Verification pending"}
          </h2>
          <p>
            {user?.email_confirmed_at
              ? "Email confirmed"
              : "Email confirmation pending"}{" "}
            · Identity checks must be connected by the operator before cash
            play.
          </p>
          <Link className="text-link" to="/support">
            Account help <ArrowRight size={15} />
          </Link>
        </article>
        <article className="panel account-tile">
          <Clock />
          <span className="eyebrow">DEMO WALLET</span>
          <h2>{credits(demo.balance)} credits</h2>
          <p>
            Session-only credits. They cannot be deposited, transferred or
            withdrawn.
          </p>
          <button
            className="button secondary"
            disabled={demo.blocked}
            onClick={demo.reset}
          >
            <RefreshCw size={15} /> Reset demo balance
          </button>
        </article>
      </div>
      <div className="panel account-details">
        <h2>Account details</h2>
        <dl>
          <div>
            <dt>Email</dt>
            <dd>{user.email}</dd>
          </div>
          <div>
            <dt>Country</dt>
            <dd>{profile?.country || "Not available"}</dd>
          </div>
          <div>
            <dt>Cash loss limit</dt>
            <dd>
              {profile
                ? credits(profile.daily_loss_limit_minor) + " per UTC day"
                : "Unavailable"}
            </dd>
          </div>
          <div>
            <dt>Account exclusion</dt>
            <dd>
              {profile?.excluded_until
                ? new Date(profile.excluded_until).toLocaleString()
                : "No exclusion recorded"}
            </dd>
          </div>
        </dl>
        <Link to="/responsible-gaming" className="text-link">
          Manage limits and time away →
        </Link>
      </div>
      <div className="panel history">
        <h2>Cash transactions</h2>
        {entries.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Type</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.id}>
                    <td>{new Date(e.created_at).toLocaleString()}</td>
                    <td>{e.kind}</td>
                    <td>
                      {credits(e.amount_minor)} {wallet?.currency}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="muted">No cash transactions to display.</p>
        )}
      </div>
      <DemoHistory />
    </section>
  );
}
export function DemoHistory() {
  const { rounds } = useDemo();
  return (
    <div className="panel history">
      <h2>Demo session history</h2>
      <p className="muted">
        This browser session only. Returned amounts include the stake.
      </p>
      {rounds.length ? (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Game</th>
                <th>Stake</th>
                <th>Returned</th>
                <th>Net</th>
              </tr>
            </thead>
            <tbody>
              {rounds.map((r) => (
                <tr key={r.id}>
                  <td>{new Date(r.time).toLocaleTimeString()}</td>
                  <td>{r.game}</td>
                  <td>{credits(r.bet)}</td>
                  <td>{credits(r.returned)}</td>
                  <td className={r.returned >= r.bet ? "success" : "muted"}>
                    {credits(r.returned - r.bet)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="muted">Play an original game to see your rounds here.</p>
      )}
    </div>
  );
}
