// Mentoria Sublime · área de membros: configuração e funções comuns
// Banco: Supabase (projeto "eleva"), tabelas ms_*, arquivos no bucket privado "mentoria".
const SB_URL = "https://rppgpmddpuvcrbvljfms.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwcGdwbWRkcHV2Y3JidmxqZm1zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE2NzU5NzcsImV4cCI6MjEwNzI1MTk3N30.pnxIEPd3jWRyzzCPJ1gO_IknDTh1Nf4vvxODuc3VzF0";
const WHATSAPP = "5571991316292";
const AREA_URL = "https://dianafreitasadr.com.br/mentoria/area/";
const sb = supabase.createClient(SB_URL, SB_KEY, { auth: { storageKey: "ms-area", persistSession: true } });

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const nl = s => esc(s).replace(/\n/g, "<br>");
const firstName = n => String(n || "").trim().split(/\s+/)[0] || "";

const SECOES = { m1: "Encontro 1", m2: "Encontro 2", m3: "Encontro 3", m4: "Encontro 4", bonus: "Presentes", briefing: "Briefing", contrato: "Contrato" };

function parseDate(d) { if (!d) return null; const [y, m, dd] = d.split("-").map(Number); return new Date(y, m - 1, dd); }
function fmtData(d, longo = true) {
  const dt = parseDate(d); if (!dt) return "";
  return dt.toLocaleDateString("pt-BR", longo ? { weekday: "long", day: "numeric", month: "long" } : { day: "2-digit", month: "short" }).replace(/\.$/, "").replace(/ de (\w)/, (m, c) => " de " + c).replace(/^./, c => c.toUpperCase());
}
function fmtDia(d) { const dt = parseDate(d); return dt ? { dia: String(dt.getDate()).padStart(2, "0"), mes: dt.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""), sem: dt.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "") } : null; }
function fmtHora(h) { if (!h) return ""; const [hh, mm] = h.split(":"); return mm === "00" ? `${+hh}h` : `${+hh}h${mm}`; }
function fmtQuando(ts) { const d = new Date(ts); return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", "") + " · " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }); }
function fmtTam(b) { if (!b) return ""; return b > 1048576 ? (b / 1048576).toFixed(1).replace(".", ",") + " MB" : Math.max(1, Math.round(b / 1024)) + " KB"; }

function agendaLink(m) {
  if (!m.data || !m.hora) return "";
  const p = n => String(n).padStart(2, "0");
  const [y, mo, d] = m.data.split("-"), [h, mi] = m.hora.split(":");
  const ini = new Date(+y, mo - 1, +d, +h, +mi), fim = new Date(ini.getTime() + 90 * 60000);
  const f = t => `${t.getFullYear()}${p(t.getMonth() + 1)}${p(t.getDate())}T${p(t.getHours())}${p(t.getMinutes())}00`;
  const q = new URLSearchParams({ action: "TEMPLATE", text: `Mentoria Sublime · ${m.titulo}`, dates: `${f(ini)}/${f(fim)}`, ctz: "America/Bahia", details: m.link ? `Link do encontro: ${m.link}` : "Mentoria Sublime com Diana Freitas" });
  return "https://calendar.google.com/calendar/render?" + q;
}

const ICONES = {
  pdf: '<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5"/><path d="M9.5 16.5h5M9.5 13h5"/>',
  slide: '<rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M12 16v4M8 20h8"/>',
  img: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.8"/><path d="M21 16l-5-5-9 9"/>',
  video: '<rect x="3" y="5" width="13" height="14" rx="2"/><path d="M16 10l5-3v10l-5-3z"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  file: '<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5"/>',
  zip: '<path d="M7 3h7l5 5v13H7z"/><path d="M11 3v2m0 2v2m0 2v2"/>'
};
function tipoIcone(m) {
  if (!m.caminho && m.url) return "link";
  const t = (m.tipo || "") + " " + (m.caminho || "");
  if (/pdf/i.test(t)) return "pdf";
  if (/presentation|powerpoint|\.pptx?|keynote|\.key/i.test(t)) return "slide";
  if (/image|\.png|\.jpe?g|\.webp/i.test(t)) return "img";
  if (/video|\.mp4|\.mov/i.test(t)) return "video";
  if (/zip|rar/i.test(t)) return "zip";
  return "file";
}
const svg = (k, cls = "") => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONES[k] || k}</svg>`;

async function abrirMaterial(m, baixar = false) {
  if (!m.caminho) { window.open(m.url, "_blank", "noopener"); return; }
  const nome = m.caminho.split("/").pop().replace(/^\d+-/, "");
  const { data, error } = await sb.storage.from("mentoria").createSignedUrl(m.caminho, 3600, baixar ? { download: nome } : undefined);
  if (error) { toast("Não consegui abrir o arquivo. Tente de novo."); return; }
  if (baixar) { const a = document.createElement("a"); a.href = data.signedUrl; a.rel = "noopener"; document.body.appendChild(a); a.click(); a.remove(); }
  else window.open(data.signedUrl, "_blank", "noopener");
}

function toast(msg) {
  let t = $("#toast");
  if (!t) { t = document.createElement("div"); t.id = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
  t.textContent = msg; t.classList.add("on");
  clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove("on"), 3200);
}

// Tela de login (compartilhada entre aluna e Diana)
function montarLogin({ titulo, sub, aoEntrar }) {
  const box = $("#login");
  box.innerHTML = `
  <div class="lg-card">
    <img class="lg-seal" src="${box.dataset.base}selo-sublime.webp" alt="" width="440" height="440">
    <span class="eyebrow">${esc(sub)}</span>
    <h1>${titulo}</h1>
    <form class="lg-form" novalidate>
      <label class="fl"><span>E-mail</span><input name="email" type="email" autocomplete="username" required></label>
      <label class="fl"><span>Senha</span><span class="pw"><input name="senha" type="password" autocomplete="current-password" required><button type="button" class="eye" aria-label="Mostrar senha">${svg('<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>')}</button></span></label>
      <p class="err" hidden></p>
      <button class="btn btn-gold" type="submit">Entrar</button>
      <p class="lg-help">Esqueceu a senha? <a href="https://wa.me/${WHATSAPP}?text=${encodeURIComponent("Oi, Diana! Esqueci a senha da minha área da Mentoria Sublime.")}" target="_blank" rel="noopener">Fale comigo no WhatsApp</a></p>
    </form>
  </div>`;
  const f = $("form", box), err = $(".err", box);
  $(".eye", box).onclick = () => { const i = f.senha; i.type = i.type === "password" ? "text" : "password"; };
  f.onsubmit = async e => {
    e.preventDefault(); err.hidden = true;
    const email = f.email.value.trim(), senha = f.senha.value;
    if (!email || !senha) { err.textContent = "Preencha e-mail e senha."; err.hidden = false; return; }
    const b = $("button[type=submit]", f); b.disabled = true; b.textContent = "Entrando…";
    const { error } = await sb.auth.signInWithPassword({ email, password: senha });
    b.disabled = false; b.textContent = "Entrar";
    if (error) { err.textContent = /invalid/i.test(error.message) ? "E-mail ou senha não conferem." : "Não foi possível entrar agora. Tente de novo."; err.hidden = false; return; }
    aoEntrar();
  };
}

async function sair() { await sb.auth.signOut(); location.href = location.pathname; }
async function souAdmin() { const { data } = await sb.from("ms_admins").select("user_id").maybeSingle(); return !!data; }
