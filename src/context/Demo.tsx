import {
  createContext,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
export type Round = {
  id: string;
  game: string;
  bet: number;
  returned: number;
  time: string;
};
type Demo = {
  balance: number;
  rounds: Round[];
  blocked: boolean;
  limit: number;
  loss: number;
  reserve: (n: number) => boolean;
  settle: (game: string, bet: number, returned: number) => void;
  reset: () => void;
  setLimit: (n: number) => void;
  exclude: () => void;
};
const Context = createContext<Demo>(null!);
export function DemoProvider({ children }: { children: ReactNode }) {
  const funds = useRef(100000);
  const pending = useRef(false);
  const spent = useRef(0);
  const locked = useRef(false);
  const cap = useRef(50000);
  const [balance, setBalance] = useState(funds.current),
    [rounds, setRounds] = useState<Round[]>([]),
    [blocked, setBlocked] = useState(false),
    [limit, setLimitState] = useState(cap.current),
    [loss, setLoss] = useState(0);
  const reserve = (n: number) => {
    if (
      locked.current ||
      !Number.isSafeInteger(n) ||
      n <= 0 ||
      n > funds.current ||
      spent.current + n > cap.current
    )
      return false;
    funds.current -= n;
    spent.current += n;
    pending.current = true;
    setBalance(funds.current);
    setLoss(spent.current);
    return true;
  };
  const settle = (game: string, bet: number, returned: number) => {
    if (!Number.isSafeInteger(returned) || returned < 0 || !pending.current)
      throw new Error("Invalid demo settlement");
    funds.current += returned;
    spent.current = Math.max(0, spent.current - returned);
    pending.current = false;
    setBalance(funds.current);
    setLoss(spent.current);
    setRounds((r) =>
      [
        {
          id: crypto.randomUUID(),
          game,
          bet,
          returned,
          time: new Date().toISOString(),
        },
        ...r,
      ].slice(0, 100),
    );
  };
  return (
    <Context.Provider
      value={{
        balance,
        rounds,
        blocked,
        limit,
        loss,
        reserve,
        settle,
        reset: () => {
          if (pending.current || locked.current) return;
          funds.current = 100000;
          setBalance(100000);
          spent.current = 0;
          setLoss(0);
          setRounds([]);
        },
        setLimit: (n) => {
          if (Number.isSafeInteger(n) && n > 0) {
            cap.current = n;
            setLimitState(n);
          }
        },
        exclude: () => {
          locked.current = true;
          setBlocked(true);
        },
      }}
    >
      {children}
    </Context.Provider>
  );
}
export const useDemo = () => useContext(Context);
export const credits = (cents: number) =>
  (cents / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
