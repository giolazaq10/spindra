import { verifyCashCountry } from "../_shared/cash-geo.ts";
import {
  admin,
  db,
  env,
  authenticate,
  headers,
  reply,
  rpc,
  workerAuthorized,
} from "../_shared/payments.ts";
import { canonical } from "../_shared/payment-rules.ts";
import {
  newCashRound,
  nextCashRound,
  publicCash,
  CASH_MODEL,
} from "../_shared/cash-engine.js";

const geoReady = () => env("CASH_GEO_SECRET").length >= 32;

async function resolveCountry(
  req: Request,
  body: string,
  userId: string,
): Promise<string | null> {
  if (geoReady()) return verifyCashCountry(req, body, env("CASH_GEO_SECRET"));
  const { data, error } = await db()
    .from("player_profiles")
    .select("country")
    .eq("id", userId)
    .single();
  if (error || !data?.country)
    throw new Error("Verified location is not eligible");
  return data.country;
}
const uuid = (v: unknown) =>
  typeof v === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v,
  );
function commit(
  user: string,
  key: string,
  id: string,
  revision: number,
  request: Record<string, unknown>,
  state: ReturnType<typeof newCashRound>,
  geoCountry: string | null = null,
) {
  return rpc("commit_cash_game", {
    p_user: user,
    p_key: key,
    p_round: id,
    p_revision: revision,
    p_game: state.game,
    p_request: request,
    p_private: state,
    p_public: publicCash(state),
    p_stake: state.stake_minor,
    p_return: state.returned_minor,
    p_done: state.phase === "settled",
    p_geo_country: geoCountry,
  });
}
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS")
    return new Response(null, { status: 204, headers: headers() });
  if (req.method !== "POST") return reply({ error: "POST required" }, 405);
  try {
    const text = await req.text();
    if (text.length > 16384) return reply({ error: "Request too large" }, 413);
    const body = JSON.parse(text);
    if (!body || typeof body !== "object" || Array.isArray(body))
      return reply({ error: "Invalid request" }, 400);
    if (body.action === "cleanup") {
      if (!(await workerAuthorized(req)))
        return reply({ error: "Worker authentication required" }, 401);
      const { data, error } = await db()
        .from("cash_game_rounds")
        .select("*")
        .eq("state", "open")
        .lt("expires_at", new Date().toISOString())
        .limit(20);
      if (error) throw new Error("Cleanup unavailable");
      let settled = 0;
      for (const r of data || []) {
        try {
          const next = nextCashRound(r.private_state, { action: "abandon" });
          await commit(
            r.user_id,
            crypto.randomUUID(),
            r.id,
            r.revision,
            { action: "timeout", revision: r.revision },
            next,
          );
          settled++;
        } catch {
          /* Concurrent actions retain their own revision and are retried by the next cleanup. */
        }
      }
      return reply({ settled });
    }
    const { user } = await authenticate(req);
    if (body.action === "admin_status" || body.action === "admin_settings") {
      const operator = await admin(req);
      if (body.action === "admin_settings") {
        if (operator.role !== "owner") throw new Error("Owner required");
        if (body.data?.enabled && !geoReady() && !body.data.profile_geo_fallback)
          throw new Error(
            "Configure the signed location gateway or enable profile-based geo verification before enabling cash play",
          );
        await rpc("configure_cash_games", {
          p_actor: user.id,
          p_data: body.data || {},
        });
      }
      const [platform, config] = await Promise.all([
        db().from("platform_settings").select("*").single(),
        db().from("cash_game_config").select("*").single(),
      ]);
      if (platform.error || config.error)
        throw new Error("Cash configuration unavailable");
      return reply({
        role: operator.role,
        platform: platform.data,
        config: config.data,
      });
    }
    if (body.action === "status") {
      const [eligibility, w, active] = await Promise.all([
        rpc("cash_game_eligibility", { p_user: user.id }),
        db()
          .from("wallets")
          .select("balance_minor")
          .eq("user_id", user.id)
          .single(),
        db()
          .from("cash_game_rounds")
          .select("id,revision,game,state,public_state,expires_at")
          .eq("user_id", user.id)
          .eq("state", "open")
          .maybeSingle(),
      ]);
      if (w.error || active.error)
        throw new Error("Cash game data unavailable");
      return reply({
        enabled: eligibility === null,
        balance_minor: w.data.balance_minor,
        active: active.data
          ? { ...active.data, view: active.data.public_state }
          : null,
        model: CASH_MODEL,
      });
    }
    if (body.action === "history") {
      const { data, error } = await db()
        .from("cash_game_rounds")
        .select("id,game,state,stake_minor,returned_minor,created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw new Error("History unavailable");
      return reply({ rounds: data });
    }
    if (body.action === "recover") {
      if (!uuid(body.request_key)) throw new Error("Invalid request key");
      const { data, error } = await db()
        .from("cash_game_commands")
        .select("response")
        .eq("user_id", user.id)
        .eq("request_key", body.request_key)
        .maybeSingle();
      if (error) throw new Error("Recovery unavailable");
      return reply({ round: data?.response || null });
    }
    if (!uuid(body.request_key))
      throw new Error("A unique request key is required");
    const request =
      body.action === "start"
        ? { action: "start", game: String(body.game), input: body.input || {} }
        : {
            action: "act",
            round_id: body.round_id,
            revision: body.revision,
            command: body.command,
          };
    const prior = await db()
      .from("cash_game_commands")
      .select("request,response")
      .eq("user_id", user.id)
      .eq("request_key", body.request_key)
      .maybeSingle();
    if (prior.error) throw new Error("Command lookup failed");
    if (prior.data) {
      if (
        JSON.stringify(canonical(prior.data.request)) !==
        JSON.stringify(canonical(request))
      )
        throw new Error("Command replay conflict");
      return reply({ ...prior.data.response, replayed: true });
    }
    if (body.action === "start") {
      const geoCountry = await resolveCountry(req, text, user.id);
      const state = newCashRound(String(body.game), body.input || {});
      return reply(
        await commit(
          user.id,
          body.request_key,
          body.request_key,
          -1,
          request,
          state,
          geoCountry,
        ),
      );
    }
    if (body.action === "act") {
      if (
        !uuid(body.round_id) ||
        !Number.isSafeInteger(body.revision) ||
        body.revision < 0 ||
        !body.command ||
        typeof body.command.action !== "string"
      )
        throw new Error("Invalid round command");
      const r = await db()
        .from("cash_game_rounds")
        .select("*")
        .eq("id", body.round_id)
        .eq("user_id", user.id)
        .single();
      if (r.error || !r.data) throw new Error("Round not found");
      if (r.data.revision !== body.revision)
        throw new Error("Round changed; refresh before acting");
      const expired = Date.parse(r.data.expires_at) <= Date.now();
      const command = expired ? { action: "abandon" } : body.command;
      const state = nextCashRound(r.data.private_state, command);
      const geoCountry =
        state.stake_minor > r.data.stake_minor
          ? await resolveCountry(req, text, user.id)
          : null;
      return reply(
        await commit(
          user.id,
          body.request_key,
          r.data.id,
          r.data.revision,
          request,
          state,
          geoCountry,
        ),
      );
    }
    throw new Error("Unknown cash game action");
  } catch (e) {
    const message = e instanceof Error ? e.message : "Cash game request failed";
    return reply(
      { error: message },
      ["Sign in required", "Invalid session"].includes(message) ? 401 : 409,
    );
  }
});
