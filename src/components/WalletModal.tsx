import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import QRCode from "@/lib/vendor/qr-code.js";
import { X, Copy, Wallet } from "lucide-react";
import { useAuth } from "@/context/Auth";
import { useWallet } from "@/context/Wallet";
import {
  walletApi,
  type Asset,
  type DepositRoute,
  type Quote,
  type Withdrawal,
  type CashEvent,
} from "@/lib/walletApi";
import AccountSecurity from "./AccountSecurity";
import "../bank.css";
type Props = {
  open: boolean;
  onClose: () => void;
  onDeposited?: () => void;
  initialTab?: "deposit" | "withdraw" | "history";
};
export default function WalletModal(props: Props) {
  const { user } = useAuth();
  return props.open ? (
    <WalletDialog key={user?.id || "guest"} {...props} />
  ) : null;
}
function WalletDialog({ onClose, onDeposited, initialTab = "deposit" }: Props) {
  const { user } = useAuth(),
    wallet = useWallet();
  const refresh = wallet.refresh;
  const [tab, setTab] = useState(initialTab),
    [assets, setAssets] = useState<Asset[]>([]),
    [coin, setCoin] = useState(""),
    [route, setRoute] = useState<DepositRoute | null>(null),
    [qr, setQr] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [address, setAddress] = useState(""),
    [memo, setMemo] = useState(""),
    [amount, setAmount] = useState(""),
    [quote, setQuote] = useState<Quote | null>(null),
    [confirmed, setConfirmed] = useState(false),
    [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]),
    [events, setEvents] = useState<CashEvent[]>([]),
    [notice, setNotice] = useState("");
  const alive = useRef(true),
    requestKey = useRef(crypto.randomUUID()),
    dialog = useRef<HTMLDivElement>(null),
    close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  }, [onClose]);
  const [expired, setExpired] = useState(false);
  useEffect(() => {
    if (!quote) return;
    const timer = setTimeout(
      () => setExpired(true),
      Math.max(0, Date.parse(quote.expires_at) - Date.now()),
    );
    return () => clearTimeout(timer);
  }, [quote]);
  const asset = assets.find((a) => a.code === coin);
  useEffect(() => {
    alive.current = true;
    const previous = document.activeElement as HTMLElement | null;
    dialog.current?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") close.current();
      if (e.key === "Tab") {
        const nodes = dialog.current?.querySelectorAll<HTMLElement>(
          "button:not(:disabled),a,input,select",
        );
        if (!nodes?.length) return;
        const first = nodes[0],
          last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      alive.current = false;
      document.removeEventListener("keydown", key);
      previous?.focus();
    };
  }, []);
  useEffect(() => {
    if (!user) return;
    let active = true;
    walletApi<{ assets: Asset[] }>("assets")
      .then((r) => {
        if (active) setAssets(r.assets);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    async function history() {
      try {
        const r = await walletApi<{
          transactions: CashEvent[];
          withdrawals: Withdrawal[];
        }>("history");
        if (active) {
          setEvents(r.transactions);
          setWithdrawals(r.withdrawals);
          refresh();
        }
      } catch {
        /* Active operations report their errors. */
      }
    }
    void history();
    const timer = setInterval(() => void history(), 15000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [user, refresh]);
  async function run(task: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await task();
    } catch (e) {
      if (alive.current)
        setError(e instanceof Error ? e.message : "Wallet request failed");
    } finally {
      if (alive.current) setBusy(false);
    }
  }
  function changeCoin(value: string) {
    setCoin(value);
    setRoute(null);
    setQr("");
    setQuote(null);
    setConfirmed(false);
    setMemo("");
    setError("");
    requestKey.current = crypto.randomUUID();
  }
  async function deposit() {
    const result = await walletApi<DepositRoute>("deposit_address", { coin });
    const image = await QRCode.toDataURL(result.address, {
      margin: 2,
      width: 220,
    });
    if (alive.current) {
      setRoute(result);
      setQr(image);
    }
  }
  async function getQuote() {
    const result = await walletApi<{ quote: Quote }>("withdrawal_quote", {
      coin,
      amount_usd: amount,
      address,
      memo,
    });
    if (alive.current) {
      setQuote(result.quote);
      setExpired(false);
      setConfirmed(false);
      requestKey.current = crypto.randomUUID();
    }
  }
  async function withdraw() {
    if (!quote || !confirmed) return;
    const result = await walletApi<{ withdrawal: Withdrawal }>(
      "withdrawal_request",
      { quote_id: quote.id, request_key: requestKey.current },
    );
    if (alive.current) {
      setNotice(
        `Withdrawal ${result.withdrawal.status.replace(/_/g, " ")}. Funds are reserved until completion or refund.`,
      );
      setQuote(null);
      setTab("history");
      refresh();
      onDeposited?.();
      const h = await walletApi<{
        transactions: CashEvent[];
        withdrawals: Withdrawal[];
      }>("history");
      if (alive.current) {
        setEvents(h.transactions);
        setWithdrawals(h.withdrawals);
      }
    }
  }
  return (
    <div className="bank-overlay" onClick={onClose}>
      <div
        ref={dialog}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Spindra crypto wallet"
        className="bank-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <header>
          <div>
            <span>SPINDRA WALLET</span>
            <h2>
              <Wallet size={23} /> Your crypto, your way.
            </h2>
          </div>
          <button onClick={onClose} aria-label="Close wallet">
            <X />
          </button>
        </header>
        {!user ? (
          <>
            <p>
              Sign in to access your personal deposit addresses and cash wallet.
            </p>
            <Link className="button primary" to="/sign-in" onClick={onClose}>
              Sign in
            </Link>
          </>
        ) : (
          <>
            <div className="bank-balance">
              Available cash{" "}
              <strong>${(wallet.realBalance / 100).toFixed(2)} USD</strong>
            </div>
            <nav aria-label="Wallet actions">
              {(["deposit", "withdraw", "history"] as const).map((t) => (
                <button
                  key={t}
                  aria-pressed={tab === t}
                  onClick={() => {
                    setTab(t);
                    setError("");
                  }}
                >
                  {t}
                </button>
              ))}
            </nav>
            {error && (
              <p className="bank-error" role="alert">
                {error === "MFA_REQUIRED"
                  ? "Verify your authenticator below, then confirm again."
                  : error}
              </p>
            )}
            {notice && <p role="status">{notice}</p>}
            {tab !== "history" && (
              <label>
                Currency & network
                <select
                  value={coin}
                  disabled={busy || !!quote}
                  onChange={(e) => changeCoin(e.target.value)}
                >
                  <option value="">Select a network</option>
                  {assets
                    .filter((a) =>
                      tab === "deposit"
                        ? a.deposits_enabled
                        : a.withdrawals_enabled,
                    )
                    .map((a) => (
                      <option key={a.code} value={a.code}>
                        {a.symbol} · {a.network}
                      </option>
                    ))}
                </select>
              </label>
            )}
            {tab === "deposit" && (
              <>
                {route ? (
                  <>
                    <div className="bank-address">
                      <img
                        src={qr}
                        alt={`${asset?.symbol} deposit address QR code`}
                      />
                      <h3>
                        {asset?.symbol} · {route.network}
                      </h3>
                      <p>Your reusable deposit address</p>
                      <code>{route.address}</code>
                      <button
                        className="button secondary"
                        onClick={() =>
                          void run(async () => {
                            await navigator.clipboard.writeText(route.address);
                            setNotice("Address copied.");
                          })
                        }
                      >
                        <Copy size={15} /> Copy address
                      </button>
                      {route.memo && (
                        <>
                          <h3>Required memo / tag</h3>
                          <code>{route.memo}</code>
                          <button
                            className="button secondary"
                            onClick={() =>
                              void run(async () => {
                                await navigator.clipboard.writeText(
                                  route.memo!,
                                );
                                setNotice("Memo copied.");
                              })
                            }
                          >
                            Copy memo
                          </button>
                        </>
                      )}
                    </div>
                    <p className="bank-note">
                      Send only {asset?.symbol} on {route.network}
                      {route.memo ? " and include the memo/tag" : ""}. Current
                      minimum: {route.minimum} {asset?.symbol} (about $
                      {Number(route.minimum_usd).toFixed(2)}). Fees and provider
                      minimums can change.
                    </p>
                    <p>
                      Choose your amount in your crypto wallet. Your address
                      stays the same for this network. Confirmed deposits appear
                      in history automatically.
                    </p>
                  </>
                ) : (
                  <>
                    <p>
                      Choose a network to get your personal address. No deposit
                      amount is required.
                    </p>
                    <button
                      className="button primary"
                      disabled={!coin || busy}
                      onClick={() => void run(deposit)}
                    >
                      {busy ? "Getting address…" : "Get deposit address"}
                    </button>
                  </>
                )}
              </>
            )}
            {tab === "withdraw" && (
              <>
                {quote ? (
                  <div className="bank-quote">
                    <h3>Review withdrawal</h3>
                    <p>
                      Wallet debit:{" "}
                      <strong>
                        ${(quote.amount_minor / 100).toFixed(2)} USD
                      </strong>
                    </p>
                    <p>
                      You receive:{" "}
                      <strong>
                        {quote.crypto_amount} {asset?.symbol}
                      </strong>
                    </p>
                    <p>
                      Network fee: {quote.fee_crypto} {asset?.symbol} · included
                      in debit
                    </p>
                    <code>{quote.address}</code>
                    {quote.memo && <p>Memo / tag: {quote.memo}</p>}
                    <p>
                      Quote expires{" "}
                      {new Date(quote.expires_at).toLocaleTimeString()}.
                    </p>
                    <label className="bank-check">
                      <input
                        type="checkbox"
                        checked={confirmed}
                        onChange={(e) => setConfirmed(e.target.checked)}
                      />{" "}
                      I checked the network, destination, memo and amount.
                    </label>
                    <button
                      className="button primary"
                      disabled={busy || !confirmed || expired}
                      onClick={() => void run(withdraw)}
                    >
                      Confirm withdrawal
                    </button>
                    <button
                      className="button secondary"
                      disabled={busy}
                      onClick={() => setQuote(null)}
                    >
                      Edit details
                    </button>
                  </div>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      void run(getQuote);
                    }}
                  >
                    <label>
                      Wallet debit (USD)
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        required
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                      />
                    </label>
                    <label>
                      Destination address
                      <input
                        required
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        autoComplete="off"
                      />
                    </label>
                    <label>
                      Memo / tag{" "}
                      {asset?.memo_required ? "(required)" : "(if needed)"}
                      <input
                        required={asset?.memo_required}
                        value={memo}
                        onChange={(e) => setMemo(e.target.value)}
                        autoComplete="off"
                      />
                    </label>
                    <button className="button primary" disabled={!coin || busy}>
                      {busy ? "Checking fees…" : "Review fees & withdrawal"}
                    </button>
                    <p className="bank-note">
                      Verified adult account, confirmed email and two-factor
                      authentication required. Eligible requests process
                      automatically; other requests receive operator review.
                    </p>
                  </form>
                )}
                <AccountSecurity />
              </>
            )}
            {tab === "history" && (
              <div className="bank-history">
                <h3>Withdrawals</h3>
                {!withdrawals.length && <p>No withdrawals yet.</p>}
                {withdrawals.map((w) => (
                  <article key={w.id}>
                    <strong>
                      ${(w.amount_minor / 100).toFixed(2)} ·{" "}
                      {w.asset.toUpperCase()}
                    </strong>
                    <span>{w.status.replace(/_/g, " ")}</span>
                    <small>{new Date(w.created_at).toLocaleString()}</small>
                    {w.tx_hash && <code>{w.tx_hash}</code>}
                    {w.reason && <p>{w.reason}</p>}
                  </article>
                ))}
                <h3>Cash activity</h3>
                {!events.length && <p>No verified cash activity yet.</p>}
                {events.map((e) => (
                  <article key={e.id}>
                    <strong>{e.kind.replace(/_/g, " ")}</strong>
                    <span>
                      {e.delta_minor > 0 ? "+" : ""}$
                      {(e.delta_minor / 100).toFixed(2)}
                    </span>
                    <small>{new Date(e.created_at).toLocaleString()}</small>
                  </article>
                ))}
              </div>
            )}
          </>
        )}
        <footer>Processed by NOWPayments · network fees apply</footer>
      </div>
    </div>
  );
}
