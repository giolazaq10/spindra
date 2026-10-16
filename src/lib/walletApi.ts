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
export async function cashApi<T>(
  action: string,
  body: Record<string, unknown> = {},
): Promise<T> {
  const gateway = import.meta.env?.VITE_CASH_GAME_URL;
  if (!gateway) return invokeAuthed<T>("cash-games", action, body);
  if (new URL(gateway).protocol !== "https:")
    throw new Error("Cash play is temporarily unavailable");
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Sign in required");
  const response = await fetch(gateway, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ ...body, action }),
    cache: "no-store",
  });
  const result = await response.json();
  if (!response.ok || result.error)
    throw new Error(result.error || "Cash request failed");
  return result as T;
}
