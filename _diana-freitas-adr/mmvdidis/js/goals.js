'use strict';
/* ---------- PERÍODOS E LIMITES ---------- */
const PER={
  key(l,d){const y=d.slice(0,4),m=+d.slice(5,7);return l==='mes'?d.slice(0,7):l==='tri'?`${y}-T${Math.ceil(m/3)}`:l==='smt'?`${y}-S${m<=6?1:2}`:D.weekStart(d)},
  months(l){return l==='mes'?1:l==='tri'?3:6},
  start(l,k){if(l==='mes')return k+'-01';if(l==='sem')return k;const y=k.slice(0,4),n=+k.slice(6),m=l==='tri'?(n-1)*3+1:(n-1)*6+1;return `${y}-${String(m).padStart(2,'0')}-01`},
  end(l,k){if(l==='sem')return D.add(k,6);const s=PER.start(l,k),y=+s.slice(0,4),m=+s.slice(5,7)-1+PER.months(l);return new Date(Date.UTC(y,m,0)).toISOString().slice(0,10)},
  range(l,k){return [PER.start(l,k),PER.end(l,k)]},
  next(l,k){return PER.key(l,D.add(PER.end(l,k),1))},
  label(l,k){if(l==='mes')return `${MESL[+k.slice(5,7)-1]} de ${k.slice(0,4)}`;if(l==='sem')return 'semana de '+D.short(k);return `${k.slice(6)}º ${l==='tri'?'trimestre':'semestre'} de ${k.slice(0,4)}`},
  short(l,k){if(l==='mes')return MESL[+k.slice(5,7)-1];if(l==='sem')return 'semana de '+D.short(k);return `${k.slice(6)}º ${l==='tri'?'trimestre':'semestre'}`}
};
const LIMIT={mes:1,tri:3,smt:1,sem:99};
const LVL={smt:'Meta do semestre',tri:'Metas do trimestre',mes:'Meta do mês',sem:'Ações da semana'};
const goalsIn=(l,k)=>S.goals.filter(g=>g.level===l&&g.period===k);
function goalTarget(g){return g.auto==='dividas'?(+g.base||0):(+g.target||0)}
function goalCur(g){
  if(g.auto==='receita'){const [a,b]=PER.range(g.level,g.period);return S.fin.inc.filter(i=>i.status==='recebido'&&(g.autoArea==='todas'||i.area===g.autoArea)&&i.date>=a&&i.date<=b).reduce((x,i)=>x+i.value,0)+(+g.cur||0)}
  if(g.auto==='dividas'){const tot=S.debts.reduce((a,d)=>a+d.balance,0);return Math.max(0,(+g.base||tot)-tot)}
  return +g.cur||0;
}
const isMoney=g=>!!g.auto||/R\$/.test(g.ind||'');

/* visual: trilha de progresso com o dinheirinho (ou a bandeira) no fim */
const BAG='<svg viewBox="0 0 44 44" aria-hidden="true"><ellipse cx="22" cy="40" rx="13" ry="2.5" fill="rgba(0,0,0,.08)"/><path d="M16 7h12l-3 6h-6z" fill="#8A5C2F"/><path d="M18.5 13h7c8 4.5 12 11 12 17.5 0 5.5-5 8-15.5 8S6.5 36 6.5 30.5C6.5 24 10.5 17.5 18.5 13z" fill="#C2894F"/><path d="M18.5 13h7c3 2 5.5 4 7.3 6.5-7-2-15-1.6-22 1.2C12.8 17.5 15.3 15 18.5 13z" fill="#D9A46C"/><rect x="16" y="11.5" width="12" height="3" rx="1.5" fill="#6E4521"/><text x="22" y="32" text-anchor="middle" font-family="Poppins,sans-serif" font-size="10.5" font-weight="700" fill="#FFF8EE">R$</text></svg>';
const FLAG='<svg viewBox="0 0 44 44" aria-hidden="true"><ellipse cx="14" cy="40" rx="8" ry="2.2" fill="rgba(0,0,0,.08)"/><rect x="12" y="6" width="3" height="34" rx="1.5" fill="#6E625A"/><path d="M15 8h21l-5 7 5 7H15z" fill="#7A2E3A"/></svg>';
function goalViz(g,big){
  const cur=goalCur(g),t=goalTarget(g)||1,p=Math.max(0,Math.min(100,cur/t*100)),m=isMoney(g);
  return `<div class="gv ${big?'big':''}"><div class="gv-track"><i style="width:${p}%"></i><span class="gv-dot" style="left:${p}%">${Math.round(p)}%</span></div><span class="gv-end ${p>=100?'won':''}">${m?BAG:FLAG}</span></div>
  <div class="row tiny" style="margin-top:4px"><span class="grow mut">${m?brl(cur):cur} de ${m?brl(t):t}</span><span class="mut">faltam <b style="color:var(--ink)">${m?brl(Math.max(0,t-cur)):Math.max(0,t-cur)}</b></span></div>`;
}
function goalHist(g){ // mini gráfico por mês
  const [a,b]=PER.range(g.level,g.period);let months=[];
  if(g.auto==='dividas'){const pays=S.debts.flatMap(d=>d.pays);const start=g.created||a;let d=start.slice(0,7);for(let i=0;i<6;i++){months.push(d);const n=new Date(d+'-15T12:00:00Z');n.setUTCMonth(n.getUTCMonth()+1);d=n.toISOString().slice(0,7)}
    return barChart(months.map(mo=>({l:MES[+mo.slice(5,7)-1],v:Math.round(pays.filter(p=>p.date.slice(0,7)===mo).reduce((x,p)=>x+p.value,0)),none:mo>D.today().slice(0,7)})),'var(--pes)')}
  if(g.auto==='receita'&&g.level!=='mes'){for(let d=a.slice(0,7);d<=b.slice(0,7);){months.push(d);const n=new Date(d+'-15T12:00:00Z');n.setUTCMonth(n.getUTCMonth()+1);d=n.toISOString().slice(0,7)}
    return barChart(months.map(mo=>({l:MES[+mo.slice(5,7)-1],v:Math.round(S.fin.inc.filter(i=>i.status==='recebido'&&(g.autoArea==='todas'||i.area===g.autoArea)&&i.date.slice(0,7)===mo).reduce((x,i)=>x+i.value,0)),none:mo>D.today().slice(0,7)})),'var(--dune)')}
  return '';
}

/* ---------- METAS QUE FALTAM DEFINIR (o “postzinho”) ---------- */
/* Pede a meta do próximo período no último dia do período atual (ex.: 30/11 → dezembro; 30/06 → 2º semestre).
   Se passar sem definir, continua lembrando na primeira semana do novo período. */
function missingGoals(date){date=date||D.today();const out=[],since=S.since||date;
  ['mes','tri','smt'].forEach(l=>{const cur=PER.key(l,date),cand=[];
    if(date===PER.end(l,cur))cand.push(PER.next(l,cur));
    if(PER.start(l,cur)>since&&D.diff(PER.start(l,cur),date)<=6)cand.push(cur);
    cand.forEach(k=>{if(!(S.goalSkip||{})[l+':'+k]&&!goalsIn(l,k).length)out.push({l,k,next:k!==cur})})});
  return out}
const ASK={mes:k=>`Di, qual vai ser a meta de ${PER.short('mes',k)}?`,tri:k=>`Di, quais vão ser as 3 metas do ${PER.short('tri',k)}?`,smt:k=>`Di, qual vai ser a grande meta do ${PER.short('smt',k)}?`};
function goalStrip(){const ms=missingGoals();if(!ms.length)return '';
  return `<button class="gp" data-a="sheet" data-v="goalPost"><span class="gp-ic">✦</span><span class="grow"><b>${esc(ASK[ms[0].l](ms[0].k))}</b><small>${ms[0].next?`Amanhã começa ${PER.short(ms[0].l,ms[0].k)}`:'Ainda falta definir'}${ms.length>1?' · também: '+ms.slice(1).map(m=>PER.short(m.l,m.k)).join(', '):''}</small></span>${IC.r}</button>`}
SHEETS.goalPost=()=>{const ms=missingGoals();
  return {title:'Hora de definir',body:ms.length?ms.map(m=>`<div class="post"><div class="post-art"><small>${m.next?'Amanhã começa · ':''}${esc(PER.label(m.l,m.k))}</small><p>${esc(ASK[m.l](m.k))}</p><span>${m.l==='tri'?'Até 3 metas grandes':'Uma meta grande'} · no padrão SMART</span></div>
    <div class="row" style="gap:8px;padding:10px"><button class="btn sm dune grow" data-a="sheet" data-v="goal" data-k="${m.l}|${m.k}">Definir agora</button><button class="btn sm line" data-a="goalSkip" data-v="${m.l}|${m.k}">Pular este período</button></div></div>`).join(''):'<p class="good">Tudo definido por aqui, Di. 👏</p>'}};
A.goalSkip=(ds)=>{S.goalSkip=S.goalSkip||{};S.goalSkip[ds.v.replace('|',':')]=true;save({quiet:true});renderSheet();toast('Esse período não vai mais pedir meta')};

/* ---------- PLANEJAMENTO ---------- */
SCREENS.planejamento=()=>{
  const T=D.today();let h=backTop('Planejamento');
  h+=`<p class="tiny mut" style="margin:0">Limites: 1 meta grande por semestre, 3 por trimestre, 1 por mês. Todas no padrão SMART.</p>`+cadenceBox();
  ['smt','tri','mes'].forEach(l=>{const cur=PER.key(l,T),nxt=PER.next(l,cur);
    [cur,nxt].forEach((k,ix)=>{const gs=goalsIn(l,k),free=LIMIT[l]-gs.length;
      h+=`<div class="sec"><h2>${LVL[l]}</h2><span class="tiny mut">${esc(PER.label(l,k))}${ix?' · próximo':''} · ${gs.length} de ${LIMIT[l]}</span></div>`;
      h+=gs.map(goalCard).join('');
      if(free>0)h+=`<button class="slot" data-a="sheet" data-v="goal" data-k="${l}|${k}">＋ Definir ${l==='tri'?`meta (${free} ${free>1?'vagas':'vaga'})`:'a meta'}</button>`;
    })});
  const wk=PER.key('sem',T),ws=goalsIn('sem',wk);
  h+=`<div class="sec"><h2>Ações da semana</h2><button class="link" data-a="sheet" data-v="goal" data-k="sem|${wk}">+ Ação</button></div><div class="card">${ws.map(g=>`<button class="li" data-a="sheet" data-v="goal" data-id="${g.id}"><span class="t"><b>${esc(g.title)}</b><small class="mut">${S.goals.find(x=>x.id===g.parent)?'ligada a “'+esc(S.goals.find(x=>x.id===g.parent).title)+'”':'sem vínculo'} · até ${D.short(g.due)}</small></span>${goalCur(g)>=goalTarget(g)&&goalTarget(g)?'<span class="pill ok">feito</span>':IC.r}</button>`).join('')||'<p class="empty">Nenhuma ação nesta semana.</p>'}</div>`;
  h+=`<div class="sec"><h2>Revisão de dezembro</h2></div><div class="card"><p class="tiny mut" style="margin:0 0 6px">Decida o que concluir, pausar ou levar para janeiro.</p>${S.projects.filter(p=>p.status!=='concluído').map(p=>`<div style="padding:10px 0;border-top:1px solid var(--line)"><div class="row"><b class="grow" style="font-weight:500">${esc(p.name)}</b>${areaPill(p.area)}</div><div class="seg" style="margin-top:8px">${['Concluir','Pausar','Levar p/ janeiro'].map(o=>`<button class="${p.dec===o?'on':''}" data-a="dec" data-id="${p.id}" data-v="${o}">${o}</button>`).join('')}</div></div>`).join('')}</div>`;
  return h;
};
function goalCard(g){const par=S.goals.find(x=>x.id===g.parent);const hist=goalHist(g);
  return `<button class="card gcard" data-a="sheet" data-v="goal" data-id="${g.id}"><div class="row">${areaPill(g.area)}<small class="mut grow" style="text-align:right">até ${D.short(g.due)}/${g.due.slice(2,4)}</small></div>
  <b class="gt">${esc(g.title)}</b>${goalViz(g)}${paceBlock(g)}
  ${hist?`<div style="margin-top:6px"><small class="mut tiny">${g.auto==='dividas'?'Pagamentos por mês':'Recebido por mês'}</small>${hist}</div>`:''}
  <small class="mut" style="display:block;margin-top:8px">Próxima ação: <b style="color:var(--ink)">${esc(g.next||'—')}</b>${par?` · ligada a “${esc(par.title)}”`:''}</small></button>`}
A.dec=(ds)=>{const p=S.projects.find(x=>x.id===ds.id);p.dec=p.dec===ds.v?'':ds.v;U.keepScroll=true;save()};

/* ---------- FORMULÁRIO SMART ---------- */
const CHIPS={
  S:['Quitar todas as dívidas e empréstimos de Aracaju','Receber R$ 15 mil com a DUNE','Fechar 3 clientes de fotografia de eventos','Gravar 6 aulas do SOS Stories','Postar 3 vídeos por semana na DUNE'],
  ind:['Valor recebido (R$)','Dívidas quitadas (R$)','Quantidade','Clientes fechados','Aulas gravadas','Posts publicados'],
  A:['Destinar 100% dos extras','Reservar um valor fixo por mês','Bloquear 2 manhãs por semana','Pedir indicação a clientes antigos','Dividir em etapas semanais'],
  R:['Liberdade financeira','Crescer a DUNE','Lançar meu produto','Ter mais tempo e paz','Construir minha marca pessoal']
};
SHEETS.goal=(a)=>{
  let g;
  if(a.id)g=S.goals.find(x=>x.id===a.id);
  else{const [l,k]=(a.k||'mes|'+PER.key('mes',D.today())).split('|');g={level:l,period:k,area:'dune',title:'',ind:'',target:'',cur:'',auto:'',autoArea:'dune',how:'',why:'',due:PER.end(l,k),next:'',parent:''}}
  if(a.draft)g=Object.assign({},g,a.draft);
  const l=g.level,T=D.today(),opts=[];let k0=PER.key(l,T);for(let i=0;i<4;i++){opts.push(k0);k0=PER.next(l,k0)}if(!opts.includes(g.period))opts.unshift(g.period);
  const used=k=>goalsIn(l,k).filter(x=>x.id!==a.id).length,full=k=>used(k)>=LIMIT[l],weekly=l==='sem';
  const chips=(f,arr,app)=>`<div class="chips" style="margin-top:6px">${arr.map(v=>`<button class="chip" style="min-height:34px;font-size:13px" data-a="chipFill" data-f="${f}" data-v="${esc(v)}" ${app?'data-app="1"':''}>${esc(v)}</button>`).join('')}</div>`;
  const step=(L,t,d,inner)=>`<div class="smart-s"><span class="smart-l">${L}</span><div class="grow"><b>${t}</b><small class="mut">${d}</small>${inner}</div></div>`;
  const body=`<div class="grid2"><label class="fld" style="margin-top:0"><span>Tipo</span><select id="gl" data-ch="goalLvl">${[['smt','Semestre (1)'],['tri','Trimestre (até 3)'],['mes','Mês (1)'],['sem','Ação da semana']].map(([v,t])=>`<option value="${v}" ${l===v?'selected':''}>${t}</option>`).join('')}</select></label>
   <label class="fld" style="margin-top:0"><span>Período</span><select id="gk">${opts.map(k=>`<option value="${k}" ${g.period===k?'selected':''} ${full(k)&&g.period!==k?'disabled':''}>${esc(PER.label(l,k))}${full(k)?' · cheio':''}</option>`).join('')}</select></label></div>
   ${full(g.period)?`<div class="warn" style="margin-top:10px">${esc(PER.label(l,g.period))} já tem ${used(g.period)} de ${LIMIT[l]} ${LIMIT[l]>1?'metas':'meta'}. Edite a existente ou escolha outro período.</div>`:''}
   <label class="fld"><span>Área</span><select id="ga">${['dune','extra','df','sos','pessoal'].map(x=>`<option value="${x}" ${g.area===x?'selected':''}>${AREAS[x].n}</option>`).join('')}</select></label>
   <div id="smart" class="smart-pills"></div>
   ${step('S','Específica','O que exatamente você vai conquistar? Uma frase com verbo.',`<textarea id="gS" data-in="smartChk" style="min-height:64px;margin-top:6px" placeholder="Ex.: Quitar todas as dívidas e empréstimos de Aracaju">${esc(g.title)}</textarea>${chips('gS',CHIPS.S)}`)}
   ${weekly?'':step('M','Mensurável','Como vai medir? Escolha o indicador e o número final.',`<input id="gI" data-in="smartChk" style="margin-top:6px" value="${esc(g.ind)}" placeholder="Indicador">${chips('gI',CHIPS.ind)}
     <div class="grid2" style="margin-top:8px"><label class="fld" style="margin:0"><span>Alvo</span><input id="gTg" data-in="smartChk" inputmode="decimal" value="${g.auto==='dividas'?'':esc(g.target)}" placeholder="${g.auto==='dividas'?'automático':'15000'}" ${g.auto==='dividas'?'disabled':''}></label><label class="fld" style="margin:0"><span>Já tenho</span><input id="gC" inputmode="decimal" value="${esc(g.cur)}" placeholder="0" ${g.auto==='dividas'?'disabled':''}></label></div>
     <label class="fld"><span>Atualizar sozinho com</span><select id="gAu" data-ch="goalAuto"><option value="">Eu atualizo manualmente</option><option value="receita|dune" ${g.auto==='receita'&&g.autoArea==='dune'?'selected':''}>Receitas recebidas da DUNE</option><option value="receita|extra" ${g.auto==='receita'&&g.autoArea==='extra'?'selected':''}>Receitas recebidas dos extras</option><option value="receita|todas" ${g.auto==='receita'&&g.autoArea==='todas'?'selected':''}>Todas as receitas recebidas</option><option value="dividas" ${g.auto==='dividas'?'selected':''}>Dívidas quitadas (Finanças › Dívidas)</option></select></label>`)}
   ${weekly?'':step('A','Atingível','Como você vai chegar lá? Recursos, valor por mês, rotina.',`<textarea id="gA" data-in="smartChk" style="min-height:60px;margin-top:6px" placeholder="Ex.: destinar todos os extras e reservar R$ 500 por mês">${esc(g.how)}</textarea>${chips('gA',CHIPS.A,1)}`)}
   ${weekly?'':step('R','Relevante','Por que essa meta importa agora?',`<textarea id="gR" data-in="smartChk" style="min-height:60px;margin-top:6px" placeholder="Ex.: começar o 2º semestre sem o peso das dívidas">${esc(g.why)}</textarea>${chips('gR',CHIPS.R,1)}`)}
   ${step('T','Temporal','Até quando? E qual o próximo passo?',`<input type="date" id="gD" data-in="smartChk" style="margin-top:6px" value="${g.due}"><input id="gN" style="margin-top:8px" value="${esc(g.next)}" placeholder="Próxima ação (ex.: atualizar o valor real de cada dívida)">`)}
   <label class="fld"><span>Ligada a</span><select id="gP"><option value="">—</option>${S.goals.filter(x=>x.id!==a.id&&x.level!=='sem').map(x=>`<option value="${x.id}" ${g.parent===x.id?'selected':''}>${esc(x.title)}</option>`).join('')}</select></label>
   ${a.id?`<div class="sec"><h3>Progresso</h3><button class="link" data-a="sheet" data-v="goalCheck" data-id="${a.id}">Fazer check-in</button></div><div class="card">${goalViz(g,true)}${paceBlock(g)}${goalTrend(g)}${(g.checkins||[]).length?`<div style="margin-top:10px">${g.checkins.slice().reverse().slice(0,6).map(c=>`<div class="kv"><span>${D.short(c.date)} · ${STAT[c.status][0]} ${STAT[c.status][1]}${c.why?`<br><small class="mut">${esc(c.why)}</small>`:''}</span><b class="num">${isMoney(g)?brl(c.cur):c.cur}</b></div>`).join('')}</div>`:'<p class="tiny mut">Ainda sem check-ins. O primeiro chega em '+D.short(nextCheck(g))+'.</p>'}${goalHist(g)}${g.auto==='dividas'?`<p class="tiny mut" style="margin:8px 0 0">Saldo inicial considerado: ${brl(g.base)}. Saldo atual das dívidas: ${brl(S.debts.reduce((x,d)=>x+d.balance,0))}. Extras recebidos desde ${D.short(g.created||D.today())}: <b>${brl(S.fin.inc.filter(i=>i.area==='extra'&&i.status==='recebido'&&i.date>=(g.created||'')).reduce((x,i)=>x+i.value,0))}</b>, destinados à quitação.</p><button class="btn sm sec2" style="margin-top:8px" data-a="goalBase" data-id="${a.id}">Usar o saldo atual como ponto de partida</button>`:''}${!g.auto&&!weekly?`<div class="row" style="gap:8px;margin-top:10px"><input id="gAdd" inputmode="decimal" placeholder="Somar ao progresso"><button class="btn sm pes" data-a="goalAdd" data-id="${a.id}">Somar</button></div>`:''}${weekly?`<button class="btn sm pes" style="margin-top:8px" data-a="goalDoneW" data-id="${a.id}">${goalCur(g)>=1?'Reabrir':'Marcar como feita'}</button>`:''}</div>`:''}`;
  return {title:a.id?'Meta':'Nova meta',body,foot:`${a.id?`<button class="btn line" data-a="goalDel" data-id="${a.id}">Excluir</button>`:''}<button class="btn dune" data-a="goalSave" data-id="${a.id||''}">Salvar meta</button>`,after(){A.smartChk()}};
};
function goalDraft(){const au=val('gAu');return {level:val('gl'),period:val('gk'),area:val('ga'),title:val('gS'),ind:val('gI'),target:val('gTg'),cur:val('gC'),auto:au?au.split('|')[0]:'',autoArea:au?(au.split('|')[1]||''):'',how:val('gA'),why:val('gR'),due:val('gD'),next:val('gN'),parent:val('gP')}}
A.goalLvl=()=>{const d=goalDraft();const l=d.level;d.period=PER.key(l,D.today());while(goalsIn(l,d.period).filter(x=>x.id!==SH.args.id).length>=LIMIT[l])d.period=PER.next(l,d.period);d.due=PER.end(l,d.period);SH.args.draft=d;renderSheet()};
A.goalAuto=()=>{const d=goalDraft();if(d.auto==='dividas'&&!d.ind)d.ind='Dívidas quitadas (R$)';if(d.auto==='receita'&&!d.ind)d.ind='Valor recebido (R$)';SH.args.draft=d;renderSheet()};
A.chipFill=(ds)=>{const e=document.getElementById(ds.f);if(!e)return;e.value=ds.app&&e.value?e.value.replace(/\.?\s*$/,'')+'; '+ds.v.toLowerCase():ds.v;A.smartChk()};
A.smartChk=()=>{const box=$('#smart');if(!box)return;const w=val('gl')==='sem';
  const ok={S:val('gS').length>=8,M:w||(!!val('gI')&&(num(val('gTg'))>0||val('gAu')==='dividas')),A:w||val('gA').length>=5,R:w||val('gR').length>=5,T:!!val('gD')};
  box.innerHTML=Object.entries(ok).map(([k,v])=>`<span class="sp ${v?'on':''}">${k}${v?' ✓':''}</span>`).join('')+`<small class="mut tiny grow" style="text-align:right">${Object.values(ok).every(Boolean)?'Meta SMART completa':'Complete as 5 letras'}</small>`;SH.args.smartOk=Object.values(ok).every(Boolean)};
A.goalSave=(ds)=>{
  const d=goalDraft();A.smartChk();if(!SH.args.smartOk){toast('Complete os campos S, M, A, R e T');return}
  if(goalsIn(d.level,d.period).filter(x=>x.id!==ds.id).length>=LIMIT[d.level]){toast(`${PER.label(d.level,d.period)} já está com o limite de metas`);return}
  let g=ds.id?S.goals.find(x=>x.id===ds.id):null;if(!g){g={id:uid(),created:D.today()};S.goals.push(g)}
  const tot=S.debts.reduce((a,x)=>a+x.balance,0);
  Object.assign(g,{level:d.level,period:d.period,area:d.area,title:d.title,ind:d.ind||(d.level==='sem'?'Feito':''),target:d.level==='sem'?1:num(d.target),cur:num(d.cur),auto:d.auto,autoArea:d.autoArea,how:d.how,why:d.why,due:d.due,next:d.next,parent:d.parent});
  if(g.auto==='dividas'&&!g.base)g.base=tot;
  save({quiet:true});closeSheet();toast('Meta salva');
};
A.goalDel=(ds)=>{S.goals=S.goals.filter(g=>g.id!==ds.id);save({quiet:true});closeSheet();toast('Meta excluída')};
A.goalBase=(ds)=>{const g=S.goals.find(x=>x.id===ds.id);g.base=S.debts.reduce((a,x)=>a+x.balance,0);g.created=D.today();save({quiet:true});renderSheet();toast('Ponto de partida atualizado')};
A.goalAdd=(ds)=>{const g=S.goals.find(x=>x.id===ds.id),v=num(val('gAdd'));if(!v)return;g.cur=(+g.cur||0)+v;save({quiet:true});renderSheet();toast('Progresso atualizado')};
A.goalDoneW=(ds)=>{const g=S.goals.find(x=>x.id===ds.id);g.cur=goalCur(g)>=1?0:1;save({quiet:true});renderSheet()};

/* ---------- MIGRAÇÃO (preserva os seus registros) ---------- */
function migrate(){
  if(S.v>=3)return false;
  const EX=['gt1','gt2','gt3','gm1','gm2','gw1'];
  if(S.v===2){S.since=S.since||D.today();S.goals=S.goals.filter(x=>!EX.includes(x.id));S.v=3;return true}
  const T=D.today(),tot=S.debts.reduce((a,d)=>a+d.balance,0),W=D.weekStart(T);
  S.notif.openRem=true;S.notif.openTime='19:00';S.notif.goalPrompt=true;S.notif.goalTime='09:00';
  S.opens=S.opens||{};S.goalSkip=S.goalSkip||{};
  const own=S.goals.filter(g=>!/^g\d$/.test(g.id)).map(g=>Object.assign(g,{period:PER.key(g.level,g.due||T),how:g.how||'',why:g.why||''}));
  S.goals=[
    {id:'gs1',level:'smt',period:'2027-S1',area:'pessoal',title:'Quitar todas as dívidas e empréstimos de Aracaju',ind:'Dívidas quitadas (R$)',target:0,cur:0,auto:'dividas',base:tot,how:'Destinar 100% dos extras (festas de cavalgada e fotografia de eventos) e reservar um valor fixo por mês para adiantar parcelas.',why:'Começar o segundo semestre de 2027 livre do peso das dívidas de Aracaju.',due:'2027-06-30',next:'Atualizar em Finanças o valor real de cada dívida e empréstimo',parent:'',created:T},
    {id:'gt1',level:'tri',period:'2027-T1',area:'dune',title:'Receber R$ 45 mil com a DUNE no 1º trimestre',ind:'Valor recebido (R$)',target:45000,cur:0,auto:'receita',autoArea:'dune',how:'Fechar 2 propostas novas por mês e oferecer manutenção mensal aos clientes atuais.',why:'Dar estabilidade à agência e sobra para quitar as dívidas.',due:'2027-03-31',next:'Fechar 2 propostas novas até 15/01',parent:''},
    {id:'gt2',level:'tri',period:'2027-T1',area:'sos',title:'Lançar o SOS Stories em março de 2027',ind:'Aulas gravadas',target:8,cur:2,auto:'',how:'Gravar 2 aulas por semana em blocos fixos.',why:'Criar uma renda que não depende só de clientes.',due:'2027-03-15',next:'Gravar a aula 3',parent:''},
    {id:'gt3',level:'tri',period:'2027-T1',area:'pessoal',title:'Ler 3 livros no 1º trimestre',ind:'Livros concluídos',target:3,cur:0,auto:'',how:'Ler 10 páginas por dia depois do almoço.',why:'Cuidar da cabeça e alimentar meus conteúdos.',due:'2027-03-31',next:'Terminar o livro atual',parent:''},
    {id:'gm1',level:'mes',period:'2026-12',area:'dune',title:'Receber R$ 12 mil em dezembro',ind:'Valor recebido (R$)',target:12000,cur:0,auto:'receita',autoArea:'dune',how:'Cobrar as entradas pendentes e entregar Café Aurora no prazo.',why:'Fechar o ano com caixa para janeiro.',due:'2026-12-31',next:'Cobrar a entrada do Studio Lume',parent:''},
    {id:'gm2',level:'mes',period:'2027-01',area:'dune',title:'Receber R$ 15 mil em janeiro',ind:'Valor recebido (R$)',target:15000,cur:0,auto:'receita',autoArea:'dune',how:'Propostas de manutenção + 1 projeto de identidade.',why:'Primeiro passo da meta do trimestre.',due:'2027-01-31',next:'Enviar proposta de manutenção para Café Aurora',parent:'gt1'},
    {id:'gw1',level:'sem',period:W,area:'sos',title:'Escrever o roteiro da aula 3',ind:'Feito',target:1,cur:0,auto:'',how:'',why:'',due:D.add(W,4),next:'Listar os 3 tópicos principais',parent:'gt2'},
    ...own
  ];
  S.goals=S.goals.filter(x=>!EX.includes(x.id));S.since=S.since||T;S.v=3;return true;
}
