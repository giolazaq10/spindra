import { recordCashSession } from "./cashSessionFeed";
import { supabase } from "./supabase";
export type Asset = {
  code: string;
  symbol: string;
  name: string;
  network: string;
  memo_required: boolean;
  deposit_available?: boolean;
  withdrawal_available?: boolean;
  deposit_status?: string;
  withdrawal_status?: string;
  deposits_enabled: boolean;
  withdrawals_enabled: boolean;
};
export type DepositRoute = {
  address: string;
  memo?: string;
  coin: string;
  network: string;
  minimum: number;
  minimum_usd: number;
};
export type Quote = {
  id: string;
  asset: string;
  address: string;
  memo?: string;
  amount_minor: number;
  crypto_amount: number;
  fee_crypto: number;
  expires_at: string;
};
export type Withdrawal = Quote & {
  status: string;
  created_at: string;
  tx_hash?: string;
  reason?: string;
};
export type CashEvent = {
  id: string;
  kind: string;
  delta_minor: number;
  balance_after_minor: number;
  created_at: string;
};
async function invokeAuthed<T>(
  endpoint: string,
  action: string,
  body: Record<string, unknown> = {},
): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Sign in required");
  const { data, error } = await supabase.functions.invoke(endpoint, {
    headers: { Authorization: `Bearer ${session.access_token}` },
    body: { ...body, action },
  });
  if (error) {
    let message = error.message;
    try {
      const detail = await error.context?.json();
      message = detail?.error || message;
    } catch {
      /* Retain transport error. */
    }
    throw new Error(message);
  }
  if (data?.error) throw new Error(data.error);
  return data as T;
}

export const walletApi = <T>(
  action: string,
  body: Record<string, unknown> = {},
) => invokeAuthed<T>("wallet-api", action, body);
const cashReads = new Map<string, Promise<unknown>>();
export async function cashApi<T>(
  action: string,
  body: Record<string, unknown> = {},
): Promise<T> {
  const gateway = import.meta.env?.VITE_CASH_GAME_URL;
  if (gateway && new URL(gateway).protocol !== "https:")
    throw new Error("Cash play is temporarily unavailable");
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Sign in required");
  const execute = async () => {
    let result;
    if (!gateway) {
      const response = await supabase.functions.invoke("cash-games", {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: { ...body, action },
      });
      if (response.error) {
        let message = response.error.message;
        try {
          message = (await response.error.context?.json())?.error || message;
        } catch {
          /* Preserve the transport error when no JSON detail is available. */
        }
        throw new Error(message);
      }
      result = response.data;
    } else {
      const response = await fetch(gateway, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ ...body, action }),
        cache: "no-store",
      });
      result = await response.json();
      if (!response.ok) throw new Error(result.error || "Cash request failed");
    }
    if (result?.error) throw new Error(result.error);
    if (session.user?.id) {
      recordCashSession(
        session.user.id,
        result?.round || result?.active || result,
      );
    }
    return result as T;
  };
  if (action !== "status" && action !== "history") return execute();
  const key = JSON.stringify([
    session.access_token,
    gateway || "cash-games",
    action,
    body,
  ]);
  const pending = cashReads.get(key);
  if (pending) return pending as Promise<T>;
  const request = execute();
  cashReads.set(key, request);
  try {
    return await request;
  } finally {
    if (cashReads.get(key) === request) cashReads.delete(key);
  }
}
