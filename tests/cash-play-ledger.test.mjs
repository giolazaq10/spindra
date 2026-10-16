import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { originals } from "../src/lib/catalog.ts";
import {
  newCashRound,
  nextCashRound,
  publicCash,
} from "../src/lib/cashEngine.ts";
test("All 28 real-balance games reserve and settle their actual engine results through the SQL ledger exactly once", async () => {
  const db = new PGlite(),
    uid = "11111111-1111-4111-8111-111111111111";
  try {
    await db.exec(
      `create role anon;create role authenticated;create role service_role;create schema auth;create table auth.users(id uuid primary key,raw_user_meta_data jsonb default '{}',email_confirmed_at timestamptz);create function auth.uid() returns uuid language sql as 'select nullif(current_setting(''request.jwt.claim.sub'',true),'''')::uuid';grant usage on schema public,auth to anon,authenticated,service_role;`,
    );
    for (const f of [
      "20261012225942_create_casino_schema.sql",
      "20261013000100_platform_foundation.sql",
      "20261013000200_crypto_wallet.sql",
      "20261016085611_authoritative_cash_rounds.sql",
    ])
      await db.exec(
        await readFile(
          new URL("../supabase/migrations/" + f, import.meta.url),
          "utf8",
        ),
      );
    await db.query(
      "insert into auth.users(id,raw_user_meta_data,email_confirmed_at) values($1,$2,now())",
      [
        uid,
        {
          date_of_birth: "1990-01-01",
          country: "GE",
          display_name: "Fixture",
          terms_version: "prelaunch-v1",
        },
      ],
    );
    await db.exec(
      `update player_profiles set kyc_status='verified',account_status='active',daily_loss_limit_minor=10000000;update wallets set balance_minor=10000000;update platform_settings set real_money_enabled=true,operator_name='Fixture',license_authority='Fixture',license_reference='Fixture',allowed_countries=array['GE'];update cash_game_config set enabled=true;`,
    );
    let balance = 10000000,
      seed = 711;
    const rng = (n) => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed % n;
    };
    for (const g of originals) {
      let state = newCashRound(
        g.slug,
        {
          bet: 20,
          bets: [
            { main: 20, three: 20, pair: 20 },
            ...Array.from({ length: 4 }, () => ({
              main: 0,
              three: 0,
              pair: 0,
            })),
          ],
          kind: "red",
        },
        rng,
      );
      const id = crypto.randomUUID();
      let revision = -1;
      const commit = async (s, key, request) => {
        const args = [
          uid,
          key,
          id,
          revision,
          g.slug,
          request,
          s,
          publicCash(s),
          s.stake_minor,
          s.returned_minor,
          s.phase === "settled",
          "GE",
        ];
        const first = (
          await db.query(
            "select commit_cash_game($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) r",
            args,
          )
        ).rows[0].r;
        const replay = (
          await db.query(
            "select commit_cash_game($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) r",
            args,
          )
        ).rows[0].r;
        assert.equal(replay.balance_minor, first.balance_minor, g.name);
        assert.equal(replay.replayed, true, g.name);
        revision = first.revision;
        return first;
      };
      const opened = await commit(state, id, { action: "start", game: g.slug });
      balance -= state.stake_minor;
      if (state.phase === "settled") balance += state.returned_minor;
      assert.equal(
        opened.balance_minor,
        balance,
        g.name + " initial reserve/return",
      );
      if (state.phase === "open") {
        state = nextCashRound(state, { action: "abandon" }, rng);
        const closed = await commit(state, crypto.randomUUID(), {
          action: "abandon",
        });
        balance += state.returned_minor;
        assert.equal(
          closed.balance_minor,
          balance,
          g.name + " terminal return",
        );
      }
      const events = (
        await db.query(
          "select count(*)::int n from cash_events where user_id=$1",
          [uid],
        )
      ).rows[0].n;
      assert.ok(events > 0);
      const sum = (
        await db.query(
          "select sum(delta_minor)::bigint total from cash_events where user_id=$1",
          [uid],
        )
      ).rows[0].total;
      assert.equal(
        10000000 + Number(sum),
        balance,
        g.name + " ledger reconciles",
      );
    }
    assert.equal(
      (await db.query("select count(*)::int n from cash_game_rounds")).rows[0]
        .n,
      28,
    );
    assert.equal(
      (
        await db.query(
          "select count(*)::int n from cash_game_rounds where state='open'",
        )
      ).rows[0].n,
      0,
    );
  } finally {
    await db.close();
  }
});
