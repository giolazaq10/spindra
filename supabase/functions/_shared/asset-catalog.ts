export type ConfiguredAsset = {
  code: string;
  symbol: string;
  name: string;
  network: string;
  memo_required: boolean;
  deposits_enabled: boolean;
  withdrawals_enabled: boolean;
};
export type PaymentAvailability = {
  deposits_enabled: boolean;
  withdrawals_enabled: boolean;
};
export function merchantCurrencyCodes(response: unknown): Set<string> {
  const r = response as Record<string, unknown> | null;
  const values = Array.isArray(response)
    ? response
    : Array.isArray(r?.selectedCurrencies)
      ? r.selectedCurrencies
      : Array.isArray(r?.currencies)
        ? r.currencies
        : null;
  if (!values) throw new Error("Unrecognized merchant currency response");
  return new Set(
    values
      .map((v) =>
        typeof v === "string"
          ? v
          : typeof v === "object" && v
            ? String(
                (v as Record<string, unknown>).code ??
                  (v as Record<string, unknown>).currency ??
                  "",
              )
            : "",
      )
      .map((v) => v.toLowerCase().trim())
      .filter((v) => /^[a-z0-9]{2,30}$/.test(v)),
  );
}
export function catalogRows(
  configured: ConfiguredAsset[],
  live: ConfiguredAsset[] | null,
  settings: PaymentAvailability,
  ready: { deposit: boolean; withdrawal: boolean },
) {
  const supported = new Map((live || []).map((a) => [a.code, a]));
  return configured.map((a) => {
    const available = supported.get(a.code);
    const status = (kind: "deposit" | "withdrawal") => {
      if (
        kind === "deposit"
          ? !settings.deposits_enabled
          : !settings.withdrawals_enabled
      )
        return kind === "deposit" ? "Deposits paused" : "Withdrawals paused";
      if (!ready[kind]) return "Payment setup incomplete";
      if (live === null) return "Provider availability unavailable";
      if (!available) return "Not enabled with payment provider";
      if (kind === "deposit" ? !a.deposits_enabled : !a.withdrawals_enabled)
        return "Network paused";
      return "Available";
    };
    const deposit_status = status("deposit"),
      withdrawal_status = status("withdrawal");
    return {
      ...a,
      memo_required: a.memo_required || !!available?.memo_required,
      provider_available: !!available,
      deposit_available: deposit_status === "Available",
      withdrawal_available: withdrawal_status === "Available",
      deposit_status,
      withdrawal_status,
    };
  });
}
