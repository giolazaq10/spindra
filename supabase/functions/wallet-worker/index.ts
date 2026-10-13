import {
  db,
  env,
  provider,
  reply,
  workerAuthorized,
  processOneWithdrawal,
  reconcilePayout,
  payoutAllowed,
} from "../_shared/payments.ts";
import { generateTotpCode } from "npm:@nowpaymentsio/nowpayments-sdk-nodejs@0.3.0";
Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return reply({ error: "POST required" }, 405);
  try {
    if (!(await workerAuthorized(req)))
      return reply({ error: "Worker authentication required" }, 401);
    const sdk = provider();
    // Interrupted submission is uncertain, never automatically sent a second time.
    await db()
      .from("withdrawals")
      .update({
        status: "submission_unknown",
        reason: "Submission interrupted; reconcile external ID",
        updated_at: new Date().toISOString(),
      })
      .eq("status", "submitting")
      .lt("updated_at", new Date(Date.now() - 300000).toISOString());
    const pending = await db()
      .from("withdrawals")
      .select("*")
      .in("status", ["submitted", "verification_required"])
      .limit(15);
    for (const w of pending.data || []) {
      try {
        if (
          w.status === "verification_required" &&
          w.provider_batch_id &&
          env("NOWPAYMENTS_2FA_SECRET") &&
          (await payoutAllowed(w.user_id, w.asset))
        ) {
          await sdk.verifyPayout(
            w.provider_batch_id,
            generateTotpCode(env("NOWPAYMENTS_2FA_SECRET")),
          );
          await db()
            .from("withdrawals")
            .update({
              status: "submitted",
              updated_at: new Date().toISOString(),
            })
            .eq("id", w.id)
            .eq("status", "verification_required");
        }
        if (w.provider_id) await reconcilePayout(w.provider_id);
      } catch {
        /* Retain the hold and try status/verification again, never create another payout. */
      }
    }
    return reply(await processOneWithdrawal());
  } catch {
    return reply({ error: "Worker failed; queued funds remain reserved" }, 503);
  }
});
