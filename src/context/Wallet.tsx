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
export type GameMode = "practice" | "real";
type WalletState = {
  practiceBalance: number;
  realBalance: number;
  currency: string;
  mode: GameMode;
  balance: number;
  loading: boolean;
  setMode: (mode: GameMode) => void;
  refresh: () => void;
};
const Context = createContext<WalletState>(null!);
export function WalletProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [cash, setCash] = useState({ owner: "", balance: 0, currency: "USD" }),
    [mode, setMode] = useState<GameMode>("practice"),
    [loading, setLoading] = useState(false);
  const current = useRef(user?.id);
  useEffect(() => {
    current.current = user?.id;
    return () => {
      current.current = undefined;
    };
  }, [user?.id]);
  const refresh = useCallback(() => {
    const id = user?.id;
    if (!id || !authConfigured) return;
    setLoading(true);
    void supabase
      .from("wallets")
      .select("balance_minor,currency")
      .eq("user_id", id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (current.current === id) {
          if (data && !error)
            setCash({
              owner: id,
              balance: data.balance_minor,
              currency: data.currency,
            });
          setLoading(false);
        }
      });
  }, [user?.id]);
  useEffect(() => {
    const timer = setTimeout(refresh, 0);
    return () => clearTimeout(timer);
  }, [refresh]);
  const realBalance = cash.owner === user?.id ? cash.balance : 0,
    practiceBalance = 100000;
  return (
    <Context.Provider
      value={{
        practiceBalance,
        realBalance,
        currency: cash.currency,
        mode,
        balance: mode === "practice" ? practiceBalance : realBalance,
        loading: !!user && loading,
        setMode,
        refresh,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export const useWallet = () => useContext(Context);
