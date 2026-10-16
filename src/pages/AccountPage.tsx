import { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { LogOut, Wallet, ShieldCheck, ArrowRight, Plus } from "lucide-react";
import { useAuth } from "@/context/Auth";
import { credits } from "@/lib/money";
import CashHistory from "@/components/CashHistory";
import { useWallet } from "@/context/Wallet";
import { supabase } from "@/lib/supabase";
import AccountSecurity from "@/components/AccountSecurity";
import DepositModal from "@/components/DepositModal";
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
  delta_minor: number;
  created_at: string;
};
export default function AccountPage() {
  const { user, loading } = useAuth(),
    wallet = useWallet(),
    location = useLocation(),
    navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null),
    [walletData, setWalletData] = useState<Balance | null>(null),
    [entries, setEntries] = useState<Entry[]>([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(true),
    [signingOut, setSigningOut] = useState(false),
    [depositOpen, setDepositOpen] = useState(false),
    [walletTab, setWalletTab] = useState<"deposit" | "withdraw" | "history">(
      "deposit",
    ),
    [adminRole, setAdminRole] = useState<string | null>(null);
  useEffect(() => {
    if (!user) return;
    let alive = true;
    supabase.rpc("my_admin_role").then(({ data }) => {
      if (alive) setAdminRole(data);
    });
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
            .from("cash_events")
            .select("id,kind,delta_minor,created_at")
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
          setWalletData(w.data);
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
        Loading account...
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
      <DepositModal
        open={depositOpen}
        initialTab={walletTab}
        onClose={() => setDepositOpen(false)}
        onDeposited={wallet.refresh}
      />
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
            {walletData
              ? credits(wallet.realBalance) + " " + walletData.currency
              : busy
                ? "Loading..."
                : "Not provisioned"}
          </h2>
          <p>
            Deposit crypto to your cash wallet. Cash games require enabled
            provider integrations.
          </p>
          <button
            className="button primary"
            onClick={() => {
              setWalletTab("deposit");
              setDepositOpen(true);
            }}
          >
            <Plus size={16} /> Deposit Crypto
          </button>
          <button
            className="button secondary"
            onClick={() => {
              setWalletTab("withdraw");
              setDepositOpen(true);
            }}
          >
            Withdraw
          </button>
          <button
            className="button secondary"
            onClick={() => {
              setWalletTab("history");
              setDepositOpen(true);
            }}
          >
            Wallet activity
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
            · Identity checks must be connected before cash play.
          </p>
          <Link className="text-link" to="/support">
            Account help <ArrowRight size={15} />
          </Link>
        </article>
      </div>
      <div className="panel account-details">
        <AccountSecurity />
        {adminRole && (
          <Link className="button secondary" to="/admin">
            Open admin control center
          </Link>
        )}
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
                      {credits(e.delta_minor)} {walletData?.currency}
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
      <CashHistory />
    </section>
  );
}
