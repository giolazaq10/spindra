// crypto-deposit edge function — proxies NowPayments invoice creation
// so the API key stays server-side.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { userId, coin, amount } = await req.json();

    if (!userId || !coin) {
      return new Response(
        JSON.stringify({ error: "userId and coin are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const apiKey = Deno.env.get("NOWPAYMENTS_API_KEY");
    if (!apiKey) {
      // Without a configured API key, return a placeholder address
      // so the deposit flow is demonstrable in the prototype.
      return new Response(
        JSON.stringify({
          address: `${coin.toUpperCase()}-DEPOSIT-ADDRESS-${userId.slice(0, 8)}`,
          coin,
          note: "NowPayments API key not configured. This is a placeholder address for prototype demonstration.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body: Record<string, string> = {
      price_amount: amount || "100",
      price_currency: "usd",
      pay_currency: coin,
      order_id: `spindra-${userId}-${Date.now()}`,
    };

    const res = await fetch("https://api.nowpayments.io/v1/invoice", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `NowPayments error ${res.status}`);
    }

    const data = await res.json();
    return new Response(
      JSON.stringify({
        address: data.pay_address || data.invoice_url,
        invoiceId: data.id,
        coin,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Deposit request failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
