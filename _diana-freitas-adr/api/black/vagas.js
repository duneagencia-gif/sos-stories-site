// Diz ao site se a oferta ainda está aberta (prazo e vagas). Não expõe quantas vendas houve.
const { situacao, PRAZO } = require("./_oferta");
module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (!process.env.MP_ACCESS_TOKEN) return res.status(200).json({ aberta: Date.now() <= PRAZO, prazo: PRAZO });
  try { return res.status(200).json({ ...(await situacao()), prazo: PRAZO }); }
  catch (e) { return res.status(200).json({ aberta: Date.now() <= PRAZO, prazo: PRAZO }); }
};
