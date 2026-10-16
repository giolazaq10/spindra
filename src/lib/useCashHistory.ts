import { useEffect, useState } from "react";
import { useAuth } from "@/context/Auth";
import { cashApi } from "./walletApi";
export type CashHistoryRound = {
  id: string;
  game: string;
  state: string;
  stake_minor: number;
  returned_minor: number;
  created_at: string;
};
export function useCashHistory() {
  const { user } = useAuth();
  const [data, setData] = useState<{
    owner: string;
    rounds: CashHistoryRound[];
    error: string;
  }>({ owner: "", rounds: [], error: "" });
  useEffect(() => {
    if (!user) return;
    let active = true;
    cashApi<{ rounds: CashHistoryRound[] }>("history")
      .then((r) => {
        if (active) setData({ owner: user.id, rounds: r.rounds, error: "" });
      })
      .catch((e) => {
        if (active) setData({ owner: user.id, rounds: [], error: e.message });
      });
    return () => {
      active = false;
    };
  }, [user]);
  return {
    rounds: data.owner === user?.id ? data.rounds : [],
    error: data.owner === user?.id ? data.error : "",
    loading: !!user && data.owner !== user.id,
  };
}
