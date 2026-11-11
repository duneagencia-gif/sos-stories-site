// Consulta o status de um pagamento da Oferta Black (para saber quando o Pix foi pago).
const { REF } = require("./_oferta");
module.exports = async (req, res) => {
  const id = String(req.query.id || "");
  if (!/^\d{5,20}$/.test(id)) return res.status(400).json({ error: "id" });
  if (!process.env.MP_ACCESS_TOKEN) return res.status(500).json({ error: "config" });
  try {
    const r = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
      headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` }
    });
    const d = await r.json();
    if (!r.ok || d.external_reference !== REF) return res.status(404).json({ error: "nao_encontrado" });
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({ status: d.status });
  } catch (e) {
    return res.status(502).json({ error: "conexao" });
  }
};
