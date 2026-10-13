import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHmac } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";
import {
  cents,
  payoutAmount,
  canonical,
  validIpn,
  providerId,
  matchesRoute,
  terminalPayout,
} from "../supabase/functions/_shared/payment-rules.ts";
test("Payment signature, amounts, network binding and terminal status checks", async () => {
  assert.equal(cents("12.03"), 1203);
  for (const v of ["-1", "0", "1.001", "1e3", 1, NaN])
    assert.throws(() => cents(v));
  assert.equal(payoutAmount(0.002, 0.0001), 0.0019);
  assert.throws(() => payoutAmount(0.001, 0.002));
  assert.throws(() => providerId(Number.MAX_SAFE_INTEGER + 1));
  const payload = { z: 1, a: { z: 3, b: 2 }, withdrawals: [{ z: 2, a: 1 }] };
  const sig = createHmac("sha512", "test-secret")
    .update(JSON.stringify(canonical(payload)))
    .digest("hex");
  assert.ok(await validIpn(payload, sig, "test-secret"));
  assert.equal(await validIpn({ ...payload, z: 2 }, sig, "test-secret"), false);
  assert.equal(await validIpn(payload, null, "test-secret"), false);
  assert.ok(
    matchesRoute(
      { pay_currency: "xrp", pay_address: "abc", payin_extra_id: "123" },
      { asset: "xrp", address: "abc", memo: "123" },
    ),
  );
  assert.equal(
    matchesRoute(
      { pay_currency: "xrp", pay_address: "abc" },
      { asset: "xrp", address: "abc", memo: "123" },
    ),
    false,
  );
  assert.equal(terminalPayout("FINISHED"), "finished");
  assert.equal(terminalPayout("PROCESSING"), null);
});
test("Crypto ledger: permanent routes, owner bootstrap, isolation, reserve/refund idempotency and uncertainty", async () => {
  const db = new PGlite();
  const uid = "11111111-1111-4111-8111-111111111111",
    other = "22222222-2222-4222-8222-222222222222";
  try {
    await db.exec(
      `create role anon;create role authenticated;create role service_role;create schema auth;create table auth.users(id uuid primary key,raw_user_meta_data jsonb default '{}',email_confirmed_at timestamptz);create function auth.uid() returns uuid language sql as 'select nullif(current_setting(''request.jwt.claim.sub'',true),'''')::uuid';grant usage on schema public,auth to anon,authenticated,service_role;`,
    );
    for (const file of [
      "20261012225942_create_casino_schema.sql",
      "20261013000100_platform_foundation.sql",
    ])
      await db.exec(
        await readFile(
          new URL("../supabase/migrations/" + file, import.meta.url),
          "utf8",
        ),
      );
    const meta = JSON.stringify({
      date_of_birth: "1990-01-01",
      display_name: "Tester",
      country: "GE",
      terms_version: "prelaunch-v1",
    });
    await db.query(
      "insert into auth.users(id,raw_user_meta_data,email_confirmed_at) values($1,$2,now())",
      [uid, meta],
    );
    await db.exec(
      await readFile(
        new URL(
          "../supabase/migrations/20261013000200_crypto_wallet.sql",
          import.meta.url,
        ),
        "utf8",
      ),
    );
    assert.equal(
      (await db.query("select role from admin_roles")).rows[0].role,
      "owner",
    );
    await db.query(
      "insert into auth.users(id,raw_user_meta_data,email_confirmed_at) values($1,$2,now())",
      [other, meta],
    );
    assert.equal(
      (await db.query("select count(*)::int n from admin_roles")).rows[0].n,
      1,
    );
    await assert.rejects(
      db.query("select claim_deposit_address($1,'btc')", [uid]),
      /paused/,
    );
    await db.exec(
      "update payment_settings set deposits_enabled=true,withdrawals_enabled=true;update player_profiles set kyc_status='verified';",
    );
    const claim = async () =>
      (await db.query("select claim_deposit_address($1,'btc') r", [uid]))
        .rows[0].r;
    const first = await claim();
    assert.equal(first.fresh, true);
    assert.equal((await claim()).fresh, false);
    assert.equal((await claim()).address.id, first.address.id);
    await db.query(
      "update deposit_addresses set status='ready',address='btc-user-address',provider_payment_id='payment-original' where id=$1",
      [first.address.id],
    );
    const credit = async (id = "p1", amount = 10000, crypto = 1) =>
      (
        await db.query(
          "select credit_crypto_deposit($1,$2,'btc',$3,'btc',$4) r",
          [id, first.address.id, crypto, amount],
        )
      ).rows[0].r;
    assert.equal((await credit()).balance_minor, 10000);
    assert.equal((await credit("p1", 99999)).replayed, true);
    await assert.rejects(credit("p1", 10000, 2), /conflict/);
    const bal = async () =>
      Number(
        (
          await db.query("select balance_minor from wallets where user_id=$1", [
            uid,
          ])
        ).rows[0].balance_minor,
      );
    const quote = async (user = uid, amount = 3000, expires = "1 minute") =>
      (
        await db.query(
          "insert into withdrawal_quotes(user_id,asset,address,amount_minor,crypto_amount,fee_crypto,expires_at) values($1,'btc','external-address',$2,.0003,.00001,now()+$3::interval) returning id",
          [user, amount, expires],
        )
      ).rows[0].id;
    const q = await quote(),
      key = crypto.randomUUID();
    const request = async (user = uid, id = q, k = key) =>
      (
        await db.query("select request_crypto_withdrawal($1,$2,$3) r", [
          user,
          id,
          k,
        ])
      ).rows[0].r;
    const w = await request();
    assert.equal(w.status, "queued");
    assert.equal(await bal(), 7000);
    assert.equal((await request()).id, w.id);
    assert.equal(await bal(), 7000);
    await assert.rejects(
      request(other, q, crypto.randomUUID()),
      /Quote expired/,
    );
    await assert.rejects(
      request(uid, await quote(uid, 8000), crypto.randomUUID()),
      /Insufficient/,
    );
    await assert.rejects(
      request(uid, await quote(uid, 100, "-1 minute"), crypto.randomUUID()),
      /expired/,
    );
    const claimed = (await db.query("select claim_crypto_withdrawal() r"))
      .rows[0].r;
    assert.equal(claimed.id, w.id);
    assert.equal(
      (await db.query("select claim_crypto_withdrawal() r")).rows[0].r,
      null,
    );
    await db.query(
      "update withdrawals set status='submission_unknown' where id=$1",
      [w.id],
    );
    await assert.rejects(
      db.query("select complete_crypto_withdrawal($1,'cancelled')", [w.id]),
      /cannot be cancelled/,
    );
    await assert.rejects(
      db.query("select complete_crypto_withdrawal($1,'rejected')", [w.id]),
      /cannot be refunded/,
    );
    assert.equal(await bal(), 7000);
    await db.query(
      "update withdrawals set status='submitted',provider_id='payout1' where id=$1",
      [w.id],
    );
    await db.query("select complete_crypto_withdrawal($1,'rejected')", [w.id]);
    await db.query("select complete_crypto_withdrawal($1,'rejected')", [w.id]);
    assert.equal(await bal(), 10000);
    assert.equal(
      (
        await db.query(
          "select count(*)::int n from cash_events where kind='withdrawal_refund'",
        )
      ).rows[0].n,
      1,
    );
    await assert.rejects(
      db.query("select complete_crypto_withdrawal($1,'finished')", [w.id]),
      /conflict/,
    );
    await assert.rejects(
      db.query(
        'select admin_payment_action($1,\'role\',$2,\'{"role":"none","reason":"testing removal"}\')',
        [uid, uid],
      ),
      /last owner/,
    );
    await assert.rejects(
      db.query("select admin_payment_action($1,'settings','platform','{}')", [
        other,
      ]),
      /permission/,
    );
    await db.exec(
      `set role authenticated;select set_config('request.jwt.claim.sub','${other}',false);`,
    );
    assert.equal((await db.query("select * from wallets")).rows.length, 1);
    assert.equal(
      (await db.query("select * from deposit_addresses")).rows.length,
      0,
    );
    await assert.rejects(
      db.query("select credit_crypto_deposit('fake',$1,'btc',1,'btc',100)", [
        first.address.id,
      ]),
      /permission denied/,
    );
    await assert.rejects(
      db.exec("select * from payment_worker_config"),
      /permission denied/,
    );
    await assert.rejects(
      db.exec("update wallets set balance_minor=999"),
      /permission denied/,
    );
  } finally {
    await db.close();
  }
});
