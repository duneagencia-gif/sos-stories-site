/* Textos: escreve, estiliza com as cores da paleta e copia como figurinha (PNG transparente) */
(function(){
  "use strict";
  var $ = function(id){ return document.getElementById(id); };
  var FONTS = [
    {n:"Playfair Display", c:"Elegantes", g:"Playfair+Display:ital,wght@0,400;0,700;1,400;1,700"},
    {n:"Cormorant Garamond", c:"Elegantes", g:"Cormorant+Garamond:ital,wght@0,400;0,700;1,400;1,700"},
    {n:"Bodoni Moda", c:"Elegantes", g:"Bodoni+Moda:ital,wght@0,400;0,700;1,400"},
    {n:"DM Serif Display", c:"Elegantes", g:"DM+Serif+Display:ital@0;1"},
    {n:"Cinzel", c:"Elegantes", g:"Cinzel:wght@400;700"},
    {n:"Italiana", c:"Elegantes", g:"Italiana"},
    {n:"Great Vibes", c:"Manuscritas", g:"Great+Vibes"},
    {n:"Allura", c:"Manuscritas", g:"Allura"},
    {n:"Pinyon Script", c:"Manuscritas", g:"Pinyon+Script"},
    {n:"Parisienne", c:"Manuscritas", g:"Parisienne"},
    {n:"Mrs Saint Delafield", c:"Manuscritas", g:"Mrs+Saint+Delafield"},
    {n:"Alex Brush", c:"Manuscritas", g:"Alex+Brush"},
    {n:"Sacramento", c:"Manuscritas", g:"Sacramento"},
    {n:"Dancing Script", c:"Manuscritas", g:"Dancing+Script:wght@400;700"},
    {n:"Poppins", c:"Modernas", g:"Poppins:ital,wght@0,300;0,400;0,700;1,400"},
    {n:"Montserrat", c:"Modernas", g:"Montserrat:ital,wght@0,400;0,700;1,400"},
    {n:"Josefin Sans", c:"Modernas", g:"Josefin+Sans:ital,wght@0,300;0,400;0,700;1,400"},
    {n:"Bebas Neue", c:"Modernas", g:"Bebas+Neue"},
    {n:"Caveat", c:"Descontraídas", g:"Caveat:wght@400;700"},
    {n:"Homemade Apple", c:"Descontraídas", g:"Homemade+Apple"},
    {n:"Nothing You Could Do", c:"Descontraídas", g:"Nothing+You+Could+Do"},
    {n:"Reenie Beanie", c:"Descontraídas", g:"Reenie+Beanie"},
    {n:"Pompiere", c:"Descontraídas", g:"Pompiere"}
  ];
  var CATS = ["Todas","Elegantes","Manuscritas","Modernas","Descontraídas","Minhas fontes"];
  var DEF = {text:"Seu texto aqui", font:"Playfair Display", color:"c1", custom:"#C9A27E", size:72, ls:0, lh:120, align:"center", bold:false, italic:false, upper:false, bg:"none", bgColor:"c3", bgCustom:"#FFFFFF"};
  var st = Object.assign({}, DEF, safeGet("fig_txt") || {});
  var cat = "Todas", myFonts = [], loaded = false, renderT = 0, lastBlob = null, seq = 0;

  function safeGet(k){ try{ return JSON.parse(localStorage.getItem(k)); }catch(e){ return null; } }
  function save(){ try{ localStorage.setItem("fig_txt", JSON.stringify(st)); }catch(e){} }
  function palette(){ try{ return pal; }catch(e){ return {c1:"#C9A27E",c2:"#3B2F2A",c3:"#FFF8F0"}; } }
  function colorOf(key, custom){ return key === "custom" ? custom : (palette()[key] || "#000000"); }
  function esc(t){ return String(t).replace(/[&<>"']/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]; }); }

  /* ---------- fontes ---------- */
  function loadGoogle(){
    if(loaded) return; loaded = true;
    var l = document.createElement("link"); l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?" + FONTS.map(function(f){ return "family=" + f.g; }).join("&") + "&display=swap";
    document.head.appendChild(l);
    l.onload = function(){ renderFonts(); schedule(); };
  }
  /* fontes enviadas pela pessoa ficam só neste aparelho (IndexedDB) */
  function idb(){ return new Promise(function(res, rej){ try{ var r = indexedDB.open("sos-fontes", 1); r.onupgradeneeded = function(){ r.result.createObjectStore("f", {keyPath:"n"}); }; r.onsuccess = function(){ res(r.result); }; r.onerror = function(){ rej(r.error); }; }catch(e){ rej(e); } }); }
  function idbAll(){ return idb().then(function(db){ return new Promise(function(res){ var q = db.transaction("f").objectStore("f").getAll(); q.onsuccess = function(){ res(q.result || []); }; q.onerror = function(){ res([]); }; }); }).catch(function(){ return []; }); }
  function idbPut(o){ return idb().then(function(db){ return new Promise(function(res){ var t = db.transaction("f","readwrite"); t.objectStore("f").put(o); t.oncomplete = res; t.onerror = res; }); }).catch(function(){}); }
  function idbDel(n){ return idb().then(function(db){ return new Promise(function(res){ var t = db.transaction("f","readwrite"); t.objectStore("f").delete(n); t.oncomplete = res; t.onerror = res; }); }).catch(function(){}); }
  function addFace(name, buf){
    var face = new FontFace(name, buf);
    return face.load().then(function(f){ document.fonts.add(f); if(myFonts.indexOf(name) < 0) myFonts.push(name); });
  }
  function loadMine(){
    return idbAll().then(function(list){
      return Promise.all(list.map(function(o){ return addFace(o.n, o.b).catch(function(){}); }));
    }).then(function(){ renderFonts(); });
  }

  /* ---------- interface ---------- */
  function renderCats(){
    $("tCats").innerHTML = CATS.map(function(c){ return '<button type="button" class="sec" aria-pressed="' + (c === cat) + '" data-c="' + esc(c) + '">' + esc(c) + '</button>'; }).join("");
    $("tCats").querySelectorAll("button").forEach(function(b){ b.onclick = function(){ cat = b.dataset.c; renderCats(); renderFonts(); }; });
  }
  function renderFonts(){
    var list = cat === "Minhas fontes" ? myFonts.map(function(n){ return {n:n, mine:true}; })
             : FONTS.filter(function(f){ return cat === "Todas" || f.c === cat; }).concat(cat === "Todas" ? myFonts.map(function(n){ return {n:n, mine:true}; }) : []);
    var html = list.map(function(f){
      var label = f.mine ? f.n.replace(/^Minha: /, "") : f.n;
      return '<button type="button" class="tfont" aria-pressed="' + (f.n === st.font) + '" data-f="' + esc(f.n) + '" style="font-family:\'' + esc(f.n) + '\',serif"><b>Aa</b><span>' + esc(label) + '</span></button>';
    }).join("");
    if(cat === "Minhas fontes" && !myFonts.length) html = '<p class="muted">Nenhuma fonte sua ainda. Toque em “Adicionar minha fonte” para usar uma fonte que você tem no computador ou no celular (.ttf, .otf ou .woff).</p>';
    $("tFonts").innerHTML = html;
    $("tFonts").querySelectorAll(".tfont").forEach(function(b){ b.onclick = function(){ st.font = b.dataset.f; changed(); renderFonts(); }; });
    $("tDelFont").hidden = !(st.font.indexOf("Minha: ") === 0);
  }
  function swatches(el, key, customKey, allowNone){
    var p = palette();
    var opts = [["c1","Principal"],["c2","Destaque"],["c3","Texto"]];
    el.innerHTML = opts.map(function(o){
      return '<button type="button" aria-pressed="' + (st[key] === o[0]) + '" data-v="' + o[0] + '"><i style="background:' + p[o[0]] + '"></i>' + o[1] + '</button>';
    }).join("") + '<label class="tcustom' + (st[key] === "custom" ? " on" : "") + '"><i style="background:' + st[customKey] + '"></i>Outra<input type="color" value="' + st[customKey] + '" aria-label="Escolher outra cor"></label>';
    el.querySelectorAll("button").forEach(function(b){ b.onclick = function(){ st[key] = b.dataset.v; changed(); syncUI(); }; });
    var inp = el.querySelector("input");
    inp.oninput = function(){ st[key] = "custom"; st[customKey] = inp.value; changed(); syncUI(); };
  }
  function seg(el, key){
    el.querySelectorAll("button").forEach(function(b){
      b.setAttribute("aria-pressed", String(st[key] === b.dataset.v));
      b.onclick = function(){ st[key] = b.dataset.v; changed(); syncUI(); };
    });
  }
  function syncUI(){
    if($("tTxt").value !== st.text) $("tTxt").value = st.text;
    [["tSize","size",""],["tLs","ls",""],["tLh","lh","%"]].forEach(function(a){ $(a[0]).value = st[a[1]]; $(a[0] + "V").textContent = st[a[1]] + a[2]; });
    $("tBold").setAttribute("aria-pressed", String(st.bold));
    $("tItalic").setAttribute("aria-pressed", String(st.italic));
    $("tUpper").setAttribute("aria-pressed", String(st.upper));
    seg($("tAlign"), "align"); seg($("tBg"), "bg");
    swatches($("tColor"), "color", "custom");
    $("tBgColorWrap").hidden = st.bg === "none";
    swatches($("tBgColor"), "bgColor", "bgCustom");
  }
  function changed(){ save(); schedule(); }
  function schedule(){ clearTimeout(renderT); renderT = setTimeout(draw, 120); }

  /* ---------- desenho ---------- */
  function fontStr(px){ return (st.italic ? "italic " : "") + (st.bold ? "700 " : "400 ") + px + "px '" + st.font + "'"; }
  function lineWidth(ctx, line, ls){
    if(!ls) return ctx.measureText(line).width;
    var w = 0, chars = Array.from(line);
    chars.forEach(function(ch){ w += ctx.measureText(ch).width; });
    return w + ls * Math.max(0, chars.length - 1);
  }
  function drawLine(ctx, line, x, y, ls){
    if(!ls){ ctx.fillText(line, x, y); return; }
    Array.from(line).forEach(function(ch){ ctx.fillText(ch, x, y); x += ctx.measureText(ch).width + ls; });
  }
  function rrect(ctx, x, y, w, h, r){
    r = Math.min(r, h / 2, w / 2);
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); ctx.fill();
  }
  function renderCanvas(k){
    var S = st.size * k, ls = st.ls / 100 * S, LH = S * st.lh / 100;
    var raw = (st.text || " ").replace(/\r/g, "");
    var lines = (st.upper ? raw.toLocaleUpperCase("pt-BR") : raw).split("\n");
    var m = document.createElement("canvas").getContext("2d"); m.font = fontStr(S);
    var widths = lines.map(function(l){ return lineWidth(m, l, ls); });
    var maxW = Math.max.apply(null, widths.concat([S * 0.3]));
    var padX = S * 0.42, padY = S * 0.22, margin = S * 0.9;
    var W = Math.ceil(maxW + margin * 2 + padX * 2), H = Math.ceil(LH * lines.length + margin * 2 + padY * 2);
    var c = document.createElement("canvas"); c.width = W; c.height = H;
    var ctx = c.getContext("2d"); ctx.font = fontStr(S); ctx.textBaseline = "middle";
    var top = margin + padY, left = margin + padX;
    var bg = colorOf(st.bgColor, st.bgCustom), fg = colorOf(st.color, st.custom);
    function lineX(i){ return st.align === "left" ? left : st.align === "right" ? left + maxW - widths[i] : left + (maxW - widths[i]) / 2; }
    if(st.bg === "box"){ ctx.fillStyle = bg; rrect(ctx, left - padX, top - padY, maxW + padX * 2, LH * lines.length + padY * 2, S * 0.28); }
    if(st.bg === "line"){ ctx.fillStyle = bg; lines.forEach(function(l, i){ if(!l.trim()) return; var h = S * 1.2; rrect(ctx, lineX(i) - padX * 0.7, top + i * LH + LH / 2 - h / 2, widths[i] + padX * 1.4, h, S * 0.22); }); }
    ctx.fillStyle = fg;
    lines.forEach(function(l, i){ drawLine(ctx, l, lineX(i), top + i * LH + LH / 2, ls); });
    return trim(c, Math.round(S * 0.08));
  }
  function trim(c, pad){
    var ctx = c.getContext("2d"), d = ctx.getImageData(0, 0, c.width, c.height).data, W = c.width, H = c.height;
    var x0 = W, y0 = H, x1 = -1, y1 = -1;
    for(var y = 0; y < H; y += 2){ for(var x = 0; x < W; x += 2){ if(d[(y * W + x) * 4 + 3] > 8){ if(x < x0) x0 = x; if(x > x1) x1 = x; if(y < y0) y0 = y; if(y > y1) y1 = y; } } }
    if(x1 < 0) return c;
    x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad); x1 = Math.min(W, x1 + pad + 2); y1 = Math.min(H, y1 + pad + 2);
    var o = document.createElement("canvas"); o.width = x1 - x0; o.height = y1 - y0;
    o.getContext("2d").drawImage(c, x0, y0, o.width, o.height, 0, 0, o.width, o.height);
    return o;
  }
  function ready(){
    var probe = fontStr(40);
    return document.fonts.load(probe, st.text || "Aa").catch(function(){}).then(function(){ return document.fonts.ready; });
  }
  function draw(){
    var my = ++seq;
    ready().then(function(){
      if(my !== seq) return;
      var cv = renderCanvas(3);
      lastBlob = new Promise(function(res){ cv.toBlob(function(b){ res(b); }, "image/png"); });
      $("tPv").src = cv.toDataURL("image/png");
      var dark = Math.max(lum(colorOf(st.color, st.custom)), st.bg === "none" ? 0 : lum(colorOf(st.bgColor, st.bgCustom))) < 0.2;
      $("tPreview").classList.toggle("light", dark);
    });
  }
  function lum(h){ var n = parseInt(String(h).replace("#", ""), 16); if(isNaN(n)) return 1; var r = (n >> 16 & 255) / 255, g = (n >> 8 & 255) / 255, b = (n & 255) / 255; return 0.2126 * r + 0.7152 * g + 0.0722 * b; }
  function freshBlob(){ return ready().then(function(){ var cv = renderCanvas(3); return new Promise(function(res, rej){ cv.toBlob(function(b){ b ? res(b) : rej(new Error("png")); }, "image/png"); }); }); }
  function msg(t, ok){ var el = $("tStatus"); el.textContent = t; el.className = "status" + (ok ? " ok" : ""); }

  function copy(){
    if(!(window.ClipboardItem && navigator.clipboard && navigator.clipboard.write)){
      msg("Seu celular não deixa copiar direto. Toque e segure a prévia acima e escolha Copiar ou Salvar imagem.");
      return;
    }
    navigator.clipboard.write([new ClipboardItem({"image/png": freshBlob()})])
      .then(function(){ msg("Texto copiado! Agora cole no Stories.", true); if(typeof toast === "function") toast("Texto copiado!"); })
      .catch(function(){ msg("Não deu para copiar direto. Toque e segure a prévia acima e escolha Copiar ou Salvar imagem."); });
  }
  function download(){
    freshBlob().then(function(b){
      var u = URL.createObjectURL(b), a = document.createElement("a");
      var nm = (st.text || "texto").split("\n")[0].toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "texto";
      a.href = u; a.download = nm + ".png"; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function(){ URL.revokeObjectURL(u); }, 4000);
      msg("Imagem salva em PNG com fundo transparente.", true);
    }).catch(function(){ msg("Não consegui gerar a imagem. Tente de novo."); });
  }

  /* ---------- eventos ---------- */
  function init(){
    if(!$("viewTxt")) return;
    renderCats(); renderFonts(); syncUI();
    $("tTxt").addEventListener("input", function(e){ st.text = e.target.value; changed(); });
    [["tSize","size"],["tLs","ls"],["tLh","lh"]].forEach(function(a){
      $(a[0]).addEventListener("input", function(e){ st[a[1]] = +e.target.value; $(a[0] + "V").textContent = st[a[1]] + (a[1] === "lh" ? "%" : ""); changed(); });
    });
    ["Bold","Italic","Upper"].forEach(function(k){
      var key = k.toLowerCase(); $("t" + k).addEventListener("click", function(){ st[key] = !st[key]; changed(); syncUI(); });
    });
    $("tCopy").addEventListener("click", copy);
    $("tSave").addEventListener("click", download);
    $("tReset").addEventListener("click", function(){ var t = st.text, f = st.font; st = Object.assign({}, DEF, {text:t, font:f}); changed(); syncUI(); renderFonts(); });
    $("tFontFile").addEventListener("change", function(e){
      var f = e.target.files && e.target.files[0]; if(!f) return;
      var name = "Minha: " + f.name.replace(/\.(ttf|otf|woff2?)$/i, "");
      f.arrayBuffer().then(function(buf){
        return addFace(name, buf).then(function(){ return idbPut({n:name, b:buf}); }).then(function(){
          st.font = name; cat = "Minhas fontes"; changed(); renderCats(); renderFonts(); msg("Fonte adicionada neste aparelho.", true);
        });
      }).catch(function(){ msg("Não consegui abrir essa fonte. Use um arquivo .ttf, .otf ou .woff."); });
      e.target.value = "";
    });
    $("tDelFont").addEventListener("click", function(){
      var n = st.font; if(n.indexOf("Minha: ") !== 0) return;
      idbDel(n).then(function(){ myFonts = myFonts.filter(function(x){ return x !== n; }); st.font = DEF.font; changed(); renderFonts(); msg("Fonte removida deste aparelho."); });
    });
    /* abre a aba: carrega as fontes e redesenha com a paleta atual */
    document.querySelectorAll('.tabbar button[data-tab="txt"]').forEach(function(b){
      b.addEventListener("click", function(){ loadGoogle(); syncUI(); schedule(); });
    });
    loadMine();
  }
  window.SOSTextos = { refresh: function(){ if($("viewTxt") && !$("viewTxt").hidden){ syncUI(); schedule(); } } };
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
