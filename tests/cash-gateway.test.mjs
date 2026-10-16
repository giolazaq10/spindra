import test from "node:test";
import assert from "node:assert/strict";
import gateway from "../integrations/cloudflare/cash-gateway.js";
import { verifyCashCountry } from "../supabase/functions/_shared/cash-geo.ts";

test("Gateway binds trusted country metadata, ignores spoofed headers and permits recovery without location", async () => {
  const env = {
    APP_ORIGIN: "https://example.invalid",
    SUPABASE_URL: "https://fixture.supabase.co",
    SUPABASE_ANON_KEY: "public",
    CASH_GEO_SECRET: "a".repeat(64),
  };
  const original = globalThis.fetch;
  let forwarded;
  globalThis.fetch = async (url, init) => {
    forwarded = new Request(url, init);
    return Response.json({ ok: true });
  };
  try {
    const request = (country, origin = env.APP_ORIGIN) => {
      const req = new Request("https://gateway.invalid", {
        method: "POST",
        headers: {
          Origin: origin,
          authorization: "Bearer fixture",
          "x-cash-country": "US",
          "x-cash-signature": "forged",
        },
        body: '{"action":"status"}',
      });
      if (country) Object.defineProperty(req, "cf", { value: { country } });
      return req;
    };
    assert.equal((await gateway.fetch(request("GE"), env)).status, 200);
    assert.equal(
      await verifyCashCountry(
        forwarded,
        await forwarded.clone().text(),
        env.CASH_GEO_SECRET,
      ),
      "GE",
    );
    assert.equal((await gateway.fetch(request(undefined), env)).status, 200);
    await assert.rejects(
      verifyCashCountry(
        forwarded,
        await forwarded.clone().text(),
        env.CASH_GEO_SECRET,
      ),
    );
    assert.equal(
      (await gateway.fetch(request("GE", "https://other.invalid"), env)).status,
      403,
    );
    assert.equal(
      (await gateway.fetch(request("GE"), { ...env, CASH_GEO_SECRET: "" }))
        .status,
      503,
    );
  } finally {
    globalThis.fetch = original;
  }
});
