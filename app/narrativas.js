/* Narrativas Estratégicas — módulo independente do Estúdio de Figurinhas.
   Não chama nenhuma API: monta o prompt localmente e guarda só o briefing no navegador. */
(function(){
  "use strict";
  var STORE_KEY = "sosStories.minhaMarca.v1";
  var META = window.NARR_META || {};
  var STRATS = (window.NARR_STRATEGIES || []).map(function(s){
    var m = META[s.id] || {};
    return Object.assign({}, s, {name: m.name || s.title, desc: m.desc || s.obj, q: m.q || []});
  });
  var DRAFT_KEY = "sosStories.minhaMarca.rascunho.v1";
  var TRATAMENTOS = [
    {v:"expressao", t:"Utilizo uma expressão própria"},
    {v:"perfil", t:"Prefiro me dirigir ao público pelo perfil"},
    {v:"neutra", t:"Prefiro uma comunicação neutra"}
  ];
  var UNIVERSAL = window.NARR_UNIVERSAL || "";
  var CATS = [];
  STRATS.forEach(function(s){ if(CATS.indexOf(s.cat) < 0) CATS.push(s.cat); });

  var TONS = ["próxima","profissional","acolhedora","descontraída","sofisticada","didática"];
  var OBJETIVOS = ["conexão","autoridade","vendas","interação","apresentar soluções","equilibrado"];
  var FIELDS = [
    {k:"nome", label:"Nome do negócio", type:"text", req:true, max:120},
    {k:"segmento", label:"Segmento / área de atuação", type:"text", req:true, max:160},
    {k:"oferta", label:"Quais produtos ou serviços sua marca oferece?", hint:"Descreva seus produtos ou serviços com o máximo de detalhes possível. Explique o que você oferece, como funciona, para quem é indicado, quais são os benefícios, diferenciais e o que está incluso. Se desejar, informe também valores, formas de pagamento, prazos e outras condições importantes. Quanto mais completas forem essas informações, mais personalizadas e estratégicas serão suas narrativas.", ph:"Ex.: Identidade Visual Premium: serviço de criação de identidade visual para empreendedoras que desejam profissionalizar suas marcas. Inclui três propostas de conceito, aplicações em mockups e arquivos finais. Investimento de R$ XXX, com possibilidade de parcelamento.", type:"area", rows:9, req:true, max:12000},
    {k:"prioritario", label:"Qual produto ou serviço você deseja priorizar na sua comunicação?", hint:"Se você oferece várias soluções, informe qual delas deseja destacar com mais frequência nos seus Stories.", type:"text", max:300},
    {k:"publico", label:"Quem é seu público?", hint:"Perfil, necessidades e contexto.", type:"area", req:true, max:2000},
    {k:"dores", label:"Quais problemas, desejos ou dúvidas seu público costuma ter?", type:"area", max:2000},
    {k:"diferenciais", label:"O que diferencia sua marca?", hint:"Apenas diferenciais verdadeiros.", type:"area", max:2000},
    {k:"tom", label:"Como sua marca se comunica?", type:"tom", req:true, max:400},
    {k:"tratamento", label:"Como sua marca costuma se dirigir ao público?", hint:"Algumas marcas utilizam expressões próprias para conversar com seus seguidores. Outras preferem se dirigir ao público pelo perfil ou manter uma comunicação mais neutra.", type:"trat", max:300},
    {k:"evitar", label:"Existe alguma palavra ou expressão que sua marca evita utilizar?", hint:"Informe palavras, apelidos ou expressões que não combinam com a comunicação da sua marca.", ph:"Ex.: amiga, querida, meu amor, gata, pessoal…", type:"text", max:600},
    {k:"objetivo", label:"Qual é o objetivo principal dos seus Stories?", type:"select", max:60},
    {k:"compra", label:"Como funciona a compra ou contratação?", hint:"Canais, etapas e condições confirmadas.", type:"area", max:2000},
    {k:"regras", label:"Informações importantes que a IA deve respeitar", hint:"Limites, termos, restrições e preferências.", type:"area", max:2000}
  ];
  var BRIEF_LABELS = {
    nome:"Nome do negócio", segmento:"Segmento / área de atuação", oferta:"Produtos ou serviços oferecidos", prioritario:"Produto ou serviço prioritário na comunicação",
    publico:"Público", dores:"Problemas, desejos ou dúvidas do público", diferenciais:"O que diferencia a marca",
    tom:"Como a marca se comunica", tratamento:"Como a marca se dirige ao público", evitar:"Palavras e expressões que a marca evita", objetivo:"Objetivo principal dos Stories",
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
    if(k === "tratamento") return !!brand.tratamentoBase;
    return !!(brand[k] && String(brand[k]).trim());
  }
  function missingRequired(){
    return FIELDS.filter(function(f){ return f.req && !filled(f.k); });
  }

  /* ---------- abas ---------- */
  function showTab(name){
    var fig = name === "fig";
    $("viewFig").hidden = name !== "fig";
    $("viewNarr").hidden = name !== "narr";
    if($("viewTxt")) $("viewTxt").hidden = name !== "txt";
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
        var all = Array.prototype.slice.call(document.querySelectorAll(".tabbar button"));
        var i = all.indexOf(b) + (e.key === "ArrowRight" ? 1 : -1);
        var other = all[(i + all.length) % all.length];
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

  function loadDraft(){ try{ var d = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null"); return d && typeof d === "object" ? d : null; }catch(e){ return null; } }
  function buildForm(){
    var src = loadDraft() || brand;
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
        var cur = src.tomBase || "";
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
        obs.value = src.tomObs || "";
        fs.appendChild(obsLab); fs.appendChild(obs);
        fs.appendChild(el("p", {"class":"nerr", id:"err-tom", role:"alert"}));
        wrap.appendChild(fs);
        box.appendChild(wrap);
        return;
      }
      if(f.type === "trat"){
        var fs2 = el("fieldset", {"class":"nf-tom"});
        var lg2 = el("legend", null, f.label); lg2.appendChild(el("span", {"class":"opt"}, " (opcional)"));
        fs2.appendChild(lg2);
        fs2.appendChild(el("p", {"class":"nhint"}, f.hint));
        var list = el("div", {"class":"nradios", role:"radiogroup"});
        TRATAMENTOS.forEach(function(o){
          var lab2 = el("label", {"class":"nradio"});
          var r2 = el("input", {type:"radio", name:"mm-trat", value:o.v});
          if(src.tratamentoBase === o.v) r2.checked = true;
          lab2.appendChild(r2); lab2.appendChild(el("span", null, o.t));
          list.appendChild(lab2);
        });
        fs2.appendChild(list);
        var exWrap = el("div", {"class":"nf", id:"mm-expr-wrap"});
        exWrap.appendChild(el("label", {"for":"mm-expr", "class":"nf-sub"}, "Qual expressão sua marca costuma utilizar?"));
        var ex = el("input", {type:"text", id:"mm-expr", "class":"nin", autocomplete:"off", placeholder:"Ex.: divas, time, poderosas, empreendedoras…"});
        ex.value = src.expressoes || "";
        exWrap.appendChild(ex);
        exWrap.appendChild(el("p", {"class":"nhint"}, "Pode informar mais de uma, separadas por vírgula."));
        fs2.appendChild(exWrap);
        var syncEx = function(){ var c = document.querySelector('input[name="mm-trat"]:checked'); exWrap.hidden = !(c && c.value === "expressao"); };
        list.addEventListener("change", syncEx); syncEx();
        fs2.appendChild(el("p", {"class":"nerr", id:"err-tratamento", role:"alert"}));
        wrap.appendChild(fs2); box.appendChild(wrap);
        return;
      }
      var lab = el("label", {"for":id}, f.label);
      if(f.req) lab.appendChild(el("span", {"class":"req", "aria-hidden":"true"}, " *"));
      else lab.appendChild(el("span", {"class":"opt"}, " (opcional)"));
      wrap.appendChild(lab);
      if(f.hint) wrap.appendChild(el("p", {"class":"nhint", id:id + "-hint"}, f.hint));
      var input;
      if(f.type === "area"){ input = el("textarea", {id:id, rows:String(f.rows || 3), "class":"nin" + (f.rows ? " big" : "")}); }
      else if(f.type === "select"){
        input = el("select", {id:id, "class":"nin"});
        input.appendChild(el("option", {value:""}, "Não informar"));
        OBJETIVOS.forEach(function(o){ input.appendChild(el("option", {value:o}, cap(o))); });
      }
      else { input = el("input", {type:"text", id:id, "class":"nin", autocomplete:"off"}); }
      if(f.hint) input.setAttribute("aria-describedby", id + "-hint");
      if(f.ph) input.setAttribute("placeholder", f.ph);
      if(f.req) input.setAttribute("aria-required", "true");
      input.value = src[f.k] || "";
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

  var draftT;
  function collectDraft(){
    var d = {};
    FIELDS.forEach(function(f){
      if(f.type === "tom"){ var r = document.querySelector('input[name="mm-tom"]:checked'); d.tomBase = r ? r.value : ""; d.tomObs = ($("mm-tomObs") || {}).value || ""; return; }
      if(f.type === "trat"){ var t = document.querySelector('input[name="mm-trat"]:checked'); d.tratamentoBase = t ? t.value : ""; d.expressoes = ($("mm-expr") || {}).value || ""; return; }
      var i = $("mm-" + f.k); if(i) d[f.k] = i.value;
    });
    return d;
  }
  $("brandForm").addEventListener("input", function(){
    clearTimeout(draftT);
    draftT = setTimeout(function(){
      try{ localStorage.setItem(DRAFT_KEY, JSON.stringify(collectDraft())); $("brandDraftMsg").textContent = "Rascunho salvo automaticamente neste aparelho."; }catch(e){}
    }, 500);
  });
  $("brandForm").addEventListener("change", function(){ $("brandForm").dispatchEvent(new Event("input")); });
  function openForm(open){
    var form = $("brandForm");
    if(open){ buildForm(); }
    form.hidden = !open;
    $("brandSummaryRow").hidden = open;
    $("brandToggle").setAttribute("aria-expanded", String(open));
    $("brandMsg").textContent = ""; $("brandDraftMsg").textContent = loadDraft() && open ? "Recuperamos o rascunho que você não tinha salvado." : "";
    if(open){ var first = form.querySelector("input,textarea,select"); if(first) first.focus(); }
  }
  $("brandToggle").addEventListener("click", function(){ openForm($("brandForm").hidden); });
  $("brandEdit").addEventListener("click", function(){ openForm(true); });
  $("brandCancel").addEventListener("click", function(){ try{ localStorage.removeItem(DRAFT_KEY); }catch(e){} openForm(false); $("brandToggle").focus(); });

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
      if(f.type === "trat"){
        var tr = document.querySelector('input[name="mm-trat"]:checked');
        var exv = $("mm-expr").value.trim();
        next.tratamentoBase = tr ? tr.value : "";
        next.expressoes = tr && tr.value === "expressao" ? exv : "";
        if(tr && tr.value === "expressao" && !exv){ $("err-tratamento").textContent = "Informe a expressão que sua marca utiliza ou escolha outra opção."; firstErr = firstErr || $("mm-expr"); }
        else if(exv.length > f.max){ $("err-tratamento").textContent = "A expressão passou de " + f.max + " caracteres."; firstErr = firstErr || $("mm-expr"); }
        next.tratamento = !tr ? "" : tr.value === "expressao" ? "Utiliza uma expressão própria: " + exv + " (uso opcional, apenas quando natural)"
          : tr.value === "perfil" ? "Prefere se dirigir ao público pelo perfil da audiência cadastrada, quando fizer sentido"
          : "Prefere uma comunicação neutra, sem apelidos, vocativos ou expressões de tratamento";
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
    try{ localStorage.removeItem(DRAFT_KEY); }catch(e){}
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
      var items = STRATS.filter(function(s){ return s.cat === c && (!q || norm(s.name + " " + s.title + " " + s.desc).indexOf(q) >= 0); });
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
        card.appendChild(el("b", {"class":"nname"}, s.name));
        card.appendChild(el("span", {"class":"nobj"}, s.desc));
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
  function productOptions(){
    var opts = [];
    var add = function(t){ t = String(t || "").trim().replace(/[:\-–—].*$/, "").trim(); if(t && t.length <= 80 && opts.indexOf(t) < 0) opts.push(t); };
    add(brand.prioritario);
    String(brand.oferta || "").split(/\n+/).forEach(function(line){ if(/:/.test(line)) add(line.split(":")[0]); });
    return opts.slice(0, 12);
  }
  function renderQuestions(s){
    var box = $("ndQs"); box.textContent = "";
    var hasTopic = s.q.some(function(q){ return q.type === "topic"; });
    $("ndAssuntoWrap").hidden = hasTopic;
    $("ndBlock").hidden = true;
    s.q.forEach(function(q){
      var id = "ndq-" + q.id;
      var wrap = el("div", {"class":"nf"});
      var lab = el("label", {"for":id}, q.label);
      lab.appendChild(q.required ? el("span", {"class":"req", "aria-hidden":"true"}, " *") : el("span", {"class":"opt"}, " (opcional)"));
      wrap.appendChild(lab);
      if(q.hint) wrap.appendChild(el("p", {"class":"nhint", id:id + "-hint"}, q.hint));
      var input = q.long ? el("textarea", {id:id, rows:"3", "class":"nin"}) : el("input", {type:"text", id:id, "class":"nin", autocomplete:"off"});
      if(q.ph) input.setAttribute("placeholder", q.ph);
      if(q.hint) input.setAttribute("aria-describedby", id + "-hint");
      if(q.required) input.setAttribute("aria-required", "true");
      if(q.type === "product"){
        var opts = productOptions();
        if(opts.length){
          var dl = el("datalist", {id:id + "-list"});
          opts.forEach(function(o){ dl.appendChild(el("option", {value:o})); });
          input.setAttribute("list", id + "-list");
          wrap.appendChild(dl);
          var chips = el("div", {"class":"nchips"});
          opts.slice(0, 6).forEach(function(o){
            var b = el("button", {type:"button", "class":"nsug"}, o);
            b.addEventListener("click", function(){ input.value = o; input.focus(); });
            chips.appendChild(b);
          });
          wrap.appendChild(input);
          wrap.appendChild(chips);
          box.appendChild(wrap);
          return;
        }
      }
      wrap.appendChild(input);
      box.appendChild(wrap);
    });
    $("ndQsWrap").hidden = !s.q.length;
  }
  function showBlock(q){
    var b = $("ndBlock"); b.hidden = false;
    $("ndBlockText").textContent = q.blockMsg;
    var box = $("ndBlockSug"); box.textContent = "";
    (q.suggest || []).forEach(function(id){
      var t = STRATS.filter(function(x){ return x.id === id; })[0]; if(!t) return;
      var btn = el("button", {type:"button", "class":"btn small ghost"}, t.name);
      btn.addEventListener("click", function(){ openDetail(t); });
      box.appendChild(btn);
    });
    b.scrollIntoView({behavior:"smooth", block:"center"});
  }
  function openDetail(s){
    current = s;
    $("narrList").hidden = true;
    $("narrDetail").hidden = false;
    $("ndNum").textContent = "Estratégia " + s.id;
    $("ndCat").textContent = s.cat;
    $("ndTitle").textContent = s.name;
    $("ndObj").textContent = s.desc;
    $("ndGoal").textContent = "Objetivo estratégico: " + s.obj;
    $("ndQty").textContent = s.qty + " Stories";
    $("ndQtyNote").textContent = "Sequência fixa de " + s.qty + " Stories. O próprio comando define formato, gancho e chamada final de cada tela.";
    $("ndAssunto").value = ""; $("ndObs").value = "";
    renderQuestions(s);
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
  var BLOCK_VERBAL = "Respeite a maneira como a marca costuma se dirigir ao seu público.\n\nNão interprete um tom acolhedor, próximo, leve ou humanizado como autorização para utilizar expressões de intimidade.\n\nEvite termos como “amiga”, “querida”, “meu bem”, “linda” e semelhantes, exceto quando estiverem expressamente autorizados no briefing.\n\nSe a marca informar uma expressão própria, utilize-a apenas quando contribuir naturalmente para a comunicação.\n\nNão repita a expressão em todos os Stories.\n\nSe a preferência for se dirigir ao público pelo perfil, utilize termos coerentes com a audiência cadastrada.\n\nSe a preferência for uma comunicação neutra, não utilize vocativos.\n\nRespeite integralmente a lista de palavras e expressões que a marca deseja evitar.\n\nPriorize uma comunicação natural, coerente e sem intimidade artificial.\n\nImportante: mesmo quando uma expressão estiver cadastrada, sua utilização não deve ser obrigatória.";
  var BLOCK_PRODUTOS = "Analise cuidadosamente as informações cadastradas sobre os produtos e serviços da marca.\n\nConsidere suas características, benefícios, diferenciais, público indicado, valores, entregas e condições comerciais, quando disponíveis.\n\nUtilize essas informações para construir narrativas específicas, relevantes e coerentes com o negócio.\n\nNão invente preços, características, entregas, benefícios, prazos ou condições comerciais.\n\nNão mencione automaticamente valores em todas as narrativas.\n\nUtilize informações comerciais somente quando forem relevantes para o objetivo da estratégia selecionada.\n\nConsidere o produto ou serviço prioritário nas narrativas comerciais, sem forçar sua apresentação em conteúdos de relacionamento ou conexão.";
  var BLOCK_COMPL = "Considere as informações adicionais fornecidas pela marca para personalizar a narrativa selecionada.\n\nQuando houver uma história real, utilize seus detalhes de maneira fiel, sem acrescentar acontecimentos inexistentes.\n\nQuando não houver uma experiência específica, desenvolva a narrativa a partir de situações comuns, observações ou exemplos hipotéticos claramente identificados.\n\nNão invente histórias pessoais, depoimentos, resultados ou casos de clientes.\n\nQuando a estratégia depender obrigatoriamente de uma informação real, solicite esse dado antes de desenvolver o conteúdo.";
  var BLOCK_CURTOS = "Todas as narrativas do SOS Stories devem ser desenvolvidas considerando o comportamento de consumo dos Stories no Instagram.\n\nOs textos precisam ser objetivos, fáceis de ler e visualmente leves, sem perder profundidade estratégica.\n\nO primeiro Story deve ter um gancho curto e impactante, preferencialmente com até 12 palavras.\n\nO segundo Story também deve ser breve, evitando explicações longas logo no início da sequência.\n\nNos Stories seguintes, desenvolva o conteúdo progressivamente, utilizando frases enxutas e informações relevantes.\n\nEvite parágrafos extensos, excesso de explicações, repetições e textos que ocupem grande parte da tela.\n\nStories com listas, orientações ou conteúdos educativos podem apresentar textos um pouco maiores quando necessário, desde que estejam organizados para facilitar a leitura.\n\nProfundidade não significa quantidade de palavras. Priorize ideias específicas, exemplos concretos e informações úteis.\n\nSe uma ideia exigir uma explicação longa, distribua o conteúdo entre os Stories previstos, sem aumentar a quantidade definida pela estratégia.\n\nAs orientações visuais e as explicações estratégicas podem ser mais detalhadas, mas o campo “Texto sugerido” deve conter apenas o conteúdo enxuto que será publicado na tela.\n\nO texto de um Story falado não precisa ser idêntico ao texto exibido na tela. Se a estratégia recomendar um vídeo, sugira uma fala mais desenvolvida em um item separado, “Fala sugerida:”, mas mantenha curta a frase escrita na tela. Não entregue um roteiro de vídeo inteiro como texto para colocar sobre a imagem.\n\nAntes de entregar a narrativa, revise cada Story e elimine palavras desnecessárias, mantendo a clareza e a intenção da mensagem.";
  function indent(v){ return String(v).replace(/\n/g, "\n  "); }
  function buildPrompt(s, assunto, obs, answers){
    var out = [];
    out.push("A. PAPEL DA IA");
    out.push("Você é um estrategista de Instagram Stories, especialista em storytelling, comunicação e comportamento do consumidor. Use todas as seções abaixo para criar a sequência solicitada.");
    out.push("");
    out.push("B. BRIEFING DA MARCA");
    Object.keys(BRIEF_LABELS).forEach(function(k){
      var v = val(k);
      if(k === "objetivo" && v !== "Não informado") v = cap(v);
      out.push("- " + BRIEF_LABELS[k] + ": " + indent(v));
    });
    out.push("");
    out.push("C. IDENTIDADE VERBAL E TRATAMENTO DA AUDIÊNCIA");
    out.push(BLOCK_VERBAL);
    out.push("");
    out.push("D. INFORMAÇÕES SOBRE PRODUTOS E SERVIÇOS");
    out.push(BLOCK_PRODUTOS);
    out.push("");
    out.push("E. CONTEXTO DESTA NARRATIVA");
    var topicAnswered = answers.some(function(a){ return a.q.type === "topic" && a.v; });
    if(!$("ndAssuntoWrap").hidden) out.push("- Assunto ou produto a abordar: " + indent(assunto || "Não informado"));
    out.push("- Observações importantes: " + indent(obs || "Não informado"));
    if(!assunto && !topicAnswered){
      out.push("Como nenhum assunto ou produto específico foi informado, escolha um tema relevante para esta estratégia com base no briefing da marca, sem inventar fatos, produtos, condições ou resultados.");
    }
    out.push("");
    out.push("F. INFORMAÇÕES COMPLEMENTARES");
    if(answers.length){
      answers.forEach(function(a){
        out.push("- " + a.q.label + " " + indent(a.v ? a.v : "Não informado. " + (a.q.empty || "")));
      });
      out.push("");
    }
    out.push(BLOCK_COMPL);
    out.push("");
    out.push("G. ESTRATÉGIA ESCOLHIDA");
    out.push("Estratégia " + s.id + " | " + s.name + " (" + s.title + ")");
    out.push("Categoria: " + s.cat);
    out.push("Objetivo estratégico: " + s.obj);
    out.push("Quantidade exata: " + s.qty + " Stories");
    out.push("");
    out.push(s.cmd);
    out.push("");
    out.push("H. REGRA OBRIGATÓRIA | TEXTOS CURTOS E LEITURA RÁPIDA");
    out.push(BLOCK_CURTOS);
    out.push("");
    out.push("I. DIRETRIZES UNIVERSAIS");
    out.push(UNIVERSAL);
    return out.join("\n");
  }

  $("ndForm").addEventListener("submit", function(e){
    e.preventDefault();
    var s = current; if(!s) return;
    var miss = missingRequired();
    if(miss.length){ renderDetailBrandWarning(); $("ndGoBrand").focus(); return; }
    var assunto = $("ndAssuntoWrap").hidden ? "" : $("ndAssunto").value.trim(), obs = $("ndObs").value.trim();
    var answers = s.q.map(function(q){ return {q:q, v:($("ndq-" + q.id).value || "").trim()}; });
    var missingReq = answers.filter(function(a){ return a.q.required && !a.v; })[0];
    if(missingReq){ showBlock(missingReq.q); $("ndq-" + missingReq.q.id).focus({preventScroll:true}); return; }
    if(answers.some(function(a){ return a.v.length > CTX_MAX * 2; })){
      $("ndErr").textContent = "As respostas complementares aceitam até " + (CTX_MAX * 2) + " caracteres cada. Resuma para gerar.";
      return;
    }
    $("ndBlock").hidden = true;
    if(assunto.length > CTX_MAX || obs.length > CTX_MAX){
      $("ndErr").textContent = "Os campos desta narrativa aceitam até " + CTX_MAX + " caracteres cada. Resuma para gerar.";
      return;
    }
    $("ndErr").textContent = "";
    $("ndOut").value = buildPrompt(s, assunto, obs, answers);
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
