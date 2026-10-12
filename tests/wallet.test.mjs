import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
test("Supabase migration: provisioning, RLS, eligibility, wallet atomicity and idempotency", async (t) => {
  const db = new PGlite();
  const uid = "11111111-1111-4111-8111-111111111111",
    uid2 = "22222222-2222-4222-8222-222222222222";
  const sid = "33333333-3333-4333-8333-333333333333";
  try {
    await db.exec(`create role anon; create role authenticated; create role service_role; create schema auth;
      create table auth.users(id uuid primary key,raw_user_meta_data jsonb default '{}',email_confirmed_at timestamptz);
      create function auth.uid() returns uuid language sql as 'select nullif(current_setting(''request.jwt.claim.sub'',true),'''')::uuid';
      grant usage on schema public,auth to anon,authenticated,service_role;
      grant execute on function auth.uid() to authenticated;`);
    await db.exec(
      await readFile(
        new URL(
          "../supabase/migrations/20261012225942_create_casino_schema.sql",
          import.meta.url,
        ),
        "utf8",
      ),
    );
    await db.exec(
      await readFile(
        new URL(
          "../supabase/migrations/20261013000100_platform_foundation.sql",
          import.meta.url,
        ),
        "utf8",
      ),
    );
    const meta = JSON.stringify({
      date_of_birth: "1990-01-01",
      display_name: "Tester",
      country: "Georgia",
      terms_version: "prelaunch-v1",
    });
    await db.query(
      "insert into auth.users(id,raw_user_meta_data,email_confirmed_at) values($1,$2,now()),($3,$2,now())",
      [uid, meta, uid2],
    );
    const balance = async () =>
      Number(
        (
          await db.query(
            "select balance_minor from public.wallets where user_id=$1",
            [uid],
          )
        ).rows[0].balance_minor,
      );
    const event = async (id, round, kind, amount) =>
      (
        await db.query(
          "select public.provider_wallet_event($1,$2,$3,$4,$5,$6,$7) as result",
          ["test", id, sid, round, kind, amount, "USD"],
        )
      ).rows[0].result;
    await t.test(
      "new users get zero cash and immutable pending KYC",
      async () => {
        assert.equal(await balance(), 0);
        assert.equal(
          (
            await db.query(
              "select kyc_status from public.player_profiles where id=$1",
              [uid],
            )
          ).rows[0].kyc_status,
          "pending",
        );
        await assert.rejects(
          db.query(
            "insert into auth.users(id,raw_user_meta_data) values(gen_random_uuid(),$1)",
            [
              JSON.stringify({
                ...JSON.parse(meta),
                date_of_birth: "2020-01-01",
              }),
            ],
          ),
          /Adult/,
        );
      },
    );
    await db.query(
      "insert into public.provider_integrations(slug,display_name,enabled) values('test','Test provider',true)",
    );
    await db.query(
      "insert into public.provider_sessions(id,user_id,provider_slug,game_id,currency,expires_at) values($1,$2,'test','test-game','USD',now()+interval '1 hour')",
      [sid, uid],
    );
    await db.query(
      "update public.wallets set balance_minor=10000 where user_id=$1",
      [uid],
    );
    await t.test("cash is disabled by default", async () => {
      await assert.rejects(
        event("e1", "r1", "debit", 100),
        /Cash operation disabled/,
      );
      assert.equal(await balance(), 10000);
    });
    await db.exec(
      "update public.platform_settings set real_money_enabled=true,operator_name='Test only',license_authority='Test',license_reference='Test',allowed_countries=array['Georgia'];",
    );
    await t.test("pending KYC cannot wager", async () => {
      await assert.rejects(event("e1", "r1", "debit", 100), /not eligible/);
    });
    await db.query(
      "update public.player_profiles set kyc_status='verified' where id=$1",
      [uid],
    );
    await t.test("debit and exact replay modify funds once", async () => {
      assert.equal((await event("e1", "r1", "debit", 100)).balance_minor, 9900);
      assert.equal((await event("e1", "r1", "debit", 100)).replayed, true);
      assert.equal(await balance(), 9900);
      await assert.rejects(
        event("e1", "r1", "debit", 200),
        /Idempotency payload conflict/,
      );
      await assert.rejects(
        event("other", "r1", "debit", 100),
        /duplicate round debit/,
      );
    });
    await t.test(
      "credit requires a bet; payout and replay are exactly-once",
      async () => {
        await assert.rejects(
          event("bad", "missing", "credit", 500),
          /Round missing/,
        );
        assert.equal(
          (await event("e2", "r1", "credit", 250)).balance_minor,
          10150,
        );
        assert.equal((await event("e2", "r1", "credit", 250)).replayed, true);
        await assert.rejects(
          event("another", "r1", "credit", 250),
          /finalized/,
        );
        assert.equal(await balance(), 10150);
      },
    );
    await t.test(
      "failed debit leaves no round or event and cannot overdraw",
      async () => {
        await db.query(
          "update public.player_profiles set daily_loss_limit_minor=100000 where id=$1",
          [uid],
        );
        await assert.rejects(
          event("insufficient", "insufficient", "debit", 20000),
          /Insufficient funds/,
        );
        assert.equal(
          Number(
            (
              await db.query(
                "select count(*) n from public.provider_rounds where round_id='insufficient'",
              )
            ).rows[0].n,
          ),
          0,
        );
        assert.equal(await balance(), 10150);
      },
    );
    await t.test(
      "daily loss limit prevents new stakes, including outstanding bets",
      async () => {
        await db.query(
          "update public.player_profiles set daily_loss_limit_minor=100 where id=$1",
          [uid],
        );
        await event("loss1", "loss1", "debit", 100);
        // The prior winning round offsets 100 of new exposure; next stake exceeds cap.
        await assert.rejects(
          event("loss2", "loss2", "debit", 151),
          /Daily loss limit/,
        );
        await event("loss-win", "loss1", "credit", 0);
      },
    );
    await t.test(
      "refund equals the original stake and cannot be repeated with a new event",
      async () => {
        await db.query(
          "update public.player_profiles set daily_loss_limit_minor=100000 where id=$1",
          [uid],
        );
        await event("refund1", "refund1", "debit", 300);
        await assert.rejects(
          event("refundbad", "refund1", "refund", 301),
          /equal original stake/,
        );
        await event("refund2", "refund1", "refund", 300);
        await assert.rejects(
          event("refund3", "refund1", "refund", 300),
          /finalized/,
        );
      },
    );
    await t.test(
      "late returns from an earlier wager day cannot expand today’s limit",
      async () => {
        await db.query(
          "update public.provider_rounds set created_at=now()-interval '1 day' where round_id='r1'",
        );
        await db.query(
          "update public.player_profiles set daily_loss_limit_minor=100 where id=$1",
          [uid],
        );
        await assert.rejects(
          event("late-win-budget", "late-win-budget", "debit", 1),
          /Daily loss limit/,
        );
        await db.query(
          "update public.player_profiles set daily_loss_limit_minor=100000 where id=$1",
          [uid],
        );
      },
    );
    await t.test(
      "RLS isolates accounts and blocks browser balance, KYC and catalog writes",
      async () => {
        await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
          uid,
        ]);
        await db.exec("set role authenticated");
        assert.equal(
          (await db.query("select * from public.wallets")).rows.length,
          1,
        );
        await assert.rejects(
          db.exec("update public.wallets set balance_minor=999999"),
          /permission denied/,
        );
        await assert.rejects(
          db.exec("update public.player_profiles set kyc_status='verified'"),
          /permission denied/,
        );
        await assert.rejects(
          db.exec("delete from public.games"),
          /permission denied/,
        );
        await assert.rejects(
          event("browser", "browser", "credit", 100),
          /permission denied/,
        );
        await db.exec("reset role");
      },
    );
    await t.test(
      "self exclusion blocks new bets but allows outstanding bets to settle",
      async () => {
        await event("open", "open", "debit", 100);
        await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
          uid,
        ]);
        await db.exec(
          "set role authenticated; select public.self_exclude(); reset role;",
        );
        await assert.rejects(
          event("after-exclusion", "after-exclusion", "debit", 100),
          /not eligible/,
        );
        await event("settle-after-exclusion", "open", "credit", 200);
        assert.equal(
          (
            await db.query(
              "select status from public.provider_sessions where id=$1",
              [sid],
            )
          ).rows[0].status,
          "closed",
        );
      },
    );
    await t.test(
      "loss limit cannot be raised or reset by the player",
      async () => {
        await db.exec("set role authenticated");
        await db.query("select public.lower_loss_limit(500)");
        await assert.rejects(
          db.query("select public.lower_loss_limit(501)"),
          /lower positive/,
        );
        await db.exec("reset role");
      },
    );
    await t.test(
      "ledger reconciles to wallet after initial test seed",
      async () => {
        const delta = Number(
          (
            await db.query(
              "select sum(delta_minor) n from public.wallet_events where user_id=$1",
              [uid],
            )
          ).rows[0].n,
        );
        assert.equal(await balance(), 10000 + delta);
      },
    );
  } finally {
    await db.close();
  }
});
