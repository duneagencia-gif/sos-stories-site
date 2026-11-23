'use strict';
/* ---------- AGENDA ---------- */
SCREENS.agenda=()=>{
  const T=D.today(),ws=U.agWeek||D.weekStart(T),sel=U.agDay||T,cap=usable();
  const days=[...Array(7)].map((_,i)=>D.add(ws,i));
  let h=`<div class="top"><button class="ib" data-a="agW" data-v="-7" aria-label="Semana anterior">${IC.l}</button><div class="grow"><h1>Agenda</h1><small class="mut">Semana de ${D.short(ws)} a ${D.short(D.add(ws,6))}</small></div><button class="ib" data-a="agW" data-v="7" aria-label="Próxima semana">${IC.r}</button></div>
  <div class="days">${days.map(d=>{const l=loadOf(d),wk=D.isWk(d);return `<button class="${d===sel?'on':''} ${wk&&l>cap?'over':''}" data-a="agDay" data-v="${d}"><span>${DOW[D.dow(d)]}</span><b>${+d.slice(8)}</b><span class="num" style="font-size:10.5px">${l?dur(l):'—'}</span></button>`}).join('')}</div>`;
  const l=loadOf(sel),free=cap-l,pct=Math.min(100,Math.round(l/cap*100));
  const its=[...S.events.filter(e=>e.date===sel).map(e=>({t:e.time||'',title:e.title,d:e.dur,area:e.area,ev:true})),...S.tasks.filter(t=>t.date===sel).map(t=>({t:t.time||'',title:t.title,d:t.dur,area:t.area,id:t.id,done:t.done,kind:t.kind,fixed:t.fixed,deps:t.deps}))].sort((a,b)=>(a.t||'99')<(b.t||'99')?-1:1);
  h+=`<div class="card" style="margin-top:12px"><div class="row"><div class="grow"><b>${esc(D.long(sel))}</b><br><small class="mut">${dur(l)} planejados de ${dur(cap)} úteis</small></div><b class="num" style="color:${free<0?'var(--red)':'var(--ok)'}">${free<0?'+'+dur(-free)+' acima':dur(free)+' livres'}</b></div>
   <div class="bar" style="margin-top:10px"><i style="width:${pct}%;background:${free<0?'var(--red)':'var(--pes)'}"></i></div>
   ${free<0?`<div class="warn" style="margin-top:10px">Este dia passou ${dur(-free)} do seu expediente com margem. Toque numa tarefa para remarcar ou use “Encaixar tarefa” para ver opções.</div>`:''}
   <div style="margin-top:8px">${its.map(i=>`<button class="li" ${i.id?`data-a="openTask" data-id="${i.id}"`:''}><span class="tm">${i.t||'—'}</span><span class="t"><b style="${i.done?'text-decoration:line-through;color:var(--ink3)':''}">${esc(i.title)}</b><small class="mut">${i.ev?'compromisso':esc(i.kind)} · ${dur(i.d)}${i.fixed?' · fixo':''}${i.deps&&i.deps.length&&task(i.deps[0])?' · depende de '+esc(task(i.deps[0]).title):''}</small></span><span class="dot" style="background:${AREAS[i.area]?.c}"></span></button>`).join('')||'<p class="empty">Nada marcado. Tempo livre.</p>'}</div>
   <div class="row" style="gap:8px;margin-top:10px"><button class="btn sm grow" data-a="sheet" data-v="fit" data-d="${sel}">Encaixar tarefa</button><button class="btn sm sec2" data-a="newTask" data-v="${sel}">+ Tarefa</button></div></div>`;
  // resumo da semana
  const wkDays=days.filter(d=>D.isWk(d)),tot=wkDays.reduce((a,d)=>a+loadOf(d),0),over=wkDays.filter(d=>loadOf(d)>cap);
  h+=`<div class="sec"><h2>Semana</h2><button class="link" data-a="go" data-v="config">Expediente</button></div><div class="card"><div class="kv"><span>Horas por dia · margem</span><b>${S.set.workH}h · ${S.set.margin}%</b></div><div class="kv"><span>Capacidade útil (seg–sex)</span><b class="num">${dur(cap*5)}</b></div><div class="kv"><span>Planejado</span><b class="num">${dur(tot)}</b></div><div class="kv"><span>Tempo livre</span><b class="num" style="color:${cap*5-tot<0?'var(--red)':'var(--ok)'}">${dur(Math.max(0,cap*5-tot))}</b></div>
  ${over.length?`<div class="warn" style="margin-top:8px">Conflito em ${over.map(d=>`${DOWL[D.dow(d)]} (${dur(loadOf(d)-cap)} a mais)`).join(', ')}.</div>`:'<div class="good" style="margin-top:8px">A semana cabe no seu expediente.</div>'}</div>
  <div class="card"><div class="row"><b class="grow">Google Agenda</b>${demo('a conectar na publicação')}</div><p class="tiny mut" style="margin:6px 0 0">Depois de conectado, o MMV consulta sua disponibilidade e cria ou atualiza apenas os blocos que você aprovar, vinculando cada tarefa ao evento para não duplicar. Agora tudo roda no calendário interno.</p></div>`;
  return h;
};
A.agW=(ds)=>{U.agWeek=D.add(U.agWeek||D.weekStart(D.today()),+ds.v);U.agDay=U.agWeek;render()};
A.agDay=(ds)=>{U.agDay=ds.v;U.keepScroll=true;render()};

/* encaixar tarefa: prazo, duração e dependência */
SHEETS.fit=({d,res})=>{
  return {title:'Encaixar tarefa',body:`<label class="fld"><span>O que precisa ser feito</span><input id="ft" value="${esc(SH.args.t||'')}" placeholder="Ex.: Editar vídeo de bastidores"></label>
  <div class="grid2"><label class="fld"><span>Duração (min)</span><input id="fd" inputmode="numeric" value="${SH.args.du||90}"></label><label class="fld"><span>Prazo</span><input type="date" id="fp" value="${SH.args.p||D.add(d||D.today(),4)}"></label></div>
  <div class="grid2"><label class="fld"><span>Área</span><select id="fa">${['dune','df','sos','pessoal'].map(a=>`<option value="${a}" ${SH.args.a===a?'selected':''}>${AREAS[a].n}</option>`).join('')}</select></label><label class="fld"><span>Depende de</span><select id="fdep"><option value="">—</option>${S.tasks.filter(t=>!t.done).map(t=>`<option value="${t.id}" ${SH.args.dep===t.id?'selected':''}>${esc(t.title)}</option>`).join('')}</select></label></div>
  <button class="btn sm sec2" style="margin-top:12px" data-a="fitRun" data-d="${d||D.today()}">Encontrar espaço</button><div id="fitres">${res||''}</div>`,foot:''};
};
A.fitRun=(ds)=>{
  const a=SH.args;a.t=val('ft');a.du=num(val('fd'))||60;a.p=val('fp');a.a=val('fa');a.dep=val('fdep');
  if(!a.t){toast('Descreva a tarefa');return}
  let st=D.today();if(a.dep){const dp=task(a.dep);if(dp&&dp.date&&dp.date>=st)st=D.add(dp.date,1)}
  const opts=[];let d=D.nextWk(st),firstFree=null;const table=[];
  while(d<=a.p){if(D.isWk(d)){const f=freeOf(d);table.push([d,f]);if(f>=a.du&&!firstFree)firstFree=d}d=D.add(d,1)}
  if(firstFree)opts.push({k:'fit',t:`Fazer ${D.rel(firstFree)} (${D.lbl(firstFree)})`,imp:`Sobram ${dur(freeOf(firstFree)-a.du)} nesse dia. Prazo mantido.`,date:firstFree});
  else{
    // mover uma tarefa móvel de algum dia antes do prazo
    for(const [day,f] of table){const need=a.du-f;const mv=S.tasks.filter(t=>t.date===day&&!t.done&&!t.fixed&&!t.time&&+t.dur>=need).sort((x,y)=>x.dur-y.dur)[0];
      if(mv){let to=D.nextWk(D.add(day,1)),lim=mv.due||D.add(day,10);while(to<=lim&&(!D.isWk(to)||freeOf(to)<mv.dur))to=D.add(to,1);if(to<=lim){opts.push({k:'move',t:`Fazer ${DOWL[D.dow(day)]} e mover “${mv.title}” para ${DOWL[D.dow(to)]}`,imp:`${DOWL[D.dow(day)]}: abre ${dur(mv.dur)}. ${DOWL[D.dow(to)]}: sobram ${dur(freeOf(to)-mv.dur)}. ${mv.due?'Prazo dela ('+D.short(mv.due)+') mantido.':''}`,date:day,mv:mv.id,to});break}}}
    let x=D.nextWk(D.add(a.p,1));for(let i=0;i<20&&freeOf(x)<a.du;i++)x=D.nextWk(D.add(x,1));
    opts.push({k:'late',t:`Estender o prazo para ${D.lbl(x)}`,imp:`Atrasa ${D.diff(a.p,x)} dia(s) em relação ao prazo.`,date:x});
  }
  a.opts=opts;a.pick=0;
  const msg=firstFree?`<div class="good" style="margin-top:12px">Cabe! ${esc(opts[0].imp)}</div>`:`<div class="warn" style="margin-top:12px">Di, até ${D.lbl(a.p)} o maior espaço livre é de ${dur(Math.max(0,...table.map(r=>r[1])))} e essa tarefa precisa de ${dur(a.du)}.</div>`;
  const tb=`<div class="card" style="margin-top:10px">${table.map(([d,f])=>`<div class="kv"><span>${D.lbl(d)}</span><b class="num" style="color:${f<a.du?'var(--red)':'var(--ok)'}">${dur(Math.max(0,f))} livres</b></div>`).join('')}</div>`;
  SH.args.res=msg+tb+`<div class="sec"><h3>Opções</h3></div>`+opts.map((o,i)=>`<button class="opt ${i===0?'on':''}" data-a="fitPick" data-i="${i}"><b>${esc(o.t)}</b><br><small class="mut">${esc(o.imp)}</small></button>`).join('')+`<button class="btn full" style="margin-top:12px" data-a="fitApprove">Aprovar</button>`;
  renderSheet();
};
A.fitPick=(ds)=>{SH.args.pick=+ds.i;document.querySelectorAll('.opt').forEach((o,i)=>o.classList.toggle('on',i===+ds.i))};
A.fitApprove=()=>{const a=SH.args,o=a.opts[a.pick];if(o.mv)moveTask(task(o.mv),o.to);S.tasks.push({id:uid(),title:a.t,area:a.a,date:o.date,dur:a.du,done:false,reschedules:0,history:[],kind:'tarefa',time:'',link:'',client:'',deps:a.dep?[a.dep]:[],due:a.p,created:D.today(),gcal:S.conn.gcal==='conectado'?'':'Bloco aprovado · será criado no Google Agenda após a conexão'});save({quiet:true});closeSheet();toast('Plano aprovado e salvo na agenda')};

/* ---------- CAPTURAR ---------- */
const CAPT=[['nota','Nota'],['ideia','Ideia'],['tarefa','Tarefa'],['gasto','Gasto'],['relato','Relato']];
A.capture=()=>openSheet('capture',{type:'nota'});
SHEETS.capture=(a)=>({title:'Capturar',body:`<div class="chips">${CAPT.map(([k,l])=>`<button class="chip ${a.type===k?'on':''}" data-a="capType" data-v="${k}">${l}</button>`).join('')}</div>
  <label class="fld"><span>${{ideia:'Sua ideia, do jeito que veio',nota:'Anotação',tarefa:'O que precisa ser feito',gasto:'Ex.: “Gastei 38 reais de gasolina hoje, pessoal”',relato:'Como foi o dia?'}[a.type]}</span><textarea id="tx-cap" placeholder="Digite ou fale…">${esc(a.text||'')}</textarea></label>
  ${micBlock('cap','Gravar, enviar áudio ou digitar')}
  ${a.type==='nota'&&a.sug?a.sug:''}
  <div class="row" style="margin-top:10px"><p class="tiny mut grow" style="margin:0">Ao salvar, você volta para a tela em que estava.</p><button class="link" data-a="goSheet" data-v="notas">Ver bloco de notas</button></div>`,
  foot:`<button class="btn dune" data-a="capSave">Salvar</button>`,
  after(){const e=$('#tx-cap');if(e&&!a.text)setTimeout(()=>e.focus(),280)}});
A.capType=(ds)=>{SH.args.text=val('tx-cap');SH.args.type=ds.v;SH.args.sug='';renderSheet();if(ds.v==='gasto'&&!SH.args.text){}};
A.capSave=()=>{
  const a=SH.args,txt=val('tx-cap');if(!txt){toast('Escreva ou grave algo primeiro');return}
  const rec={id:uid(),type:a.type,text:txt,raw:a.raw||txt,sim:!!a.sim,audio:a.audio||null,at:D.today(),ts:Date.now()};
  if(a.type==='gasto'){const p=parseExpense(txt);closeSheetSoft();openSheet('gasto',{pre:p,from:txt});return}
  if(a.type==='tarefa'){const dd=parseDate(txt)||D.today();closeSheetSoft();openSheet('task',{date:dd});setTimeout(()=>{const e=$('#tt');if(e)e.value=txt.replace(/\b(amanh[ãa]|hoje|at[ée] .*)$/i,'').trim()},30);return}
  if(a.type==='relato'){closeSheetSoft();openSheet('fechamento',{date:D.today(),text:txt,raw:a.raw,sim:a.sim});return}
  if(a.type==='ideia'){S.captures.push(rec);const c={id:uid(),original:txt,profile:guessProfile(txt),format:/carross/i.test(txt)?'carrossel':'video',stage:'captura',draft:null,post:'',plan:null,created:D.today(),ref:'',raw:rec.raw};S.contents.push(c);save({quiet:true});closeSheet();toast('Ideia salva no banco',()=>{U.page='conteudo';openSheet('content',{id:c.id})},'Desenvolver');return}
  if(a.type==='nota'){
    if(!a.sugDone){const s=noteSuggestions(txt);if(s.length){a.text=txt;a.sugList=s;a.sugDone=true;a.sug=`<div class="card" style="margin-top:10px"><b>Encontrei possíveis tarefas/prazos</b>${s.map((x,i)=>`<label class="row" style="margin-top:8px"><input type="checkbox" id="ns${i}" checked><span>${esc(x.title)} · <b>${D.lbl(x.date)}</b></span></label>`).join('')}<p class="tiny mut">Confirme e toque em Salvar.</p></div>`;renderSheet();return}}
    rec.tags=[];S.captures.push(rec);(a.sugList||[]).forEach((x,i)=>{if(val('ns'+i))S.tasks.push({id:uid(),title:x.title,area:'dune',date:x.date,dur:30,done:false,reschedules:0,history:[],kind:'tarefa',time:'',link:'',client:'',deps:[],created:D.today(),fromNote:rec.id})});
    save({quiet:true});closeSheet();toast('Nota salva'+((a.sugList||[]).length?' com tarefas confirmadas':''));return}
};
function closeSheetSoft(){SH=null}
function guessProfile(t){const n=norm(t);if(/tiktok/.test(n)&&/(pessoal|minha vida|rotina|diario)/.test(n))return 'tt_pes';if(/tiktok/.test(n))return 'tt_dune';return 'ig_dune'}
function parseDate(t){const n=norm(t),T=D.today();if(/\bhoje\b/.test(n))return T;if(/\bamanha\b/.test(n))return D.add(T,1);if(/\bontem\b/.test(n))return D.add(T,-1);
  const dw=['domingo','segunda','terca','quarta','quinta','sexta','sabado'];for(let i=0;i<7;i++){if(new RegExp('\\b'+dw[i]).test(n)){let d=D.add(T,1);while(D.dow(d)!==i)d=D.add(d,1);return d}}
  const m=n.match(/\bdia\s+(\d{1,2})(?:\/(\d{1,2}))?/)||n.match(/\b(\d{1,2})\/(\d{1,2})\b/);if(m){let mo=m[2]?+m[2]:+T.slice(5,7),y=+T.slice(0,4);let s=`${y}-${String(mo).padStart(2,'0')}-${String(+m[1]).padStart(2,'0')}`;if(s<T)s=m[2]?`${y+1}${s.slice(4)}`:D.add(s,30).slice(0,8)+String(+m[1]).padStart(2,'0');return s}
  return null}
function noteSuggestions(t){const out=[];t.split(/[.\n;]/).forEach(s=>{const n=norm(s);if(/(preciso|tenho que|lembrar de|enviar|mandar|cobrar|ligar|entregar|revisar)/.test(n)){const d=parseDate(s)||D.add(D.today(),1);out.push({title:s.trim().replace(/^(preciso|tenho que|lembrar de)\s+/i,'').replace(/^./,c=>c.toUpperCase()),date:d})}});return out.slice(0,3)}

/* ---------- FECHAMENTO DO DIA ---------- */
SHEETS.fechamento=(a)=>{
  const date=a.date||D.today();
  if(a.step!=='sum'){
    const prev=S.closings.slice().sort((x,y)=>x.date<y.date?1:-1).slice(0,5);
    return {title:'Fechamento do dia',body:`<p class="mut">${esc(D.long(date))}</p>${micBlock('fech','Conte como foi o seu dia')}
    <label class="fld"><span>Relato</span><textarea id="tx-fech" style="min-height:120px" placeholder="O que fez, o que ficou, como comeu, se treinou, como se sentiu…">${esc(a.text||'')}</textarea></label>
    <p class="note">A organização do relato roda localmente no artefato. Na publicação, ela usa o modelo escolhido (Claude ou ChatGPT), com aviso antes de enviar um relato pessoal.</p>
    <div class="sec"><h3>Histórico</h3></div>${prev.map(c=>`<div class="kv"><span>${D.short(c.date)} · ${esc(c.mood||'—')} · energia ${c.energy||'—'}</span><span class="mut tiny">${esc(c.yield||'')}</span></div>`).join('')}`,
    foot:`<button class="btn dune" data-a="fechParse">Organizar relato</button>`};
  }
  const r=a.res;
  const ta=(id,lbl,v)=>`<label class="fld"><span>${lbl}</span><textarea id="${id}" style="min-height:${v&&v.split('\n').length>1?80:52}px" placeholder="(não mencionado)">${esc(v||'')}</textarea></label>`;
  return {title:'Resumo do dia',body:`<p class="mut tiny">Confira e corrija. O que você não mencionou ficou em branco.</p>
   ${ta('f_done','O que fiz',r.done.join('\n'))}${ta('f_pend','Ficou pendente',r.pending.join('\n'))}${ta('f_extra','Fora do planejamento',r.extra.join('\n'))}
   <div class="grid2"><label class="fld"><span>Alimentação</span><input id="f_food" value="${esc(r.food)}" placeholder="(não mencionado)"></label><label class="fld"><span>Atividade física</span><input id="f_act" value="${esc(r.activity)}" placeholder="(não mencionado)"></label></div>
   <div class="grid2"><label class="fld"><span>Humor</span><input id="f_mood" value="${esc(r.mood)}" placeholder="(não mencionado)"></label><label class="fld"><span>Energia (1–5)</span><input id="f_en" inputmode="numeric" value="${r.energy||''}" placeholder="—"></label></div>
   <label class="fld"><span>Como o dia rendeu</span><input id="f_y" value="${esc(r.yield)}" placeholder="(não mencionado)"></label>
   ${r.actions.length?`<div class="sec"><h3>Atualizações sugeridas</h3></div><div class="card">${r.actions.map((x,i)=>`<label class="row" style="padding:8px 0;align-items:flex-start"><input type="checkbox" id="fa${i}" ${x.on?'checked':''}><span>${esc(x.label)}${x.ext?`<br><small class="mut">Evento externo: só será movido no Google Agenda com sua confirmação.</small>`:''}</span></label>`).join('')}</div>`:''}
   ${r.doubts.length?`<div class="warn" style="margin-top:10px"><b>Preciso confirmar</b><br>${r.doubts.map(esc).join('<br>')}</div>`:''}
   <p class="note ${a.sim?'demo':''}">${a.sim?'Transcrição simulada. ':''}Relato original guardado: “${esc(a.raw||a.text)}”</p>`,
   foot:`<button class="btn line" data-a="fechBack">Voltar</button><button class="btn dune" data-a="fechSave">Salvar</button>`};
};
A.fechParse=()=>{const t=val('tx-fech');if(!t){toast('Conte como foi o dia (ou use o áudio de demonstração)');return}const a=SH.args;a.text=t;a.raw=a.raw||t;a.res=parseClosing(t,a.date||D.today());a.step='sum';renderSheet();$('.sh-b').scrollTop=0};
A.fechBack=()=>{SH.args.step='';renderSheet()};
A.fechSave=()=>{
  const a=SH.args,r=a.res,date=a.date||D.today(),lines=id=>val(id).split('\n').map(s=>s.trim()).filter(Boolean);
  const c={date,raw:a.raw||a.text,sim:!!a.sim,done:lines('f_done'),pending:lines('f_pend'),extra:lines('f_extra'),food:val('f_food'),activity:val('f_act'),mood:val('f_mood'),energy:num(val('f_en'))||'',yield:val('f_y'),source:'relato'};
  S.closings=S.closings.filter(x=>x.date!==date);S.closings.push(c);
  r.actions.forEach((x,i)=>{if(!val('fa'+i))return;
    if(x.type==='done'){const t=task(x.id);if(t){t.done=true;t.doneAt=date}}
    if(x.type==='resch'){const t=task(x.id);if(t)moveTask(t,D.nextWk(D.add(date,1)))}
    if(x.type==='train'){S.train.sessions.push({id:uid(),date,act:x.act,min:x.min,manual:true,fromReport:true});if(x.counts)setDone(date,'treino',true,'relato')}
    if(x.type==='extra')S.tasks.push({id:uid(),title:x.title,area:'dune',date,dur:30,done:true,doneAt:date,unplanned:true,reschedules:0,history:[],kind:'tarefa',time:'',link:'',client:'',deps:[],created:date,inList:false});
  });
  if(c.mood||c.energy||c.food){S.checkins[date]=Object.assign({},S.checkins[date],{mood:(S.checkins[date]||{}).mood||c.mood.split(',')[0],energy:(S.checkins[date]||{}).energy||c.energy||undefined,food:(S.checkins[date]||{}).food||c.food,fromReport:true})}
  setDone(date,'fechamento',true,'relato');
  save({quiet:true});closeSheet();toast('Fechamento salvo ✓');
};
const STOP=new Set('hoje para pela pelo com sem mais muito pouco tambem ainda depois antes minha meu minhas meus uma umas uns dos das nas nos que porque como'.split(' '));
const toks=s=>norm(s).replace(/[^a-z0-9 ]/g,' ').split(/\s+/).filter(w=>w.length>=4&&!STOP.has(w));
function matchTask(clause,date,wantDone){
  const ws=toks(clause).filter(w=>!/(ei|ou|i)$/.test(w)||w==='tiktok');let best=null,bs=0,tie=false;
  S.tasks.forEach(t=>{if(!t.date||Math.abs(D.diff(date,t.date))>3)return;if(!wantDone&&t.done&&t.date!==date)return;const tt=toks(t.title);let s=ws.filter(w=>tt.some(x=>x===w||(x.length>4&&w.startsWith(x.slice(0,5))))).length;if(!s)return;if(t.date===date)s+=.5;if(s>bs){bs=s;best=t;tie=false}else if(s===bs)tie=true});
  return {t:best,tie};
}
function parseClosing(raw,date){
  const r={done:[],pending:[],extra:[],food:'',activity:'',mood:'',energy:'',yield:'',actions:[],doubts:[]};
  const cl=raw.split(/[.;!?\n]|,\s*|\s+e\s+(?=(?:não\s+|nao\s+)?[a-zà-ú]+(?:ei|i|ou)\b)/i).map(s=>s.trim().replace(/^(hoje|mesmo assim|e)\s+/i,'').trim()).filter(s=>s&&!/^(mesmo assim|hoje)$/i.test(s));
  const tw=trainFor(date);
  cl.forEach(c=>{const n=norm(c);
    let m;
    if((m=n.match(/\bnao\s+(gravei|fiz|terminei|consegui|entreguei|li|treinei|postei|enviei|finalizei|rezei|comecei)\b/))){
      const {t,tie}=matchTask(c,date);
      const INF={gravei:'Gravar',fiz:'Fazer',terminei:'Terminar',consegui:'',entreguei:'Entregar',li:'Ler',treinei:'Treinar',postei:'Postar',enviei:'Enviar',finalizei:'Finalizar',rezei:'Rezar',comecei:'Começar'};
      r.pending.push(t&&!tie?t.title:c.replace(/^n[ãa]o\s+(\S+)\s*/i,(_,v)=>(INF[norm(v)]??v)+' ').trim().replace(/^./,x=>x.toUpperCase()));
      if(t&&!tie){r.actions.push({type:'resch',id:t.id,label:`Manter “${t.title}” pendente e remarcar para ${D.lbl(D.nextWk(D.add(date,1)))}`,on:false,ext:!!t.gcal})}
      else if(tie)r.doubts.push(`“${c}”: qual tarefa ou perfil? Encontrei mais de uma opção.`);
      return}
    if((m=n.match(/(\d+)\s*(minutos?|min|horas?|h)\b\s*(de\s+)?([a-z]+(?:\s+em casa)?)?/))&&/(fiz|treinei|pedalei|corri|caminhei|yoga|bike|cardio|academia|treino|alonguei)/.test(n)){
      const min=+m[1]*(/^h/.test(m[2])?60:1),act=(m[4]||'atividade').trim();r.activity=`${act.replace(/^./,x=>x.toUpperCase())} · ${min} min`;
      const counts=!!(tw&&norm(tw.act).includes(norm(act).split(' ')[0]));
      r.actions.push({type:'train',act:act.replace(/^./,x=>x.toUpperCase()),min,counts,label:`Registrar ${min} min de ${act}${counts?` como o treino de hoje (${tw.act}) e dar o check`:''}`,on:true});return}
    if(/(almocei|almoco|jantei|jantar|comi\b|cafe da manha|lanchei|lanche|belisquei|beber agua|bebi)/.test(n)){r.food=(r.food?r.food+'; ':'')+c.replace(/^./,x=>x.toUpperCase());return}
    if((m=n.match(/(cansad|exaust|esgotad|feliz|animad|ansios|tranquil|trist|estressad|motivad|disposta|sem energia|leve|irritad)\w*/))){r.mood=(r.mood?r.mood+', ':'')+m[0];const lo=/(cansad|exaust|esgotad|sem energia|trist)/.test(m[0]),hi=/(animad|disposta|motivad|feliz)/.test(m[0]);if(lo)r.energy=2;else if(hi)r.energy=4;return}
    if(/(rendeu|produtiv|valeu a pena)/.test(n)){r.yield=/nao rendeu|pouco produtiv/.test(n)?'não rendeu':'rendeu';return}
    if(/\b(terminei|finalizei|entreguei|fiz|gravei|conclui|enviei|postei|publiquei|resolvi|mandei|li|editei|apresentei|aprovei)\b/.test(n)){
      const {t,tie}=matchTask(c,date,false);
      const txt=c.replace(/^./,x=>x.toUpperCase());r.done.push(txt);
      if(t&&!tie&&!t.done)r.actions.push({type:'done',id:t.id,label:`Marcar “${t.title}” como concluída`,on:true});
      else if(tie)r.doubts.push(`“${c}”: a qual tarefa isso se refere?`);
      else if(!t){r.extra.push(txt);r.actions.push({type:'extra',title:txt,label:`Registrar “${txt}” como feito fora do planejamento`,on:true})}
      return}
  });
  return r;
}

/* ---------- CONTEÚDO ---------- */
const FMT={video:{n:'Vídeo',steps:[['Roteirizar',45,-6],['Gravar',90,-4],['Editar',60,-3],['Aprovar e postar',15,0]]},carrossel:{n:'Carrossel',steps:[['Escrever texto',45,-5],['Criar arte',90,-3],['Aprovar',20,-1],['Postar',10,0]]}};
const STG=[['captura','Captura'],['desenvolver','Desenvolver'],['planejar','Planejar'],['produzir','Produzir'],['publicado','Publicado']];
function nextAction(c){
  if(c.stage==='publicado')return 'Publicado em '+D.short(c.publishedAt||c.post);
  if(!c.draft)return 'Desenvolver o rascunho';
  if(!c.plan)return 'Planejar data e produção';
  const st=c.plan.steps.map(s=>({...s,t:task(s.taskId)})).find(s=>s.t&&!s.t.done);
  return st?`${st.label} · ${D.rel(st.t.date)}`:'Registrar a publicação';
}
SCREENS.conteudo=()=>{
  const f=U.contentF,list=S.contents.filter(c=>f==='todos'||(f==='ativos'?c.stage!=='publicado':f==='semdata'?!c.post&&c.stage!=='publicado':c.stage==='publicado'));
  return `${backTop('Conteúdo')}<div class="chips">${[['ativos','Em andamento'],['semdata','Sem data'],['publicado','Publicados'],['todos','Todos']].map(([k,l])=>`<button class="chip ${f===k?'on':''}" data-a="setU" data-k="contentF" data-v="${k}">${l}</button>`).join('')}</div>
  <div class="card" style="margin-top:12px">${list.map(c=>`<button class="li" data-a="openContent" data-id="${c.id}"><span class="t"><b>${esc(c.original)}</b><small class="mut">${esc(S.editorial[c.profile].n)} · ${FMT[c.format].n} · <b style="color:var(--dune)">${esc(nextAction(c))}</b></small></span>${IC.r}</button>`).join('')||'<p class="empty">Nada por aqui.</p>'}</div>
  <button class="btn full sec2" style="margin-top:12px" data-a="capIdea">+ Nova ideia</button>
  <div class="sec"><h2>Perfil editorial</h2></div>${Object.entries(S.editorial).map(([k,p])=>`<div class="card"><div class="row"><b class="grow">${esc(p.n)}</b>${areaPill(p.area)}<button class="link" data-a="sheet" data-v="editorial" data-k="${k}">Editar</button></div><small class="mut">${esc(p.temas)}</small><br><small class="mut3">Tom: ${esc(p.tom)} · Exemplo aprovado: ${esc(p.ex)}</small></div>`).join('')}
  <p class="note">A publicação dos posts fica com você. O MMV planeja, cria as tarefas e registra quando você publicar.</p>`;
};
A.capIdea=()=>openSheet('capture',{type:'ideia'});
A.openContent=(ds)=>openSheet('content',{id:ds.id});
SHEETS.editorial=({k})=>{const p=S.editorial[k];return {title:p.n,body:`<label class="fld"><span>Temas</span><textarea id="et">${esc(p.temas)}</textarea></label><label class="fld"><span>Tom de voz e preferências</span><input id="eto" value="${esc(p.tom)}"></label><label class="fld"><span>Exemplos aprovados</span><textarea id="eex">${esc(p.ex)}</textarea></label>`,foot:`<button class="btn" data-a="edSave" data-k="${k}">Salvar perfil</button>`}};
A.edSave=(ds)=>{Object.assign(S.editorial[ds.k],{temas:val('et'),tom:val('eto'),ex:val('eex')});save({quiet:true});closeSheet();toast('Perfil editorial salvo')};
function genDraft(c){
  const p=S.editorial[c.profile],idea=c.original.replace(/^ideia:\s*/i,'').replace(/\.$/,''),I=idea.charAt(0).toLowerCase()+idea.slice(1);
  const hooks={ig_dune:`Quase ninguém vê esta parte do processo: ${I}.`,tt_dune:`Bastidores da DUNE: ${I}. Vem comigo.`,tt_pes:`Diário da reorganização: hoje é sobre ${I}.`};
  const ctas={ig_dune:'Salva este post e me conta nos comentários qual etapa você quer ver em detalhe.',tt_dune:'Me segue para ver o próximo bastidor da agência.',tt_pes:'Se você também está se reorganizando, me conta como foi o seu dia.'};
  if(c.format==='video')return {hook:hooks[c.profile],script:`1. Abertura (0–3 s): o gancho, olhando para a câmera.\n2. Contexto (3–15 s): por que isso importa para quem acompanha ${p.n}.\n3. Desenvolvimento (15–45 s): mostrar ${I}, em três momentos curtos.\n4. Aprendizado (45–55 s): uma frase prática que a pessoa leva.\n5. Fechamento: CTA.`,takes:'Close no rosto falando o gancho\nTela do computador ou mesa com o processo\nDetalhe das mãos (papel, caneta, mouse)\nResultado final em tela cheia\nTake extra de reação para o fechamento',cta:ctas[c.profile]};
  return {headline:idea.length>60?idea.slice(0,57)+'…':idea,pages:`Página 1: ${idea}\nPágina 2: O problema que isso resolve\nPágina 3: Primeiro passo\nPágina 4: Segundo passo\nPágina 5: Terceiro passo\nPágina 6: Resumo em uma frase\nPágina 7: ${ctas[c.profile]}`,cta:ctas[c.profile],caption:`Complemento da legenda: conto aqui o bastidor que não coube nas páginas, com um exemplo real de cliente (com autorização). Tom: ${p.tom.toLowerCase()}.`};
}
function suggestPost(){return D.add(D.weekStart(D.today()),14)}
function idealPlan(fmt,post){return FMT[fmt].steps.map(([l,du,o])=>({label:l,dur:du,date:o===0?post:D.prevWk(D.add(post,o))}))}
function evalPlan(steps,ex){const add=Object.assign({},ex&&ex.add);return steps.map(s=>{const f=freeOf(s.date,{skip:ex&&ex.skip,add,sub:ex&&ex.sub});add[s.date]=(add[s.date]||0)+s.dur;return Object.assign({},s,{free:f,ok:f>=s.dur})})}
function shiftPlan(steps,i,post,ex){
  const out=steps.map(s=>Object.assign({},s)),add=Object.assign({},ex&&ex.add);
  for(let k=0;k<i;k++)add[out[k].date]=(add[out[k].date]||0)+out[k].dur;
  let prev=out[i].date;
  for(let k=i;k<out.length-1;k++){
    let d=k===i?D.add(out[k].date,1):(out[k].date>prev?out[k].date:prev),ok=false;
    while(d<post){if(D.isWk(d)&&freeOf(d,{skip:ex&&ex.skip,add})>=out[k].dur){ok=true;break}d=D.add(d,1)}
    if(!ok)return null;out[k].date=d;add[d]=(add[d]||0)+out[k].dur;prev=d;
  }
  const last=out[out.length-1];if(freeOf(last.date,{skip:ex&&ex.skip,add})<last.dur)return null;
  return out;
}
function planOptions(c,post){
  const skip=new Set((c.plan&&c.plan.steps||[]).map(s=>s.taskId).filter(Boolean));
  const ev=evalPlan(idealPlan(c.format,post),{skip});const i=ev.findIndex(s=>!s.ok);
  if(i<0)return {ev,conflict:null,opts:[{k:'ok',title:'Manter o plano',imp:'Todas as etapas cabem na agenda.',steps:ev}]};
  const s=ev[i],opts=[],dn=DOWL[D.dow(s.date)],pn=DOWL[D.dow(post)];
  const A1=shiftPlan(ev,i,post,{skip});
  if(A1)opts.push({k:'shift',title:`${s.label} na ${DOWL[D.dow(A1[i].date)]} e manter a postagem de ${pn}`,imp:A1.slice(i,-1).map(x=>`${x.label}: ${D.lbl(x.date)}`).join(' · ')+'. Nenhuma outra tarefa muda.',steps:evalPlan(A1,{skip})});
  const need=s.dur-s.free;
  const cand=S.tasks.filter(t=>t.date===s.date&&!t.done&&!t.fixed&&!t.time&&+t.dur>=need).sort((a,b)=>a.dur-b.dur);
  for(const mv of cand){let to=D.nextWk(D.add(s.date,1)),lim=mv.due||D.add(s.date,7),found=null;
    while(to<=lim){if(D.isWk(to)){const ex={skip,add:{[to]:+mv.dur},sub:{[s.date]:+mv.dur}};const e2=evalPlan(idealPlan(c.format,post),ex);if(e2.every(x=>x.ok)){found={to,e2};break}}to=D.add(to,1)}
    if(found){opts.push({k:'move',title:`${s.label} na ${dn} e mover “${mv.title}” para ${D.lbl(found.to)}`,imp:`${dn}: abre ${dur(mv.dur)}. ${DOWL[D.dow(found.to)]}: ficam ${dur(usable()-loadOf(found.to)-mv.dur-found.e2.filter(x=>x.date===found.to).reduce((a,x)=>a+x.dur,0))} livres. ${mv.due?`O prazo dela (${D.short(mv.due)}) continua atendido.`:''}`,steps:found.e2,mv:mv.id,to:found.to});break}}
  let p2=D.nextWk(D.add(post,1));for(let n=0;n<14;n++){const e3=evalPlan(idealPlan(c.format,p2),{skip});if(e3.every(x=>x.ok)){opts.push({k:'late',title:`Adiar a postagem para ${D.lbl(p2)}`,imp:`Posta ${D.diff(post,p2)} dia(s) depois. Nada mais muda.`,steps:e3,post:p2});break}p2=D.nextWk(D.add(p2,1))}
  const sh=opts.find(o=>o.k==='shift'),mv=opts.find(o=>o.k==='move');
  const msg=`Di, na ${dn} sobram ${dur(Math.max(0,s.free))} e ${s.label==='Gravar'?'esse vídeo':'essa etapa'} precisa de ${dur(s.dur)}.`+(sh?` Na ${DOWL[D.dow(sh.steps[i].date)]} dá pra ${s.label.toLowerCase()} e manter a postagem de ${pn}.`:'')+(mv?` Se quiser ${s.label.toLowerCase()} na ${dn}, precisamos mover “${task(mv.mv).title}”.`:'');
  return {ev,conflict:{i,msg},opts};
}
SHEETS.content=({id})=>{
  const c=S.contents.find(x=>x.id===id),a=SH.args,si=STG.findIndex(s=>s[0]===c.stage);
  let b=`<div class="row" style="gap:4px;margin-bottom:12px">${STG.map((s,i)=>`<div class="grow" style="text-align:center"><div style="height:5px;border-radius:9px;background:${i<=si?'var(--dune)':'var(--soft)'}"></div><small class="tiny ${i===si?'':'mut3'}">${s[1]}</small></div>`).join('')}</div>
  <div class="card"><small class="mut">Ideia original (preservada)</small><p style="margin:4px 0 0">${esc(c.original)}</p>${c.ref?`<small class="mut3">${esc(c.ref)}</small>`:''}</div>
  <div class="grid2"><label class="fld"><span>Perfil</span><select id="cp" data-ch="cMeta" data-id="${id}">${Object.entries(S.editorial).map(([k,p])=>`<option value="${k}" ${c.profile===k?'selected':''}>${p.n}</option>`).join('')}</select></label><label class="fld"><span>Formato</span><select id="cf" data-ch="cMeta" data-id="${id}">${Object.entries(FMT).map(([k,f])=>`<option value="${k}" ${c.format===k?'selected':''}>${f.n}</option>`).join('')}</select></label></div>`;
  // rascunho
  b+=`<div class="sec"><h2>Rascunho</h2>${c.draft?'':''}</div>`;
  if(!c.draft)b+=`<button class="btn full dune" data-a="cDraft" data-id="${id}">Gerar rascunho no meu estilo</button>`;
  else{const d=c.draft;const f=c.format==='video'?[['hook','Gancho'],['script','Roteiro falado'],['takes','Sugestões de takes'],['cta','CTA']]:[['headline','Headline'],['pages','Texto por página'],['cta','CTA'],['caption','Legenda']];
    b+=f.map(([k,l])=>`<label class="fld"><span>${l}</span><textarea id="d_${k}" style="min-height:${k==='script'||k==='pages'||k==='takes'?130:60}px">${esc(d[k]||'')}</textarea></label>`).join('')+`<p class="note demo">${demo()} Rascunho gerado localmente a partir do seu perfil editorial. Na publicação, ${esc(S.set.models.ideias)} gera o texto (envia só a ideia e o perfil).</p><button class="btn sm sec2" data-a="cDraftSave" data-id="${id}" style="margin-top:8px">Salvar rascunho</button>`}
  // plano
  if(c.draft&&c.stage!=='publicado'){
    const post=a.post||c.post||suggestPost();
    b+=`<div class="sec"><h2>Planejar</h2></div><div class="row" style="gap:8px;align-items:flex-end"><label class="fld grow" style="margin:0"><span>Data de postagem ${c.post?'':'(sugerida)'}</span><input type="date" id="cpost" value="${post}"></label><button class="btn sm" data-a="cCheck" data-id="${id}">Conferir agenda</button></div>`;
    if(a.po){const P=a.po;
      b+=P.conflict?`<div class="warn" style="margin-top:12px">${esc(P.conflict.msg)}</div>`:`<div class="good" style="margin-top:12px">Tudo cabe na sua agenda.</div>`;
      b+=`<div class="card steps" style="margin-top:10px">${P.ev.map(s=>`<div class="li"><span class="tm" style="width:64px">${D.short(s.date)}</span><span class="t"><b>${s.label}</b><small class="mut">${DOWL[D.dow(s.date)]} · precisa de ${dur(s.dur)} · livres ${dur(Math.max(0,s.free))}</small></span>${s.ok?'<span class="pill ok">cabe</span>':'<span class="pill bad">não cabe</span>'}</div>`).join('')}</div>`;
      if(P.conflict)b+=`<div class="sec"><h3>Opções e impacto</h3></div>`+P.opts.map((o,i)=>`<button class="opt ${a.pick===i?'on':''}" data-a="cPick" data-i="${i}"><b>${esc(o.title)}</b><br><small class="mut">${esc(o.imp)}</small></button>`).join('');
      b+=`<p class="tiny mut" style="margin-top:8px">Ao aprovar, as etapas viram tarefas no calendário interno${S.conn.gcal==='conectado'?' e no Google Agenda':'; no Google Agenda depois da conexão'}, sem duplicar.</p>`;
    }
  }
  // produção
  if(c.plan){b+=`<div class="sec"><h2>Produção</h2></div><div class="card">${c.plan.steps.map(s=>{const t=task(s.taskId);return t?`<div class="li"><button class="ck" style="width:44px;height:44px" data-a="cStep" data-id="${t.id}"><i style="width:26px;height:26px;border-radius:50%;border:2px solid var(--line);display:grid;place-items:center;${t.done?'background:var(--pes);border-color:var(--pes);color:#fff':''}">${t.done?IC.check:''}</i></button><span class="t"><b>${esc(s.label)}</b><small class="mut">${D.lbl(t.date)} · ${dur(t.dur)}</small></span></div>`:''}).join('')}</div>`;
    if(c.stage!=='publicado')b+=`<label class="fld"><span>Link do post publicado (opcional)</span><input id="clink" inputmode="url" placeholder="https://instagram.com/p/…"></label><button class="btn full sec2" style="margin-top:10px" data-a="cPub" data-id="${id}">Registrar publicação</button>`;}
  if(!c.post&&c.stage!=='publicado')b+=`<div class="row" style="gap:8px;margin-top:16px"><button class="btn sm line grow" data-a="cArchive" data-id="${id}">Arquivar ideia</button></div>`;
  const foot=a.po&&c.stage!=='publicado'?`<button class="btn dune" data-a="cApprove" data-id="${id}">Aprovar plano</button>`:'';
  return {title:'Conteúdo',body:b,foot};
};
A.cMeta=(ds)=>{const c=S.contents.find(x=>x.id===ds.id);c.profile=val('cp');const nf=val('cf');if(nf!==c.format){c.format=nf;c.draft=null}SH.args.po=null;save({quiet:true});renderSheet()};
A.cDraft=(ds)=>{const c=S.contents.find(x=>x.id===ds.id);c.draft=genDraft(c);if(c.stage==='captura')c.stage='desenvolver';save({quiet:true});renderSheet()};
A.cDraftSave=(ds)=>{const c=S.contents.find(x=>x.id===ds.id);Object.keys(c.draft).forEach(k=>{const e=document.getElementById('d_'+k);if(e)c.draft[k]=e.value});save({quiet:true});toast('Rascunho salvo')};
A.cCheck=(ds)=>{const c=S.contents.find(x=>x.id===ds.id);if(c.draft)A.cDraftSave(ds);const post=val('cpost');SH.args.post=post;SH.args.po=planOptions(c,post);SH.args.pick=0;renderSheet()};
A.cPick=(ds)=>{SH.args.pick=+ds.i;renderSheet()};
A.cApprove=(ds)=>{
  const c=S.contents.find(x=>x.id===ds.id),P=SH.args.po,o=P.opts[SH.args.pick||0];
  if(o.mv)moveTask(task(o.mv),o.to);
  const post=o.post||SH.args.post;const old=(c.plan&&c.plan.steps)||[];
  const steps=o.steps.map((s,i)=>{let t=old[i]&&task(old[i].taskId);
    if(t){moveTask(t,s.date);t.dur=s.dur}else{t={id:uid(),title:`${s.label} · ${c.original.slice(0,38)}${c.original.length>38?'…':''}`,area:S.editorial[c.profile].area,date:s.date,dur:s.dur,done:false,reschedules:0,history:[],kind:s.label==='Gravar'?'gravação':'tarefa',time:'',link:'',client:'',deps:[],created:D.today(),contentId:c.id};S.tasks.push(t)}
    t.gcal=S.conn.gcal==='conectado'?'':'Bloco aprovado · será criado no Google Agenda após a conexão (sem duplicar)';
    return {label:s.label,taskId:t.id}});
  steps.forEach((s,i)=>{if(i>0)task(s.taskId).deps=[steps[i-1].taskId]});
  c.plan={steps};c.post=post;c.stage='produzir';SH.args.po=null;save({quiet:true});renderSheet();toast('Plano aprovado: tarefas criadas na agenda');
};
A.cStep=(ds)=>{const t=task(ds.id);t.done=!t.done;t.doneAt=t.done?D.today():null;save({quiet:true});renderSheet()};
A.cPub=(ds)=>{const c=S.contents.find(x=>x.id===ds.id);c.stage='publicado';c.publishedAt=D.today();c.link=val('clink');(c.plan?c.plan.steps:[]).forEach(s=>{const t=task(s.taskId);if(t&&!t.done){t.done=true;t.doneAt=D.today()}});save({quiet:true});renderSheet();toast('Publicação registrada')};
A.cArchive=(ds)=>{const c=S.contents.find(x=>x.id===ds.id);c.stage='arquivado';S.contents=S.contents.filter(x=>x!==c);S.archived=(S.archived||[]).concat(c);save({quiet:true});closeSheet();toast('Ideia arquivada')};

/* ---------- PROJETOS ---------- */
SCREENS.projetos=()=>{
  const ar=U.projA||'dune';
  let h=backTop('Projetos')+`<div class="seg">${['dune','extra','df','sos','pessoal'].map(a=>`<button class="${ar===a?'on':''}" data-a="setU" data-k="projA" data-v="${a}">${{dune:'DUNE',extra:'Extras',df:'Diana F.',sos:'SOS',pessoal:'Pessoal'}[a]}</button>`).join('')}</div>`;
  if(ar==='dune')h+=`<div class="sec"><h2>Clientes</h2></div><div class="card">${S.clients.map(c=>`<div class="li"><span class="t"><b>${esc(c.name)}</b><small class="mut">Contato: ${esc(c.contact)} · ${S.tasks.filter(t=>t.client===c.name&&!t.done).length} tarefas abertas</small></span></div>`).join('')}<div class="row" style="gap:8px;margin-top:8px"><input id="ncl" placeholder="Novo cliente"><button class="btn sm" data-a="addClient">Adicionar</button></div></div>`;
  h+=`<div class="sec"><h2>Projetos</h2></div>`+S.projects.filter(p=>p.area===ar).map(p=>{const ts=S.tasks.filter(t=>t.project===p.name);const open=ts.filter(t=>!t.done);
    return `<div class="card"><div class="row"><b class="grow">${esc(p.name)}</b><span class="pill ${p.status==='ativo'?'ok':''}">${esc(p.status)}</span></div><small class="mut">${p.client?esc(p.client)+' · ':''}prazo ${D.short(p.due)} · ${ts.length-open.length}/${ts.length} tarefas</small>
    ${open.slice(0,4).map(t=>`<button class="li" data-a="openTask" data-id="${t.id}"><span class="t"><b>${esc(t.title)}</b><small class="mut">${t.date?D.rel(t.date):'sem data'} · ${esc(t.kind)} · ${dur(t.dur)}</small></span></button>`).join('')}
    <div class="row" style="gap:8px;margin-top:8px"><input id="pl-${p.id}" inputmode="url" value="${esc(p.link)}" placeholder="Link da pasta ou documento"><button class="btn sm sec2" data-a="projLink" data-id="${p.id}">Salvar</button></div>${p.link?`<a class="tiny" href="${esc(p.link)}" target="_blank" rel="noopener">Abrir pasta/documento</a>`:''}</div>`}).join('');
  h+=`<div class="card"><div class="row" style="gap:8px"><input id="npj" placeholder="Novo projeto em ${esc(AREAS[ar].n)}"><button class="btn sm" data-a="addProj" data-v="${ar}">Criar</button></div></div><p class="note demo">${demo('Google Drive')} Por enquanto, cole as URLs das pastas e documentos. A busca no Drive será conectada na publicação.</p>`;
  return h;
};
A.addClient=()=>{const n=val('ncl');if(!n)return;S.clients.push({id:uid(),name:n,contact:'',link:''});save()};
A.addProj=(ds)=>{const n=val('npj');if(!n)return;S.projects.push({id:uid(),area:ds.v,name:n,client:'',status:'ativo',due:D.add(D.today(),30),link:'',dec:''});save()};
A.projLink=(ds)=>{S.projects.find(p=>p.id===ds.id).link=val('pl-'+ds.id);U.keepScroll=true;save();toast('Link salvo')};
