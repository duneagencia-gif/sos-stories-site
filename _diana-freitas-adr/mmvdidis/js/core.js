'use strict';
/* ---------- utilidades ---------- */
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=()=>Math.random().toString(36).slice(2,10);
const brl=v=>(+v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const num=v=>{if(typeof v==='number')return v;v=String(v??'').replace(/[^\d,.-]/g,'');if(v.includes(','))v=v.replace(/\./g,'').replace(',','.');return parseFloat(v)||0};
const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
const DOW=['dom','seg','ter','qua','qui','sex','sáb'],DOWL=['domingo','segunda','terça','quarta','quinta','sexta','sábado'],MES=['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'],MESL=['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
const D={
  off:-3,
  now(){return new Date(Date.now()+this.off*3600e3)},
  today(){return this.now().toISOString().slice(0,10)},
  nowMin(){const d=this.now();return d.getUTCHours()*60+d.getUTCMinutes()},
  add(s,n){const d=new Date(s+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)},
  dow(s){return new Date(s+'T12:00:00Z').getUTCDay()},
  diff(a,b){return Math.round((new Date(b+'T12:00:00Z')-new Date(a+'T12:00:00Z'))/864e5)},
  weekStart(s){return this.add(s,-((this.dow(s)+6)%7))},
  lbl(s){return `${DOW[this.dow(s)]}, ${+s.slice(8)} ${MES[+s.slice(5,7)-1]}`},
  long(s){return `${DOWL[this.dow(s)]}, ${+s.slice(8)} de ${MESL[+s.slice(5,7)-1]}`},
  short(s){return s?`${s.slice(8)}/${s.slice(5,7)}`:''},
  rel(s){const n=this.diff(this.today(),s);return n===0?'hoje':n===1?'amanhã':n===-1?'ontem':this.lbl(s)},
  isWk(s){const w=this.dow(s);return w>0&&w<6},
  nextWk(s){while(!this.isWk(s))s=this.add(s,1);return s},
  prevWk(s){while(!this.isWk(s))s=this.add(s,-1);return s},
  hm(m){m=Math.max(0,Math.round(m));return `${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`},
  toMin(t){const[a,b]=String(t||'0:0').split(':');return (+a||0)*60+(+b||0)},
  ym(s){return s.slice(0,7)},
  mesNome(s){return MESL[+s.slice(5,7)-1]}
};
const dur=m=>{m=Math.round(+m||0);return m>=60?`${Math.floor(m/60)}h${m%60?String(m%60).padStart(2,'0'):''}`:`${m} min`};
const AREAS={dune:{n:'DUNE',c:'var(--dune)'},df:{n:'Diana Freitas',c:'var(--df)'},sos:{n:'SOS Stories',c:'var(--sos)'},pessoal:{n:'Pessoal',c:'var(--pes)'},extra:{n:'Extras · Diana',c:'var(--ext)'},fe:{n:'Fé',c:'var(--fe)'}};
const areaPill=a=>`<span class="pill ${a}">${esc((AREAS[a]||{}).n||a)}</span>`;
const demo=t=>`<span class="pill demo">${esc(t||'demonstração')}</span>`;

/* ---------- ícones ---------- */
const IC={
  check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  hoje:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/></svg>',
  agenda:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>',
  plus:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  fin:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="3" y="6" width="18" height="13" rx="3"/><path d="M3 10h18M7 15h3"/></svg>',
  mais:'<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5.5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="18.5" cy="12" r="1.8"/></svg>',
  l:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
  r:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>',
  x:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  bell:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 16V11a6 6 0 0112 0v5l1.5 2h-15zM10 20.5a2 2 0 004 0"/></svg>',
  pause:'<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>',
  play:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 5l12 7-12 7z"/></svg>',
  eye:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
  mic:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0013 0M12 17.5V21"/></svg>',
  livro:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5.5C6.5 4 9.5 4 12 6c2.5-2 5.5-2 8-.5V19c-2.5-1.5-5.5-1.5-8 .5-2.5-2-5.5-2-8-.5z"/><path d="M12 6v13.5"/></svg>',
  treino:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M7 8v8M17 8v8M4.5 10v4M19.5 10v4M7 12h10"/></svg>',
  nota:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4h9l4 4v12H6z"/><path d="M14.5 4v4.5H19M9.5 13h6M9.5 16.5h4"/></svg>',
  edit:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 20h4L19 9l-4-4L4 16z"/></svg>'
};

/* ---------- estado ---------- */
const KEY='mmv.v1',PKEY='mmv.photos',AKEY='mmv.auth';
let S=null,PH={};
const U={tab:'hoje',page:null,date:null,showAll:false,carPaused:false,finArea:'tudo',wishF:'todos',agDay:null,contentF:'ativos',revTab:'semana'};

function ls(k,v){try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v);return true}catch(e){return null}}
function loadState(){
  try{S=JSON.parse(ls(KEY)||'null')}catch(e){S=null}
  if(!S||!(S.v>=1))S=seed();
  if(runMigrations()&&!S.fresh){S.updated=Date.now();ls(KEY,JSON.stringify(S))}
  try{PH=JSON.parse(ls(PKEY)||'{}')||{}}catch(e){PH={}}
  seedPhotos();
}
let saveT=null,STORE_OK=true;
function save(opts){
  S.updated=Date.now();delete S.fresh;
  notifDiff();
  STORE_OK=ls(KEY,JSON.stringify(S))!==null;
  clearTimeout(saveT);saveT=setTimeout(cloudPush,1500);
  if(!(opts&&opts.quiet))render();
}
function runMigrations(){let c=migrate();c=migrateCk()||c;c=migrateQuotes()||c;return c}
function savePhotos(){ls(PKEY,JSON.stringify(PH))}

/* nuvem: banco por pessoa na conta Claude (capability db) */
const CLOUD={db:null,ref:null,uid:null,state:'verificando',busy:false,again:false};
async function cloudInit(){
  if(!window.claude||!claude.use){CLOUD.state='indisponível';return}
  try{
    const [db,user]=await Promise.all([claude.use('db'),claude.use('user')]);
    if(!db||!user){CLOUD.state='indisponível';render();return}
    const id=await user.id();if(!id){CLOUD.state='indisponível';render();return}
    CLOUD.db=db;CLOUD.uid=id;CLOUD.ref=db.doc('data/users/'+id+'/state');
    const snap=await CLOUD.ref.get();
    if(snap.exists){
      const r=snap.data();let remote=null;try{remote=JSON.parse(r.json)}catch(e){}
      if(remote&&remote.v>=1&&(S.fresh||(remote.updated||0)>(S.updated||0))){const wasFresh=S.fresh;S=remote;if(runMigrations()){S.updated=Date.now()}ls(KEY,JSON.stringify(S));if(wasFresh)render()}
      // fotos
      const need=allPhotoIds().filter(p=>!PH[p]);
      for(const p of need){try{const s=await db.doc('data/users/'+id+'/ph_'+p).get();if(s.exists){PH[p]=s.data().src}}catch(e){}}
      savePhotos();
    }
    CLOUD.state='sincronizado';render();
    if(!S.fresh&&(!snap.exists||(S.updated||0)>((snap.exists&&snap.data().updated)||0)))cloudPush();
  }catch(e){CLOUD.state='indisponível';render()}
}
async function cloudPush(){
  if(!CLOUD.ref)return;
  if(CLOUD.busy){CLOUD.again=true;return}
  CLOUD.busy=true;
  try{
    await CLOUD.ref.set({json:JSON.stringify(S),updated:S.updated||Date.now()});
    for(const p of allPhotoIds()){if(PH[p]&&!(S.phSynced||{})[p]){await CLOUD.db.doc('data/users/'+CLOUD.uid+'/ph_'+p).set({src:PH[p]});S.phSynced=S.phSynced||{};S.phSynced[p]=1;ls(KEY,JSON.stringify(S));}}
    CLOUD.state='sincronizado';
  }catch(e){CLOUD.state=(e&&e.code==='quota_exceeded')?'espaço cheio':'falha — tentando de novo'}
  CLOUD.busy=false;
  if(CLOUD.again){CLOUD.again=false;setTimeout(cloudPush,800)}
}
function allPhotoIds(){const o=[];S.wishes.forEach(w=>(w.photos||[]).forEach(p=>o.push(p)));return o}

/* ---------- consultas comuns ---------- */
const task=id=>S.tasks.find(t=>t.id===id);
function usable(){return Math.round(S.set.workH*60*(1-S.set.margin/100))}
function loadOf(date,ex){
  let m=0;
  S.tasks.forEach(t=>{if(t.date===date&&!t.done&&!(ex&&ex.skip&&ex.skip.has(t.id)))m+=+t.dur||0});
  S.events.forEach(e=>{if(e.date===date)m+=+e.dur||0});
  if(ex&&ex.add&&ex.add[date])m+=ex.add[date];
  if(ex&&ex.sub&&ex.sub[date])m-=ex.sub[date];
  return m;
}
const freeOf=(d,ex)=>usable()-loadOf(d,ex);

/* checklist do dia: hábitos + tarefas de todas as áreas */
function trainFor(date){const o=S.train.override[date];if(o)return o.act?o:null;return S.train.schedule[D.dow(date)]||null}
function dayItems(date){
  const dow=D.dow(date),out=[];
  S.habits.forEach(h=>{
    if(!h.on)return;
    const days=h.id==='revisao'?[S.set.reviewDow]:h.days;
    if((h.freq==='days'||h.id==='revisao')&&!days.includes(dow))return;
    if(h.id==='treino'){const w=trainFor(date);if(!w)return;out.push({key:'treino',label:'Treino · '+w.act,sub:dur(w.dur),area:'pessoal',order:h.order,open:'treino'});return}
    let sub=h.sub||'';
    if(h.id==='revisao')sub='às '+S.set.reviewTime;
    if(h.id==='leitura'){const b=curBook();sub=S.readT?'📖 leitura em andamento':b?`${b.title} · meta: ${S.set.readRule.type==='pages'?S.set.readRule.val+' pág.':S.set.readRule.val+' min'}`:'Toque para iniciar o cronômetro'}
    if(h.id==='biblia'){const r=S.faith.bible.find(x=>x.date===date);if(r)sub=[r.book,r.chap].filter(Boolean).join(' ')}
    out.push({key:h.id,label:h.label,sub,area:h.area,order:h.order,open:h.open});
  });
  S.tasks.filter(t=>t.date===date&&t.inList!==false).forEach((t,i)=>{
    out.push({key:'t:'+t.id,label:t.title,sub:[t.time,t.kind!=='tarefa'?t.kind:'',dur(t.dur)].filter(Boolean).join(' · '),area:t.area,order:(t.time?40+D.toMin(t.time)/1440:45)+i/100,open:'task',id:t.id});
  });
  out.sort((a,b)=>a.order-b.order);
  out.forEach(it=>it.done=isDone(date,it.key));
  return out;
}
function isDone(date,key){if(key.startsWith('t:')){const t=task(key.slice(2));return !!(t&&t.done)}return !!(S.checks[date]&&S.checks[date][key])}
function setDone(date,key,val,via){
  if(key.startsWith('t:')){const t=task(key.slice(2));if(!t)return;t.done=val;t.doneAt=val?date:null;return}
  S.checks[date]=S.checks[date]||{};
  if(val)S.checks[date][key]={at:Date.now(),via:via||'toque'};else delete S.checks[date][key];
}
function curBooks(){return S.books.filter(b=>b.status==='atual')}
function curBook(){const f=S.books.find(b=>b.id===S.focusBook&&b.status==='atual');return f||S.books.find(b=>b.status==='atual')}
function bookPct(b){return b.pages?Math.min(100,Math.round(b.current/b.pages*100)):0}
function bookPg(b){return b.pages?`pág. ${b.current} de ${b.pages}`:`pág. ${b.current}`}

/* ---------- notificações (agendadas no fuso America/Bahia) ---------- */
function notifList(){
  const P=S.notif,T=D.today(),out=[];
  const at=(date,min)=>date+' '+D.hm(min);
  if(P.bills){S.bills.filter(b=>b.status!=='pago').forEach(b=>{
    const dd=D.diff(T,b.due);
    if(P.billDay&&dd>=0&&dd<=14)out.push({k:'bd:'+b.id,when:at(b.due,D.toMin(P.billTime)),title:`Conta vence hoje: ${b.desc}`,body:P.hideVal?'Toque para ver o valor':brl(b.value),open:['bill',b.id],cat:'Contas'});
    const pre=D.add(b.due,-7);
    if(P.bill7&&D.diff(T,pre)>=0)out.push({k:'b7:'+b.id,when:at(pre,D.toMin(P.billTime)),title:`Daqui a 7 dias: ${b.desc}`,body:(P.hideVal?'':brl(b.value)+' · ')+'vence '+D.short(b.due),open:['bill',b.id],cat:'Contas'});
  })}
  S.tasks.filter(t=>!t.done&&t.date&&D.diff(T,t.date)>=0&&D.diff(T,t.date)<=14).forEach(t=>{
    if(t.kind==='gravação'&&P.rec){const m=t.time?D.toMin(t.time)-P.recLead:D.toMin('09:00');out.push({k:'rc:'+t.id,when:at(t.date,m),title:t.time?`Você tem uma gravação ${t.area==='dune'?'da DUNE':t.area==='sos'?'do SOS Stories':''} às ${t.time.replace(':00','h')}`.replace('  ',' '):`Gravação hoje: ${t.title}`,body:t.title,open:['task',t.id],cat:'Gravações'})}
    else if(t.kind==='entrega'&&P.del){out.push({k:'en:'+t.id,when:at(t.date,D.toMin(P.taskTime)),title:`Entrega ${t.date===T?'hoje':D.rel(t.date)}: ${t.title}`,body:t.client||AREAS[t.area].n,open:['task',t.id],cat:'Entregas'})}
    else if(t.kind==='tarefa'&&P.tasks){out.push({k:'tk:'+t.id,when:at(t.date,D.toMin(P.taskTime)),title:`Tarefa ${t.date===T?'de hoje':D.rel(t.date)}: ${t.title}`,body:dur(t.dur),open:['task',t.id],cat:'Tarefas'})}
  });
  S.tasks.filter(t=>t.remind&&!t.done&&t.date&&D.diff(T,t.date)>=0&&D.diff(T,t.date)<=40).forEach(t=>out.push({k:'rm:'+t.id,when:at(t.date,t.time?D.toMin(t.time):D.toMin('09:00')),title:'Lembrete: '+t.title,body:t.client||'',open:['task',t.id],cat:'Lembretes'}));
  if(P.openRem){const nd=(S.opens||{})[T]?D.add(T,1):T;out.push({k:'op:'+nd,when:at(nd,D.toMin(P.openTime||'19:00')),title:'Ei, Didis! Foi o nosso compromisso fazer deste ano um ano incrível.',body:'Entra no MMV e atualiza as informações de hoje.',open:['pend'],cat:'Se você não entrar no dia'})}
  if(P.goalPrompt&&typeof missingGoals==='function'){const gt=D.toMin(P.goalTime||'09:00');
    for(let i=0;i<=40;i++){const d=D.add(T,i);missingGoals(d).forEach(m=>{const k='gp:'+m.l+':'+m.k;if(!out.some(x=>x.k===k))out.push({k,when:at(d,gt),title:ASK[m.l](m.k),body:m.next?`Amanhã começa ${PER.short(m.l,m.k)}. Defina no padrão SMART.`:'Toque para definir no padrão SMART',open:['goal',m.l+'|'+m.k],cat:'Metas'})})}}
  if(P.ckOn!==false&&typeof goalsDue==='function'){const tm=D.toMin(P.ckTime||'09:00');const seen=new Set();
    S.goals.forEach(g=>{const [a,b]=goalWindow(g);if(goalTarget(g)&&goalCur(g)>=goalTarget(g))return;let d=nextCheck(g);if(d<T)d=T;if(d>D.add(b,3)||D.diff(T,d)>40||d<a)return;const k='ck:'+g.id+':'+d;if(seen.has(k))return;seen.add(k);
      const p=goalPace(g);out.push({k,when:at(d,tm),title:p.status==='ok'||p.status==='done'?`Check-in: “${g.title}”. Você está no ritmo, bora manter? 👏`:`Check-in: “${g.title}” precisa de gás 🔥`,body:'Toque para atualizar e dizer por quê',open:['check',g.id],cat:'Check-in de metas'})})}
  if(P.summary){const pend=dayItems(T).filter(i=>!i.done).length;if(pend>0)out.push({k:'sm:'+T,when:at(T,D.toMin(P.sumTime)),title:pend===1?'Ainda fica uma pendência pra hoje. Quer concluir ou remarcar?':`Ainda ficam ${pend===2?'duas':pend} pendências pra hoje. Quer concluir ou remarcar?`,body:'Resumo do dia',open:['pend'],cat:'Resumo'})}
  const nowS=T+' '+D.hm(D.nowMin());
  out.forEach(n=>n.past=n.when<nowS);
  return out.sort((a,b)=>a.when<b.when?-1:1);
}
function notifDiff(){
  if(!S.notif)return;
  const cur={};notifList().forEach(n=>cur[n.k]=n);
  const prev=S.nsnap||{};
  for(const k in prev){
    if(!cur[k]){
      const [type,id]=k.split(':');let why='não é mais necessário';
      const t=task(id),b=S.bills.find(x=>x.id===id);
      if(type==='gp')why='meta definida';else if(type==='ck')why='check-in feito';else if(type==='op')why='você entrou no app';else if(t&&t.done)why='tarefa concluída';else if(b&&b.status==='pago')why='conta paga';else if(t)why='tarefa remarcada para '+D.short(t.date);else if(type==='sm')why='sem pendências';
      if(prev[k].when>=D.today())S.nlog.unshift({at:Date.now(),title:prev[k].title,st:'cancelado',why});
    }else if(cur[k].when!==prev[k].when){S.nlog.unshift({at:Date.now(),title:cur[k].title,st:'reagendado',why:'agora em '+D.short(cur[k].when.slice(0,10))+' às '+cur[k].when.slice(11)})}
  }
  S.nlog=S.nlog.slice(0,30);
  const snap={};for(const k in cur)snap[k]={when:cur[k].when,title:cur[k].title};
  S.nsnap=snap;
}

/* ---------- UI: render, folhas, toast ---------- */
function render(){
  if(!AUTH.ok){renderLogin();return}
  {const T=D.today();S.opens=S.opens||{};if(!S.opens[T]){S.opens[T]=1;for(const k in S.opens)if(D.diff(k,T)>60)delete S.opens[k];ls(KEY,JSON.stringify(S))}}
  const scr=SCREENS[U.page||U.tab]||SCREENS.hoje;
  const y=window.scrollY;
  $('#app').innerHTML=scr();
  $('#tabs').innerHTML=tabsHtml();
  $('#tabs').hidden=false;
  renderMini();
  if(U.keepScroll)window.scrollTo(0,y);U.keepScroll=false;
  afterRender();
}
function tabsHtml(){
  const t=(id,lbl,ic)=>`<button data-a="tab" data-v="${id}" class="${(U.page?'mais':U.tab)===id?'on':''}" aria-label="${lbl}">${IC[ic]}${lbl}</button>`;
  return `<nav>${t('hoje','Hoje','hoje')}${t('agenda','Agenda','agenda')}${t('leitura','Leitura','livro')}<button class="cap" data-a="capture" aria-label="Capturar nota"><span>${IC.nota}</span>Notas</button>${t('treinos','Treino','treino')}${t('fin','Finanças','fin')}${t('mais','Mais','mais')}</nav>`;
}
let SH=null;
function openSheet(type,args){SH={type,args:args||{}};renderSheet();$('#scrim').classList.add('on');requestAnimationFrame(()=>$('#sheet').classList.add('on'))}
function renderSheet(){
  if(!SH)return;const r=SHEETS[SH.type](SH.args);
  $('#sheet').innerHTML=`<div class="sh-h"><h2>${r.title}</h2><button class="ib" data-a="closeSheet" aria-label="Fechar">${IC.x}</button></div><div class="sh-b">${r.body}</div>${r.foot?`<div class="sh-f">${r.foot}</div>`:''}`;
  if(r.after)r.after();
}
function closeSheet(){if(SH&&SH.onClose)SH.onClose();SH=null;$('#sheet').classList.remove('on');$('#scrim').classList.remove('on');stopReader();setTimeout(()=>{if(!SH)$('#sheet').innerHTML=''},260);render()}
let toastT;
function toast(msg,undo,label){const el=$('#toast');el.innerHTML=`<span>${esc(msg)}</span>${undo?`<button data-a="undo">${esc(label||'Desfazer')}</button>`:''}`;U.undo=undo||null;el.classList.add('on');clearTimeout(toastT);toastT=setTimeout(()=>el.classList.remove('on'),undo?5000:2600)}
const val=id=>{const e=document.getElementById(id);return e?(e.type==='checkbox'?e.checked:e.value.trim()):''};

/* imagens: comprime para caber no armazenamento */
function fileToImg(file,max){return new Promise((res,rej)=>{const fr=new FileReader();fr.onload=()=>{const im=new Image();im.onload=()=>{const k=Math.min(1,(max||720)/Math.max(im.width,im.height));const c=document.createElement('canvas');c.width=Math.round(im.width*k);c.height=Math.round(im.height*k);c.getContext('2d').drawImage(im,0,0,c.width,c.height);res(c.toDataURL('image/jpeg',.72))};im.onerror=rej;im.src=fr.result};fr.onerror=rej;fr.readAsDataURL(file)})}

/* ilustrações de exemplo para os desejos (dados fictícios) */
function artCar(){return 'data:image/svg+xml;utf8,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F6D9B8"/><stop offset="1" stop-color="#FBF1E4"/></linearGradient><linearGradient id="c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C98E5A"/><stop offset="1" stop-color="#9A6534"/></linearGradient></defs><rect width="400" height="300" fill="url(#s)"/><circle cx="310" cy="80" r="34" fill="#F9C88E"/><rect y="215" width="400" height="85" fill="#E8D5BE"/><path d="M70 205 Q80 150 140 140 L180 110 Q200 100 250 102 L290 108 Q320 115 335 150 L350 160 Q360 175 355 205 Z" fill="url(#c)"/><path d="M190 120 L245 115 L270 145 L175 150 Z" fill="#F6E7D4" opacity=".9"/><path d="M280 118 L300 120 Q318 128 326 150 L285 148 Z" fill="#F6E7D4" opacity=".9"/><circle cx="135" cy="208" r="26" fill="#3A2E28"/><circle cx="135" cy="208" r="11" fill="#CDBBA6"/><circle cx="295" cy="208" r="26" fill="#3A2E28"/><circle cx="295" cy="208" r="11" fill="#CDBBA6"/><rect x="335" y="165" width="16" height="8" rx="3" fill="#FFF3D6"/></svg>`)}
function artSitio(){return 'data:image/svg+xml;utf8,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="300" fill="#E6EFE3"/><circle cx="80" cy="70" r="30" fill="#F7D9A0"/><path d="M0 190 Q100 130 200 175 T400 160 V300 H0Z" fill="#A9C4A2"/><path d="M0 230 Q120 190 240 225 T400 215 V300 H0Z" fill="#7F9E7F"/><rect x="215" y="140" width="90" height="62" fill="#F5EBDD"/><path d="M205 142 L260 105 L315 142Z" fill="#9C5B3B"/><rect x="250" y="168" width="20" height="34" fill="#7A2E3A"/><rect x="224" y="155" width="18" height="16" fill="#CFE0EA"/><circle cx="120" cy="170" r="26" fill="#5F8463"/><rect x="117" y="180" width="6" height="30" fill="#6B4E37"/><circle cx="345" cy="160" r="20" fill="#5F8463"/><rect x="342" y="170" width="5" height="26" fill="#6B4E37"/></svg>`)}
function artCadeira(){return 'data:image/svg+xml;utf8,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="300" fill="#F2E7EE"/><rect x="0" y="230" width="400" height="70" fill="#E3D3DD"/><rect x="160" y="60" width="90" height="100" rx="26" fill="#7A2E3A"/><rect x="150" y="160" width="110" height="26" rx="12" fill="#8E3C49"/><rect x="200" y="186" width="10" height="38" fill="#4A3A36"/><path d="M160 236 L250 236 M205 224 L170 240 M205 224 L240 240" stroke="#4A3A36" stroke-width="7" stroke-linecap="round"/><rect x="128" y="120" width="26" height="10" rx="5" fill="#4A3A36"/><rect x="256" y="120" width="26" height="10" rx="5" fill="#4A3A36"/></svg>`)}
function seedPhotos(){if(!PH.p_car)PH.p_car=artCar();if(!PH.p_sitio)PH.p_sitio=artSitio();if(!PH.p_cad)PH.p_cad=artCadeira()}
const phSrc=id=>PH[id]||'';
