// Cria o pagamento da Mentoria Sublime no Mercado Pago.
// O valor é decidido aqui no servidor pelo plano, nunca pelo navegador.
// Precisa da variável de ambiente MP_ACCESS_TOKEN (Access Token de produção da Diana) na Vercel.
const { randomUUID } = require("crypto");

const PLANOS = {
  parc: { amount: 2000, maxInstallments: 10, description: "Mentoria Sublime · parcelado" },
  vista: { amount: 1700, maxInstallments: 1, description: "Mentoria Sublime · à vista" }
};

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "method" });
  if (!process.env.MP_ACCESS_TOKEN) return res.status(500).json({ error: "config" });

  const { plano, formData } = req.body || {};
  const p = PLANOS[plano];
  if (!p || !formData || !formData.payment_method_id || !formData.payer || !formData.payer.email) {
    return res.status(400).json({ error: "dados" });
  }

  const body = {
    transaction_amount: p.amount,
    description: p.description,
    payment_method_id: formData.payment_method_id,
    payer: {
      email: formData.payer.email,
      first_name: formData.payer.first_name,
      last_name: formData.payer.last_name,
      identification: formData.payer.identification
    },
    statement_descriptor: "MENTORIA SUBLIME",
    external_reference: `sublime-${plano}-${Date.now()}`
  };
  if (formData.token) {
    body.token = formData.token;
    body.installments = Math.max(1, Math.min(Number(formData.installments) || 1, p.maxInstallments));
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
