/* Minhas fontes (só a administradora vê): duas fontes já configuradas, é só digitar e copiar.
   **palavra** entre dois asteriscos fica em negrito. */
(function(){
  "use strict";
  var $ = function(id){ return document.getElementById(id); };
  var PRESETS = [
    {id:"poppins", nome:"Poppins", fam:"Poppins", peso:400, negrito:700, ls:-0.060, lh:0.69, cor:"branco", align:"center", exemplo:"para **ajudar mulheres**\n**empreendedoras** a\nconstruírem essa presença"},
    {id:"parslay", nome:"Parslay", fam:"Parslay", url:"/app/fonts/parslay.otf", peso:400, negrito:400, ls:0, lh:1.1, cor:"branco", align:"center", exemplo:"Criei o Método Aura"}
  ];
  var S = 120; // tamanho de desenho (px); a figurinha sai em alta
  var st = load();
  function load(){ try{ return JSON.parse(localStorage.getItem("fig_minhas")) || {}; }catch(e){ return {}; } }
  function save(){ try{ localStorage.setItem("fig_minhas", JSON.stringify(st)); }catch(e){} }
  var pal0 = {c1:"#C9A27E", c2:"#3B2F2A", c3:"#FFF8F0"};
  function paleta(){ try{ return (typeof pal !== "undefined" && pal && pal.c1) ? pal : (JSON.parse(localStorage.getItem("fig_pal")) || pal0); }catch(e){ return pal0; } }
  function cfg(p){ var o = st[p.id] || {}; return {texto: o.texto != null ? o.texto : "", cor: o.cor || p.cor, custom: o.custom || "#FFFFFF", align: o.align || p.align, ls: o.ls != null ? o.ls : p.ls, lh: o.lh != null ? o.lh : p.lh, w: o.w != null ? o.w : 0}; }
  function corDe(c){ var P = paleta(); return c.cor === "custom" ? c.custom : c.cor === "branco" ? "#FFFFFF" : c.cor === "preto" ? "#000000" : (P[c.cor] || "#000"); }
  function esc(t){ return String(t).replace(/[&<>"']/g, function(ch){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]; }); }

  /* fontes */
  var prontas = {};
  function carregar(p){
    if(prontas[p.id]) return prontas[p.id];
    var pr;
    if(p.url){ pr = new FontFace(p.fam, "url(" + p.url + ")").load().then(function(f){ document.fonts.add(f); }); }
    else { pr = Promise.all([document.fonts.load(p.peso + " 40px '" + p.fam + "'"), document.fonts.load(p.negrito + " 40px '" + p.fam + "'")]); }
    prontas[p.id] = pr.catch(function(){});
    return prontas[p.id];
  }

  /* desenho: **negrito** e __sublinhado__ podem ser só um trecho da frase (e podem se combinar) */
  function trechos(linha){ var out = [], b = false, u = false, buf = "", i = 0;
    while(i < linha.length){ var two = linha.substr(i, 2);
      if(two === "**" || two === "__"){ if(buf) out.push({t:buf, b:b, u:u}); buf = ""; if(two === "**") b = !b; else u = !u; i += 2; }
      else { buf += linha[i]; i++; } }
    if(buf || !out.length) out.push({t:buf, b:b, u:u}); return out; }
  function fonte(p, b){ return (b ? p.negrito : p.peso) + " " + S + "px '" + p.fam + "'"; }
  function largura(ctx, p, t, b, ls){ ctx.font = fonte(p, b); var ch = Array.from(t); var w = 0; ch.forEach(function(c){ w += ctx.measureText(c).width; }); return w + ls * ch.length; }
  /* quebra automática: divide cada linha em palavras e monta linhas que caibam na largura */
  function quebrar(linhas, m, p, ls, maxPx){
    var out = [];
    linhas.forEach(function(l){
      var tok = []; l.forEach(function(t){ (t.t.match(/\s+|[^\s]+/g) || [""]).forEach(function(x){ tok.push({t:x, b:t.b, u:t.u, sp:/^\s+$/.test(x)}); }); });
      var cur = [], w = 0;
      var fecha = function(){ while(cur.length && cur[cur.length - 1].sp) cur.pop(); out.push(cur.length ? cur : [{t:"", b:false, u:false}]); cur = []; w = 0; };
      tok.forEach(function(k){
        var kw = largura(m, p, k.t, k.b, ls);
        if(k.sp && !cur.length) return;
        if(!k.sp && cur.length && w + kw - ls > maxPx) fecha();
        cur.push(k); w += kw;
      });
      fecha();
    });
    return out;
  }
  function render(p, c){
    var ls = c.ls * S, LH = S * c.lh;
    var linhas = (c.texto || p.exemplo).replace(/\r/g, "").split("\n").map(trechos);
    var m = document.createElement("canvas").getContext("2d");
    if(c.w > 0) linhas = quebrar(linhas, m, p, ls, c.w * S);
    var larg = linhas.map(function(l){ return l.reduce(function(a, t){ return a + largura(m, p, t.t, t.b, ls); }, 0) - ls; });
    var maxW = Math.max.apply(null, larg.concat([S * .3])), pad = S * .6;
    var cv = document.createElement("canvas"); cv.width = Math.ceil(maxW + pad * 2); cv.height = Math.ceil(LH * linhas.length + pad * 2 + S * .4);
    var ctx = cv.getContext("2d"); ctx.fillStyle = corDe(c); ctx.textBaseline = "alphabetic";
    var th = Math.max(2, S * .055);
    linhas.forEach(function(l, i){
      var x = pad + (c.align === "left" ? 0 : c.align === "right" ? maxW - larg[i] : (maxW - larg[i]) / 2);
      var y = pad + i * LH + S * .82;
      l.forEach(function(t, k){ var x0 = x; ctx.font = fonte(p, t.b); Array.from(t.t).forEach(function(ch){ ctx.fillText(ch, x, y); x += ctx.measureText(ch).width + ls; });
        if(t.u && t.t){ var fim = x - ((k === l.length - 1 || !l[k + 1].u) ? ls : 0); ctx.fillRect(x0, y + S * .1, Math.max(0, fim - x0), th); } });
    });
    return recorta(cv, Math.round(S * .06));
  }
  function recorta(c, pad){
    var d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data, W = c.width, H = c.height, x0 = W, y0 = H, x1 = -1, y1 = -1;
    for(var y = 0; y < H; y++){ for(var x = 0; x < W; x++){ if(d[(y * W + x) * 4 + 3] > 8){ if(x < x0) x0 = x; if(x > x1) x1 = x; if(y < y0) y0 = y; if(y > y1) y1 = y; } } }
    if(x1 < 0) return c;
    x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad); x1 = Math.min(W, x1 + pad + 1); y1 = Math.min(H, y1 + pad + 1);
    var o = document.createElement("canvas"); o.width = x1 - x0; o.height = y1 - y0; o.getContext("2d").drawImage(c, x0, y0, o.width, o.height, 0, 0, o.width, o.height); return o;
  }
  function lum(h){ var n = parseInt(String(h).slice(1), 16); return isNaN(n) ? 1 : (0.2126 * (n >> 16 & 255) + 0.7152 * (n >> 8 & 255) + 0.0722 * (n & 255)) / 255; }

  /* interface */
  function card(p){
    var c = cfg(p), P = paleta();
    var cores = [["c1","Principal",P.c1],["c2","Destaque",P.c2],["c3","Texto",P.c3],["branco","Branco","#FFFFFF"],["preto","Preto","#000000"]];
    return '<section class="panel mf" data-id="' + p.id + '">' +
      '<div class="mf-h"><h2 class="label" style="font-size:13px;margin:0">' + esc(p.nome) + '</h2><span class="mf-tag" style="font-family:\'' + p.fam + '\';font-weight:' + p.peso + '">Aa</span></div>' +
      '<div class="preview mf-pv"><img alt="Prévia em ' + esc(p.nome) + '"></div>' +
      '<div class="field"><div class="op-head"><span class="label">Largura da linha</span><span class="mf-wv">' + (c.w > 0 ? c.w.toFixed(1) : "Livre") + '</span></div><input type="range" class="mf-w" min="2" max="30.5" step="0.5" value="' + (c.w > 0 ? c.w : 30.5) + '" aria-label="Largura da linha: arraste para quebrar o texto em mais linhas"></div>' +
      '<textarea class="nin mf-txt" rows="3" placeholder="' + esc(p.exemplo.replace(/\*\*|__/g, "")) + '">' + esc(c.texto) + '</textarea>' +
      '<div class="seg mf-fmt">' + (p.negrito !== p.peso ? '<button type="button" data-m="**" title="Negrito no trecho selecionado"><b>N</b> Negrito</button>' : '') + '<button type="button" data-m="__" title="Sublinhar o trecho selecionado"><span style="text-decoration:underline;text-underline-offset:3px">S</span> Sublinhado</button></div>' +
      '<p class="muted" style="font-size:12px">Selecione um trecho e toque em ' + (p.negrito !== p.peso ? 'Negrito ou ' : '') + 'Sublinhado. Toque de novo para tirar. Enter quebra a linha.</p>' +
      '<div class="sheet-actions"><button class="btn mf-copy" type="button">Copiar</button><button class="btn ghost mf-save" type="button">Salvar PNG</button></div>' +
      '<p class="status mf-st" role="status"></p>' +
      '<details class="mf-aj"><summary>Ajustes</summary>' +
        '<div class="seg mf-cor">' + cores.map(function(k){ return '<button type="button" data-v="' + k[0] + '" aria-pressed="' + (c.cor === k[0]) + '"><i style="background:' + k[2] + '"></i>' + k[1] + '</button>'; }).join("") +
          '<label class="tcustom' + (c.cor === "custom" ? " on" : "") + '"><i style="background:' + c.custom + '"></i>Outra<input type="color" value="' + c.custom + '"></label></div>' +
        '<div class="seg mf-al">' + [["left","Esquerda"],["center","Centro"],["right","Direita"]].map(function(a){ return '<button type="button" data-v="' + a[0] + '" aria-pressed="' + (c.align === a[0]) + '">' + a[1] + '</button>'; }).join("") + '</div>' +
        '<div class="field"><div class="op-head"><span class="label">Espaço entre letras</span><span class="mf-lsv">' + Math.round(c.ls * 1000) + '</span></div><input type="range" class="mf-ls" min="-150" max="300" step="1" value="' + Math.round(c.ls * 1000) + '"></div>' +
        '<div class="field"><div class="op-head"><span class="label">Espaço entre linhas</span><span class="mf-lhv">' + c.lh.toFixed(2) + '</span></div><input type="range" class="mf-lh" min="0.6" max="2" step="0.01" value="' + c.lh + '"></div>' +
        '<button class="link mf-reset" type="button">Voltar ao meu padrão</button>' +
      '</details></section>';
  }
  var timers = {};
  function desenhar(p, el){
    clearTimeout(timers[p.id]);
    timers[p.id] = setTimeout(function(){
      carregar(p).then(function(){ var c = cfg(p), cv = render(p, c); el.querySelector(".mf-pv img").src = cv.toDataURL("image/png"); el.querySelector(".mf-pv").classList.toggle("light", lum(corDe(c)) < 0.25); });
    }, 90);
  }
  function blob(p){ return carregar(p).then(function(){ var cv = render(p, cfg(p)); return new Promise(function(r){ cv.toBlob(r, "image/png"); }); }); }
  function set(p, k, v){ st[p.id] = st[p.id] || {}; st[p.id][k] = v; save(); }
  function ligar(p, el){
    var msg = function(t, ok){ var s = el.querySelector(".mf-st"); s.textContent = t; s.className = "status mf-st" + (ok ? " ok" : ""); };
    var ta = el.querySelector(".mf-txt");
    ta.addEventListener("input", function(e){ set(p, "texto", e.target.value); desenhar(p, el); });
    el.querySelectorAll(".mf-fmt button").forEach(function(b){
      b.addEventListener("mousedown", function(e){ e.preventDefault(); }); // não perde a seleção
      b.onclick = function(){ var mk = b.dataset.m, v = ta.value, a = ta.selectionStart, z = ta.selectionEnd, n = mk.length;
        if(a === z){ ta.setRangeText(mk + mk, a, z, "end"); ta.setSelectionRange(a + n, a + n); }
        else if(v.slice(a - n, a) === mk && v.slice(z, z + n) === mk){ ta.value = v.slice(0, a - n) + v.slice(a, z) + v.slice(z + n); ta.setSelectionRange(a - n, z - n); }
        else if(v.slice(a, a + n) === mk && v.slice(z - n, z) === mk && z - a >= 2 * n){ ta.value = v.slice(0, a) + v.slice(a + n, z - n) + v.slice(z); ta.setSelectionRange(a, z - 2 * n); }
        else { ta.value = v.slice(0, a) + mk + v.slice(a, z) + mk + v.slice(z); ta.setSelectionRange(a + n, z + n); }
        ta.focus(); ta.dispatchEvent(new Event("input")); };
    });
    el.querySelectorAll(".mf-cor button").forEach(function(b){ b.onclick = function(){ set(p, "cor", b.dataset.v); refazer(); }; });
    var ci = el.querySelector(".mf-cor input"); ci.oninput = function(){ set(p, "custom", ci.value); set(p, "cor", "custom"); desenhar(p, el); el.querySelectorAll(".mf-cor button").forEach(function(b){ b.setAttribute("aria-pressed", "false"); }); ci.parentNode.classList.add("on"); ci.parentNode.querySelector("i").style.background = ci.value; };
    el.querySelectorAll(".mf-al button").forEach(function(b){ b.onclick = function(){ set(p, "align", b.dataset.v); el.querySelectorAll(".mf-al button").forEach(function(x){ x.setAttribute("aria-pressed", String(x === b)); }); desenhar(p, el); }; });
    el.querySelector(".mf-ls").oninput = function(e){ set(p, "ls", +e.target.value / 1000); el.querySelector(".mf-lsv").textContent = e.target.value; desenhar(p, el); };
    el.querySelector(".mf-lh").oninput = function(e){ set(p, "lh", +e.target.value); el.querySelector(".mf-lhv").textContent = (+e.target.value).toFixed(2); desenhar(p, el); };
    el.querySelector(".mf-w").oninput = function(e){ var v = +e.target.value; v = v >= 30.5 ? 0 : v; set(p, "w", v); el.querySelector(".mf-wv").textContent = v > 0 ? v.toFixed(1) : "Livre"; desenhar(p, el); };
    el.querySelector(".mf-reset").onclick = function(){ var t = (st[p.id] || {}).texto; st[p.id] = {texto: t}; save(); refazer(); };
    el.querySelector(".mf-copy").onclick = function(){
      if(!(window.ClipboardItem && navigator.clipboard && navigator.clipboard.write)){ msg("Seu celular não deixa copiar direto. Toque e segure a prévia e escolha Copiar."); return; }
      navigator.clipboard.write([new ClipboardItem({"image/png": blob(p)})]).then(function(){ msg("Copiado! Agora é só colar.", true); }, function(){ msg("Não deu para copiar direto. Toque e segure a prévia e escolha Copiar."); });
    };
    el.querySelector(".mf-save").onclick = function(){ blob(p).then(function(b){ var u = URL.createObjectURL(b), a = document.createElement("a"); a.href = u; a.download = p.id + "-" + Date.now() + ".png"; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function(){ URL.revokeObjectURL(u); }, 4000); msg("PNG salvo com fundo transparente.", true); }); };
    desenhar(p, el);
  }
  function refazer(){
    var box = $("mfGrid"); if(!box) return;
    var abertos = {}; box.querySelectorAll(".mf").forEach(function(s){ abertos[s.dataset.id] = s.querySelector(".mf-aj").open; });
    box.innerHTML = PRESETS.map(card).join("");
    PRESETS.forEach(function(p){ var el = box.querySelector('[data-id="' + p.id + '"]'); if(abertos[p.id]) el.querySelector(".mf-aj").open = true; ligar(p, el); });
  }
  window.SOSMinhas = { abrir: refazer, refresh: function(){ if($("viewMine") && !$("viewMine").hidden) refazer(); } };
})();
