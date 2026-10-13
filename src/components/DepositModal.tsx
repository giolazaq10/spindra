import { useState, useEffect } from "react";
import { X, Bitcoin, Coins, DollarSign, Loader2, Copy, Check, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/Auth";
import { authConfigured, supabase } from "@/lib/supabase";

type Props = {
  open: boolean;
  onClose: () => void;
  onDeposited?: () => void;
};

const coins = [
  { id: "btc", label: "Bitcoin", symbol: "BTC", icon: Bitcoin, color: "from-orange-400 to-amber-500" },
  { id: "eth", label: "Ethereum", symbol: "ETH", icon: Coins, color: "from-blue-400 to-indigo-500" },
  { id: "usdt", label: "Tether", symbol: "USDT", icon: DollarSign, color: "from-emerald-400 to-teal-500" },
  { id: "usdc", label: "USD Coin", symbol: "USDC", icon: DollarSign, color: "from-blue-400 to-blue-600" },
];

type DepositState = "select" | "address" | "waiting" | "confirmed";

export default function DepositModal({ open, onClose, onDeposited }: Props) {
  const { user } = useAuth();
  const [state, setState] = useState<DepositState>("select");
  const [selectedCoin, setSelectedCoin] = useState<string>("");
  const [address, setAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) {
      setState("select");
      setSelectedCoin("");
      setAddress("");
      setAmount("");
      setError("");
    }
  }, [open]);

  if (!open) return null;

  async function createDeposit() {
    if (!user || !authConfigured) {
      setError("Please sign in to deposit.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/crypto-deposit`;
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          userId: user.id,
          coin: selectedCoin,
          amount: amount || undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Request failed (${res.status})`);
      }
      const data = await res.json();
      setAddress(data.address || data.pay_address || "");
      setState("address");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to start deposit.");
    } finally {
      setBusy(false);
    }
  }

  function copyAddress() {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const coin = coins.find((c) => c.id === selectedCoin);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-[count-up_0.2s_ease]"
      onClick={onClose}
    >
      <div
        className="glass-strong rounded-3xl p-8 max-w-md w-full mx-4 border border-white/10 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <span className="text-xs font-bold tracking-widest text-amber-400 uppercase">
              Crypto Deposit
            </span>
            <h2 className="text-2xl font-extrabold text-white mt-1">
              Fund Your Wallet
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-lg glass flex items-center justify-center text-gray-400 hover:text-white"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
            {error}
          </div>
        )}

        {state === "select" && (
          <div className="space-y-3">
            <p className="text-sm text-gray-400 mb-4">
              Choose a cryptocurrency to deposit. Funds will be credited to your wallet after confirmation.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {coins.map((c) => {
                const Icon = c.icon;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCoin(c.id)}
                    className={`glass rounded-2xl p-4 text-center transition-all duration-200 hover:scale-[1.03] ${
                      selectedCoin === c.id
                        ? "border-amber-400/50 bg-amber-400/5"
                        : "hover:border-white/20"
                    }`}
                  >
                    <div className={`w-10 h-10 mx-auto mb-2 rounded-xl bg-gradient-to-br ${c.color} flex items-center justify-center`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-sm font-bold text-white">{c.label}</div>
                    <div className="text-xs text-gray-500">{c.symbol}</div>
                  </button>
                );
              })}
            </div>

            {selectedCoin && (
              <div className="pt-3">
                <label className="block text-xs text-gray-400 mb-2">
                  Amount (optional)
                </label>
                <input
                  type="text"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 0.001 BTC"
                  className="w-full glass rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-amber-400/40"
                />
              </div>
            )}

            <button
              onClick={createDeposit}
              disabled={!selectedCoin || busy}
              className="w-full px-6 py-3.5 bg-gradient-to-r from-amber-400 to-orange-500 text-black rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 hover:scale-[1.02] transition-transform"
            >
              {busy ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating address...
                </>
              ) : (
                <>
                  Get Deposit Address
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}

        {state === "address" && coin && (
          <div className="space-y-4">
            <div className="text-center">
              <div className={`w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-br ${coin.color} flex items-center justify-center`}>
                <coin.icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-bold text-white">
                Send {coin.symbol} to this address
              </h3>
            </div>

            <div className="glass rounded-2xl p-4">
              <div className="text-xs text-gray-500 mb-2">Deposit address</div>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm text-amber-400 break-all font-mono">
                  {address || "Generating..."}
                </code>
                {address && (
                  <button
                    onClick={copyAddress}
                    className="w-9 h-9 rounded-lg glass flex items-center justify-center text-gray-400 hover:text-amber-400 flex-shrink-0"
                    aria-label="Copy address"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                )}
              </div>
            </div>

            {amount && (
              <div className="glass rounded-2xl p-4">
                <div className="text-xs text-gray-500 mb-1">Expected amount</div>
                <div className="text-sm text-white font-semibold">{amount} {coin.symbol}</div>
              </div>
            )}

            <div className="glass rounded-xl p-3 text-xs text-gray-400">
              Funds will appear in your wallet after network confirmations. The deposit address is unique to your account and can be reused.
            </div>

            <button
              onClick={() => setState("waiting")}
              className="w-full px-6 py-3.5 glass rounded-xl font-semibold text-white hover:border-amber-400/40 transition-all"
            >
              I've Sent the Payment
            </button>
          </div>
        )}

        {state === "waiting" && (
          <div className="text-center py-6">
            <Loader2 className="w-12 h-12 text-amber-400 animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">
              Waiting for confirmation
            </h3>
            <p className="text-sm text-gray-400 mb-6">
              Your deposit is being processed. This usually takes 10-30 minutes depending on the network.
            </p>
            <button
              onClick={() => {
                setState("confirmed");
                setTimeout(() => {
                  onDeposited?.();
                  onClose();
                }, 2000);
              }}
              className="w-full px-6 py-3.5 glass rounded-xl font-semibold text-white hover:border-amber-400/40 transition-all"
            >
              Simulate Confirmation
            </button>
          </div>
        )}

        {state === "confirmed" && (
          <div className="text-center py-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <Check className="w-8 h-8 text-emerald-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              Deposit Confirmed!
            </h3>
            <p className="text-sm text-gray-400">
              Your wallet has been credited.
            </p>
          </div>
        )}

        <div className="mt-5 pt-5 border-t border-white/5 text-xs text-gray-500 text-center">
          Powered by NowPayments · Crypto deposits are subject to network fees
        </div>
      </div>
    </div>
  );
}
