'use strict';
/* ---------- SERVIDOR DO MMV (versão publicada em dianafreitasadr.com.br/mmvdidis) ----------
   Código conferido no servidor, banco central, gestão DUNE e Google Agenda. */
const API={
  base:'https://sksyekgjvmqlimxffqrf.supabase.co/functions/v1/mmv',
  key:'sb_publishable_81wU-gy5qIobtwMGaMpcdA_lQ7WWWm7',
  on:!window.claude&&/(^|\.)dianafreitasadr\.com\.br$|^diana-freitas-adr-site.*\.vercel\.app$/.test(location.hostname),
  token:null,busy:false,again:false,state:'conectando'
};
try{API.token=localStorage.getItem('mmv.tk')}catch(e){}
async function api(path,opt){opt=opt||{};
  const r=await fetch(API.base+path,{method:opt.method||'GET',headers:{'content-type':'application/json','x-mmv-token':API.token||'','apikey':API.key},body:opt.body?JSON.stringify(opt.body):undefined});
  let j={};try{j=await r.json()}catch(e){}
  if(r.status===401&&path!=='/login'){apiLogoutLocal();throw Object.assign(new Error(j.error||'Sessão expirada'),{status:401})}
  if(!r.ok&&!(opt.ok409&&r.status===409))throw Object.assign(new Error(j.error||('Erro '+r.status)),{status:r.status,data:j});
  return Object.assign(j,{_status:r.status});
}
function apiLogoutLocal(){API.token=null;ls('mmv.tk','');ls(AKEY,'');AUTH.ok=false;render()}

/* login e código no servidor */
const _renderLogin=renderLogin;
renderLogin=function(){_renderLogin();if(!API.on)return;const f=$('#lf');if(!f)return;
  const b=f.querySelector('button[type=submit]'),inp=$('#code');if(b)b.disabled=false;if(inp)inp.disabled=false;
  f.onsubmit=async e=>{e.preventDefault();const c=val('code');if(!c)return;b.disabled=true;b.textContent='Entrando…';
    try{const r=await api('/login',{method:'POST',body:{code:c}});API.token=r.token;ls('mmv.tk',r.token);ls(AKEY,'1');AUTH.ok=true;U.tab='hoje';U.page=null;render();window.scrollTo(0,0);apiAfterLogin()}
    catch(err){b.disabled=false;b.textContent='Entrar';$('#lmsg').textContent=err.status===429?err.message:err.status===401?`Código incorreto.${err.data&&err.data.left!==undefined?' '+err.data.left+' tentativa(s) restante(s).':''}`:'Sem conexão com o servidor. Tente de novo.'}}};
const _codeSave=A.codeSave;
A.codeSave=async()=>{if(!API.on)return _codeSave();try{await api('/code',{method:'POST',body:{current:val('c0'),next:val('c1')}});toast('Código trocado. Outros aparelhos vão precisar entrar de novo.');render()}catch(e){toast(e.message)}};
const _logout=A.logout;
A.logout=async()=>{if(API.on){try{await api('/logout',{method:'POST'})}catch(e){}API.token=null;ls('mmv.tk','')}_logout()};
const _setNum=A.setNum;
A.setNum=(ds,el)=>{_setNum(ds,el);if(API.on&&ds.k==='maxTries')api('/code',{method:'POST',body:{maxTries:num(el.value)}}).catch(()=>{})};

/* banco central: o estado completo do MMV + fotos */
const _cloudInit=cloudInit,_cloudPush=cloudPush;
cloudInit=async function(){if(!API.on)return _cloudInit();if(!AUTH.ok||!API.token){CLOUD.state='aguardando login';return}apiAfterLogin()};
cloudPush=async function(){if(!API.on)return _cloudPush();if(!API.token||!API.ready)return;
  if(API.busy){API.again=true;return}API.busy=true;
  try{const r=await api('/state',{method:'PUT',body:{data:S,photos:PH,updated:S.updated||Date.now()},ok409:true});
    if(r._status===409&&r.data){S=r.data;PH=Object.assign({},PH,r.photos||{});runMigrations();ls(KEY,JSON.stringify(S));savePhotos();render();toast('Atualizado com o que você fez em outro aparelho')}
    CLOUD.state='sincronizado';}
  catch(e){CLOUD.state=e.status===401?'sessão expirada':'sem conexão (salvo neste aparelho)'}
  API.busy=false;if(API.again){API.again=false;setTimeout(cloudPush,800)}
};
let afterLoginDone=false;
async function apiAfterLogin(){
  if(afterLoginDone)return;afterLoginDone=true;
  try{const r=await api('/state');
    /* aparelho que nunca sincronizou (ex.: app recém-instalado na Tela de Início) sempre adota o servidor */
    const firstSync=ls('mmv.synced')!=='1';
    const takeRemote=r.data&&(firstSync||S.fresh||(+r.updated||0)>(S.updated||0)||(r.data.examplesRemoved&&!S.examplesRemoved));
    API.ready=true;
    if(takeRemote){S=r.data;PH=Object.assign({},PH,r.photos||{});runMigrations();ls(KEY,JSON.stringify(S));savePhotos();render()}
    else if(!S.fresh)cloudPush();
    ls('mmv.synced','1');
    CLOUD.state='sincronizado';}
  catch(e){CLOUD.state='sem conexão (salvo neste aparelho)';setTimeout(()=>{afterLoginDone=false;apiAfterLogin()},30000)}
  duneLoad();gStatus();
}
const _persistLine=persistLine;
persistLine=function(){return API.on?`Banco do MMV: ${CLOUD.state} · cópia neste aparelho`:_persistLine()};

/* ---------- GESTÃO DUNE ---------- */
const DUNE={data:null,at:0,err:''};
const FASE={a_fazer:'a fazer',alteracao:'em alteração',enviado:'enviado ao cliente',finais:'arquivos finais'};
async function duneLoad(){if(!API.on||!API.token)return;try{DUNE.data=await api('/dune');DUNE.at=Date.now();DUNE.err='';if(API.ready)applyGestaoFin();U.keepScroll=true;if(!SH)render()}catch(e){DUNE.err=e.message}}
setInterval(()=>{if(API.on&&AUTH.ok&&Date.now()-DUNE.at>10*60000&&document.visibilityState==='visible')duneLoad()},60000);
function tarefaOcorre(t,date){
  if(t.ate&&date>t.ate)return false;const r=norm(t.recorrencia||'nenhuma');
  if(!r||r==='nenhuma')return t.data===date;
  if(t.data&&date<t.data)return false;
  if(r.startsWith('diar'))return true;
  if(r.startsWith('seman')){const dw=D.dow(date);return (t.dias_semana||[]).some(x=>+x===dw||norm(String(x)).startsWith(DOW[dw]))}
  if(r.startsWith('mens'))return +t.dia_mes===+date.slice(8);
  return t.data===date;
}
function duneItems(date){
  if(!DUNE.data)return [];const T=D.today(),out=[],seen=new Set(),done=(S.duneDone||{});
  DUNE.data.demandas.forEach(d=>{const late=d.prazo&&d.prazo<T;if(d.prazo===date||(date===T&&late)){const k='dd:'+d.id;seen.add(k);out.push({key:k,label:`${d.titulo}${d.cliente?' · '+d.cliente:''}`,sub:`gestão DUNE · ${FASE[d.fase]||d.fase||'pendente'}${late?' · prazo '+D.short(d.prazo):''}`,area:'dune',order:44,open:'dune',dune:d})}});
  DUNE.data.tarefas.forEach(t=>{if(tarefaOcorre(t,date)){const k='dt:'+t.id+':'+date;seen.add(k);out.push({key:k,label:t.titulo,sub:'tarefa da gestão DUNE',area:'dune',order:45,open:'dune',tarefa:t})}});
  Object.entries(done).forEach(([k,v])=>{if(v&&v.date===date&&!seen.has(k))out.push({key:k,label:v.label,sub:v.sub||'gestão DUNE',area:'dune',order:44,open:'dune'})});
  return out;
}
const _dayItems=dayItems;
dayItems=function(date){const base=_dayItems(date);const extra=duneItems(date).map(it=>Object.assign(it,{done:isDone(date,it.key)}));const all=base.concat(extra);all.sort((a,b)=>a.order-b.order);return all};
const _isDone=isDone;
isDone=function(date,key){
  if(key.startsWith('dd:'))return !!((S.duneDone||{})[key]);
  if(key.startsWith('dt:')){const [,id,d]=key.split(':');if((S.duneDone||{})[key])return true;const t=DUNE.data&&DUNE.data.tarefas.find(x=>x.id===id);return !!(t&&t.feitas.includes(d))}
  return _isDone(date,key)};
const _setDone=setDone;
setDone=function(date,key,valx,via){
  if(!key.startsWith('dd:')&&!key.startsWith('dt:'))return _setDone(date,key,valx,via);
  const it=duneItems(date).find(i=>i.key===key);S.duneDone=S.duneDone||{};
  const prev=S.duneDone[key];
  if(valx)S.duneDone[key]={date,label:it?it.label:'Item da gestão',sub:it?it.sub:''};else delete S.duneDone[key];
  if(key.startsWith('dt:')&&!valx&&DUNE.data){const [,id,d]=key.split(':');const t=DUNE.data.tarefas.find(x=>x.id===id);if(t)t.feitas=t.feitas.filter(x=>x!==d)}
  const [tipo,id,d]=key.split(':');
  api('/dune/concluir',{method:'POST',body:{tipo:tipo==='dd'?'demanda':'tarefa',id,data:d||date,feita:!!valx}})
    .then(()=>{toast(valx?'Concluído também na gestão DUNE ✓':'Reaberto na gestão DUNE');duneLoad()})
    .catch(e=>{if(prev)S.duneDone[key]=prev;else delete S.duneDone[key];save({quiet:true});render();toast('Gestão: '+e.message)});
};
SHEETS.dune=({date})=>{const it=dayItems(date||U.date||D.today()).find(i=>i.key===SH.args.k)||{};const d=it.dune,t=it.tarefa;
  return {title:'Gestão DUNE',body:`<div class="card"><b>${esc(it.label||'')}</b><br><small class="mut">${esc(it.sub||'')}</small>${d?`<div class="kv" style="margin-top:8px"><span>Etapa</span><b>${esc(d.etapa||'')}</b></div><div class="kv"><span>Fase</span><b>${esc(FASE[d.fase]||d.fase||'')}</b></div><div class="kv"><span>Prazo</span><b>${d.prazo?D.lbl(d.prazo):'—'}</b></div>`:''}${t&&t.observacoes?`<p class="tiny mut">${esc(t.observacoes)}</p>`:''}</div>
  <p class="note">Ao concluir aqui, o MMV conclui também no sistema de gestão, em seu nome, com as mesmas regras de lá (liberação de parcelas, status do projeto e auditoria).</p>
  <p class="tiny"><a href="https://dune-gestao.vercel.app" target="_blank" rel="noopener">Abrir a gestão DUNE</a></p>`,
  foot:`<button class="btn dune" data-a="duneTog" data-k="${esc(SH.args.k)}" data-d="${date||U.date||D.today()}">${it.done?'Reabrir na gestão':'Concluir na gestão'}</button>`}};
A.duneTog=(ds)=>{const was=isDone(ds.d,ds.k);setDone(ds.d,ds.k,!was);save({quiet:true});closeSheet()};
const _openItem=A.openItem;
A.openItem=(ds)=>{if(ds.k.startsWith('dd:')||ds.k.startsWith('dt:')){openSheet('dune',{k:ds.k,date:U.date||D.today()});return}_openItem(ds)};

/* carga do dia: gestão + Google entram no cálculo de tempo livre */
const _loadOf=loadOf;
loadOf=function(date,ex){let m=_loadOf(date,ex);
  if(DUNE.data){DUNE.data.demandas.forEach(d=>{if(d.prazo===date)m+=(+S.set.duneDur||60)});DUNE.data.tarefas.forEach(t=>{if(tarefaOcorre(t,date)&&!t.feitas.includes(date))m+=30})}
  (G.ev[date]||[]).forEach(e=>{if(!e.allDay)m+=e.dur});return m};

/* finanças: recebimentos e parcelas da gestão */
const _finCalc=finCalc;
finCalc=function(area){const c=_finCalc(area);if(!DUNE.data||!(area==='dune'||area==='tudo'))return c;
  const ym=D.today().slice(0,7);const rec=DUNE.data.recebidos.filter(r=>inMonth(r.data,ym)).reduce((a,r)=>a+r.valor,0);const prev=DUNE.data.parcelas.filter(p=>p.vencimento&&inMonth(p.vencimento,ym)).reduce((a,p)=>a+p.valor,0);
  c.rec+=rec;c.prev+=prev;c.gRec=rec;c.gPrev=prev;c.falta=Math.max(0,c.need-c.rec);c.sobra=c.rec+c.prev-c.billsT-c.debtM-c.extra-c.spent;return c};
const _finScreen=SCREENS.fin;
SCREENS.fin=()=>{let h=_finScreen();if(!API.on||!(U.finArea==='dune'||U.finArea==='tudo'))return h;
  const T=D.today(),ym=T.slice(0,7);let blk;
  if(!DUNE.data)blk=`<div class="sec"><h2>Da gestão DUNE</h2></div><div class="card"><p class="empty">${DUNE.err?'Não consegui ler a gestão: '+esc(DUNE.err):'Carregando…'}</p></div>`;
  else{const rec=DUNE.data.recebidos.filter(r=>inMonth(r.data,ym)).sort((a,b)=>a.data<b.data?1:-1),par=DUNE.data.parcelas.filter(p=>p.vencimento&&p.vencimento<=D.add(T,45)).sort((a,b)=>a.vencimento<b.vencimento?-1:1);
    blk=`<div class="sec"><h2>Da gestão DUNE</h2><span class="pill dune">ao vivo</span></div><div class="card"><small class="mut">A receber (parcelas)</small>${par.map(p=>`<div class="li"><span class="t"><b>${esc(p.cliente||p.plano||'Cliente')}</b><small class="mut">${esc(p.descricao||('Parcela '+(p.numero||'')))} · vence ${D.short(p.vencimento)}${p.vencimento<T?' · <b style="color:var(--red)">atrasada</b>':''}</small></span><b class="num">${brl(p.valor)}</b></div>`).join('')||'<p class="empty">Nenhuma parcela a receber nos próximos 45 dias.</p>'}
    <small class="mut" style="display:block;margin-top:12px">Recebido em ${esc(D.mesNome(T))} (líquido)</small>${rec.map(r=>`<div class="li"><span class="t"><b>${esc(r.cliente||'Cliente')}</b><small class="mut">${esc(r.plano||'')} · ${D.short(r.data)}${r.forma?' · '+esc(r.forma):''}</small></span><b class="num" style="color:var(--ok)">${brl(r.valor)}</b></div>`).join('')||'<p class="empty">Nada recebido ainda este mês.</p>'}
    <p class="tiny mut" style="margin:8px 0 0">Esses valores já entram nos totais acima. Para pagar ou registrar recebimentos, use a gestão.</p></div>`}
  const mark='<div class="sec"><h2>Histórico de gastos</h2>';return h.includes(mark)?h.replace(mark,blk+mark):h+blk};

/* ---------- GOOGLE AGENDA ---------- */
const G={status:null,ev:{},loaded:{}};
async function gStatus(){if(!API.on||!API.token)return;try{G.status=await api('/google/status');if(G.status.connected)gWeek(D.weekStart(D.today()));render()}catch(e){}}
async function gWeek(ws){if(!G.status||!G.status.connected||G.loaded[ws])return;G.loaded[ws]=1;
  try{const r=await api(`/google/events?from=${ws}&to=${D.add(ws,6)}`);for(let i=0;i<7;i++)G.ev[D.add(ws,i)]=[];r.events.forEach(e=>{(G.ev[e.date]=G.ev[e.date]||[]).push(e)});U.keepScroll=true;if(!SH)render()}catch(e){G.loaded[ws]=0}}
const _agenda=SCREENS.agenda;
SCREENS.agenda=()=>{let h=_agenda();if(!API.on)return h;const ws=U.agWeek||D.weekStart(D.today()),sel=U.agDay||D.today();gWeek(ws);
  const gev=G.ev[sel]||[],dd=duneItems(sel);
  const blk=`<div class="card"><b>Também neste dia</b>${gev.map(e=>`<div class="li"><span class="tm">${e.allDay?'dia':e.time}</span><span class="t"><b>${esc(e.title)}</b><small class="mut">Google Agenda${e.dur?' · '+dur(e.dur):''}</small></span><span class="dot" style="background:#4285F4"></span></div>`).join('')}${dd.map(i=>`<button class="li" data-a="openItem" data-k="${esc(i.key)}"><span class="tm">—</span><span class="t"><b>${esc(i.label)}</b><small class="mut">${esc(i.sub)}</small></span><span class="dot" style="background:var(--dune)"></span></button>`).join('')}${!gev.length&&!dd.length?'<p class="empty">Nada da gestão nem do Google neste dia.</p>':''}
   <p class="tiny mut" style="margin:6px 0 0">${G.status&&G.status.connected?'Google Agenda conectado':'Google Agenda não conectado'} · gestão DUNE ${DUNE.data?'conectada':'carregando'}. Esses compromissos entram no cálculo de tempo livre.</p></div>`;
  const mark='<div class="sec"><h2>Semana</h2>';h=h.includes(mark)?h.replace(mark,blk+mark):h+blk;
  return h.replace(/<div class="card"><div class="row"><b class="grow">Google Agenda<\/b>[\s\S]*?Agora tudo roda no calendário interno\.<\/p><\/div>/,'');
};
/* blocos aprovados vão para o Google Agenda, sem duplicar */
function gStart(t){if(t.time)return t.time;const b=blocks(t.date).items.find(x=>x.task===t.id);return b?D.hm(b.s):S.set.dayStart}
let gFlushing=false;
async function gcalFlush(){
  if(!API.on||!G.status||!G.status.connected||gFlushing)return;
  const pend=S.tasks.filter(t=>t.gcal&&t.gcal!=='ok'&&t.date&&!t.done).slice(0,20);if(!pend.length)return;gFlushing=true;
  try{await api('/google/upsert',{method:'POST',body:{items:pend.map(t=>({taskId:t.id,title:t.title,date:t.date,start:gStart(t),dur:t.dur}))}});pend.forEach(t=>t.gcal='ok');_save({quiet:true});toast(`${pend.length} ${pend.length>1?'blocos enviados':'bloco enviado'} ao Google Agenda ✓`)}
  catch(e){toast('Google Agenda: '+e.message)}
  gFlushing=false;
}
const _save=save;
save=function(o){_save(o);setTimeout(gcalFlush,300)};
const _moveTask=moveTask;
moveTask=function(t,to){_moveTask(t,to);if(t.gcal==='ok'||t.gcal)t.gcal='remarcar'};
/* conexões */
const _conexoes=SCREENS.conexoes;
SCREENS.conexoes=()=>{if(!API.on)return _conexoes();const g=G.status||{};
  const row=(n,st,txt)=>`<div class="li"><span class="t"><b>${n}</b><small class="mut">${txt}</small></span><span class="pill ${st==='ok'?'ok':st==='bad'?'bad':'demo'}">${st==='ok'?'funcionando':st==='bad'?'atenção':'pendente'}</span></div>`;
  return backTop('Conexões')+`<div class="card">
  ${row('Acesso por código','ok','Conferido no servidor, com limite de tentativas. Trocar código em Configurações encerra as outras sessões.')}
  ${row('Banco do MMV',CLOUD.state==='sincronizado'?'ok':'bad','Estado: '+esc(CLOUD.state)+'. Seus registros ficam no servidor e numa cópia neste aparelho.')}
  ${row('Gestão DUNE',DUNE.data?'ok':'bad',DUNE.data?`Lendo ${DUNE.data.demandas.length} demandas, ${DUNE.data.tarefas.length} tarefas e ${DUNE.data.parcelas.length} parcelas. Atualiza a cada 10 min.`:esc(DUNE.err||'Carregando…'))}
  ${row('Google Agenda',g.connected?'ok':g.configured?'demo':'demo',g.connected?`Conectado${g.account?' ('+esc(g.account)+')':''}. Lê sua disponibilidade e cria/atualiza os blocos aprovados.`:g.configured?'Pronto para conectar.':'Falta cadastrar a chave do Google (passo a passo abaixo).')}
  </div>
  <div class="row wrap" style="gap:8px;margin-top:12px"><button class="btn sm dune" data-a="duneRefresh">Atualizar gestão agora</button>${g.connected?`<button class="btn sm line" data-a="gDisc">Desconectar Google</button>`:`<button class="btn sm" style="background:#4285F4" data-a="gConn" ${g.configured?'':'disabled'}>Conectar Google Agenda</button>`}</div>
  ${!g.configured?`<div class="card" style="margin-top:14px"><b>Para conectar o Google Agenda (uma vez só)</b><ol class="tiny" style="padding-left:18px;line-height:1.7;margin:8px 0 0">
   <li>No Google Cloud Console, com a conta da agenda, crie um projeto (ex.: “MMV”) e ative a <b>Google Calendar API</b>.</li>
   <li>Em <b>Tela de consentimento OAuth</b>: tipo Externo, nome “MMV”. Depois coloque o status em <b>Em produção</b> (em teste, a conexão expira a cada 7 dias).</li>
   <li>Em <b>Credenciais › Criar › ID do cliente OAuth</b>, tipo “Aplicativo da Web”. Em URIs de redirecionamento autorizados, cole:<br><code style="word-break:break-all">${esc(g.redirect||API.base+'/google/callback')}</code></li>
   <li>Me mande uma mensagem dizendo que criou: eu abro o pedido no Supabase para você colar o <b>ID do cliente</b> e a <b>chave secreta</b>. Elas ficam só no servidor.</li></ol></div>`:''}
  <p class="note">Credenciais e acessos ficam no servidor, nunca neste aparelho.</p>`};
A.duneRefresh=async()=>{toast('Atualizando a gestão…');DUNE.at=0;await duneLoad();toast(DUNE.data?'Gestão atualizada ✓':'Não consegui ler a gestão')};
A.gConn=async()=>{const w=window.open('','_blank');try{const r=await api('/google/start');if(w){w.location.href=r.url;toast('Termine no Safari e volte ao MMV')}else location.href=r.url}catch(e){if(w)w.close();toast(e.message)}};
window.addEventListener('focus',()=>{if(API.on&&AUTH.ok&&G.status&&!G.status.connected)gStatus()});
A.gDisc=async()=>{try{await api('/google/disconnect',{method:'POST'});G.status=null;G.ev={};G.loaded={};await gStatus();toast('Google Agenda desconectado')}catch(e){toast(e.message)}};
if(API.on&&/google-(ok|erro)/.test(location.hash)){const ok=location.hash.includes('ok');history.replaceState(null,'',location.pathname);setTimeout(()=>{U.page='conexoes';render();toast(ok?'Google Agenda conectado ✓ Pode voltar ao app pelo ícone.':'Não deu para conectar o Google. Tente de novo.')},600)}

/* ---------- limpar dados de exemplo ---------- */
function removeExamples(){
  const ex=seed(),since=S.since||D.today(),tt=new Set(ex.tasks.map(t=>t.title)),inc=new Set(ex.fin.inc.map(i=>i.desc)),sp=new Set(ex.fin.spend.map(i=>i.desc)),bl=new Set(ex.bills.map(b=>b.desc)),db=new Set(ex.debts.map(d=>d.name)),pj=new Set(ex.projects.map(p=>p.name)),cl=new Set(ex.clients.map(c=>c.name)),ct=new Set(ex.contents.map(c=>c.original)),ev=new Set(ex.events.map(e=>e.title));
  S.tasks=S.tasks.filter(t=>!tt.has(t.title));S.events=S.events.filter(e=>!ev.has(e.title));S.fin.inc=S.fin.inc.filter(i=>!inc.has(i.desc));S.fin.spend=S.fin.spend.filter(i=>!sp.has(i.desc));
  S.bills=S.bills.filter(b=>!bl.has(b.desc));S.debts=S.debts.filter(d=>!db.has(d.name));S.projects=S.projects.filter(p=>!pj.has(p.name));S.clients=S.clients.filter(c=>!cl.has(c.name));S.contents=S.contents.filter(c=>!ct.has(c.original));
  Object.keys(S.checks).forEach(d=>{if(d<since)delete S.checks[d]});S.closings=S.closings.filter(c=>c.date>=since);S.readS=S.readS.filter(r=>r.date>=since);S.train.sessions=S.train.sessions.filter(s=>s.date>=since);
  S.faith.bible=S.faith.bible.filter(b=>b.date>=since);Object.keys(S.faith.grat).forEach(d=>{if(d<since)delete S.faith.grat[d]});
  S.editorial=S.editorial;S.fin.reserveDebt=0;S.examplesRemoved=D.today();
}
const _config=SCREENS.config;
SCREENS.config=()=>{let h=_config();const mark='<div id="rsc"></div>';return h.replace(mark,`<button class="btn sm line" style="margin-top:8px" data-a="exClean">Apagar os dados de exemplo</button>`+mark)};
A.exClean=()=>{$('#rsc').innerHTML=`<div class="warn" style="margin-top:10px">Isso apaga as tarefas, contas, dívidas, receitas, clientes, projetos e históricos de exemplo. O que você criou continua.<div class="row" style="gap:8px;margin-top:8px"><button class="btn sm" style="background:var(--red)" data-a="exCleanOk">Apagar exemplos</button><button class="btn sm sec2" data-a="go" data-v="config">Cancelar</button></div></div>`};
A.exCleanOk=()=>{removeExamples();save({quiet:true});U.page=null;U.tab='hoje';render();toast('Dados de exemplo apagados. Agora é só o seu MMV ✓')};

/* ---------- FINANÇAS DA GESTÃO (levantamento financeiro) ----------
   Contas, faturas, compromissos e dívidas vêm do sistema de gestão e entram no MMV só para leitura. */
const ymAdd=(ym,n)=>{const d=new Date(ym+'-15T12:00:00Z');d.setUTCMonth(d.getUTCMonth()+n);return d.toISOString().slice(0,7)};
const lastDayOf=ym=>new Date(Date.UTC(+ym.slice(0,4),+ym.slice(5,7),0)).toISOString().slice(0,10);
const dueOf=(ym,dia)=>dia?`${ym}-${String(Math.min(+dia,+lastDayOf(ym).slice(8))).padStart(2,'0')}`:lastDayOf(ym);
const escA=e=>e==='D'?'dune':'pessoal';
const DEBT_CATS=['Dívidas','Cartão de terceiro'];
function gestaoFin(){
  const F=DUNE.data&&DUNE.data.fin;if(!F||!F.base)return null;const B=F.base,T=D.today(),ym=T.slice(0,7),months=[ymAdd(ym,-1),ym,ymAdd(ym,1)];
  const pagos=Object.assign({},(B.pagos&&B.pagos.porChave)||{}),notas={},bills=[],debts=[],AJ=F.ajustes||{};
  const fat=JSON.parse(JSON.stringify((B.faturas&&B.faturas.porFatura)||{})),comp=(B.compras&&B.compras.porFatura)||{};
  /* ajustes da gestão: pagamentos e observações registrados depois do levantamento base */
  Object.values(AJ).forEach(a=>{const k=String(a._k||'').split(':');if(k[0]==='b'&&k.length===3){const key=k[1]+'|'+k[2];
      if(a.obs)notas[key]=a.obs;
      if(a.status==='pago')pagos[key]={valor:a.valor||a.debitado||(pagos[key]&&pagos[key].valor),pagoEm:a.pagoEm,obs:a.obs,conta:a.conta};
      else if(a.status==='aberto'||a.status==='pendente')delete pagos[key]}
    else if(k[0]==='f'&&k.length===3){const key=k[1]+'|'+k[2],f=fat[key]=fat[key]||{};
      if(a.status)f.status=a.status;if(a.pagoEm)f.pagoEm=a.pagoEm;if(a.total)f.total=a.total;if(a.creditos!=null)f.creditos=a.creditos;if(a.obs)f.nota=a.obs;
      if(a.status==='pago'&&!f.total&&a.debitado)f.total=a.debitado}});
  (B.recorrentes&&B.recorrentes.lista||[]).forEach(r=>{
    months.forEach(m=>{const v=r.meses&&r.meses[m];if(!v)return;const p=pagos[r.id+'|'+m];const due=dueOf(m,r.dia);if(m<ym&&p)return;
      bills.push({id:'g_'+r.id+'_'+m,src:'gestao',area:escA(r.esc),desc:r.desc+(r.dia?'':' (sem data)'),value:(p&&p.valor||v)/100,due,status:p?'pago':'aberto',paidAt:p?p.pagoEm:null,cat:r.cat,rec:'mensal',conta:r.conta,nota:(p&&p.obs)||notas[r.id+'|'+m]||''})});
    if(DEBT_CATS.includes(r.cat)){let rem=0;const pays=[];Object.entries(r.meses||{}).forEach(([m,v])=>{const p=pagos[r.id+'|'+m];if(p)pays.push({date:p.pagoEm,value:(p.valor||v)/100,kind:'parcela'});else if(m>=ym)rem+=v});
      if(rem>0||pays.length)debts.push({id:'gd_'+r.id,src:'gestao',area:escA(r.esc),name:r.desc,balance:rem/100,monthly:0,mPlan:((r.meses||{})[ym]||(r.meses||{})[ymAdd(ym,1)]||0)/100,pays,fim:r.fim})}
  });
  (F.compromissos||[]).forEach(c=>{months.forEach(m=>{if(c.inicio&&m<c.inicio)return;if(c.fim&&!c.semFim&&m>c.fim)return;if(!c.valor)return;const p=pagos['u-'+c.id+'|'+m]||pagos[c.id+'|'+m]||(m===c.inicio&&c.primeiraPaga);if(m<ym&&p)return;
    bills.push({id:'g_c'+c.id+'_'+m,src:'gestao',area:escA(c.esc),desc:c.desc,value:((p&&p.valor)||c.valor)/100,due:dueOf(m,(c.dias||[])[0]),status:p?'pago':'aberto',paidAt:p&&p.pagoEm||null,cat:c.cat,rec:'mensal',nota:notas['u-'+c.id+'|'+m]||''})})});
  (B.cartoes&&B.cartoes.lista||[]).filter(k=>!k.terceiro&&k.vence).forEach(k=>{months.forEach(m=>{const key=k.id+'|'+m,f=fat[key],cs=comp[key];if(!f&&!cs)return;
    let total=f&&f.total?f.total:(cs||[]).reduce((a,x)=>a+(+x[2]||0),0);if(f&&f.creditos>1&&!f.total)total-=f.creditos;const pago=f&&f.status==='pago';if(m<ym&&pago)return;
    bills.push({id:'g_f'+key.replace('|','_'),src:'gestao',area:'pessoal',desc:'Fatura '+k.nome,value:Math.max(0,total)/100,due:dueOf(m,k.vence),status:pago?'pago':'aberto',paidAt:pago?f.pagoEm:null,cat:'Cartão',rec:'mensal',nota:f&&f.nota||''})})});
  // parcelamentos de fatura (ex.: Mercado Pago em 5×)
  Object.entries(comp).forEach(([key,list])=>{const gr={};(list||[]).forEach(x=>{if(/^(Parcelamento da fatura|Juros do parcelamento)/.test(x[1]||'')&&/^\d+\/\d+$/.test(x[5]||'')){const g=gr[x[0]]=gr[x[0]]||{v:0,k:0,n:0};g.v+=+x[2];const [kk,nn]=x[5].split('/').map(Number);g.k=kk;g.n=nn}});
    Object.entries(gr).forEach(([d,g])=>{const left=g.n-g.k+(fat[key]&&fat[key].status==='pago'?0:1);if(left>0)debts.push({id:'gd_parc_'+key+d,src:'gestao',area:'pessoal',name:'Parcelamento de fatura ('+key.split('|')[0].toUpperCase()+')',balance:g.v*left/100,monthly:0,mPlan:g.v/100,pays:[]})})});
  const cfg=F.config||{},contas=(B.contas&&B.contas.lista)||[];
  const saldos=Object.entries(cfg.saldos||{}).map(([id,s])=>{const c=contas.find(x=>x.id===id)||{};return {id,nome:c.nome||id,area:escA(c.esc),valor:s.valor/100,em:s.em}});
  const gastos=((B.gastos&&B.gastos.lista)||[]).map(g=>({date:g[1],value:g[4]/100,area:g[5]==='D'?'dune':g[5]==='P'?'pessoal':'',desc:g[3],cat:g[6]})).concat((F.lancamentos||[]).filter(l=>l.tipo==='gasto').map(l=>({date:l.data,value:l.valor/100,area:escA(l.esc),desc:l.desc,cat:l.cat})));
  return {bills,debts,saldos,gastos,rel:(cfg.relatorios||{})[ym]||null,reserva:cfg.metaReserva};
}
function applyGestaoFin(){const G2=gestaoFin();if(!G2)return;
  S.bills=S.bills.filter(b=>b.src!=='gestao').concat(G2.bills);
  S.debts=S.debts.filter(d=>d.src!=='gestao').concat(G2.debts);
  const g=S.goals.find(x=>x.auto==='dividas');const tot=S.debts.reduce((a,d)=>a+d.balance,0);if(g&&!(+g.base)&&tot>0){g.base=tot;g.created=D.today()}
  DUNE.fin=G2;_save({quiet:true});
}
const _finCalc2=finCalc;
finCalc=function(area){const c=_finCalc2(area);const G2=DUNE.fin;if(!G2)return c;const ym=D.today().slice(0,7);
  const sp=G2.gastos.filter(g=>inMonth(g.date,ym)&&(area==='tudo'||g.area===area)).reduce((a,g)=>a+g.value,0);c.spent+=sp;c.sobra-=sp;return c};
const _finScreen2=SCREENS.fin;
SCREENS.fin=()=>{let h=_finScreen2();const G2=DUNE.fin;if(!API.on||!G2||U.finArea==='extra')return h;
  const ar=U.finArea,sal=G2.saldos.filter(s=>ar==='tudo'||s.area===ar),tot=sal.reduce((a,s)=>a+s.valor,0);
  let blk=`<div class="card" style="margin-top:10px"><div class="row"><small class="mut grow">Saldo nas contas (gestão)</small><b class="num" style="color:${tot<0?'var(--red)':'var(--ok)'}">${brl(tot)}</b></div>${sal.map(s=>`<div class="kv"><span>${esc(s.nome)}</span><b class="num" style="color:${s.valor<0?'var(--red)':'inherit'}">${brl(s.valor)}</b></div>`).join('')}<small class="mut tiny">Atualizado no levantamento de ${sal[0]?D.short(sal[0].em.slice(0,10)):'—'}</small></div>`;
  if(G2.rel&&G2.rel.resumo)blk+=`<details class="card" style="margin-top:10px"><summary class="link" style="padding:4px 0">Leitura do mês na gestão</summary><p style="margin:8px 0">${esc(G2.rel.resumo)}</p>${(G2.rel.cortes||[]).map(x=>`<div class="kv"><span>✂️ ${esc(x.t)}</span><b class="num">${brl((x.v||0)/100)}</b></div>`).join('')}</details>`;
  const mark='<div class="grid2" style="margin-top:10px">';return h.includes(mark)?h.replace(mark,blk+mark):h};
/* contas e dívidas da gestão são só leitura no MMV */
const _billPay=A.billPay;A.billPay=(ds)=>{const b=S.bills.find(x=>x.id===ds.id);if(b&&b.src==='gestao'){toast('Esta conta vem da gestão: registre o pagamento lá');return}_billPay(ds)};
const _billSave=A.billSave;A.billSave=(ds)=>{const b=ds.id&&S.bills.find(x=>x.id===ds.id);if(b&&b.src==='gestao'){toast('Edite esta conta na gestão DUNE');closeSheet();return}_billSave(ds)};
const _debtPay=A.debtPay;A.debtPay=(ds)=>{const d=S.debts.find(x=>x.id===ds.id);if(d&&d.src==='gestao'){toast('Registre pagamentos desta dívida na gestão DUNE');return}_debtPay(ds)};
/* folha só de leitura para contas da gestão, com a observação registrada lá */
const _billSheet=SHEETS.bill;SHEETS.bill=(a)=>{const b=a&&a.id&&S.bills.find(x=>x.id===a.id);if(!b||b.src!=='gestao')return _billSheet(a);
  return {title:esc(b.desc),body:`<div class="card"><div class="row"><div class="grow">${areaPill(b.area)} <span class="pill ${b.status==='pago'?'ok':''}">${b.status==='pago'?'paga em '+D.short(b.paidAt):'em aberto'}</span></div><div class="big num">${brl(b.value)}</div></div><small class="mut">Vencimento: ${D.long(b.due)}${b.cat?' · '+esc(b.cat):''}</small></div>
  ${b.nota?`<div class="card" style="margin-top:10px"><small class="mut">Anotação na gestão</small><p style="margin:6px 0 0">${esc(b.nota)}</p></div>`:''}
  <p class="tiny mut" style="margin-top:12px">Esta conta vem do seu financeiro na gestão DUNE. Para pagar, mudar valor ou data, registre lá: o MMV atualiza sozinho.</p>`,
  foot:`<button class="btn line" data-a="closeSheet">Fechar</button>`}};

/* ---------- nada de dados de exemplo no site ----------
   Remove automaticamente qualquer item idêntico aos exemplos do app (mesma descrição e valor),
   sem tocar no que vem da gestão nem no que a Di criou. */
function cleanSeed(){
  if(!S||!S.tasks)return false;const ex=seed(),before=JSON.stringify([S.tasks.length,S.bills.length,S.debts.length,S.fin.inc.length,S.fin.spend.length,S.projects.length,S.clients.length,S.contents.length,S.events.length,(S.wishes||[]).length,(S.books||[]).length]);
  const fp=(a,f)=>new Set(a.map(f)),bl=fp(ex.bills,b=>b.desc+'|'+b.value),db=fp(ex.debts,d=>d.name+'|'+d.monthly),inc=fp(ex.fin.inc,i=>i.desc+'|'+i.value),sp=fp(ex.fin.spend,i=>i.desc+'|'+i.value),
    tt=fp(ex.tasks,t=>t.title),ev=fp(ex.events,e=>e.title),pj=fp(ex.projects,p=>p.name),cl=fp(ex.clients,c=>c.name),ct=fp(ex.contents,c=>c.original),wi=fp(ex.wishes,w=>w.name),bk=fp(ex.books,b=>b.title);
  S.bills=S.bills.filter(b=>b.src==='gestao'||!bl.has(b.desc+'|'+b.value));S.debts=S.debts.filter(d=>d.src==='gestao'||!db.has(d.name+'|'+d.monthly));
  S.fin.inc=S.fin.inc.filter(i=>!inc.has(i.desc+'|'+i.value));S.fin.spend=S.fin.spend.filter(i=>!sp.has(i.desc+'|'+i.value));
  S.tasks=S.tasks.filter(t=>!tt.has(t.title));S.events=S.events.filter(e=>!ev.has(e.title));S.projects=S.projects.filter(p=>!pj.has(p.name));S.clients=S.clients.filter(c=>!cl.has(c.name));
  S.contents=S.contents.filter(c=>!ct.has(c.original));if(S.wishes)S.wishes=S.wishes.filter(w=>!wi.has(w.name));if(S.books)S.books=S.books.filter(b=>!bk.has(b.title));
  const since=S.since||'2026-11-20';
  Object.keys(S.checks||{}).forEach(d=>{if(d<since)delete S.checks[d]});S.closings=(S.closings||[]).filter(c=>c.date>=since);S.readS=(S.readS||[]).filter(r=>r.date>=since);
  if(S.train)S.train.sessions=(S.train.sessions||[]).filter(x=>x.date>=since);if(S.faith){S.faith.bible=(S.faith.bible||[]).filter(b=>b.date>=since);Object.keys(S.faith.grat||{}).forEach(d=>{if(d<since)delete S.faith.grat[d]})}
  const after=JSON.stringify([S.tasks.length,S.bills.length,S.debts.length,S.fin.inc.length,S.fin.spend.length,S.projects.length,S.clients.length,S.contents.length,S.events.length,(S.wishes||[]).length,(S.books||[]).length]);
  if(before!==after){S.examplesRemoved=S.examplesRemoved||D.today();S.fin.reserveDebt=0;return true}return false;
}
const _runMig=runMigrations;runMigrations=function(){let c=_runMig();if(API.on)c=cleanSeed()||c;return c};
