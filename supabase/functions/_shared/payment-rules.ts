export function cents(input: unknown) {
  if (typeof input !== "string" || !/^\d{1,8}(\.\d{1,2})?$/.test(input))
    throw new Error("Enter a valid USD amount with at most two decimals");
  const [a, b = ""] = input.split(".");
  const n = Number(a) * 100 + Number(b.padEnd(2, "0"));
  if (!Number.isSafeInteger(n) || n < 1 || n > 100000000)
    throw new Error("Amount out of range");
  return n;
}
export function positive(value: unknown, label = "Provider amount") {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) throw new Error(label + " unavailable");
  return n;
}
export function minorFloor(value: unknown) {
  const n = Math.floor(positive(value) * 100 + 1e-8);
  if (!Number.isSafeInteger(n) || n < 1 || n > 9000000000000)
    throw new Error("Credit amount out of range");
  return n;
}
export function payoutAmount(gross: unknown, fee: unknown) {
  const amount = positive(gross),
    cost = Number(fee);
  if (!Number.isFinite(cost) || cost < 0)
    throw new Error("Network fee unavailable");
  const micros = Math.floor((amount - cost) * 1e6 + 1e-8);
  if (micros < 1) throw new Error("Amount does not cover network fee");
  return micros / 1e6;
}
export function providerId(value: unknown) {
  if (typeof value === "number" && !Number.isSafeInteger(value))
    throw new Error("Unsafe provider ID");
  const id = String(value ?? "");
  if (!/^[a-zA-Z0-9_-]{1,100}$/.test(id))
    throw new Error("Invalid provider ID");
  return id;
}
export function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
        .map(([key, v]) => [key, canonical(v)]),
    );
  return value;
}
export async function validIpn(
  body: unknown,
  signature: string | null,
  secret: string,
) {
  if (!signature || !/^[a-f0-9]{128}$/i.test(signature) || !secret)
    return false;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"],
  );
  const bytes = new Uint8Array(
    await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(JSON.stringify(canonical(body))),
    ),
  );
  const expected = Array.from(bytes, (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
  return equalSecret(expected, signature.toLowerCase());
}
export function equalSecret(a: string, b: string) {
  let different = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++)
    different |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return different === 0;
}
export function terminalPayout(status: unknown) {
  const value = String(status).toUpperCase();
  if (value === "FINISHED") return "finished";
  if (["FAILED", "REJECTED", "REJECTED_NOT_CHECKED"].includes(value))
    return "rejected";
  if (value === "CANCELLED") return "cancelled";
  return null;
}
export function matchesRoute(
  payment: Record<string, unknown>,
  route: Record<string, unknown>,
) {
  return (
    String(payment.pay_currency).toLowerCase() === route.asset &&
    payment.pay_address === route.address &&
    String(payment.payin_extra_id ?? "") === String(route.memo ?? "")
  );
}

export function settlementCurrency(
  value: unknown,
  primary: string,
  merchant: Set<string>,
) {
  const code = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (
    !/^[a-z0-9]{2,30}$/.test(code) ||
    !(code === primary.toLowerCase() || merchant.has(code))
  )
    throw new Error("Unexpected deposit settlement currency");
  return code;
}
