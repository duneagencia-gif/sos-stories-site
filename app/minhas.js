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
  function cfg(p){ var o = st[p.id] || {}; return {texto: o.texto != null ? o.texto : "", cor: o.cor || p.cor, custom: o.custom || "#FFFFFF", align: o.align || p.align, ls: o.ls != null ? o.ls : p.ls, lh: o.lh != null ? o.lh : p.lh}; }
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

  /* desenho: cada linha vira trechos normais e **negrito** */
  function trechos(linha){ var out = [], re = /\*\*(.+?)\*\*/g, i = 0, m; while((m = re.exec(linha))){ if(m.index > i) out.push([linha.slice(i, m.index), false]); out.push([m[1], true]); i = re.lastIndex; } if(i < linha.length) out.push([linha.slice(i), false]); return out.length ? out : [["", false]]; }
  function fonte(p, b){ return (b ? p.negrito : p.peso) + " " + S + "px '" + p.fam + "'"; }
  function largura(ctx, p, t, b, ls){ ctx.font = fonte(p, b); var ch = Array.from(t); var w = 0; ch.forEach(function(c){ w += ctx.measureText(c).width; }); return w + ls * ch.length; }
  function render(p, c){
    var ls = c.ls * S, LH = S * c.lh;
    var linhas = (c.texto || p.exemplo).replace(/\r/g, "").split("\n").map(trechos);
    var m = document.createElement("canvas").getContext("2d");
    var larg = linhas.map(function(l){ return l.reduce(function(a, t){ return a + largura(m, p, t[0], t[1], ls); }, 0) - ls; });
    var maxW = Math.max.apply(null, larg.concat([S * .3])), pad = S * .6;
    var cv = document.createElement("canvas"); cv.width = Math.ceil(maxW + pad * 2); cv.height = Math.ceil(LH * linhas.length + pad * 2 + S * .4);
    var ctx = cv.getContext("2d"); ctx.fillStyle = corDe(c); ctx.textBaseline = "alphabetic";
    linhas.forEach(function(l, i){
      var x = pad + (c.align === "left" ? 0 : c.align === "right" ? maxW - larg[i] : (maxW - larg[i]) / 2);
      var y = pad + i * LH + S * .82;
      l.forEach(function(t){ ctx.font = fonte(p, t[1]); Array.from(t[0]).forEach(function(ch){ ctx.fillText(ch, x, y); x += ctx.measureText(ch).width + ls; }); });
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
      '<textarea class="nin mf-txt" rows="3" placeholder="' + esc(p.exemplo.replace(/\*\*/g, "")) + '">' + esc(c.texto) + '</textarea>' +
      '<p class="muted" style="font-size:12px">Enter quebra a linha.' + (p.negrito !== p.peso ? ' Use <b>**palavra**</b> para deixar em negrito.' : '') + '</p>' +
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
    el.querySelector(".mf-txt").addEventListener("input", function(e){ set(p, "texto", e.target.value); desenhar(p, el); });
    el.querySelectorAll(".mf-cor button").forEach(function(b){ b.onclick = function(){ set(p, "cor", b.dataset.v); refazer(); }; });
    var ci = el.querySelector(".mf-cor input"); ci.oninput = function(){ set(p, "custom", ci.value); set(p, "cor", "custom"); desenhar(p, el); el.querySelectorAll(".mf-cor button").forEach(function(b){ b.setAttribute("aria-pressed", "false"); }); ci.parentNode.classList.add("on"); ci.parentNode.querySelector("i").style.background = ci.value; };
    el.querySelectorAll(".mf-al button").forEach(function(b){ b.onclick = function(){ set(p, "align", b.dataset.v); el.querySelectorAll(".mf-al button").forEach(function(x){ x.setAttribute("aria-pressed", String(x === b)); }); desenhar(p, el); }; });
    el.querySelector(".mf-ls").oninput = function(e){ set(p, "ls", +e.target.value / 1000); el.querySelector(".mf-lsv").textContent = e.target.value; desenhar(p, el); };
    el.querySelector(".mf-lh").oninput = function(e){ set(p, "lh", +e.target.value); el.querySelector(".mf-lhv").textContent = (+e.target.value).toFixed(2); desenhar(p, el); };
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
