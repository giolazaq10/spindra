import { useCallback, useEffect, useSyncExternalStore } from "react";
import { useAuth } from "@/context/Auth";
import { cashApi } from "./walletApi";
import {
  cashFeedSnapshot,
  subscribeCashFeed,
  loadCashFeed,
  type CashHistoryRound,
} from "./cashSessionFeed";
export type { CashHistoryRound } from "./cashSessionFeed";
export function useCashHistory() {
  const { user } = useAuth(),
    owner = user?.id;
  const subscribe = useCallback(
    (listener: () => void) => subscribeCashFeed(owner, listener),
    [owner],
  );
  const snapshot = useCallback(() => cashFeedSnapshot(owner), [owner]);
  const data = useSyncExternalStore(subscribe, snapshot, snapshot);
  useEffect(() => {
    if (!owner) return;
    const load = (force = false) =>
      loadCashFeed(
        owner,
        () => cashApi<{ rounds: CashHistoryRound[] }>("history"),
        force,
      );
    void load(true);
    const focus = () => {
      void load(true);
    };
    window.addEventListener("focus", focus);
    return () => window.removeEventListener("focus", focus);
  }, [owner]);
  return data;
}
