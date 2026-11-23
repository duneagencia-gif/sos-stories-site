// Valor da parcela de 10x no cartão (com os juros do Mercado Pago), para mostrar no site.
const { VALOR } = require("./_oferta");
let cache = null, quando = 0;
module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "public, max-age=300");
  if (cache && Date.now() - quando < 30 * 60 * 1000) return res.status(200).json(cache);
  try {
    const r = await fetch(`https://api.mercadopago.com/v1/payment_methods/installments?amount=${VALOR}&payment_method_id=master`, {
      headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` }
    });
    const d = await r.json();
    const pc = (d[0]?.payer_costs || []);
    const p10 = pc.find(c => c.installments === 10), p12 = pc.find(c => c.installments === 12);
    if (!p10) throw new Error("sem10");
    cache = { p10: p10.installment_amount, t10: p10.total_amount, p12: p12?.installment_amount || null, t12: p12?.total_amount || null };
    quando = Date.now();
    return res.status(200).json(cache);
  } catch (e) {
    return res.status(200).json({ p10: null });
  }
};
