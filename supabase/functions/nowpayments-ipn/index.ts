import {
  env,
  reply,
  creditPayment,
  reconcilePayout,
} from "../_shared/payments.ts";
import { validIpn, providerId } from "../_shared/payment-rules.ts";
Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return reply({ error: "POST required" }, 405);
  try {
    const text = await req.text();
    if (text.length > 65536) return reply({ error: "Payload too large" }, 413);
    const body = JSON.parse(text);
    if (
      !(await validIpn(
        body,
        req.headers.get("x-nowpayments-sig"),
        env("NOWPAYMENTS_IPN_SECRET"),
      ))
    )
      return reply({ error: "Invalid signature" }, 401);
    if (body.payment_id !== undefined)
      return reply(await creditPayment(providerId(body.payment_id)));
    if (body.id !== undefined && body.batch_withdrawal_id !== undefined)
      return reply(await reconcilePayout(providerId(body.id)));
    return reply({ ignored: true });
  } catch {
    return reply(
      { error: "Notification could not be reconciled; retry required" },
      503,
    );
  }
});
