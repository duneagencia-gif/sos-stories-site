// Cria o pagamento da Oferta Black Sublime no Mercado Pago.
// Valor decidido aqui no servidor: R$ 1.000 no Pix, ou no cartão em até 12x com os juros do Mercado Pago pagos por quem compra.
// Usa a mesma MP_ACCESS_TOKEN da Mentoria (já cadastrada na Vercel).
const { randomUUID } = require("crypto");
const { REF, VALOR, PARCELAS, situacao } = require("./_oferta");

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "method" });
  if (!process.env.MP_ACCESS_TOKEN) return res.status(500).json({ error: "config" });

  const { formData, cliente } = req.body || {};
  if (!formData || !formData.payment_method_id || !formData.payer || !formData.payer.email) {
    return res.status(400).json({ error: "dados" });
  }

  try {
    const s = await situacao();
    if (!s.aberta) return res.status(200).json({ status: "encerrada", motivo: s.motivo });
  } catch (e) { /* se a busca falhar, não trava a venda */ }

  const nome = String(cliente?.nome || "").slice(0, 80);
  const whats = String(cliente?.whats || "").replace(/\D/g, "").slice(0, 15);
  const body = {
    transaction_amount: VALOR,
    description: "Oferta Black Sublime",
    payment_method_id: formData.payment_method_id,
    payer: {
      email: formData.payer.email,
      first_name: formData.payer.first_name,
      last_name: formData.payer.last_name,
      identification: formData.payer.identification
    },
    statement_descriptor: "DIANA FREITAS",
    external_reference: REF,
    metadata: { nome, whatsapp: whats, oferta: "black-sublime" }
  };
  if (formData.token) {
    body.token = formData.token;
    body.installments = Math.max(1, Math.min(Number(formData.installments) || 1, PARCELAS));
    if (formData.issuer_id) body.issuer_id = formData.issuer_id;
  }

  try {
    const r = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": randomUUID()
      },
      body: JSON.stringify(body)
    });
    const d = await r.json();
    if (!r.ok) return res.status(400).json({ status: "rejected", detail: d.cause?.[0]?.code || d.message || "erro" });
    const tx = d.point_of_interaction?.transaction_data;
    return res.status(200).json({
      id: d.id,
      status: d.status,
      detail: d.status_detail,
      pix: tx ? { code: tx.qr_code, img: tx.qr_code_base64 } : null
    });
  } catch (e) {
    return res.status(502).json({ status: "rejected", detail: "conexao" });
  }
};
