// Envia um pagamento da Mentoria Sublime para a área de membros (Supabase, função ms-pagamento):
// registra no financeiro e cria a aluna já com login (os dados de acesso aparecem na página de obrigada). Nunca derruba o pagamento.
// Precisa da variável MS_HOOK_SECRET na Vercel (mesmo valor guardado no Supabase).
const HOOK = "https://rppgpmddpuvcrbvljfms.supabase.co/functions/v1/ms-pagamento";

module.exports = async function registrar(d) {
  try {
    if (!d || !process.env.MS_HOOK_SECRET) return;
    if (!String(d.description || "").startsWith("Mentoria Sublime")) return;
    if (!["approved", "refunded", "charged_back", "cancelled"].includes(d.status)) return;
    const ref = String(d.external_reference || "");
    const nome = [d.payer?.first_name, d.payer?.last_name].filter(Boolean).join(" ").trim() || d.card?.cardholder?.name || d.metadata?.nome || "";
    await fetch(HOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-ms-secret": process.env.MS_HOOK_SECRET },
      body: JSON.stringify({
        mp_id: String(d.id),
        status: d.status,
        nome,
        email: d.payer?.email || d.metadata?.email || "",
        valor: d.transaction_amount,
        valor_liquido: d.transaction_details?.net_received_amount ?? null,
        forma: d.payment_type_id === "bank_transfer" || d.payment_method_id === "pix" ? "pix" : d.payment_type_id === "ticket" ? "boleto" : "cartao",
        parcelas: d.installments || 1,
        plano: ref.includes("-vista-") ? "vista" : "parc",
        pago_em: d.date_approved || d.date_created,
        acesso: d.metadata?.acesso || ""
      })
    });
  } catch (e) { /* segue: o pagamento já foi feito no Mercado Pago */ }
};
