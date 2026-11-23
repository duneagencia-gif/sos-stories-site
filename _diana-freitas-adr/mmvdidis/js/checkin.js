'use strict';
/* ---------- COBRANÇA DAS METAS (check-ins) ----------
   Semana e mês: toda semana · Trimestre: a cada 15 dias · Semestre: 1 vez por mês (editável). */
const CAD_DEF={sem:7,mes:7,tri:14,smt:30};
const cad=l=>{const c=Object.assign({},CAD_DEF,S.set.ckCad);return l==='sem'?c.mes:c[l]};
function goalWindow(g){const ps=PER.start(g.level,g.period),st=g.created&&g.created<ps?g.created:ps;return [st,g.due||PER.end(g.level,g.period)]}
function lastCheck(g){const c=(g.checkins||[]).slice(-1)[0];return c?c.date:goalWindow(g)[0]}
function nextCheck(g){return D.add(lastCheck(g),cad(g.level))}
function goalsDue(date){date=date||D.today();return S.goals.filter(g=>{const [a,b]=goalWindow(g);if(date<a||date>D.add(b,3))return false;if(goalCur(g)>=goalTarget(g)&&goalTarget(g))return false;return nextCheck(g)<=date})}

/* ritmo: quanto deveria estar até hoje x quanto está */
function debtPlan(g){
  const T=D.today(),tot=S.debts.reduce((a,d)=>a+d.balance,0),monthsLeft=Math.max(.5,D.diff(T,g.due)/30.4),need=tot/monthsLeft;
  const pays=S.debts.flatMap(d=>d.pays),paid90=pays.filter(p=>D.diff(p.date,T)<=90).reduce((a,p)=>a+p.value,0);
  const planned=S.debts.filter(d=>d.balance>0).reduce((a,d)=>a+(+d.monthly||+d.mPlan||0),0)+(+S.fin.reserveDebt||0);
  const extras30=S.fin.inc.filter(i=>i.area==='extra'&&i.status==='recebido'&&D.diff(i.date,T)<=30).reduce((a,i)=>a+i.value,0);
  const cap=planned+extras30,thisMonth=pays.filter(p=>p.date.slice(0,7)===T.slice(0,7)).reduce((a,p)=>a+p.value,0);
  const proj=cap>0?D.add(T,Math.ceil(tot/cap*30.4)):null;
  const status=tot<=0?'done':cap>=need?'ok':cap>=need*.8?'atras':'longe';
  return {tot,monthsLeft,need,paid90,planned,extras30,cap,thisMonth,proj,status};
}
function goalPace(g){
  const T=D.today(),[a,b]=goalWindow(g),total=Math.max(1,D.diff(a,b)),el=Math.min(total,Math.max(0,D.diff(a,T)));
  const tgt=goalTarget(g),cur=goalCur(g),exp=tgt*el/total,daysLeft=Math.max(0,D.diff(T,b));
  if(g.auto==='dividas'){const d=debtPlan(g);return {cur,tgt,exp,frac:el/total,daysLeft,status:d.status,debt:d}}
  const status=tgt&&cur>=tgt?'done':cur>=exp*.9?'ok':cur>=exp*.6?'atras':'longe';
  return {cur,tgt,exp,frac:el/total,daysLeft,status};
}
const STAT={done:['🎉','Meta batida','ok'],ok:['👏','No ritmo','ok'],atras:['⏳','Um pouco atrás','demo'],longe:['🔥','Precisa de gás','bad']};
const mesAno=d=>d?`${MESL[+d.slice(5,7)-1]} de ${d.slice(0,4)}`:'—';
function paceMsg(g,p){
  const m=isMoney(g),f=v=>m?brl(v):Math.round(v*10)/10;
  if(p.debt){const d=p.debt;
    let s=d.status==='done'?'Todas as dívidas quitadas. Que conquista, Didis! 🎉':d.status==='ok'?`Você está no ritmo! Com ${brl(d.cap)}/mês (parcelas + reserva + extras do último mês), quita tudo em ${mesAno(d.proj)}, dentro do prazo. 👏`
      :`Precisa dar um gás: faltam ${brl(d.tot)} em ${Math.round(d.monthsLeft)} meses, ou seja ${brl(d.need)}/mês. Hoje o planejado é ${brl(d.cap)}/mês. Faltam ${brl(d.need-d.cap)} por mês. Dá para subir a reserva para adiantar dívidas para ${brl(Math.ceil((S.fin.reserveDebt+d.need-d.cap)/50)*50)} ou buscar mais ${brl(d.need-d.cap)} em extras (cavalgadas, fotografia).`;
    if(d.thisMonth>=d.need&&d.tot>0)s+=` E este mês você já pagou ${brl(d.thisMonth)}, acima do necessário. Mandou muito bem, Didis!`;
    return s;}
  if(p.status==='done')return 'Meta batida! Comemore e registre o que funcionou. 🎉';
  if(p.status==='ok')return `No ritmo: até hoje o esperado era ${f(p.exp)} e você está em ${f(p.cur)}. Continue assim! 👏`;
  if(p.status==='atras')return `Um pouco atrás: o esperado era ${f(p.exp)} e você está em ${f(p.cur)}. Faltam ${f(p.tgt-p.cur)} em ${p.daysLeft} dias. Próxima ação: ${g.next||'defina uma'}.`;
  return `Precisa de gás: o esperado era ${f(p.exp)} e você está em ${f(p.cur)}. Faltam ${f(p.tgt-p.cur)} em ${p.daysLeft} dias, cerca de ${f((p.tgt-p.cur)/Math.max(1,p.daysLeft/7))} por semana. Vale rever a próxima ação ou reservar um bloco na agenda.`;
}
/* gráfico: linha ideal (tracejada) x evolução real, com o dinheirinho no fim */
function goalTrend(g){
  const [a,b]=goalWindow(g),tgt=goalTarget(g)||1,T=D.today(),tot=Math.max(1,D.diff(a,b));
  const pts=[...(g.checkins||[]).map(c=>({d:c.date,v:c.cur})),{d:T,v:goalCur(g)}].filter(p=>p.d>=a&&p.d<=b);
  if(!pts.length||pts[0].d!==a)pts.unshift({d:a,v:g.auto==='dividas'?0:(g.checkins&&g.checkins[0]?Math.min(g.checkins[0].cur,goalCur(g)):0)});
  const W=320,H=120,L=8,R=40,Tp=14,B=22,x=d=>L+(W-L-R)*Math.min(1,Math.max(0,D.diff(a,d)/tot)),y=v=>Tp+(H-Tp-B)*(1-Math.min(1.05,Math.max(0,v/tgt)));
  const line=pts.map((p,i)=>`${i?'L':'M'}${x(p.d).toFixed(1)},${y(p.v).toFixed(1)}`).join(' ');
  const ex=x(T),last=pts[pts.length-1],m=isMoney(g);
  return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block;margin-top:8px" role="img" aria-label="Evolução da meta">
  <line x1="${L}" y1="${y(0)}" x2="${W-R}" y2="${y(0)}" stroke="var(--line)"/>
  <line x1="${L}" y1="${y(0)}" x2="${W-R}" y2="${y(tgt)}" stroke="var(--ink3)" stroke-dasharray="4 4"/>
  <line x1="${ex}" y1="${Tp-6}" x2="${ex}" y2="${y(0)}" stroke="var(--dune)" stroke-width="1" opacity=".5"/>
  <path d="${line}" fill="none" stroke="var(--pes)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  ${pts.map(p=>`<circle cx="${x(p.d)}" cy="${y(p.v)}" r="3.5" fill="#fff" stroke="var(--pes)" stroke-width="2"/>`).join('')}
  <circle cx="${x(last.d)}" cy="${y(last.v)}" r="5" fill="var(--pes)"/>
  <g transform="translate(${W-R+4},${y(tgt)-18})"><g transform="scale(.8)">${(m?BAG:FLAG).replace('<svg viewBox="0 0 44 44" aria-hidden="true">','<svg width="44" height="44" viewBox="0 0 44 44">')}</g></g>
  ${ex-L>44?`<text x="${L}" y="${H-6}" font-size="10" fill="var(--ink3)" font-family="Poppins,sans-serif">${MES[+a.slice(5,7)-1]}/${a.slice(2,4)}</text>`:''}
  <text x="${ex}" y="${H-6}" font-size="10" fill="var(--dune)" text-anchor="middle" font-family="Poppins,sans-serif">hoje</text>
  ${W-R-ex>44?`<text x="${W-R}" y="${H-6}" font-size="10" fill="var(--ink3)" text-anchor="end" font-family="Poppins,sans-serif">${MES[+b.slice(5,7)-1]}/${b.slice(2,4)}</text>`:''}</svg>
  <div class="row tiny mut" style="gap:12px"><span><i style="display:inline-block;width:14px;border-top:2px dashed var(--ink3);vertical-align:middle"></i> ritmo ideal</span><span><i style="display:inline-block;width:14px;border-top:3px solid var(--pes);vertical-align:middle"></i> você</span></div>`;
}
function paceBlock(g){const p=goalPace(g),s=STAT[p.status];
  return `<div class="pace ${s[2]}"><div class="row"><span class="pace-e">${s[0]}</span><b class="grow">${s[1]}</b><small class="mut">${Math.round(p.frac*100)}% do prazo</small></div><p>${esc(paceMsg(g,p))}</p></div>`}

/* faixa em Hoje + folha de check-in */
function checkStrip(){const ds=goalsDue();if(!ds.length)return '';
  return `<button class="gp" style="background:var(--pes)" data-a="sheet" data-v="goalCheck"><span class="gp-ic" style="background:rgba(255,255,255,.22)">✓</span><span class="grow"><b>Hora do check-in das metas</b><small style="color:#E8F1E9">${ds.length===1?esc(ds[0].title):ds.length+' metas esperando você'}</small></span>${IC.r}</button>`}
SHEETS.goalCheck=(a)=>{
  const list=a.id?[S.goals.find(g=>g.id===a.id)]:goalsDue();
  if(!list.length)return {title:'Check-in das metas',body:'<p class="good">Nenhuma meta esperando check-in agora. 👏</p>'};
  return {title:'Check-in das metas',body:`<p class="tiny mut" style="margin-top:0">Atualize, diga como se sente e por quê. Eu comparo com o ritmo esperado.</p>`+list.map(g=>{const p=goalPace(g),manual=!g.auto;
    return `<div class="card ckc"><div class="row">${areaPill(g.area)}<small class="mut grow" style="text-align:right">${esc(LVL[g.level])} · até ${D.short(g.due)}</small></div><b style="display:block;margin-top:6px;font-weight:600">${esc(g.title)}</b>
    ${goalViz(g)}${paceBlock(g)}
    ${manual?`<label class="fld"><span>Onde você está agora? (${esc(g.ind||'progresso')})</span><input id="ck_v_${g.id}" inputmode="decimal" value="${goalCur(g)}"></label>`:`<p class="tiny mut" style="margin:10px 0 0">${g.auto==='dividas'?'Calculado pelas suas dívidas em Finanças.':'Calculado pelas receitas em Finanças.'}</p>`}
    <div class="fld"><span>Como você sente essa meta?</span><div class="moods" style="grid-template-columns:repeat(3,minmax(0,1fr))">${[['ok','😀','no ritmo'],['atras','😐','um pouco atrás'],['longe','😟','travei']].map(([k,e,l])=>`<button data-a="ckFeel" data-id="${g.id}" data-v="${k}" id="ckf_${g.id}_${k}"><span>${e}</span><small>${l}</small></button>`).join('')}</div></div>
    <label class="fld"><span>Por quê? O que ajudou ou atrapalhou?</span><textarea id="ck_w_${g.id}" style="min-height:64px"></textarea></label>
    <label class="fld"><span>Próxima ação</span><input id="ck_n_${g.id}" value="${esc(g.next||'')}"></label></div>`}).join(''),
  foot:`<button class="btn pes" data-a="ckSave" data-ids="${list.map(g=>g.id).join(',')}">Salvar check-in</button>`};
};
A.ckFeel=(ds)=>{SH.args.feel=SH.args.feel||{};SH.args.feel[ds.id]=ds.v;['ok','atras','longe'].forEach(k=>{const e=document.getElementById(`ckf_${ds.id}_${k}`);if(e)e.classList.toggle('on',k===ds.v)})};
A.ckSave=(ds)=>{const T=D.today();let praise=0,push=0;
  ds.ids.split(',').forEach(id=>{const g=S.goals.find(x=>x.id===id);if(!g)return;
    if(!g.auto){const v=document.getElementById('ck_v_'+id);if(v&&v.value!=='')g.cur=num(v.value)}
    const p=goalPace(g);g.next=val('ck_n_'+id)||g.next;
    g.checkins=(g.checkins||[]).filter(c=>c.date!==T);g.checkins.push({date:T,cur:goalCur(g),status:p.status,feel:(SH.args.feel||{})[id]||'',why:val('ck_w_'+id)});
    if(p.status==='ok'||p.status==='done')praise++;else push++;});
  save({quiet:true});closeSheet();toast(push?'Check-in salvo. Bora dar um gás, Di 🔥':'Check-in salvo. Você está mandando bem, Di! 👏')};
A.ckCad=(ds,el)=>{S.set.ckCad=Object.assign({},CAD_DEF,S.set.ckCad);S.set.ckCad[ds.k]=+el.value;U.keepScroll=true;save()};
function cadenceBox(){const c=Object.assign({},CAD_DEF,S.set.ckCad),opt=(k,vals)=>`<select style="width:auto;padding:6px 8px" data-ch="ckCad" data-k="${k}">${vals.map(([v,l])=>`<option value="${v}" ${c[k]===v?'selected':''}>${l}</option>`).join('')}</select>`;
  return `<div class="card" style="margin-top:12px"><b>Como eu te cobro</b><div class="kv"><span>Ações da semana e meta do mês</span>${opt('mes',[[7,'toda semana'],[14,'a cada 15 dias']])}</div><div class="kv"><span>Metas do trimestre</span>${opt('tri',[[7,'toda semana'],[14,'a cada 15 dias'],[30,'1× por mês']])}</div><div class="kv"><span>Meta do semestre</span>${opt('smt',[[14,'a cada 15 dias'],[30,'1× por mês'],[60,'a cada 2 meses']])}</div>
  <button class="btn sm pes" style="margin-top:10px" data-a="sheet" data-v="goalCheck">Fazer check-in agora${goalsDue().length?` (${goalsDue().length})`:''}</button></div>`}
function migrateCk(){if(S.v>=4)return false;S.set.ckCad=Object.assign({},CAD_DEF);S.set.ckCad.sem=7;S.notif.ckOn=true;S.notif.ckTime=S.notif.ckTime||'09:00';S.goals.forEach(g=>{g.checkins=g.checkins||[];g.created=g.created||D.today()});S.v=4;return true}

function migrateQuotes(){if(S.v>=5)return false;const EXQ=['Feito com calma também é feito.','Um passo pequeno, todo dia, constrói o que você pediu em oração.','Organizar a vida é escolher, com carinho, o que fica para amanhã.'];
  S.quotes=S.quotes.filter(q=>!EXQ.includes(q.text));MY_QUOTES.forEach(t=>{if(!S.quotes.some(q=>q.text===t))S.quotes.push({id:uid(),text:t,by:'Minhas frases',fav:false,hidden:false})});S.set.quoteHidden=false;S.v=5;return true}
