import {
  createContext,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { DemoLedger } from "../lib/demoLedger";
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
  reserve: (amount: number, id: string) => boolean;
  settle: (game: string, id: string, returned: number) => void;
  reset: () => void;
  setLimit: (amount: number) => void;
  exclude: () => void;
};
const Context = createContext<Demo>(null!);
export function DemoProvider({ children }: { children: ReactNode }) {
  const ledger = useRef(new DemoLedger());
  const [balance, setBalance] = useState(100000),
    [rounds, setRounds] = useState<Round[]>([]),
    [blocked, setBlocked] = useState(false),
    [limit, setLimitState] = useState(50000),
    [loss, setLoss] = useState(0);
  function sync() {
    setBalance(ledger.current.balance);
    setLoss(ledger.current.loss);
  }
  function reserve(amount: number, id: string) {
    const accepted = ledger.current.reserve(amount, id);
    if (accepted) sync();
    return accepted;
  }
  function settle(game: string, id: string, returned: number) {
    const bet = ledger.current.settle(id, returned);
    if (bet === null) return;
    sync();
    setRounds((r) =>
      [{ id, game, bet, returned, time: new Date().toISOString() }, ...r].slice(
        0,
        100,
      ),
    );
  }
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
          if (ledger.current.reset()) {
            sync();
            setRounds([]);
          }
        },
        setLimit: (n) => {
          if (Number.isSafeInteger(n) && n > 0) {
            ledger.current.limit = n;
            setLimitState(n);
          }
        },
        exclude: () => {
          ledger.current.blocked = true;
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
