// ============================================================
//  Supabase Edge Function: create-checkout-session
//  Cria uma sessão de Checkout EMBEDADO no Stripe.
//  Produto FÍSICO: coleta endereço de entrega (Brasil) + telefone.
//  SEM banco de dados. Só cria a sessão.
//
//  SECRET necessário (Edge Functions -> Secrets):
//    STRIPE_SECRET_KEY = sk_live_...   (a chave NOVA, depois do Roll)
//
//  IMPORTANTE: desligue "Verify JWT" nesta função
//  (Settings da função -> desmarca Verify JWT -> Save).
//  Sem isso o navegador toma 401 e o checkout não abre.
// ============================================================

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")!;

// ===================== EDITE AQUI =====================
const PRICE_ID       = "price_1U6fefEt4eVK2qhOywMI9IvO";
const RETURN_URL     = "https://SEUDOMINIO.com/thank-you"; // troque pelo seu domínio
const SHIP_COUNTRIES = ["BR"];                              // só Brasil
// ======================================================

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  try {
    const body = await req.json().catch(() => ({} as Record<string, string>));

    const p = new URLSearchParams();
    p.set("mode", "payment");
    p.set("ui_mode", "embedded");
    p.append("line_items[0][price]", PRICE_ID);
    p.append("line_items[0][quantity]", "1");
    p.set("return_url", `${RETURN_URL}?session_id={CHECKOUT_SESSION_ID}`);
    p.set("phone_number_collection[enabled]", "true");

    // Endereço de entrega (produto físico)
    SHIP_COUNTRIES.forEach((c, i) =>
      p.append(`shipping_address_collection[allowed_countries][${i}]`, c)
    );

    // Rastreio (VTurb / Meta / etc.)
    if (body.client_reference_id) p.set("client_reference_id", body.client_reference_id);
    ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid"]
      .forEach((k) => { if (body[k]) p.set(`metadata[${k}]`, body[k]); });

    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: p,
    });
    const data = await res.json();
    if (!res.ok) return json({ error: data.error?.message || "stripe_error" }, 400);
    return json({ clientSecret: data.client_secret });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
