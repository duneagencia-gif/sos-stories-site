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
cloudPush=async function(){if(!API.on)return _cloudPush();if(!API.token)return;
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
    if(r.data&&(S.fresh||(+r.updated||0)>(S.updated||0))){S=r.data;PH=Object.assign({},PH,r.photos||{});runMigrations();ls(KEY,JSON.stringify(S));savePhotos();render()}
    else if(!S.fresh)cloudPush();
    CLOUD.state='sincronizado';}
  catch(e){CLOUD.state='sem conexão (salvo neste aparelho)'}
  duneLoad();gStatus();
}
const _persistLine=persistLine;
persistLine=function(){return API.on?`Banco do MMV: ${CLOUD.state} · cópia neste aparelho`:_persistLine()};

/* ---------- GESTÃO DUNE ---------- */
const DUNE={data:null,at:0,err:''};
const FASE={a_fazer:'a fazer',alteracao:'em alteração',enviado:'enviado ao cliente',finais:'arquivos finais'};
async function duneLoad(){if(!API.on||!API.token)return;try{DUNE.data=await api('/dune');DUNE.at=Date.now();DUNE.err='';U.keepScroll=true;if(!SH)render()}catch(e){DUNE.err=e.message}}
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
