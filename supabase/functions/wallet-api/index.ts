import {
  db,
  env,
  provider,
  authenticate,
  admin,
  headers,
  reply,
  rpc,
  assets,
  minimum,
  ipnUrl,
  reconcilePayout,
} from "../_shared/payments.ts";
import {
  cents,
  positive,
  payoutAmount,
  providerId,
} from "../_shared/payment-rules.ts";
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS")
    return new Response(null, { status: 204, headers: headers() });
  if (req.method !== "POST") return reply({ error: "POST required" }, 405);
  try {
    const { user, aal } = await authenticate(req);
    const body = await req.json(),
      action = String(body.action || "");
    if (action.startsWith("admin_")) {
      const a = await admin(req);
      if (action === "admin_snapshot") {
        const result = await Promise.all([
          db()
            .from("player_profiles")
            .select("*,wallets(*)")
            .order("created_at", { ascending: false })
            .limit(100),
          db()
            .from("deposit_addresses")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(100),
          db()
            .from("deposit_receipts")
            .select("*")
            .order("credited_at", { ascending: false })
            .limit(100),
          db()
            .from("withdrawals")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(100),
          db()
            .from("cash_events")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(150),
          db()
            .from("admin_audit")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(100),
          db().from("payment_settings").select("*").single(),
          db().from("crypto_assets").select("*"),
          db().from("provider_integrations").select("*"),
          db().from("admin_roles").select("*"),
        ]);
        if (result.some((r) => r.error))
          throw new Error("Admin data unavailable");
        return reply({
          role: a.role,
          players: result[0].data,
          addresses: result[1].data,
          deposits: result[2].data,
          withdrawals: result[3].data,
          ledger: result[4].data,
          audit: result[5].data,
          settings: result[6].data,
          assets: result[7].data,
          integrations: result[8].data,
          roles: result[9].data,
          configuration: {
            api_key: !!env("NOWPAYMENTS_API_KEY"),
            ipn_secret: !!env("NOWPAYMENTS_IPN_SECRET"),
            custody_confirmed: env("NOWPAYMENTS_CUSTODY_CONFIRMED") === "true",
            reusable_addresses:
              env("NOWPAYMENTS_REUSABLE_ADDRESSES_CONFIRMED") === "true",
            outcome_currency: env("NOWPAYMENTS_OUTCOME_CURRENCY"),
            payout_credentials:
              !!env("NOWPAYMENTS_EMAIL") && !!env("NOWPAYMENTS_PASSWORD"),
            payout_2fa: !!env("NOWPAYMENTS_2FA_SECRET"),
          },
        });
      }
      if (a.role === "support") throw new Error("Admin permission required");
      if (action === "admin_reconcile_payout") {
        const { data: r } = await db()
          .from("withdrawals")
          .select("*")
          .eq("id", body.target)
          .single();
        if (!r) throw new Error("Withdrawal missing");
        if (r.provider_id) return reply(await reconcilePayout(r.provider_id));
        const payout = await provider().getPayoutStatus(
          providerId(body.provider_id),
        );
        if (
          payout.unique_external_id !== r.id ||
          payout.currency !== r.asset ||
          payout.address !== r.address ||
          String(payout.extra_id ?? "") !== String(r.memo ?? "") ||
          Number(payout.amount) !== Number(r.crypto_amount)
        )
          throw new Error("Payout correlation mismatch");
        const update = await db()
          .from("withdrawals")
          .update({
            provider_id: payout.id,
            provider_batch_id: payout.batchId,
            status: "submitted",
            updated_at: new Date().toISOString(),
          })
          .eq("id", r.id)
          .in("status", ["submitting", "submission_unknown"]);
        if (update.error) throw new Error("Reconciliation failed");
        await db()
          .from("admin_audit")
          .insert({
            actor_id: user.id,
            action,
            target: r.id,
            details: { provider_id: payout.id },
          });
        return reply(await reconcilePayout(providerId(payout.id)));
      }
      if (action === "admin_reconcile_address") {
        const { data: r } = await db()
          .from("deposit_addresses")
          .select("*")
          .eq("id", body.target)
          .single();
        if (!r || r.status === "ready")
          throw new Error("Address not awaiting reconciliation");
        const p = await provider().getPaymentStatus(
          providerId(body.provider_id),
        );
        if (
          p.order_id !== r.order_id ||
          p.pay_currency !== r.asset ||
          !p.pay_address ||
          /^https?:/i.test(p.pay_address)
        )
          throw new Error("Deposit correlation mismatch");
        const update = await db()
          .from("deposit_addresses")
          .update({
            address: p.pay_address,
            memo: p.payin_extra_id || null,
            provider_payment_id: providerId(p.payment_id),
            status: "ready",
            updated_at: new Date().toISOString(),
          })
          .eq("id", r.id)
          .neq("status", "ready");
        if (update.error) throw new Error("Reconciliation failed");
        await db()
          .from("admin_audit")
          .insert({
            actor_id: user.id,
            action,
            target: r.id,
            details: { provider_id: p.payment_id },
          });
        return reply({ ok: true });
      }
      if (action === "admin_action") {
        if (
          body.operation === "settings" &&
          (body.data?.deposits_enabled || body.data?.withdrawals_enabled)
        ) {
          if (
            !env("NOWPAYMENTS_API_KEY") ||
            !env("NOWPAYMENTS_IPN_SECRET") ||
            !env("NOWPAYMENTS_OUTCOME_CURRENCY") ||
            env("NOWPAYMENTS_CUSTODY_CONFIRMED") !== "true" ||
            env("NOWPAYMENTS_REUSABLE_ADDRESSES_CONFIRMED") !== "true"
          )
            throw new Error(
              "Payment setup must be completed before enabling deposits or withdrawals",
            );
          if (
            body.data.withdrawals_enabled &&
            (!env("NOWPAYMENTS_EMAIL") ||
              !env("NOWPAYMENTS_PASSWORD") ||
              !env("NOWPAYMENTS_2FA_SECRET"))
          )
            throw new Error("Payout credentials and 2FA secret required");
        }
        return reply(
          await rpc("admin_payment_action", {
            p_actor: user.id,
            p_action: body.operation,
            p_target: body.target || "platform",
            p_data: body.data || {},
          }),
        );
      }
      throw new Error("Unsupported admin action");
    }
    if (action === "assets") return reply({ assets: await assets() });
    if (action === "history") {
      const { data, error } = await db()
        .from("cash_events")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      const ws = await db()
        .from("withdrawals")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error || ws.error) throw new Error("History unavailable");
      return reply({ transactions: data, withdrawals: ws.data });
    }
    if (action === "deposit_address") {
      if (!user.email_confirmed_at) throw new Error("Confirm your email first");
      if (
        env("NOWPAYMENTS_REUSABLE_ADDRESSES_CONFIRMED") !== "true" ||
        env("NOWPAYMENTS_CUSTODY_CONFIRMED") !== "true" ||
        !env("NOWPAYMENTS_IPN_SECRET")
      )
        throw new Error("Permanent deposit service is not configured");
      const list = await assets(),
        asset = list.find((a) => a.code === body.coin && a.deposits_enabled);
      if (!asset) throw new Error("Asset unavailable");
      const min = await minimum(asset.code);
      const claim = await rpc("claim_deposit_address", {
          p_user: user.id,
          p_asset: asset.code,
        }),
        r = claim.address;
      if (!claim.fresh) {
        if (r.status !== "ready")
          return reply(
            {
              error:
                "Address creation is pending reconciliation. Your existing address will not be replaced.",
            },
            409,
          );
        return reply({
          address: r.address,
          memo: r.memo,
          coin: r.asset,
          network: asset.network,
          minimum: min.amount,
          minimum_usd: min.usd,
          reusable: true,
        });
      }
      try {
        const payment = await provider().createDirectPayment({
          amount: min.usd,
          currency: "usd",
          payCurrency: asset.code,
          payAmount: min.amount,
          orderId: r.order_id,
          ipnCallbackUrl: ipnUrl(),
          fixedRate: false,
          feePaidByUser: false,
          skipPreflight: true,
        });
        if (!payment.pay_address || /^https?:/i.test(payment.pay_address))
          throw new Error("No deposit address");
        const saved = await db()
          .from("deposit_addresses")
          .update({
            address: payment.pay_address,
            memo: payment.payin_extra_id || null,
            provider_payment_id: providerId(payment.payment_id),
            status: "ready",
            updated_at: new Date().toISOString(),
          })
          .eq("id", r.id)
          .eq("status", "creating");
        if (saved.error) throw new Error("Deposit route could not be saved");
        return reply({
          address: payment.pay_address,
          memo: payment.payin_extra_id,
          coin: r.asset,
          network: asset.network,
          minimum: min.amount,
          minimum_usd: min.usd,
          reusable: true,
        });
      } catch {
        await db()
          .from("deposit_addresses")
          .update({
            status: "review_required",
            updated_at: new Date().toISOString(),
          })
          .eq("id", r.id)
          .eq("status", "creating");
        return reply(
          {
            error:
              "Address creation requires reconciliation. Please contact support; do not send funds until an address is shown.",
          },
          503,
        );
      }
    }
    if (action === "withdrawal_quote") {
      const list = await assets(),
        asset = list.find((a) => a.code === body.coin && a.withdrawals_enabled);
      if (!asset) throw new Error("Asset unavailable");
      const amount = cents(body.amount_usd);
      const address = String(body.address || "").trim(),
        memo = String(body.memo || "").trim();
      if (
        address.length < 10 ||
        address.length > 250 ||
        memo.length > 150 ||
        (!memo && asset.memo_required)
      )
        throw new Error("Valid address and required memo/tag needed");
      const sdk = provider();
      await sdk.validatePayoutAddress({
        address,
        currency: asset.code,
        extraId: memo || undefined,
      });
      const estimate = await sdk.estimatePrice({
        amount: amount / 100,
        fromCurrency: "usd",
        toCurrency: asset.code,
      });
      const fee = await sdk.getPayoutFeeEstimate({
        currency: asset.code,
        amount: positive(estimate.estimated_amount),
      });
      const cryptoAmount = payoutAmount(estimate.estimated_amount, fee.fee);
      const minimum = await sdk.getMinimumPayoutAmount(asset.code);
      if (cryptoAmount < positive(minimum.minAmount))
        throw new Error(
          "Amount is below the provider withdrawal minimum after network fees",
        );
      const q = await db()
        .from("withdrawal_quotes")
        .insert({
          user_id: user.id,
          asset: asset.code,
          address,
          memo: memo || null,
          amount_minor: amount,
          crypto_amount: cryptoAmount,
          fee_crypto: fee.fee,
          expires_at: new Date(Date.now() + 90000).toISOString(),
        })
        .select("*")
        .single();
      if (q.error) throw new Error("Quote unavailable");
      return reply({ quote: q.data, minimum: minimum.minAmount });
    }
    if (action === "withdrawal_request") {
      if (aal !== "aal2") throw new Error("MFA_REQUIRED");
      if (
        !/^[0-9a-f-]{36}$/i.test(String(body.request_key)) ||
        !/^[0-9a-f-]{36}$/i.test(String(body.quote_id))
      )
        throw new Error("Invalid request ID");
      const r = await rpc("request_crypto_withdrawal", {
        p_user: user.id,
        p_quote: body.quote_id,
        p_key: body.request_key,
      });
      return reply({ withdrawal: r });
    }
    throw new Error("Unknown wallet action");
  } catch (e) {
    const message = e instanceof Error ? e.message : "Wallet request failed";
    const auth = ["Sign in required", "Invalid session"];
    const mfa = message === "MFA_REQUIRED";
    return reply(
      { error: message.slice(0, 200) },
      auth.includes(message) ? 401 : mfa ? 403 : 400,
    );
  }
});
