// ============================================================
//  Supabase Edge Function: session-status
//  Confirma o pagamento para a página de obrigado. Sem banco.
//  SECRET necessário: STRIPE_SECRET_KEY
//  Desligue "Verify JWT" nesta função também.
// ============================================================

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")!;

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
    const { session_id } = await req.json();
    if (!session_id) return json({ error: "missing_session_id" }, 400);

    const res = await fetch(
      `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(session_id)}`,
      { headers: { "Authorization": `Bearer ${STRIPE_SECRET_KEY}` } }
    );
    const s = await res.json();
    if (!res.ok) return json({ error: s.error?.message || "stripe_error" }, 400);

    return json({
      status        : s.status,          // open | complete | expired
      payment_status: s.payment_status,  // paid | unpaid
      email         : s.customer_details?.email || null,
    });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
