import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "./Auth";
import { supabase, authConfigured } from "@/lib/supabase";

export type GameMode = "practice" | "real";

type WalletState = {
  /** Practice balance in cents (session-only, no cash value) */
  practiceBalance: number;
  /** Real balance in cents (from Supabase wallet) */
  realBalance: number;
  /** Currency code for the real wallet */
  currency: string;
  /** Currently selected game mode */
  mode: GameMode;
  /** Active balance for the current mode */
  balance: number;
  /** Whether the real wallet is loading */
  loading: boolean;
  /** Switch between practice and real */
  setMode: (mode: GameMode) => void;
  /** Refresh the real wallet from Supabase */
  refresh: () => void;
};

const Context = createContext<WalletState>(null!);

export function WalletProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [practiceBalance, setPracticeBalance] = useState(100000);
  const [realBalance, setRealBalance] = useState(0);
  const [currency, setCurrency] = useState("USD");
  const [mode, setMode] = useState<GameMode>("practice");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || !authConfigured) return;
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("wallets")
          .select("balance_minor,currency")
          .eq("user_id", user.id)
          .maybeSingle();
        if (!error && data && alive) {
          setRealBalance(data.balance_minor);
          setCurrency(data.currency);
        }
      } catch {
        // wallet table may not exist yet
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [user]);

  const balance = mode === "practice" ? practiceBalance : realBalance;

  return (
    <Context.Provider
      value={{
        practiceBalance,
        realBalance,
        currency,
        mode,
        balance,
        loading,
        setMode,
        refresh: () => {
          if (!user || !authConfigured) return;
          setLoading(true);
          supabase
            .from("wallets")
            .select("balance_minor,currency")
            .eq("user_id", user.id)
            .maybeSingle()
            .then(({ data }) => {
              if (data) {
                setRealBalance(data.balance_minor);
                setCurrency(data.currency);
              }
              setLoading(false);
            });
        },
      }}
    >
      {children}
    </Context.Provider>
  );
}

export const useWallet = () => useContext(Context);
