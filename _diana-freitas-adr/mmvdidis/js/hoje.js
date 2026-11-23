'use strict';
const SCREENS={},SHEETS={},A={};

/* ---------- HOJE ---------- */
function ring(p){const r=22,c=2*Math.PI*r;return `<svg class="ring" viewBox="0 0 54 54"><circle cx="27" cy="27" r="${r}" fill="none" stroke="var(--soft)" stroke-width="6"/><circle cx="27" cy="27" r="${r}" fill="none" stroke="var(--pes)" stroke-width="6" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c*(1-p)}" transform="rotate(-90 27 27)" style="transition:stroke-dashoffset .5s"/></svg>`}
function ckRow(it){
  const a=AREAS[it.area]||AREAS.pessoal;
  return `<li class="ci ${it.done?'done':''}" data-k="${esc(it.key)}"><button class="ck" data-a="ck" data-k="${esc(it.key)}" aria-label="${it.done?'Desmarcar':'Marcar'} ${esc(it.label)}"><i>${IC.check}</i></button><button class="cn" data-a="openItem" data-k="${esc(it.key)}"><b>${esc(it.label)}</b><small><span class="dot" style="background:${a.c}"></span><span class="mut">${esc(it.sub||a.n)}</span></small></button></li>`;
}
const EMO={bem:'🙂',animada:'🤩',tranquila:'😌',cansada:'😴',ansiosa:'😰',triste:'😢'};
const emo=m=>{const k=Object.keys(EMO).find(x=>norm(m||'').startsWith(norm(x).slice(0,5)));return k?EMO[k]+' ':''};
SCREENS.hoje=()=>{
  const d=U.date||D.today(),isT=d===D.today(),items=dayItems(d),done=items.filter(i=>i.done).length,n=items.length;
  const lim=5,shown=U.showAll?items:items.slice(0,lim);
  const unread=notifList().filter(x=>x.when.slice(0,10)===D.today()&&!x.past).length;
  let h=`<div class="top"><button class="ib" data-a="day" data-v="-1" aria-label="Dia anterior">${IC.l}</button>
  <div class="grow"><h1>${isT?`Hoje <span style="font-weight:500;color:var(--ink2);font-size:17px;white-space:nowrap">${DOWL[D.dow(d)]}, ${D.short(d)}</span>`:esc(D.lbl(d))}</h1><small class="mut">${isT?`${D.nowMin()<720?'Bom dia':D.nowMin()<1080?'Boa tarde':'Boa noite'}, Di`:`<button class="link" style="padding:0" data-a="day" data-v="0">Voltar para hoje</button>`}</small></div>
  <button class="ib" data-a="day" data-v="1" aria-label="Próximo dia">${IC.r}</button><button class="ib" data-a="go" data-v="notif" aria-label="Avisos" style="position:relative">${IC.bell}${unread?`<span style="position:absolute;top:9px;right:9px;width:8px;height:8px;border-radius:50%;background:var(--sos)"></span>`:''}</button></div>
  ${quoteTop()}${isT?goalStrip()+checkStrip():''}
  <div class="card" style="padding:0 4px 0 0">
   <div class="prog">${ring(n?done/n:0)}<div class="grow"><b class="num">${done} de ${n}</b> <span class="mut">concluídos</span><br><small class="mut tiny">${done===n&&n?'Dia completo, Di. Que orgulho!':'Toque no círculo para marcar, no nome para abrir'}</small></div><button class="link" data-a="go" data-v="ckedit">Editar</button></div>
   <ul class="cl" style="border-top:1px solid var(--line)">${shown.map(ckRow).join('')||'<li class="empty" style="padding:14px">Nada previsto para este dia.</li>'}</ul>
   ${n>lim?`<button class="more" data-a="showAll">${U.showAll?'Mostrar menos':`Ver mais ${n-lim} ${n-lim===1?'item':'itens'}`}</button>`:''}
  </div>`;
  h+=carouselHtml();
  // prioridades
  const pr=S.tasks.filter(t=>t.date===d&&t.prio).slice(0,3);
  h+=`<div class="sec"><h2>Três prioridades</h2><button class="link" data-a="newTask" data-v="${d}">+ Tarefa</button></div><div class="card">${pr.length?pr.map((t,i)=>`<button class="li" data-a="openTask" data-id="${t.id}"><span class="tm" style="width:24px;color:var(--dune)">${i+1}</span><span class="t"><b style="${t.done?'text-decoration:line-through;color:var(--ink3)':''}">${esc(t.title)}</b><small class="mut">${esc(AREAS[t.area].n)} · ${dur(t.dur)}</small></span>${t.done?'<span class="pill ok">feito</span>':''}</button>`).join(''):'<p class="empty">Marque até três tarefas como prioridade.</p>'}</div>`;
  // agenda + blocos
  const bl=blocks(d);
  h+=`<div class="sec"><h2>Agenda e blocos</h2><button class="link" data-a="tab" data-v="agenda">Semana</button></div><div class="card">${bl.items.length?bl.items.map(b=>`<button class="li" ${b.task?`data-a="openTask" data-id="${b.task}"`:''}><span class="tm">${D.hm(b.s)}</span><span class="t"><b>${esc(b.title)}</b><small class="mut">${b.fixed?'compromisso':'bloco de trabalho'} · ${dur(b.e-b.s)}${b.over?' · <span style="color:var(--red)">passa do expediente</span>':''}</small></span><span class="dot" style="background:${AREAS[b.area]?.c||'var(--ink3)'}"></span></button>`).join(''):'<p class="empty">Agenda livre.</p>'}
   <div class="kv" style="border-top:1px solid var(--line);margin-top:4px;padding-top:10px"><span class="mut">Tempo livre no expediente</span><b class="num" style="color:${bl.free<0?'var(--red)':'var(--ok)'}">${bl.free<0?'faltam '+dur(-bl.free):dur(bl.free)}</b></div></div>`;
  // contas
  const T=D.today(),due=S.bills.filter(b=>b.status!=='pago'&&D.diff(T,b.due)<=7).sort((a,b)=>a.due<b.due?-1:1);
  h+=`<div class="sec"><h2>Contas · hoje e 7 dias</h2><button class="link" data-a="tab" data-v="fin">Finanças</button></div><div class="card">${due.length?due.map(billRow).join(''):'<p class="empty">Nenhuma conta nos próximos 7 dias.</p>'}</div>`;
  // check-in
  const ck=S.checkins[d]||{};
  h+=`<div class="sec"><h2>Check-in pessoal</h2><span class="tiny mut">opcional</span></div><div class="card">
   <div class="tiny mut" style="margin-bottom:6px">Humor</div><div class="moods">${Object.entries(EMO).map(([m,e])=>`<button class="${ck.mood===m?'on':''}" data-a="ckin" data-f="mood" data-v="${m}" aria-label="${m}"><span>${e}</span><small>${m}</small></button>`).join('')}</div>
   <div class="tiny mut" style="margin:12px 0 6px">Energia</div><div class="energy">${[1,2,3,4,5].map(v=>`<button class="${ck.energy>=v?'on':''}" data-a="ckin" data-f="energy" data-v="${v}" aria-label="Energia ${v}"><i style="height:${8+v*6}px"></i></button>`).join('')}<small class="mut">${ck.energy?['','bem baixa','baixa','ok','boa','lá em cima'][ck.energy]:'toque para marcar'}</small></div>
   <button class="li" data-a="sheet" data-v="checkin" style="margin-top:8px"><span class="t"><b>Alimentação</b><small class="mut">${esc(ck.food||'Toque para anotar')}</small></span>${IC.r}</button></div>`;
  h+=`<p class="tiny mut3" style="text-align:center;margin-top:24px">${persistLine()}</p>`;
  return h;
};
function persistLine(){return `${STORE_OK?'Salvo neste aparelho':'Sem armazenamento local'}${window.claude?' · conta Claude: '+CLOUD.state:''}`}
function quoteTop(){const q=quoteOfDay();if(!q)return '';return `<div class="qtop"><span class="qmark">“</span><p>${esc(q.text)}</p></div>`}
function quoteOfDay(){const qs=S.quotes.filter(q=>!q.hidden);if(!qs.length)return null;const n=D.diff('2026-01-01',D.today());const favs=qs.filter(q=>q.fav);if(favs.length&&n%3===0)return favs[Math.floor(n/3)%favs.length];return qs[n%qs.length]}
function billRow(b){const dd=D.diff(D.today(),b.due);return `<button class="li" data-a="openBill" data-id="${b.id}"><span class="t"><b>${esc(b.desc)}</b><small class="mut">${areaPill(b.area)} ${b.status==='pago'?'paga em '+D.short(b.paidAt):dd<0?`<span style="color:var(--red)">venceu ${D.short(b.due)}</span>`:dd===0?'<b style="color:var(--sos)">vence hoje</b>':'vence '+D.rel(b.due)+' · '+D.short(b.due)}</small></span><b class="num">${brl(b.value)}</b></button>`}

/* blocos de trabalho: compromissos fixos + tarefas encaixadas nos intervalos */
function blocks(date){
  const st=D.toMin(S.set.dayStart),end=st+S.set.workH*60;
  const fixed=[...S.events.filter(e=>e.date===date&&e.time).map(e=>({s:D.toMin(e.time),e:D.toMin(e.time)+(+e.dur||30),title:e.time&&e.title,area:e.area,fixed:true})),
    ...S.tasks.filter(t=>t.date===date&&t.time).map(t=>({s:D.toMin(t.time),e:D.toMin(t.time)+(+t.dur||30),title:t.title,area:t.area,fixed:true,task:t.id}))].sort((a,b)=>a.s-b.s);
  const flex=S.tasks.filter(t=>t.date===date&&!t.time&&!t.done).sort((a,b)=>(b.prio-a.prio));
  const out=[...fixed];let cur=st;
  flex.forEach(t=>{let s=cur,moved=true;while(moved){moved=false;for(const f of fixed){if(s<f.e&&s+(+t.dur)>f.s){s=f.e;moved=true}}}out.push({s,e:s+(+t.dur),title:t.title,area:t.area,task:t.id,over:s+(+t.dur)>end});cur=s+(+t.dur)});
  out.sort((a,b)=>a.s-b.s);
  return {items:out,free:usable()-loadOf(date)};
}

/* carrossel de desejos */
function carouselHtml(){
  if(!S.set.carousel)return '';
  const ws=S.wishes.filter(w=>w.showToday&&(w.photos||[]).length);
  if(!ws.length)return '';
  return `<div class="car" style="margin-top:14px" id="car"><div class="trk" id="trk">${ws.map(w=>`<button class="sl" data-a="openWish" data-id="${w.id}"><img src="${phSrc(w.photos[0])}" alt=""><div class="cap"><b>${esc(w.name)}</b><small>${w.goal&&w.goal.on?`${brl(w.goal.saved)} guardados de ${brl(w.goal.value||w.value)}`:esc(w.why||'')}</small></div></button>`).join('')}</div>
  <div class="ctl"><button data-a="carPause" aria-label="${U.carPaused?'Retomar':'Pausar'} transição">${U.carPaused?IC.play:IC.pause}</button><button data-a="carHide" aria-label="Ocultar carrossel">${IC.x}</button></div></div>`;
}
let carTick=0;
function carouselStep(){const t=$('#trk');if(!t||U.carPaused||SH)return;if(++carTick%5)return;const w=t.clientWidth;if(!w)return;const n=t.children.length;const i=Math.round(t.scrollLeft/w);t.scrollTo({left:((i+1)%n)*w,behavior:'smooth'})}

/* ---------- ações do checklist ---------- */
A.ck=(ds)=>{
  const d=U.date||D.today(),k=ds.k,was=isDone(d,k);
  setDone(d,k,!was,'toque');
  if(!was){U.pop=k;toast('Concluído',()=>{setDone(d,k,false);save()})}
  U.keepScroll=true;save();
};
A.openItem=(ds)=>{
  const d=U.date||D.today(),it=dayItems(d).find(i=>i.key===ds.k);if(!it)return;
  if(it.open==='task')openSheet('task',{id:it.id});else if(SHEETS[it.open])openSheet(it.open,{date:d});else{U.page=it.open;render();window.scrollTo(0,0)}
};
A.day=(ds)=>{const v=+ds.v;U.date=v===0?D.today():D.add(U.date||D.today(),v);U.showAll=false;render();window.scrollTo(0,0)};
A.showAll=()=>{U.showAll=!U.showAll;U.keepScroll=true;render()};
A.carPause=()=>{U.carPaused=!U.carPaused;U.keepScroll=true;render()};
A.carHide=()=>{S.set.carousel=false;save();toast('Carrossel oculto. Reative em Lista de Desejos.')};
A.ckin=(ds)=>{const d=U.date||D.today();S.checkins[d]=S.checkins[d]||{};const v=ds.f==='energy'?+ds.v:ds.v;S.checkins[d][ds.f]=S.checkins[d][ds.f]===v?undefined:v;U.keepScroll=true;save()};
A.qfav=(ds)=>{const q=S.quotes.find(x=>x.id===ds.id);q.fav=!q.fav;U.keepScroll=true;save()};
A.qhide=()=>{S.set.quoteHidden=true;save();toast('Frase oculta. Reative em Configurações.')};

/* ---------- FÉ ---------- */
SHEETS.rezar=({date})=>{
  const done=isDone(date,'rezar'),last=[];for(let i=13;i>=0;i--){const d=D.add(D.today(),-i);last.push(`<span title="${d}" style="width:16px;height:16px;border-radius:5px;display:inline-block;background:${isDone(d,'rezar')?'var(--fe)':'var(--soft)'}"></span>`)}
  return {title:'Rezar',body:`<p class="mut">${esc(D.long(date))}</p><button class="btn full ${done?'sec2':''}" style="${done?'':'background:var(--fe)'};min-height:64px;font-size:17px" data-a="pray" data-d="${date}">${done?'✓ Rezei hoje · desfazer':'Rezei hoje'}</button>
   <div class="sec"><h3>Últimos 14 dias</h3></div><div class="row wrap" style="gap:5px">${last.join('')}</div>
   <p class="note">A fé tem um espaço próprio no MMV: estes registros não entram nos indicadores de produtividade.</p>`};
};
A.pray=(ds)=>{const v=!isDone(ds.d,'rezar');setDone(ds.d,'rezar',v,'Fé');save({quiet:true});renderSheet();render();if(v)toast('Oração registrada')};
SHEETS.biblia=({date})=>{
  const r=S.faith.bible.find(x=>x.date===date)||{};
  return {title:'Ler a Bíblia',body:`<p class="mut">${esc(D.long(date))}</p>
   <div class="grid2"><label class="fld"><span>Livro</span><input id="bb" value="${esc(r.book||'')}" placeholder="Salmos"></label><label class="fld"><span>Capítulo</span><input id="bc" inputmode="numeric" value="${esc(r.chap||'')}"></label></div>
   <label class="fld"><span>Versículo (opcional)</span><input id="bv" value="${esc(r.verse||'')}"></label>
   <label class="fld"><span>Reflexão (opcional)</span><textarea id="br">${esc(r.refl||'')}</textarea></label>
   <p class="note demo">${demo('leitor')} A leitura da Bíblia dentro do app depende de um texto/arquivo autorizado vinculado na publicação. Por enquanto, marque manualmente.</p>
   <div class="sec"><h3>Registros anteriores</h3></div>${S.faith.bible.slice().reverse().slice(0,8).map(x=>`<div class="kv"><span>${D.short(x.date)} · ${esc(x.book)} ${esc(x.chap)}${x.verse?':'+esc(x.verse):''}</span><span class="mut tiny">${esc((x.refl||'').slice(0,40))}</span></div>`).join('')||'<p class="empty">Sem registros.</p>'}`,
   foot:`${isDone(date,'biblia')?`<button class="btn line" data-a="bibleUndo" data-d="${date}">Desmarcar</button>`:''}<button class="btn" style="background:var(--fe)" data-a="bibleSave" data-d="${date}">Salvar leitura</button>`};
};
A.bibleSave=(ds)=>{const d=ds.d;S.faith.bible=S.faith.bible.filter(x=>x.date!==d);S.faith.bible.push({date:d,book:val('bb'),chap:val('bc'),verse:val('bv'),refl:val('br')});setDone(d,'biblia',true,'leitura registrada');save({quiet:true});closeSheet();toast('Leitura da Bíblia registrada')};
A.bibleUndo=(ds)=>{setDone(ds.d,'biblia',false);S.faith.bible=S.faith.bible.filter(x=>x.date!==ds.d);save({quiet:true});closeSheet()};
SHEETS.gratidao=({date})=>{
  const g=S.faith.grat[date]||['','',''];
  return {title:'Três motivos de gratidão',body:`<p class="mut">${esc(D.long(date))}</p>
   ${micBlock('grat','Fale os três motivos num único áudio')}
   ${[0,1,2].map(i=>`<label class="fld"><span>${i+1}º motivo</span><input id="g${i}" value="${esc(g[i]||'')}"></label>`).join('')}
   <div class="sec"><h3>Reler agradecimentos</h3></div>${Object.keys(S.faith.grat).sort().reverse().filter(k=>k!==date).slice(0,6).map(k=>`<div class="card" style="padding:10px 12px"><small class="mut">${esc(D.lbl(k))}</small><div>${S.faith.grat[k].filter(Boolean).map(x=>'· '+esc(x)).join('<br>')}</div></div>`).join('')||'<p class="empty">Ainda sem registros.</p>'}`,
   foot:`<button class="btn" style="background:var(--fe)" data-a="gratSave" data-d="${date}">Salvar e concluir</button>`};
};
A.gratSave=(ds)=>{const a=[0,1,2].map(i=>val('g'+i));if(a.filter(Boolean).length<3){toast('Preencha os três motivos');return}S.faith.grat[ds.d]=a;setDone(ds.d,'gratidao',true,'formulário');save({quiet:true});closeSheet();toast('Gratidão registrada')};

/* microfone: ditado (quando disponível), áudio pronto ou demonstração */
const MIC={d:null,on:false,target:null,buf:''};
function micBlock(ctx,hint){
  return `<div class="card" style="margin-top:8px;padding:12px"><div class="row"><button class="mic ${MIC.on&&MIC.ctx===ctx?'on':''}" data-a="mic" data-ctx="${ctx}" aria-label="Gravar">${IC.mic}</button><div class="grow"><b style="font-weight:500">${esc(hint)}</b><br><small class="mut tiny" id="micst">${MIC.d?'Ditado disponível neste navegador':'No iPhone, toque no campo de texto e use o microfone do teclado'}</small></div></div>
  <div class="row wrap" style="margin-top:10px;gap:8px"><label class="btn sm line" style="position:relative;overflow:hidden">Enviar áudio pronto<input type="file" accept="audio/*" data-ch="audioFile" data-ctx="${ctx}" style="position:absolute;inset:0;opacity:0"></label><button class="btn sm sec2" data-a="demoAudio" data-ctx="${ctx}">Áudio de demonstração</button></div>
  <div id="audinfo-${ctx}"></div></div>`;
}
const DEMO_TXT={
  grat:'Hoje eu agradeço pela saúde da minha mãe, pelo cliente novo que chegou e pelo almoço tranquilo no meio da correria.',
  fech:'Hoje terminei as artes da Ana Beatriz, almocei tarde, fiz 20 minutos de bike, fiquei cansada e não gravei o TikTok. Mesmo assim, senti que o dia rendeu.',
  cap:'Gastei 38 reais de gasolina hoje, pessoal',
  idea:'Ideia: mostrar o processo de escolher a tipografia de uma marca, do rascunho à versão final.'
};
function applyTranscript(ctx,text,simulated){
  if(ctx==='grat'){const parts=text.replace(/^hoje eu agradeço (pela|pelo|por)\s*/i,'').split(/,\s*(?:e\s+)?|\s+e\s+(?=pel[oa]|por)/i).map(s=>s.replace(/^(pela|pelo|por)\s+/i,'').replace(/\.$/,'').trim()).filter(Boolean);
    [0,1,2].forEach(i=>{const e=document.getElementById('g'+i);if(e)e.value=(parts[i]||'').replace(/^./,c=>c.toUpperCase())});}
  else{const e=document.getElementById('tx-'+ctx);if(e){e.value=(e.value?e.value+' ':'')+text;e.dispatchEvent(new Event('input',{bubbles:true}))}}
  const info=document.getElementById('audinfo-'+ctx);
  if(info)info.innerHTML=`<p class="note ${simulated?'demo':''}">${simulated?'Transcrição <b>simulada</b> (áudio de demonstração). ':''}Transcrição original guardada: “${esc(text)}”</p>`;
  if(SH)SH.args.raw=text,SH.args.sim=!!simulated;
}
A.demoAudio=(ds)=>applyTranscript(ds.ctx,DEMO_TXT[ds.ctx]||DEMO_TXT.cap,true);
A.mic=(ds,el)=>{
  if(!MIC.d){toast('Use o microfone do teclado do iPhone ou o áudio de demonstração');const e=document.getElementById('tx-'+ds.ctx)||document.getElementById('g0');if(e)e.focus();return}
  if(MIC.on){MIC.d.stop().catch(()=>{});return}
  MIC.ctx=ds.ctx;
  MIC.d.start().catch(e=>{toast(e&&e.code==='not_granted'?'Microfone não autorizado. Digite ou use o teclado.':'Não consegui iniciar o ditado')});
};
function initDictation(){
  if(!window.claude||!claude.use)return;
  claude.use('dictation').then(d=>{if(!d)return;MIC.d=d;
    d.onFinal(({text})=>{if(MIC.ctx)applyTranscript(MIC.ctx,text,false)});
    d.onState(({state})=>{MIC.on=state==='listening';document.querySelectorAll('.mic').forEach(m=>m.classList.toggle('on',MIC.on))});
  }).catch(()=>{});
}
A.audioFile=(ds,el)=>{const f=el.files&&el.files[0];if(!f)return;const info=document.getElementById('audinfo-'+ds.ctx);
  if(SH)SH.args.audio={name:f.name,size:f.size};
  if(info)info.innerHTML=`<div class="note demo">Áudio recebido: <b>${esc(f.name)}</b> (${Math.round(f.size/1024)} KB). A transcrição real será feita na publicação, pelo modelo que você escolher (com aviso antes do envio). Aqui, digite o conteúdo ou use o áudio de demonstração.<div class="row wrap" style="gap:8px;margin-top:8px"><label class="row" style="gap:6px"><input type="radio" name="keepa" id="keepa1" checked> Guardar o áudio</label><label class="row" style="gap:6px"><input type="radio" name="keepa"> Excluir após transcrever</label></div></div>`};

/* ---------- LEITURA ---------- */
SHEETS.leitura=({date})=>{
  const b=curBook(),today=readStats(date),a=S.readT;
  let body='';
  if(b)body+=`<div class="card"><b>${esc(b.title)}</b><br><small class="mut">${esc(b.author)}</small>
   <div class="row" style="margin-top:10px"><div class="bar grow"><i style="width:${Math.round(b.current/b.pages*100)}%"></i></div><span class="num tiny">pág. ${b.current} de ${b.pages}</span></div></div>`;
  body+=readTimerCard(date);
  body+=`<div class="grid2" style="margin-top:10px"><div class="card"><small class="mut">Hoje</small><div class="big">${today.min} min</div><small class="mut">${today.pages} pág. · ${today.n} ${today.n===1?'sessão':'sessões'}</small></div><div class="card"><small class="mut">Critério do check</small><div class="big" style="font-size:20px">${S.set.readRule.type==='pages'?`avançar ${S.set.readRule.val} pág.`:`ler ${S.set.readRule.val} min`}</div><small class="mut">${isDone(date,'leitura')?'✓ cumprido':'ainda não'}</small></div></div>`;
  if(!a){
    body+=`<div class="sec"><h3>Já leu e esqueceu de cronometrar?</h3></div><div class="grid2"><label class="fld" style="margin:0"><span>Minutos</span><input id="rm" inputmode="numeric" placeholder="15"></label>${b?`<label class="fld" style="margin:0"><span>Até a página</span><input id="rp" inputmode="numeric" placeholder="${b.current+5}"></label>`:'<span></span>'}</div>
     <button class="btn sm sec2" style="margin-top:10px" data-a="readManual" data-d="${date}">Lançar leitura</button>`;
  }
  const foot=a?(a.running?`<button class="btn line" data-a="rtPause">${IC.pause} Pausar</button>`:`<button class="btn line" data-a="rtResume">${IC.play} Retomar</button>`)+`<button class="btn pes" data-a="rtFinish">Finalizar leitura</button>`
    :`<button class="btn pes" data-a="rtStart" data-d="${date}">${IC.play} Iniciar leitura</button>${b&&(b.demo||b.pdf)?`<button class="btn line" data-a="openReader">Abrir PDF</button>`:''}`;
  return {title:'Ler hoje',body,foot};
};
/* cronômetro de leitura: livro físico, Kindle, outro app ou qualquer leitura fora do PDF */
function readTElapsed(){const a=S.readT;if(!a)return 0;return a.acc+(a.running?Date.now()-a.start:0)}
function readTimerCard(date){const a=S.readT,b=curBook();
  if(!a)return `<div class="card" style="margin-top:10px;text-align:center"><small class="mut">Cronômetro de leitura</small><div class="timer" style="opacity:.35">00:00</div><small class="mut">Para livro físico, Kindle ou qualquer leitura fora do PDF. Toque em “Iniciar leitura”.</small></div>`;
  return `<div class="card" style="margin-top:10px;text-align:center"><small class="mut">${a.book&&b?esc(b.title):'Leitura'}</small><div class="timer" id="rtmr">${fmtSec(readTElapsed()/1000)}</div><small class="mut">${a.running?'lendo':'pausado'} · continua contando se você mudar de tela</small>
   ${b?`<label class="fld" style="margin:12px 0 0;text-align:left"><span>Parei na página (opcional)</span><input id="rtp" inputmode="numeric" placeholder="${b.current+1}"></label>`:''}</div>`}
A.rtStart=(ds)=>{const b=curBook();S.readT={date:ds.d,start:Date.now(),acc:0,running:true,book:b?b.id:null};save({quiet:true});renderSheet();renderMini()};
A.rtPause=()=>{const a=S.readT;a.acc+=Date.now()-a.start;a.running=false;save({quiet:true});renderSheet();renderMini()};
A.rtResume=()=>{const a=S.readT;a.start=Date.now();a.running=true;save({quiet:true});renderSheet();renderMini()};
A.rtFinish=()=>{const a=S.readT,sec=Math.round(readTElapsed()/1000),min=Math.max(1,Math.round(sec/60)),b=a.book?S.books.find(x=>x.id===a.book):null;
  let pages=0;const p=num(val('rtp'));if(b&&p){pages=Math.max(0,p-b.current);b.current=Math.min(b.pages,p)}
  S.readS.push({id:uid(),date:a.date,min,sec,pages,manual:false,timer:true,book:b?b.id:null});S.readT=null;
  if(!checkReadRule(a.date)&&!isDone(a.date,'leitura'))setDone(a.date,'leitura',true,'cronômetro');
  save({quiet:true});closeSheet();renderMini();toast(`Leitura salva: ${min} min${pages?` · ${pages} pág.`:''} ✓`);
  if(b&&b.current>=b.pages&&!b.demo)openSheet('bookDone',{id:b.id})};
function readStats(date){const r=S.readS.filter(x=>x.date===date);return {min:Math.round(r.reduce((a,x)=>a+x.min,0)),pages:r.reduce((a,x)=>a+x.pages,0),n:r.length}}
function checkReadRule(date){const st=readStats(date),R=S.set.readRule;const ok=R.type==='pages'?st.pages>=R.val:st.min>=R.val;if(ok&&!isDone(date,'leitura')){setDone(date,'leitura',true,'leitor');toast('“Ler hoje” concluído ✓');return true}return false}
A.readManual=(ds)=>{const b=curBook(),m=num(val('rm')),p=b?num(val('rp')):0;if(!m&&!p){toast('Informe os minutos'+(b?' ou a página':''));return}const pages=p?Math.max(0,p-b.current):0;if(p)b.current=Math.min(b.pages,p);S.readS.push({date:ds.d,min:m,pages,manual:true,book:b?b.id:null});if(m&&!isDone(ds.d,'leitura')&&S.set.readRule.type==='pages'&&!p)setDone(ds.d,'leitura',true,'manual');checkReadRule(ds.d);save({quiet:true});renderSheet();toast('Leitura lançada')};
/* leitor de exemplo: conta só o tempo ativo */
const RD={on:false,sid:null,active:0,last:0,pages:0};
A.openReader=()=>{const b=curBook();RD.on=true;RD.sid=uid();RD.active=0;RD.last=Date.now();RD.pages=0;RD.date=D.today();RD.startPage=b.current;if(b.current>=b.pages)b.current=0;openSheet('reader',{})};
SHEETS.reader=()=>{const b=curBook(),p=Math.max(0,Math.min(b.current,b.pages-1));
  return {title:esc(b.title),after(){if(b.pdf)pdfRender(p)},body:`<div class="row tiny mut" style="margin-bottom:8px"><span class="grow" id="rdpg">Página ${p+1} de ${b.pages}</span><span id="rdt" class="num">${fmtSec(RD.active)} ativo</span></div>
  ${b.pdf?`<div class="reader" id="rdp" style="padding:2px;min-height:420px;display:grid;place-items:center"><p class="mut tiny">Abrindo o PDF…</p></div>`:`<div class="reader" id="rdp">${esc(DEMO_BOOK[p])}</div>`}
  <p class="tiny mut" style="margin-top:8px">O tempo pausa quando o app vai para segundo plano ou fica 90 s sem interação.</p>
  <label class="fld"><span>Destacar trecho ou anotar insight (pág. ${p+1})</span><textarea id="rn" style="min-height:64px"></textarea></label><button class="btn sm sec2" style="margin-top:8px" data-a="readNote" data-p="${p+1}">Salvar nota</button>`,
  foot:`<button class="btn line" data-a="rdPrev" ${p<=0?'disabled':''}>${IC.l} Voltar</button><button class="btn pes" data-a="rdNext">${p>=b.pages-1?'Concluir':'Próxima página'} ${IC.r}</button>`};
};
const fmtSec=s=>`${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;
function readerTick(){if(!RD.on||!SH||SH.type!=='reader')return;if(document.visibilityState==='visible'&&Date.now()-RD.last<90000){RD.active++;const e=$('#rdt');if(e)e.textContent=fmtSec(RD.active)+' ativo';if(RD.active%15===0)readerFlush(true)}}
function readerFlush(quiet){if(!RD.sid)return;const b=curBook();let s=S.readS.find(x=>x.sid===RD.sid);if(!s){s={sid:RD.sid,date:RD.date,min:0,pages:0,manual:false,book:b.id};S.readS.push(s)}s.min=Math.round(RD.active/6)/10;s.pages=RD.pages;checkReadRule(RD.date);save({quiet:true})}
function stopReader(){if(RD.on){readerFlush(true);RD.on=false;RD.sid=null}}
A.rdNext=()=>{const b=curBook();RD.last=Date.now();if(b.current<b.pages){b.current++;RD.pages++}readerFlush();if(b.current>=b.pages){closeSheet();if(b.demo)toast('Livro de exemplo concluído!');else openSheet('bookDone',{id:b.id});return}renderSheet()};
A.rdPrev=()=>{const b=curBook();RD.last=Date.now();if(b.current>0)b.current--;renderSheet()};
A.readNote=(ds)=>{const t=val('rn');if(!t)return;curBook().notes.push({page:+ds.p,text:t,hl:true});save({quiet:true});RD.last=Date.now();renderSheet();toast('Nota salva no Caderno')};
document.addEventListener('pointerdown',()=>{RD.last=Date.now()},{passive:true});
document.addEventListener('scroll',()=>{RD.last=Date.now()},{passive:true,capture:true});

/* ---------- TREINO ---------- */
function trainElapsed(){const a=S.train.active;if(!a)return 0;return a.acc+(a.running?Date.now()-a.start:0)}
SHEETS.treino=({date})=>{
  const w=trainFor(date),a=S.train.active,done=isDone(date,'treino');
  const sess=S.train.sessions.filter(s=>s.date===date);
  let body=`<p class="mut">${esc(D.long(date))}</p>`;
  if(a){body+=`<div class="card" style="text-align:center"><b>${esc(a.act)}</b><div class="timer" id="tmr">${fmtSec(trainElapsed()/1000)}</div><small class="mut">${a.running?'em andamento':'pausado'} · continua contando se você mudar de tela</small></div>`}
  else{body+=`<div class="card"><small class="mut">Treino de hoje</small><div class="big" style="font-size:22px">${w?esc(w.act):'Dia livre'}</div><small class="mut">${w?'previsto: '+dur(w.dur):''}</small></div>`}
  body+=`${sess.length?`<div class="good" style="margin-top:10px">Registrado hoje: ${sess.map(s=>`${esc(s.act)} · ${s.min} min${s.manual?' (manual)':''}`).join(', ')}</div>`:''}
  <div class="sec"><h3>Trocar a atividade de hoje</h3></div><div class="grid2"><input id="ta" value="${esc(w?w.act:'')}" placeholder="Atividade"><input id="td" inputmode="numeric" value="${w?w.dur:30}" placeholder="min"></div><button class="btn sm sec2" style="margin-top:8px" data-a="trainSwap" data-d="${date}">Trocar</button>
  <div class="sec"><h3>Registrar sessão feita fora do app</h3></div><div class="grid2"><input id="ma" value="${esc(w?w.act:'')}" placeholder="Atividade"><input id="mm" inputmode="numeric" placeholder="minutos"></div><button class="btn sm sec2" style="margin-top:8px" data-a="trainManual" data-d="${date}">Registrar</button>`;
  const foot=a?(a.running?`<button class="btn line" data-a="trainPause">${IC.pause} Pausar</button>`:`<button class="btn line" data-a="trainResume">${IC.play} Retomar</button>`)+`<button class="btn pes" data-a="trainFinish">Finalizar</button>`:`<button class="btn pes" data-a="trainStart" data-d="${date}" ${w?'':'disabled'}>Iniciar treino</button>`;
  return {title:'Treino',body,foot};
};
A.trainStart=(ds)=>{const w=trainFor(ds.d);S.train.active={act:w.act,date:ds.d,start:Date.now(),acc:0,running:true};save({quiet:true});renderSheet()};
A.trainPause=()=>{const a=S.train.active;a.acc+=Date.now()-a.start;a.running=false;save({quiet:true});renderSheet();renderMini()};
A.trainResume=()=>{const a=S.train.active;a.start=Date.now();a.running=true;save({quiet:true});renderSheet();renderMini()};
A.trainFinish=()=>{const a=S.train.active,min=Math.max(1,Math.round(trainElapsed()/60000));S.train.sessions.push({id:uid(),date:a.date,act:a.act,min,manual:false,sec:Math.round(trainElapsed()/1000)});setDone(a.date,'treino',true,'cronômetro');S.train.active=null;save({quiet:true});closeSheet();toast(`Treino salvo: ${a.act} · ${min} min ✓`)};
A.trainSwap=(ds)=>{S.train.override[ds.d]={act:val('ta')||'Treino',dur:num(val('td'))||30};save({quiet:true});renderSheet();toast('Atividade de hoje trocada')};
A.trainManual=(ds)=>{const m=num(val('mm'));if(!m){toast('Informe os minutos');return}S.train.sessions.push({id:uid(),date:ds.d,act:val('ma')||'Treino',min:m,manual:true});setDone(ds.d,'treino',true,'manual');save({quiet:true});renderSheet();toast('Sessão registrada ✓')};
function renderMini(){const el=$('#mini');if(!el)return;const a=S.train.active,r=S.readT;
  if(a&&!(SH&&SH.type==='treino')){el.hidden=false;el.innerHTML=`<span class="grow">${esc(a.act)} · ${a.running?'em andamento':'pausado'}</span><span class="num" id="mtm">${fmtSec(trainElapsed()/1000)}</span><button class="btn sm" style="background:rgba(255,255,255,.22)" data-a="sheet" data-v="treino" data-d="${a.date}">Abrir</button>`;return}
  if(r&&!(SH&&SH.type==='leitura')){el.hidden=false;el.innerHTML=`<span class="grow">📖 Leitura · ${r.running?'lendo':'pausado'}</span><span class="num" id="mrt">${fmtSec(readTElapsed()/1000)}</span><button class="btn sm" style="background:rgba(255,255,255,.22)" data-a="sheet" data-v="leitura" data-d="${r.date}">Abrir</button>`;return}
  el.hidden=true}
function trainTick(){if(!S)return;if(S.train.active){const s=fmtSec(trainElapsed()/1000);const t=$('#tmr');if(t)t.textContent=s;const m=$('#mtm');if(m)m.textContent=s}if(S.readT){const s=fmtSec(readTElapsed()/1000);const t=$('#rtmr');if(t)t.textContent=s;const m=$('#mrt');if(m)m.textContent=s}}

/* ---------- CHECK-IN ---------- */
SHEETS.checkin=({date})=>{const d=date||U.date||D.today(),c=S.checkins[d]||{};
  return {title:'Check-in pessoal',body:`<p class="mut">${esc(D.long(d))}</p><label class="fld"><span>Humor</span><input id="cm" value="${esc(c.mood||'')}" placeholder="bem, cansada…"></label><label class="fld"><span>Energia (1 a 5)</span><input id="ce" inputmode="numeric" value="${esc(c.energy||'')}"></label><label class="fld"><span>Alimentação</span><textarea id="cf" placeholder="Como você comeu hoje?">${esc(c.food||'')}</textarea></label><p class="note">Também dá para preencher pelo relato em áudio do Fechamento do Dia.</p>`,
  foot:`<button class="btn pes" data-a="ckinSave" data-d="${d}">Salvar</button>`}};
A.ckinSave=(ds)=>{S.checkins[ds.d]={mood:val('cm'),energy:num(val('ce'))||undefined,food:val('cf')};setDone(ds.d,'checkin',true,'formulário');save({quiet:true});closeSheet();toast('Check-in salvo')};

/* ---------- TAREFA ---------- */
SHEETS.task=({id,date})=>{
  const t=id?task(id):{title:'',area:'dune',date:date||D.today(),dur:30,kind:'tarefa',time:'',link:'',client:'',prio:false,deps:[],due:''};
  const others=S.tasks.filter(x=>!x.done&&x.id!==id).slice(0,40);
  return {title:id?'Tarefa':'Nova tarefa',body:`
   <label class="fld"><span>Título</span><input id="tt" value="${esc(t.title)}"></label>
   <div class="grid2"><label class="fld"><span>Área</span><select id="tarea">${Object.keys(AREAS).filter(a=>a!=='fe').map(a=>`<option value="${a}" ${t.area===a?'selected':''}>${AREAS[a].n}</option>`).join('')}</select></label>
   <label class="fld"><span>Tipo</span><select id="tk">${['tarefa','entrega','gravação'].map(k=>`<option ${t.kind===k?'selected':''}>${k}</option>`).join('')}</select></label></div>
   <div class="grid2"><label class="fld"><span>Data</span><input type="date" id="td2" value="${t.date||''}"></label><label class="fld"><span>Horário (opcional)</span><input type="time" id="th" value="${t.time||''}"></label></div>
   <div class="grid2"><label class="fld"><span>Duração (min)</span><input id="tdu" inputmode="numeric" value="${t.dur}"></label><label class="fld"><span>Prazo final</span><input type="date" id="tdue" value="${t.due||''}"></label></div>
   <label class="fld"><span>Cliente / projeto</span><input id="tc" value="${esc(t.client||t.project||'')}"></label>
   <label class="fld"><span>Depende de</span><select id="tdep"><option value="">—</option>${others.map(o=>`<option value="${o.id}" ${(t.deps||[])[0]===o.id?'selected':''}>${esc(o.title)}</option>`).join('')}</select></label>
   <label class="fld"><span>Link de documento ou pasta</span><input id="tl" inputmode="url" value="${esc(t.link||'')}" placeholder="https://drive.google.com/…"></label>
   ${t.link?`<p class="tiny"><a href="${esc(t.link)}" target="_blank" rel="noopener">Abrir link</a></p>`:''}
   <label class="row fld" style="gap:10px"><input type="checkbox" id="tp" ${t.prio?'checked':''}> <span style="margin:0">Prioridade do dia</span></label>
   ${id?`<div class="sec"><h3>Remarcar rápido</h3></div><div class="row wrap" style="gap:8px"><button class="btn sm sec2" data-a="resch" data-id="${id}" data-v="1">Amanhã</button><button class="btn sm sec2" data-a="resch" data-id="${id}" data-v="7">+1 semana</button>${t.reschedules?`<span class="pill bad">remarcada ${t.reschedules}×</span>`:''}</div>
   ${t.gcal?`<p class="note demo">${demo('Google Agenda')} ${esc(t.gcal)}</p>`:''}`:''}`,
   foot:id?`<button class="btn line" data-a="taskDone" data-id="${id}">${t.done?'Reabrir':'✓ Concluir'}</button><button class="btn" data-a="taskSave" data-id="${id}">Salvar</button>`:`<button class="btn" data-a="taskSave">Salvar tarefa</button>`};
};
function moveTask(t,to){if(!to||t.date===to)return;t.history=t.history||[];if(t.date)t.history.push({from:t.date,to,at:D.today()});t.reschedules=(t.reschedules||0)+1;t.date=to;if(t.gcal)t.gcal='Evento atualizado (sem duplicar) · aguardando conexão'}
A.taskSave=(ds)=>{
  const title=val('tt');if(!title){toast('Dê um título');return}
  let t=ds.id?task(ds.id):null;const nd=val('td2');
  if(!t){t={id:uid(),done:false,reschedules:0,history:[],created:D.today(),date:nd};S.tasks.push(t)}else moveTask(t,nd);
  Object.assign(t,{title,area:val('tarea'),kind:val('tk'),time:val('th'),dur:num(val('tdu'))||30,due:val('tdue'),client:val('tc'),deps:val('tdep')?[val('tdep')]:[],link:val('tl'),prio:val('tp')});
  if(!t.date)t.date=nd;
  save({quiet:true});closeSheet();toast('Tarefa salva');
};
A.taskDone=(ds)=>{const t=task(ds.id);t.done=!t.done;t.doneAt=t.done?D.today():null;save({quiet:true});closeSheet();toast(t.done?'Tarefa concluída ✓':'Tarefa reaberta')};
A.resch=(ds)=>{const t=task(ds.id);moveTask(t,D.nextWk(D.add(t.date||D.today(),+ds.v)));save({quiet:true});renderSheet();toast('Remarcada para '+D.lbl(t.date))};
A.newTask=(ds)=>openSheet('task',{date:ds.v||D.today()});
A.openTask=(ds)=>openSheet('task',{id:ds.id});
