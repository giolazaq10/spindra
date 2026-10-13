import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import {
  NowPaymentsSDK,
  generateTotpCode,
} from "npm:@nowpaymentsio/nowpayments-sdk-nodejs@0.3.0";
import {
  equalSecret,
  matchesRoute,
  minorFloor,
  payoutAmount,
  positive,
  providerId,
  terminalPayout,
} from "./payment-rules.ts";
export const env = (name: string) => Deno.env.get(name) || "";
export const db = () =>
  createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
export function provider() {
  if (!env("NOWPAYMENTS_API_KEY"))
    throw new Error("Payments are not configured");
  return new NowPaymentsSDK({
    apiKey: env("NOWPAYMENTS_API_KEY"),
    email: env("NOWPAYMENTS_EMAIL") || undefined,
    password: env("NOWPAYMENTS_PASSWORD") || undefined,
    twoFactorSecret: env("NOWPAYMENTS_2FA_SECRET") || undefined,
    baseUrl:
      env("NOWPAYMENTS_SANDBOX") === "true"
        ? "https://api-sandbox.nowpayments.io"
        : "https://api.nowpayments.io",
    timeoutMs: 15000,
  });
}
export const ipnUrl = () =>
  env("SUPABASE_URL") + "/functions/v1/nowpayments-ipn";
export async function rpc(name: string, args: Record<string, unknown> = {}) {
  const result = await db().rpc(name, args);
  if (result.error) throw new Error(result.error.message);
  return result.data;
}
export async function authenticate(req: Request) {
  const token = req.headers.get("authorization")?.replace(/^Bearer /i, "");
  if (!token) throw new Error("Sign in required");
  const client = createClient(env("SUPABASE_URL"), env("SUPABASE_ANON_KEY"), {
    auth: { persistSession: false },
  });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) throw new Error("Invalid session");
  let aal = "aal1";
  try {
    aal =
      JSON.parse(
        atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")),
      ).aal || "aal1";
  } catch {
    /* Invalid claim encoding cannot grant higher assurance. */
  }
  return { user: data.user, aal };
}
export async function admin(req: Request) {
  const auth = await authenticate(req);
  if (auth.aal !== "aal2") throw new Error("MFA_REQUIRED");
  const { data, error } = await db()
    .from("admin_roles")
    .select("role")
    .eq("user_id", auth.user.id)
    .maybeSingle();
  if (error || !data) throw new Error("Admin permission required");
  return { ...auth, role: data.role };
}
export const headers = () => ({
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
  "Access-Control-Allow-Origin": env("APP_ORIGIN") || "*",
  "Access-Control-Allow-Headers":
    "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  Vary: "Origin",
});
export const reply = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: headers() });
export async function minimum(asset: string) {
  const sdk = provider(),
    outcome = env("NOWPAYMENTS_OUTCOME_CURRENCY");
  if (!outcome) throw new Error("Settlement currency is not configured");
  const raw = (await sdk.raw.getMinimumPaymentAmount({
    currency_from: asset,
    currency_to: outcome,
    fiat_equivalent: "usd",
    is_fixed_rate: false,
    is_fee_paid_by_user: false,
  })) as Record<string, unknown>;
  const amount = positive(raw.min_amount, "Deposit minimum");
  const fiat =
    Number(raw.fiat_equivalent) > 0
      ? Number(raw.fiat_equivalent)
      : (
          await sdk.estimatePrice({
            amount,
            fromCurrency: asset,
            toCurrency: "usd",
          })
        ).estimated_amount;
  return { amount, usd: positive(fiat, "Deposit USD estimate") };
}
export async function assets() {
  const { data, error } = await db()
    .from("crypto_assets")
    .select("*")
    .order("symbol");
  if (error) throw new Error("Wallet migration is required");
  const live = await provider().getAvailableCurrencies();
  const merchant = await provider().getMerchantCurrencies();
  const allowed = new Set(merchant.map((c: { code: string }) => c.code));
  const available = new Map(live.map((c) => [c.code, c]));
  return (data || [])
    .filter((a) => available.has(a.code) && allowed.has(a.code))
    .map((a) => ({
      ...a,
      memo_required:
        a.memo_required || available.get(a.code)?.requiresExtraId === true,
    }));
}
export async function creditPayment(id: string) {
  const sdk = provider(),
    payment = await sdk.getPaymentStatus(providerId(id));
  if (payment.payment_status !== "finished")
    return { status: payment.payment_status, credited: false };
  const receipt = await db()
    .from("deposit_receipts")
    .select("payment_id")
    .eq("payment_id", id)
    .maybeSingle();
  if (receipt.error) throw new Error("Receipt lookup failed");
  if (receipt.data)
    return { status: "finished", credited: true, replayed: true };
  const original = providerId(payment.parent_payment_id || payment.payment_id);
  const route = await db()
    .from("deposit_addresses")
    .select("*")
    .eq("provider_payment_id", original)
    .eq("status", "ready")
    .maybeSingle();
  if (route.error || !route.data) throw new Error("Unknown deposit payment");
  const raw = payment as unknown as Record<string, unknown>;
  if (!matchesRoute(raw, route.data))
    throw new Error("Deposit currency, address or memo mismatch");
  if (payment.outcome_currency !== env("NOWPAYMENTS_OUTCOME_CURRENCY"))
    throw new Error("Unexpected deposit settlement currency");
  const outcome = positive(payment.outcome_amount, "Settled deposit");
  const amount = await sdk.estimatePrice({
    amount: outcome,
    fromCurrency: payment.outcome_currency,
    toCurrency: "usd",
  });
  await rpc("credit_crypto_deposit", {
    p_payment: id,
    p_address: route.data.id,
    p_asset: route.data.asset,
    p_crypto: outcome,
    p_outcome: payment.outcome_currency,
    p_minor: minorFloor(amount.estimated_amount),
  });
  return { status: "finished", credited: true };
}
export async function reconcilePayout(id: string) {
  const sdk = provider();
  const { data: r, error } = await db()
    .from("withdrawals")
    .select("*")
    .eq("provider_id", id)
    .maybeSingle();
  if (error || !r) throw new Error("Unknown payout");
  const p = await sdk.getPayoutStatus(id);
  if (
    p.id !== r.provider_id ||
    p.currency !== r.asset ||
    p.address !== r.address ||
    String(p.extra_id ?? "") !== String(r.memo ?? "") ||
    Math.abs(Number(p.amount) - Number(r.crypto_amount)) > 1e-10
  )
    throw new Error("Payout details mismatch");
  const terminal = terminalPayout(p.payout_status || p.rawStatus);
  if (terminal) {
    if (terminal === "cancelled") {
      // A provider-confirmed cancellation is a failed external payout, not a local pre-submit cancel.
      await rpc("complete_crypto_withdrawal", {
        p_id: r.id,
        p_status: "rejected",
        p_hash: p.hash || null,
      });
    } else
      await rpc("complete_crypto_withdrawal", {
        p_id: r.id,
        p_status: terminal,
        p_hash: p.hash || null,
      });
  }
  return { status: p.status };
}
export async function payoutAllowed(userId: string, asset: string) {
  const [s, p, a] = await Promise.all([
    db().from("payment_settings").select("withdrawals_enabled").single(),
    db()
      .from("player_profiles")
      .select("account_status,kyc_status,date_of_birth")
      .eq("id", userId)
      .single(),
    db()
      .from("crypto_assets")
      .select("withdrawals_enabled")
      .eq("code", asset)
      .single(),
  ]);
  return (
    !s.error &&
    !p.error &&
    !a.error &&
    s.data.withdrawals_enabled &&
    p.data.account_status === "active" &&
    p.data.kyc_status === "verified" &&
    !!p.data.date_of_birth &&
    new Date(p.data.date_of_birth).getTime() <=
      new Date(
        new Date().getUTCFullYear() - 18,
        new Date().getUTCMonth(),
        new Date().getUTCDate(),
      ).getTime() &&
    a.data.withdrawals_enabled
  );
}
export async function processOneWithdrawal() {
  if (
    !env("NOWPAYMENTS_EMAIL") ||
    !env("NOWPAYMENTS_PASSWORD") ||
    !env("NOWPAYMENTS_2FA_SECRET")
  )
    return {
      processed: false,
      reason: "Payout credentials and 2FA secret required",
    };
  const r = await rpc("claim_crypto_withdrawal");
  if (!r) return { processed: false };
  const sdk = provider();
  // Finish all deterministic preflight before the money-moving POST. Never retry an uncertain POST.
  try {
    const fee = await sdk.getPayoutFeeEstimate({
      currency: r.asset,
      amount: Number(r.crypto_amount),
    });
    if (
      !Number.isFinite(Number(fee.fee)) ||
      Number(fee.fee) < 0 ||
      Number(fee.fee) > Number(r.fee_crypto) + 1e-12
    )
      throw new Error("Fee changed; new quote required");
    await sdk.preflightPayout({
      address: r.address,
      currency: r.asset,
      amount: Number(r.crypto_amount),
      extraId: r.memo || undefined,
    });
  } catch {
    await db()
      .from("withdrawals")
      .update({
        status: "review_required",
        reason:
          "Preflight did not pass; check fee, minimum and custody balance",
        updated_at: new Date().toISOString(),
      })
      .eq("id", r.id)
      .eq("status", "submitting");
    return { processed: false, review: true };
  }
  if (!(await payoutAllowed(r.user_id, r.asset))) {
    await db()
      .from("withdrawals")
      .update({
        status: "review_required",
        reason: "Payments or account eligibility changed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", r.id)
      .eq("status", "submitting");
    return { processed: false, review: true };
  }
  try {
    const batch = await sdk.createPayout({
      address: r.address,
      currency: r.asset,
      amount: Number(r.crypto_amount),
      extraId: r.memo || undefined,
      uniqueExternalId: r.id,
      ipnCallbackUrl: ipnUrl(),
      skipPreflight: true,
      autoVerify: false,
    });
    const payout = batch.withdrawals[0];
    if (!payout?.id) throw new Error("Payout ID missing");
    const save = await db()
      .from("withdrawals")
      .update({
        provider_id: payout.id,
        provider_batch_id: batch.id,
        status: "verification_required",
        updated_at: new Date().toISOString(),
      })
      .eq("id", r.id)
      .eq("status", "submitting");
    if (save.error) throw new Error("Payout save failed");
    try {
      if (!(await payoutAllowed(r.user_id, r.asset)))
        return { processed: true, verificationRequired: true };
      const code = generateTotpCode(env("NOWPAYMENTS_2FA_SECRET"));
      await sdk.verifyPayout(batch.id, code);
      await db()
        .from("withdrawals")
        .update({ status: "submitted", updated_at: new Date().toISOString() })
        .eq("id", r.id)
        .eq("status", "verification_required");
    } catch {
      return { processed: true, verificationRequired: true };
    }
    return { processed: true };
  } catch {
    await db()
      .from("withdrawals")
      .update({
        status: "submission_unknown",
        reason:
          "Provider submission outcome is uncertain. Reconcile by external ID; do not resend.",
        updated_at: new Date().toISOString(),
      })
      .eq("id", r.id)
      .eq("status", "submitting");
    return { processed: false, uncertain: true };
  }
}
export async function workerAuthorized(req: Request) {
  const key = await rpc("payment_worker_secret");
  return equalSecret(req.headers.get("x-worker-key") || "", String(key || ""));
}
export { payoutAmount };
