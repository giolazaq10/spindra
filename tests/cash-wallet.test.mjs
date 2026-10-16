import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
const uid = "11111111-1111-4111-8111-111111111111",
  other = "22222222-2222-4222-8222-222222222222";
test("Cash rounds atomically reserve/settle, enforce eligibility, isolate private state and reject conflicting commands", async () => {
  const db = new PGlite();
  try {
    await db.exec(
      `create role anon;create role authenticated;create role service_role;create schema auth;create table auth.users(id uuid primary key,raw_user_meta_data jsonb default '{}',email_confirmed_at timestamptz);create function auth.uid() returns uuid language sql as 'select nullif(current_setting(''request.jwt.claim.sub'',true),'''')::uuid';grant usage on schema public,auth to anon,authenticated,service_role;`,
    );
    for (const f of [
      "20261012225942_create_casino_schema.sql",
      "20261013000100_platform_foundation.sql",
      "20261013000200_crypto_wallet.sql",
      "20261013000400_payment_eligibility.sql",
      "20261016085611_authoritative_cash_rounds.sql",
    ])
      await db.exec(
        await readFile(
          new URL("../supabase/migrations/" + f, import.meta.url),
          "utf8",
        ),
      );
    const meta = JSON.stringify({
      date_of_birth: "1990-01-01",
      country: "GE",
      display_name: "Tester",
      terms_version: "prelaunch-v1",
    });
    await db.query(
      "insert into auth.users(id,raw_user_meta_data,email_confirmed_at) values($1,$2,now()),($3,$2,now())",
      [uid, meta, other],
    );
    await db.query("update wallets set balance_minor=10000 where user_id=$1", [
      uid,
    ]);
    await db.query("insert into admin_roles(user_id,role) values($1,'owner')", [
      uid,
    ]);
    const configure = (actor, data) =>
      db.query("select configure_cash_games($1,$2)", [actor, data]);
    const setup = {
      enabled: true,
      operator_name: "Test",
      license_authority: "Test",
      license_reference: "Test",
      allowed_countries: ["GE"],
      policy_reviewed: true,
      reason: "Testing owner configuration",
    };
    await assert.rejects(configure(other, setup), /Owner/);
    await assert.rejects(
      configure(uid, { ...setup, allowed_countries: ["US"] }),
      /excluded/,
    );
    await assert.rejects(
      configure(uid, { ...setup, allowed_countries: [] }),
      /approved countries/,
    );
    await assert.rejects(
      configure(uid, { ...setup, policy_reviewed: false }),
      /policy review/,
    );
    const bal = async () =>
      Number(
        (
          await db.query("select balance_minor from wallets where user_id=$1", [
            uid,
          ])
        ).rows[0].balance_minor,
      );
    const commit = async ({
      user = uid,
      key = crypto.randomUUID(),
      id = key,
      rev = -1,
      stake = 100,
      returned = 0,
      done = true,
      request = { action: "start" },
      game = "solar-vault",
      geo = "GE",
    } = {}) => {
      const state = {
        model: "spindra-cash-v1",
        game,
        phase: done ? "settled" : "open",
        data: { shoe: ["private"] },
      };
      return (
        await db.query(
          "select commit_cash_game($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) r",
          [
            user,
            key,
            id,
            rev,
            game,
            request,
            state,
            { game, phase: state.phase },
            stake,
            returned,
            done,
            geo,
          ],
        )
      ).rows[0].r;
    };
    await assert.rejects(commit(), /not enabled/);
    assert.equal(await bal(), 10000);
    await db.exec(
      "update cash_game_config set enabled=true;update platform_settings set real_money_enabled=true,operator_name='Test operator',license_authority='Test licence',license_reference='Test reference',allowed_countries=array['GE'];",
    );
    await assert.rejects(commit(), /Verified adult/);
    await db.exec("update player_profiles set kyc_status='verified';");
    await assert.rejects(commit({ geo: "US" }), /location/);
    const key = crypto.randomUUID();
    const first = await commit({ key, returned: 250 });
    assert.equal(await bal(), 10150);
    assert.equal((await commit({ key, returned: 999 })).replayed, true);
    assert.equal(await bal(), 10150);
    await assert.rejects(
      commit({ key, request: { action: "different" } }),
      /replay conflict/,
    );
    const openKey = crypto.randomUUID();
    const open = await commit({
      key: openKey,
      game: "noir-blackjack",
      done: false,
      stake: 300,
    });
    assert.equal(await bal(), 9850);
    await assert.rejects(
      commit({ game: "solar-vault" }),
      /existing cash round/,
    );
    await assert.rejects(
      commit({ user: other, id: open.id, rev: 0, game: "noir-blackjack" }),
      /ownership/,
    );
    await assert.rejects(
      commit({ id: open.id, rev: 1, game: "noir-blackjack" }),
      /Round changed/,
    );
    assert.equal(await bal(), 9850);
    const actionKey = crypto.randomUUID();
    await commit({
      key: actionKey,
      id: open.id,
      rev: 0,
      game: "noir-blackjack",
      stake: 400,
      done: false,
      request: { action: "double" },
    });
    assert.equal(await bal(), 9750);
    await assert.rejects(
      commit({ id: open.id, rev: 0, game: "noir-blackjack", stake: 500 }),
      /Round changed/,
    );
    await db.exec(
      "update player_profiles set excluded_until=now()+interval '1 day';update cash_game_config set enabled=false;",
    );
    await assert.rejects(
      commit({
        id: open.id,
        rev: 1,
        game: "noir-blackjack",
        stake: 500,
        done: false,
      }),
      /not enabled/,
    );
    const endKey = crypto.randomUUID();
    await commit({
      key: endKey,
      id: open.id,
      rev: 1,
      game: "noir-blackjack",
      stake: 400,
      returned: 800,
    });
    assert.equal(await bal(), 10550);
    await commit({
      key: endKey,
      id: open.id,
      rev: 1,
      game: "noir-blackjack",
      stake: 400,
      returned: 800,
    });
    assert.equal(await bal(), 10550);
    assert.equal(
      (
        await db.query(
          "select count(*)::int n from cash_events where reference=$1",
          ["game-return:" + open.id],
        )
      ).rows[0].n,
      1,
    );
    await db.exec(
      "update player_profiles set excluded_until=null;update cash_game_config set enabled=true;update player_profiles set daily_loss_limit_minor=100;",
    );
    // Prior profit offsets subsequent losses under the same UTC-day budget.
    for (let i = 0; i < 6; i++) await commit({ stake: 100, returned: 0 });
    await assert.rejects(commit({ stake: 100 }), /Daily loss/);
    await db.exec(
      "update player_profiles set daily_loss_limit_minor=10000;update platform_settings set allowed_countries=array['US'];update player_profiles set country='US';",
    );
    await assert.rejects(commit(), /country/);
    await db.exec(
      `set role authenticated;select set_config('request.jwt.claim.sub','${uid}',false);`,
    );
    await assert.rejects(
      db.exec("select * from cash_game_rounds"),
      /permission denied/,
    );
    await assert.rejects(
      db.exec("select * from cash_game_commands"),
      /permission denied/,
    );
    await assert.rejects(
      db.query("select cash_game_eligibility($1)", [uid]),
      /permission denied/,
    );
    assert.ok(
      (await db.exec("select * from cash_events"))[0].rows.every(
        (r) => r.user_id === uid,
      ),
    );
  } finally {
    await db.close();
  }
});
