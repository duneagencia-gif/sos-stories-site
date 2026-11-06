// Aviso do Mercado Pago (notification_url). Confere o pagamento direto na API do MP
// e manda para a área de membros. Cobre o Pix pago depois que a pessoa fechou a página.
const registrar = require("./_registrar");

module.exports = async (req, res) => {
  const q = req.query || {}, b = req.body || {};
  const tipo = q.type || q.topic || b.type || b.topic;
  const id = String(q["data.id"] || q.id || b.data?.id || "");
  if (tipo !== "payment" || !/^\d{5,20}$/.test(id) || !process.env.MP_ACCESS_TOKEN) return res.status(200).json({ ok: true });
  try {
    const r = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, { headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` } });
    if (r.ok) await registrar(await r.json());
  } catch (e) {}
  return res.status(200).json({ ok: true });
};
