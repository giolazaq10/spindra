import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { useAuth } from "./Auth";
import { supabase, authConfigured } from "@/lib/supabase";
type WalletState = {
  realBalance: number;
  balance: number;
  currency: string;
  loading: boolean;
  error: string;
  refresh: () => void;
  acceptServerBalance: (minor: number) => void;
};
const Context = createContext<WalletState>(null!);
export function WalletProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [cash, setCash] = useState({ owner: "", balance: 0, currency: "USD" }),
    [pending, setPending] = useState(false),
    [error, setError] = useState("");
  const current = useRef(user?.id),
    version = useRef(0);
  useEffect(() => {
    current.current = user?.id;
    version.current++;
    return () => {
      current.current = undefined;
    };
  }, [user?.id]);
  const refresh = useCallback(() => {
    const id = user?.id;
    if (!id || !authConfigured) return;
    const ticket = ++version.current;
    setPending(true);
    void (async () => {
      try {
        const { data, error } = await supabase
          .from("wallets")
          .select("balance_minor,currency")
          .eq("user_id", id)
          .maybeSingle();
        if (current.current !== id || version.current !== ticket) return;
        if (error || !data)
          throw new Error(error?.message || "Wallet unavailable");
        setCash({
          owner: id,
          balance: data.balance_minor,
          currency: data.currency,
        });
        setError("");
      } catch (e) {
        if (current.current === id && version.current === ticket)
          setError(e instanceof Error ? e.message : "Wallet unavailable");
      } finally {
        if (current.current === id && version.current === ticket)
          setPending(false);
      }
    })();
  }, [user?.id]);
  useEffect(() => {
    const timer = setTimeout(refresh, 0);
    window.addEventListener("focus", refresh);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("focus", refresh);
    };
  }, [refresh]);
  const acceptServerBalance = useCallback(
    (minor: number) => {
      if (!user || !Number.isSafeInteger(minor) || minor < 0) return;
      version.current++;
      setCash({ owner: user.id, balance: minor, currency: "USD" });
      setError("");
      setPending(false);
    },
    [user],
  );
  const realBalance = cash.owner === user?.id ? cash.balance : 0;
  return (
    <Context.Provider
      value={{
        realBalance,
        balance: realBalance,
        currency: "USD",
        loading: !!user && (pending || (cash.owner !== user.id && !error)),
        error,
        refresh,
        acceptServerBalance,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export const useWallet = () => useContext(Context);
