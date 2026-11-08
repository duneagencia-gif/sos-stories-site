// Dados de acesso à área de membros, mostrados na página de obrigada.
// Só responde com o código (t) que o pagar.js entregou ao navegador de quem pagou.
const HOOK = "https://rppgpmddpuvcrbvljfms.supabase.co/functions/v1/ms-pagamento";

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  const t = String((req.query || {}).t || "");
  if (!/^[0-9a-f-]{36}$/.test(t)) return res.status(404).json({ ok: false });
  if (!process.env.MS_HOOK_SECRET) return res.status(500).json({ ok: false, error: "config" });
  try {
    const r = await fetch(HOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-ms-secret": process.env.MS_HOOK_SECRET },
      body: JSON.stringify({ acao: "acesso", token: t })
    });
    const d = await r.json();
    return res.status(r.ok ? 200 : r.status).json(d);
  } catch (e) {
    return res.status(502).json({ ok: false, error: "conexao" });
  }
};
