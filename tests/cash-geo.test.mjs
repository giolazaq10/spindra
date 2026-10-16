import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import {
  geoPayload,
  verifyCashCountry,
} from "../supabase/functions/_shared/cash-geo.ts";
test("Location attestations bind country, body, user token and timestamp; browser spoofing and expiry fail", async () => {
  const secret = "a".repeat(64),
    timestamp = String(Date.now()),
    body = JSON.stringify({ action: "start", request_key: "fixed" }),
    authorization = "Bearer fixture";
  const signature = createHmac("sha256", secret)
    .update(geoPayload(timestamp, "GE", authorization, body))
    .digest("hex");
  const req = (extra = {}) =>
    new Request("https://example.invalid", {
      headers: {
        authorization,
        "x-cash-country": "GE",
        "x-cash-timestamp": timestamp,
        "x-cash-signature": signature,
        ...extra,
      },
    });
  assert.equal(await verifyCashCountry(req(), body, secret), "GE");
  for (const [r, b, now] of [
    [req({ "x-cash-country": "US" }), body, Date.now()],
    [req(), body + " ", Date.now()],
    [req({ authorization: "Bearer other" }), body, Date.now()],
    [req(), body, Date.now() + 180000],
  ])
    await assert.rejects(verifyCashCountry(r, b, secret, now));
  await assert.rejects(verifyCashCountry(req(), body, ""));
  await assert.rejects(
    verifyCashCountry(new Request("https://example.invalid"), body, secret),
  );
});
