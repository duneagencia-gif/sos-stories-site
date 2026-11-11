// Regras da Oferta Black Sublime (vale para o site e para o servidor).
// Prazo: 11/11/2026 até 23:59 no horário da Bahia (UTC-3) = 12/11 02:59:59 UTC.
// O site mostra "5 vagas", mas aceita até LIMITE pagamentos aprovados e depois encerra.
const REF = "black-sublime-2026";
const PRAZO = Date.parse("2026-11-12T02:59:59Z");
const LIMITE = 10;
const VALOR = 1000;
const PARCELAS = 12;

async function aprovados() {
  const u = `https://api.mercadopago.com/v1/payments/search?external_reference=${REF}&status=approved&limit=1`;
  const r = await fetch(u, { headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` } });
  if (!r.ok) throw new Error("busca");
  const d = await r.json();
  return Number(d.paging?.total) || 0;
}

async function situacao() {
  if (Date.now() > PRAZO) return { aberta: false, motivo: "prazo" };
  const n = await aprovados();
  if (n >= LIMITE) return { aberta: false, motivo: "vagas" };
  return { aberta: true };
}

module.exports = { REF, PRAZO, LIMITE, VALOR, PARCELAS, situacao };
