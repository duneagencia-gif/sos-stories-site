/* Narrativas Estratégicas — módulo independente do Estúdio de Figurinhas.
   Não chama nenhuma API: monta o prompt localmente e guarda só o briefing no navegador. */
(function(){
  "use strict";
  var STORE_KEY = "sosStories.minhaMarca.v1";
  var STRATS = window.NARR_STRATEGIES || [];
  var UNIVERSAL = window.NARR_UNIVERSAL || "";
  var CATS = [];
  STRATS.forEach(function(s){ if(CATS.indexOf(s.cat) < 0) CATS.push(s.cat); });

  var TONS = ["próxima","profissional","acolhedora","descontraída","sofisticada","didática"];
  var OBJETIVOS = ["conexão","autoridade","vendas","interação","apresentar soluções","equilibrado"];
  var FIELDS = [
    {k:"nome", label:"Nome do negócio", type:"text", req:true, max:120},
    {k:"segmento", label:"Segmento / área de atuação", type:"text", req:true, max:160},
    {k:"oferta", label:"O que você vende ou oferece?", hint:"Produtos e serviços reais.", type:"area", req:true, max:2000},
    {k:"publico", label:"Quem é seu público?", hint:"Perfil, necessidades e contexto.", type:"area", req:true, max:2000},
    {k:"dores", label:"Quais problemas, desejos ou dúvidas seu público costuma ter?", type:"area", max:2000},
    {k:"diferenciais", label:"O que diferencia sua marca?", hint:"Apenas diferenciais verdadeiros.", type:"area", max:2000},
    {k:"tom", label:"Como sua marca se comunica?", type:"tom", req:true, max:400},
    {k:"objetivo", label:"Qual é o objetivo principal dos seus Stories?", type:"select", max:60},
    {k:"compra", label:"Como funciona a compra ou contratação?", hint:"Canais, etapas e condições confirmadas.", type:"area", max:2000},
    {k:"regras", label:"Informações importantes que a IA deve respeitar", hint:"Limites, termos, restrições e preferências.", type:"area", max:2000}
  ];
  var BRIEF_LABELS = {
    nome:"Nome do negócio", segmento:"Segmento / área de atuação", oferta:"O que vende ou oferece",
    publico:"Público", dores:"Problemas, desejos ou dúvidas do público", diferenciais:"O que diferencia a marca",
    tom:"Como a marca se comunica", objetivo:"Objetivo principal dos Stories",
    compra:"Como funciona a compra ou contratação", regras:"Informações importantes que a IA deve respeitar"
  };
  var CTX_MAX = 1500;

  function $(id){ return document.getElementById(id); }
  function el(tag, attrs, text){
    var e = document.createElement(tag);
    if(attrs) Object.keys(attrs).forEach(function(k){
      if(k === "class") e.className = attrs[k]; else e.setAttribute(k, attrs[k]);
    });
    if(text != null) e.textContent = text;
    return e;
  }
  function cap(s){ return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
  function load(){
    try{ var v = JSON.parse(localStorage.getItem(STORE_KEY) || "null"); return v && typeof v === "object" ? v : {}; }
    catch(e){ return {}; }
  }
  function save(data){
    try{ localStorage.setItem(STORE_KEY, JSON.stringify(data)); return true; }
    catch(e){ return false; }
  }
  var brand = load();

  function filled(k){
    if(k === "tom") return !!(brand.tom && String(brand.tom).trim());
    return !!(brand[k] && String(brand[k]).trim());
  }
  function missingRequired(){
    return FIELDS.filter(function(f){ return f.req && !filled(f.k); });
  }

  /* ---------- abas ---------- */
  function showTab(name){
    var fig = name !== "narr";
    $("viewFig").hidden = !fig;
    $("viewNarr").hidden = fig;
    document.querySelectorAll(".tabbar button").forEach(function(b){
      var on = b.dataset.tab === name;
      b.setAttribute("aria-selected", String(on));
      b.tabIndex = on ? 0 : -1;
    });
    var sheet = $("sheet");
    if(!fig && sheet && !sheet.hidden){ var c = $("close"); if(c) c.click(); }
    window.scrollTo(0, 0);
  }
  document.querySelectorAll(".tabbar button").forEach(function(b){
    b.addEventListener("click", function(){ showTab(b.dataset.tab); });
    b.addEventListener("keydown", function(e){
      if(e.key === "ArrowRight" || e.key === "ArrowLeft"){
        var other = document.querySelector('.tabbar button:not([data-tab="' + b.dataset.tab + '"])');
        other.focus(); other.click(); e.preventDefault();
      }
    });
  });

  /* ---------- Minha Marca ---------- */
  function renderBrandSummary(){
    var n = FIELDS.filter(function(f){ return filled(f.k); }).length;
    var miss = missingRequired();
    $("brandName").textContent = brand.nome ? brand.nome : "Ainda não preenchida";
    $("brandStatus").textContent = n + " de " + FIELDS.length + " informações" + (miss.length ? " · faltam obrigatórias" : " · pronta para usar");
    $("brandMeter").style.width = Math.round(n / FIELDS.length * 100) + "%";
    $("brandCard").classList.toggle("ok", !miss.length);
    $("brandEdit").textContent = n ? "Editar informações" : "Preencher minha marca";
  }

  function buildForm(){
    var box = $("brandFields");
    box.textContent = "";
    FIELDS.forEach(function(f){
      var wrap = el("div", {"class":"nf"});
      var id = "mm-" + f.k;
      if(f.type === "tom"){
        var fs = el("fieldset", {"class":"nf-tom"});
        var lg = el("legend", null, f.label);
        lg.appendChild(el("span", {"class":"req", "aria-hidden":"true"}, " *"));
        fs.appendChild(lg);
        var opts = el("div", {"class":"nchips", role:"radiogroup"});
        var cur = brand.tomBase || "";
        TONS.forEach(function(t){
          var lab = el("label", {"class":"nchip"});
          var r = el("input", {type:"radio", name:"mm-tom", value:t, id:"mm-tom-" + t.replace(/\W/g,"")});
          if(cur === t) r.checked = true;
          lab.appendChild(r); lab.appendChild(el("span", null, cap(t)));
          opts.appendChild(lab);
        });
        fs.appendChild(opts);
        var obsLab = el("label", {"for":"mm-tomObs", "class":"nf-sub"}, "Observação sobre o tom (opcional)");
        var obs = el("input", {type:"text", id:"mm-tomObs", "class":"nin", autocomplete:"off"});
        obs.value = brand.tomObs || "";
        fs.appendChild(obsLab); fs.appendChild(obs);
        fs.appendChild(el("p", {"class":"nerr", id:"err-tom", role:"alert"}));
        wrap.appendChild(fs);
        box.appendChild(wrap);
        return;
      }
      var lab = el("label", {"for":id}, f.label);
      if(f.req) lab.appendChild(el("span", {"class":"req", "aria-hidden":"true"}, " *"));
      else lab.appendChild(el("span", {"class":"opt"}, " (opcional)"));
      wrap.appendChild(lab);
      if(f.hint) wrap.appendChild(el("p", {"class":"nhint", id:id + "-hint"}, f.hint));
      var input;
      if(f.type === "area"){ input = el("textarea", {id:id, rows:"3", "class":"nin"}); }
      else if(f.type === "select"){
        input = el("select", {id:id, "class":"nin"});
        input.appendChild(el("option", {value:""}, "Não informar"));
        OBJETIVOS.forEach(function(o){ input.appendChild(el("option", {value:o}, cap(o))); });
      }
      else { input = el("input", {type:"text", id:id, "class":"nin", autocomplete:"off"}); }
      if(f.hint) input.setAttribute("aria-describedby", id + "-hint");
      if(f.req) input.setAttribute("aria-required", "true");
      input.value = brand[f.k] || "";
      wrap.appendChild(input);
      if(f.type !== "select"){
        var cnt = el("span", {"class":"ncount", id:id + "-count"});
        wrap.appendChild(cnt);
        var upd = function(){
          var len = input.value.length;
          cnt.textContent = len + "/" + f.max;
          cnt.classList.toggle("over", len > f.max);
        };
        input.addEventListener("input", upd); upd();
      }
      wrap.appendChild(el("p", {"class":"nerr", id:"err-" + f.k, role:"alert"}));
      box.appendChild(wrap);
    });
  }

  function openForm(open){
    var form = $("brandForm");
    if(open){ buildForm(); }
    form.hidden = !open;
    $("brandSummaryRow").hidden = open;
    $("brandToggle").setAttribute("aria-expanded", String(open));
    $("brandMsg").textContent = "";
    if(open){ var first = form.querySelector("input,textarea,select"); if(first) first.focus(); }
  }
  $("brandToggle").addEventListener("click", function(){ openForm($("brandForm").hidden); });
  $("brandEdit").addEventListener("click", function(){ openForm(true); });
  $("brandCancel").addEventListener("click", function(){ openForm(false); $("brandToggle").focus(); });

  $("brandForm").addEventListener("submit", function(e){
    e.preventDefault();
    var next = {}, firstErr = null;
    document.querySelectorAll("#brandForm .nerr").forEach(function(p){ p.textContent = ""; });
    FIELDS.forEach(function(f){
      var errEl = $("err-" + f.k), v;
      if(f.type === "tom"){
        var r = document.querySelector('input[name="mm-tom"]:checked');
        var obs = $("mm-tomObs").value.trim();
        next.tomBase = r ? r.value : "";
        next.tomObs = obs;
        v = r ? cap(r.value) + (obs ? ". Observação: " + obs : "") : "";
        if(f.req && !r){ errEl.textContent = "Escolha como sua marca se comunica."; firstErr = firstErr || document.querySelector('input[name="mm-tom"]'); }
        else if(obs.length > f.max){ errEl.textContent = "A observação passou de " + f.max + " caracteres. Resuma para salvar."; firstErr = firstErr || $("mm-tomObs"); }
        next.tom = v;
        return;
      }
      var input = $("mm-" + f.k);
      v = input.value.trim();
      if(f.req && !v){ errEl.textContent = "Preencha este campo para salvar."; firstErr = firstErr || input; }
      else if(v.length > f.max){ errEl.textContent = "Este campo tem " + v.length + " caracteres e o limite é " + f.max + ". Resuma para salvar."; firstErr = firstErr || input; }
      next[f.k] = v;
    });
    if(firstErr){
      $("brandMsg").textContent = "Confira os campos destacados.";
      $("brandMsg").className = "status err";
      firstErr.focus();
      return;
    }
    next.savedAt = new Date().toISOString();
    if(!save(next)){
      $("brandMsg").textContent = "Este navegador não deixou salvar. Verifique se não está em uma aba anônima e tente de novo.";
      $("brandMsg").className = "status err";
      return;
    }
    brand = next;
    renderBrandSummary();
    openForm(false);
    $("brandSavedMsg").textContent = "Minha marca salva neste aparelho.";
    setTimeout(function(){ $("brandSavedMsg").textContent = ""; }, 3500);
    if(current) renderDetailBrandWarning();
  });

  /* ---------- catálogo ---------- */
  var catFilter = "Todas", query = "", current = null;
  function norm(s){ return String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); }

  function renderCats(){
    var box = $("narrCats"); box.textContent = "";
    ["Todas"].concat(CATS).forEach(function(c){
      var b = el("button", {type:"button", "class":"sec", "aria-pressed":String(c === catFilter)}, c);
      b.addEventListener("click", function(){ catFilter = c; renderCats(); renderList(); });
      box.appendChild(b);
    });
  }
  function renderList(){
    var box = $("narrGrid"); box.textContent = "";
    var q = norm(query.trim());
    var groups = catFilter === "Todas" ? CATS : [catFilter];
    var total = 0;
    groups.forEach(function(c){
      var items = STRATS.filter(function(s){ return s.cat === c && (!q || norm(s.title).indexOf(q) >= 0); });
      if(!items.length) return;
      total += items.length;
      box.appendChild(el("h2", {"class":"ncat"}, c));
      var grid = el("div", {"class":"ncards"});
      items.forEach(function(s){
        var card = el("button", {type:"button", "class":"ncard"});
        var top = el("span", {"class":"ncard-top"});
        top.appendChild(el("span", {"class":"nnum"}, s.id));
        top.appendChild(el("span", {"class":"nqty"}, s.qty + " Stories"));
        card.appendChild(top);
        card.appendChild(el("b", null, s.title));
        card.appendChild(el("span", {"class":"nobj"}, s.obj));
        card.addEventListener("click", function(){ openDetail(s); });
        grid.appendChild(card);
      });
      box.appendChild(grid);
    });
    if(!total){
      var empty = el("div", {"class":"empty"});
      empty.appendChild(el("b", null, "Nenhuma estratégia com esse nome"));
      empty.appendChild(document.createTextNode("Tente outra palavra ou escolha “Todas”."));
      box.appendChild(empty);
    }
  }
  $("narrSearch").addEventListener("input", function(e){ query = e.target.value; renderList(); });

  /* ---------- detalhe e geração ---------- */
  function renderDetailBrandWarning(){
    var miss = missingRequired();
    var w = $("ndBrandWarn");
    w.hidden = !miss.length;
    if(miss.length){
      $("ndBrandWarnText").textContent = "Antes de gerar, preencha em Minha Marca: " + miss.map(function(f){ return f.label.replace(/\?$/,""); }).join(", ") + ".";
    }
  }
  function openDetail(s){
    current = s;
    $("narrList").hidden = true;
    $("narrDetail").hidden = false;
    $("ndNum").textContent = "Estratégia " + s.id;
    $("ndCat").textContent = s.cat;
    $("ndTitle").textContent = s.title;
    $("ndObj").textContent = s.obj;
    $("ndQty").textContent = s.qty + " Stories";
    $("ndQtyNote").textContent = "Sequência fixa de " + s.qty + " Stories. O próprio comando define formato, gancho e chamada final de cada tela.";
    $("ndAssunto").value = ""; $("ndObs").value = "";
    $("ndErr").textContent = "";
    $("ndResult").hidden = true;
    $("ndForm").hidden = false;
    renderDetailBrandWarning();
    window.scrollTo(0, $("viewNarr").offsetTop - 10);
    $("ndBack").focus();
  }
  function closeDetail(){
    current = null;
    $("narrDetail").hidden = true;
    $("narrList").hidden = false;
  }
  $("ndBack").addEventListener("click", closeDetail);
  $("ndGoBrand").addEventListener("click", function(){
    closeDetail(); openForm(true);
    $("brandCard").scrollIntoView({behavior:"smooth", block:"start"});
  });

  function val(k){ var v = brand[k]; return v && String(v).trim() ? String(v).trim() : "Não informado"; }
  function buildPrompt(s, assunto, obs){
    var out = [];
    out.push("A. PAPEL DA IA");
    out.push("Você é um estrategista de Instagram Stories, especialista em storytelling, comunicação e comportamento do consumidor. Use todas as seções abaixo para criar a sequência solicitada.");
    out.push("");
    out.push("B. BRIEFING DA MARCA");
    Object.keys(BRIEF_LABELS).forEach(function(k){
      var v = val(k);
      if(k === "objetivo" && v !== "Não informado") v = cap(v);
      out.push("- " + BRIEF_LABELS[k] + ": " + v);
    });
    out.push("");
    out.push("C. CONTEXTO DESTA NARRATIVA");
    out.push("- Assunto ou produto a abordar: " + (assunto || "Não informado"));
    out.push("- Observações importantes: " + (obs || "Não informado"));
    if(!assunto){
      out.push("Como nenhum assunto ou produto foi informado, escolha um tema relevante para esta estratégia com base no briefing da marca, sem inventar fatos, produtos, condições ou resultados.");
    }
    out.push("");
    out.push("D. ESTRATÉGIA ESCOLHIDA");
    out.push("Estratégia " + s.id + " | " + s.title);
    out.push("Categoria: " + s.cat);
    out.push("Objetivo estratégico: " + s.obj);
    out.push("Quantidade exata: " + s.qty + " Stories");
    out.push("");
    out.push(s.cmd);
    out.push("");
    out.push("E. DIRETRIZES UNIVERSAIS");
    out.push(UNIVERSAL);
    return out.join("\n");
  }

  $("ndForm").addEventListener("submit", function(e){
    e.preventDefault();
    var s = current; if(!s) return;
    var miss = missingRequired();
    if(miss.length){ renderDetailBrandWarning(); $("ndGoBrand").focus(); return; }
    var assunto = $("ndAssunto").value.trim(), obs = $("ndObs").value.trim();
    if(assunto.length > CTX_MAX || obs.length > CTX_MAX){
      $("ndErr").textContent = "Os campos desta narrativa aceitam até " + CTX_MAX + " caracteres cada. Resuma para gerar.";
      return;
    }
    $("ndErr").textContent = "";
    $("ndOut").value = buildPrompt(s, assunto, obs);
    $("ndCopyMsg").textContent = ""; $("ndCopyMsg").className = "status";
    $("ndForm").hidden = true;
    $("ndResult").hidden = false;
    $("ndResult").scrollIntoView({behavior:"smooth", block:"start"});
    $("ndCopy").focus({preventScroll:true});
  });
  $("ndEdit").addEventListener("click", function(){
    $("ndResult").hidden = true; $("ndForm").hidden = false; $("ndAssunto").focus();
  });
  $("ndCopy").addEventListener("click", function(){
    var ta = $("ndOut"), text = ta.value, msg = $("ndCopyMsg");
    function ok(){ msg.textContent = "Prompt copiado! Agora cole no ChatGPT ou no Claude."; msg.className = "status ok"; }
    function fallback(){
      try{
        ta.focus(); ta.select(); ta.setSelectionRange(0, text.length);
        if(document.execCommand && document.execCommand("copy")){ ok(); return; }
      }catch(e){}
      msg.textContent = "Seu navegador não deixou copiar direto. O texto já está selecionado na caixa: toque e segure e escolha Copiar.";
      msg.className = "status err";
    }
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(text).then(ok, fallback);
    } else fallback();
  });

  ["ndAssunto","ndObs"].forEach(function(id){
    var t = $(id), c = $(id + "Count");
    var upd = function(){ c.textContent = t.value.length + "/" + CTX_MAX; c.classList.toggle("over", t.value.length > CTX_MAX); };
    t.addEventListener("input", upd); upd();
  });

  renderBrandSummary(); renderCats(); renderList();
  window.SOSNarrativas = {showTab: showTab};
})();
