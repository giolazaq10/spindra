export const geoPayload = (
  timestamp: string,
  country: string,
  authorization: string,
  body: string,
) => JSON.stringify([timestamp, country, authorization, body]);
export async function verifyCashCountry(
  req: Request,
  body: string,
  secret: string,
  now = Date.now(),
) {
  if (secret.length < 32)
    throw new Error("Cash location gateway is not configured");
  const ts = req.headers.get("x-cash-timestamp") || "",
    country = req.headers.get("x-cash-country") || "",
    sig = req.headers.get("x-cash-signature") || "";
  if (
    !/^\d{13}$/.test(ts) ||
    Math.abs(now - Number(ts)) > 120000 ||
    !/^([A-Z]{2})$/.test(country) ||
    country === "XX" ||
    !/^([a-f0-9]{64})$/.test(sig)
  )
    throw new Error("Trusted location verification required");
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );
  const supplied = Uint8Array.from(sig.match(/../g)!, (v) => parseInt(v, 16));
  if (
    !(await crypto.subtle.verify(
      "HMAC",
      key,
      supplied,
      new TextEncoder().encode(
        geoPayload(ts, country, req.headers.get("authorization") || "", body),
      ),
    ))
  )
    throw new Error("Invalid location signature");
  return country;
}
