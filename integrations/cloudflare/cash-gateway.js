/** Deploy on an operator-controlled Cloudflare Worker. Set CASH_GEO_SECRET as a Worker secret. */
export default {
  async fetch(request, env) {
    const origin = env.APP_ORIGIN;
    const cors = {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Headers":
        "authorization, apikey, content-type, x-client-info",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      Vary: "Origin",
      "Cache-Control": "no-store",
    };
    if (request.method === "OPTIONS")
      return new Response(null, { status: 204, headers: cors });
    if (request.method !== "POST")
      return new Response("POST required", { status: 405, headers: cors });
    if (request.headers.get("Origin") !== origin)
      return new Response("Origin denied", { status: 403, headers: cors });
    if (
      !env.CASH_GEO_SECRET ||
      env.CASH_GEO_SECRET.length < 32 ||
      !/^https:\/\/[a-z0-9]+\.supabase\.co$/.test(env.SUPABASE_URL)
    )
      return new Response("Gateway not configured", {
        status: 503,
        headers: cors,
      });
    // Unknown location cannot add stakes, but account reads and existing-hand
    // settlement must remain reachable. The backend enforces this distinction.
    const country = request.cf?.country || "XX";
    const body = await request.text();
    if (body.length > 16384)
      return new Response("Request too large", { status: 413, headers: cors });
    const authorization = request.headers.get("authorization") || "",
      ts = String(Date.now());
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(env.CASH_GEO_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const bytes = new Uint8Array(
      await crypto.subtle.sign(
        "HMAC",
        key,
        new TextEncoder().encode(
          JSON.stringify([ts, country, authorization, body]),
        ),
      ),
    );
    const signature = Array.from(bytes, (b) =>
      b.toString(16).padStart(2, "0"),
    ).join("");
    const upstream = await fetch(
      env.SUPABASE_URL + "/functions/v1/cash-games",
      {
        method: "POST",
        body,
        redirect: "error",
        headers: {
          "content-type": "application/json",
          authorization: authorization,
          apikey: env.SUPABASE_ANON_KEY,
          "x-cash-timestamp": ts,
          "x-cash-country": country,
          "x-cash-signature": signature,
        },
      },
    );
    return new Response(upstream.body, {
      status: upstream.status,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  },
};
