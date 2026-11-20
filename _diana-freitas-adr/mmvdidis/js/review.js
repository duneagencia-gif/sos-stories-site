'use strict';
/* ---------- REVISÃO SEMANAL ---------- */
function range(kind){const T=D.today(),W=D.weekStart(T);if(kind==='passada')return [D.add(W,-7),D.add(W,-1)];if(kind==='mes')return [D.add(T,-27),T];return [W,D.add(W,6)]}
const inR=(d,[a,b])=>d&&d>=a&&d<=b;
function reviewData(kind){
  const R=range(kind),T=D.today(),days=[];for(let d=R[0];d<=R[1]&&d<=T;d=D.add(d,1))days.push(d);
  const pr=S.tasks.filter(t=>t.prio&&inR(t.date,R)),prDone=pr.filter(t=>t.done);
  const unpl=S.tasks.filter(t=>t.unplanned&&inR(t.doneAt||t.date,R));
  const extraRep=S.closings.filter(c=>inR(c.date,R)).flatMap(c=>c.extra||[]);
  const moved=S.tasks.filter(t=>(t.history||[]).some(h=>inR(h.at,R)||inR(h.from,R)));
  const movesN=moved.reduce((a,t)=>a+(t.history||[]).filter(h=>inR(h.at,R)||inR(h.from,R)).length,0);
  const planned=S.tasks.filter(t=>inR(t.date,R)&&t.date<=T).reduce((a,t)=>a+(+t.dur||0),0),realized=S.tasks.filter(t=>t.done&&inR(t.doneAt,R)).reduce((a,t)=>a+(+t.dur||0),0);
  const pub=S.contents.filter(c=>c.stage==='publicado'&&inR(c.publishedAt,R)),pend=S.contents.filter(c=>c.stage!=='publicado');
  const noClose=days.filter(d=>!S.closings.some(c=>c.date===d));
  const per=days.map(d=>{const cl=S.closings.find(c=>c.date===d),ck=S.checkins[d]||{};const rs=S.readS.filter(r=>r.date===d),ts=S.train.sessions.filter(s=>s.date===d);
    return {d,readMeas:Math.round(rs.filter(r=>!r.manual).reduce((a,r)=>a+r.min,0)),readRep:Math.round(rs.filter(r=>r.manual).reduce((a,r)=>a+r.min,0)),trainMeas:ts.filter(s=>!s.manual).reduce((a,s)=>a+s.min,0),trainRep:ts.filter(s=>s.manual).reduce((a,s)=>a+s.min,0),energy:+(ck.energy||(cl&&cl.energy)||0),mood:ck.mood||(cl&&cl.mood)||'',has:!!(cl||ck.mood),pr:S.tasks.filter(t=>t.prio&&t.done&&t.doneAt===d).length,mv:S.tasks.reduce((a,t)=>a+(t.history||[]).filter(h=>h.at===d).length,0)}});
  const prayer=days.filter(d=>isDone(d,'rezar')).length,bibDays=days.filter(d=>S.habits.find(h=>h.id==='biblia').days.includes(D.dow(d))),bib=bibDays.filter(d=>isDone(d,'biblia')).length;
  return {R,days,pr,prDone,unpl,extraRep,moved,movesN,planned,realized,pub,pend,noClose,per,prayer,bibDays,bib};
}
function feedback(r){
  const fb=[],adj=[];
  const recs=S.tasks.filter(t=>t.kind==='gravação'&&(t.reschedules||0)>0&&(t.history||[]).some(h=>D.diff(h.at,D.today())<=21));
  recs.forEach(t=>{const reasons=(t.history||[]).map(h=>{const busy=S.tasks.filter(x=>x.date===h.from&&x.id!==t.id).sort((a,b)=>b.dur-a.dur).slice(0,2);return `${D.lbl(h.from)}: ${busy.length?busy.map(b=>`${b.title} (${dur(b.dur)})`).join(' e '):'sem outro registro nesse dia'}`});
    fb.push(`Você adiou “${t.title}” ${t.reschedules} ${t.reschedules>1?'vezes':'vez'}. Nos dias originais a agenda tinha — ${reasons.join('; ')}.`)});
  if(recs.length)adj.push({id:'rec',text:'Reservar um bloco fixo de gravação de 90 min na terça às 9h',act:'recBlock'});
  const nxt=D.add(D.weekStart(D.today()),7),cap=usable(),over=[0,1,2,3,4].map(i=>D.add(nxt,i)).filter(d=>loadOf(d)>cap);
  if(over.length){const d=over[0];fb.push(`A próxima semana já passa do expediente na ${DOWL[D.dow(d)]} (${dur(loadOf(d))} planejados para ${dur(cap)} úteis).`);adj.push({id:'over',text:`Aliviar a ${DOWL[D.dow(d)]}: mover uma tarefa sem horário fixo para o dia com mais folga`,act:'relieve',d})}
  const low=r.per.filter(p=>p.energy&&p.energy<=2);if(low.length>=2)fb.push(`Energia baixa em ${low.length} dias (${low.map(p=>DOW[D.dow(p.d)]).join(', ')}), pelo que você contou.`);
  const readDays=r.per.filter(p=>p.readMeas+p.readRep>0).length;
  if(readDays<Math.min(5,r.days.length))adj.push({id:'read',text:'Ler 5 minutos depois do almoço (critério do check: 5 min)',act:'readRule'});
  if(r.noClose.length)adj.push({id:'close',text:`Fechar o dia às 20h com o resumo de pendências (faltaram ${r.noClose.length} registros)`,act:'summary'});
  if(r.prDone.length<r.pr.length)fb.push(`Prioridades: ${r.prDone.length} de ${r.pr.length} concluídas. ${r.pr.filter(t=>!t.done).slice(0,2).map(t=>`“${t.title}”`).join(' e ')} ficaram abertas.`);
  if(r.unpl.length||r.extraRep.length)fb.push(`Entregas fora do plano: ${[...r.unpl.map(t=>t.title),...r.extraRep].slice(0,3).join('; ')}.`);
  return {fb,adj:adj.slice(0,3)};
}
SCREENS.revisao=()=>{
  const k=U.revTab,r=reviewData(k),{fb,adj}=feedback(r),wkKey=r.R[0],st=(S.review.adj[wkKey]=S.review.adj[wkKey]||{});
  const isM=k==='mes';
  const bucket=(fn)=>{if(!isM)return r.per.map(p=>({l:DOW[D.dow(p.d)],...fn(p)}));const out=[];for(let i=0;i<r.per.length;i+=7){const g=r.per.slice(i,i+7);const vals=g.map(fn);out.push({l:'S'+(out.length+1),v:vals.reduce((a,x)=>a+(x.none?0:x.v),0),none:vals.every(x=>x.none)})}return out};
  let h=backTop('Revisão')+`<div class="seg">${[['semana','Esta semana'],['passada','Semana passada'],['mes','4 semanas']].map(([a,l])=>`<button class="${k===a?'on':''}" data-a="setU" data-k="revTab" data-v="${a}">${l}</button>`).join('')}</div>
  <p class="tiny mut" style="margin:8px 0 0">${D.short(r.R[0])} a ${D.short(r.R[1])} · revisão de 30 min toda ${DOWL[S.set.reviewDow]} às ${S.set.reviewTime}</p>
  <div class="grid2" style="margin-top:10px"><div class="card"><small class="mut">Prioridades</small><div class="big">${r.prDone.length}/${r.pr.length}</div><small class="mut">concluídas</small></div><div class="card"><small class="mut">Remarcações</small><div class="big">${r.movesN}</div><small class="mut">${r.moved.length} tarefas</small></div></div>
  <div class="grid2" style="margin-top:10px"><div class="card"><small class="mut">Planejado × realizado</small><div class="num" style="font-size:18px;font-weight:600">${dur(r.planned)} × ${dur(r.realized)}</div><small class="mut tiny">pela duração estimada</small></div><div class="card"><small class="mut">Conteúdos</small><div class="big">${r.pub.length}</div><small class="mut">publicados · ${r.pend.length} pendentes</small></div></div>`;
  h+=`<div class="sec"><h2>Feedback</h2></div><div class="card">${fb.map(x=>`<p style="margin:0 0 10px">${esc(x)}</p>`).join('')||'<p class="empty">Ainda há poucos dados para um feedback com exemplos.</p>'}</div>`;
  h+=`<div class="sec"><h2>Ajustes para a próxima semana</h2></div>${adj.map(a=>{const s=st[a.id]||{};return `<div class="card"><p style="margin:0">${s.text?esc(s.text):esc(a.text)}</p>${s.st?`<span class="pill ${s.st==='aceito'?'ok':''}" style="margin-top:8px">${s.st}</span>`:`<div id="ed-${a.id}"></div><div class="row" style="gap:8px;margin-top:10px"><button class="btn sm pes" data-a="adjOk" data-id="${a.id}" data-k="${wkKey}">Aceitar</button><button class="btn sm sec2" data-a="adjEd" data-id="${a.id}">Editar</button><button class="btn sm line" data-a="adjNo" data-id="${a.id}" data-k="${wkKey}">Dispensar</button></div>`}</div>`}).join('')||'<p class="empty">Nenhum ajuste sugerido.</p>'}`;
  h+=`<div class="sec"><h2>Evolução</h2></div>
  <div class="card"><small class="mut">Prioridades concluídas</small>${barChart(bucket(p=>({v:p.pr})),'var(--dune)')}</div>
  <div class="card"><small class="mut">Tarefas remarcadas</small>${barChart(bucket(p=>({v:p.mv})),'var(--sos)')}</div>
  <div class="card"><small class="mut">Leitura (min) · medido pelo app</small>${barChart(bucket(p=>({v:p.readMeas})),'var(--pes)')}<small class="mut tiny">Relatado/manual no período: ${r.per.reduce((a,p)=>a+p.readRep,0)} min</small></div>
  <div class="card"><small class="mut">Atividade física (min) · cronômetro</small>${barChart(bucket(p=>({v:p.trainMeas})),'var(--pes)')}<small class="mut tiny">Contado por você (manual/relato): ${r.per.reduce((a,p)=>a+p.trainRep,0)} min</small></div>
  <div class="card"><small class="mut">Energia (1–5) · o que você contou</small>${barChart(bucket(p=>({v:p.energy,none:!p.has})),'var(--fe)')}<small class="mut tiny">Humor: ${r.per.filter(p=>p.mood).map(p=>`${DOW[D.dow(p.d)]} ${emo(p.mood)}${esc(p.mood)}`).join(' · ')||'—'}</small></div>
  ${r.noClose.length?`<div class="warn">Faltam registros de fechamento em: ${r.noClose.map(d=>D.short(d)).join(', ')}. As barras listradas indicam falta de dados.</div>`:''}`;
  h+=`<div class="sec"><h2>Metas</h2></div><div class="card">${S.goals.filter(g=>g.level!=='sem').map(g=>{const p=goalPace(g);return `<button class="kv" style="width:100%;text-align:left" data-a="sheet" data-v="goal" data-id="${g.id}"><span>${STAT[p.status][0]} ${esc(g.title)}<br><small class="mut">${STAT[p.status][1]}</small></span><b class="num">${Math.round(goalCur(g)/(goalTarget(g)||1)*100)}%</b></button>`}).join('')||'<p class="empty">Nenhuma meta ativa.</p>'}</div>`;
  h+=`<div class="sec"><h2>Fé</h2></div><div class="card"><div class="kv"><span>Oração</span><b>${r.prayer} de ${r.days.length} dias</b></div><div class="kv"><span>Leitura da Bíblia</span><b>${r.bib} de ${r.bibDays.length} dias escolhidos</b></div><details style="margin-top:6px"><summary class="link">Reler meus agradecimentos</summary>${r.days.slice().reverse().filter(d=>S.faith.grat[d]).map(d=>`<p class="tiny" style="margin:8px 0"><b>${D.lbl(d)}</b><br>${S.faith.grat[d].map(esc).join(' · ')}</p>`).join('')||'<p class="empty">Sem registros no período.</p>'}</details></div>`;
  h+=`<div class="sec"><h2>Ideias sem data</h2></div><div class="card">${S.contents.filter(c=>!c.post&&c.stage!=='publicado').map(c=>`<button class="li" data-a="openContent" data-id="${c.id}"><span class="t"><b>${esc(c.original)}</b><small class="mut">agendar, reformular ou arquivar</small></span>${IC.r}</button>`).join('')||'<p class="empty">Todas as ideias têm data.</p>'}</div>`;
  h+=`<button class="btn full pes" style="margin-top:16px" data-a="revDone">${isDone(D.today(),'revisao')?'✓ Revisão concluída':'Concluir revisão'}</button>`;
  return h;
};
A.adjEd=(ds)=>{const e=$('#ed-'+ds.id);const k=range(U.revTab)[0];e.innerHTML=`<input id="adt-${ds.id}" style="margin-top:8px" value="${esc(((S.review.adj[k]||{})[ds.id]||{}).text||'')}" placeholder="Escreva o ajuste do seu jeito">`;$('#adt-'+ds.id).focus()};
A.adjOk=(ds)=>{const r=reviewData(U.revTab),a=feedback(r).adj.find(x=>x.id===ds.id),e=$('#adt-'+ds.id),txt=e&&e.value.trim();
  S.review.adj[ds.k][ds.id]={st:'aceito',text:txt||a.text};
  if(a.act==='recBlock'){let d=D.add(D.weekStart(D.today()),8);S.tasks.push({id:uid(),title:'Bloco de gravação',area:'dune',kind:'gravação',date:d,time:'09:00',dur:90,done:false,reschedules:0,history:[],link:'',client:'',deps:[],created:D.today(),fixed:true})}
  if(a.act==='relieve'){const mv=S.tasks.filter(t=>t.date===a.d&&!t.done&&!t.fixed&&!t.time).sort((x,y)=>y.dur-x.dur)[0];if(mv){let to=D.nextWk(D.add(a.d,1));for(let i=0;i<10&&freeOf(to)<mv.dur;i++)to=D.nextWk(D.add(to,1));moveTask(mv,to);S.review.adj[ds.k][ds.id].text+=` → “${mv.title}” foi para ${D.lbl(to)}`}}
  if(a.act==='readRule')S.set.readRule={type:'min',val:5};
  if(a.act==='summary'){S.notif.summary=true;S.notif.sumTime='20:00'}
  U.keepScroll=true;save();toast('Ajuste aceito')};
A.adjNo=(ds)=>{S.review.adj[ds.k][ds.id]={st:'dispensado'};U.keepScroll=true;save()};
A.revDone=()=>{const v=!isDone(D.today(),'revisao');setDone(D.today(),'revisao',v,'revisão');U.keepScroll=true;save();if(v)toast('Revisão concluída ✓')};

/* ---------- CHECKLIST: ordem e frequência ---------- */
SCREENS.ckedit=()=>{const hs=S.habits.slice().sort((a,b)=>a.order-b.order);
  return backTop('Itens do checklist')+`<p class="tiny mut">Ordem, frequência e quais itens aparecem. Tarefas, entregas e gravações entram sozinhas no dia marcado.</p><div class="card">${hs.map((h,i)=>`<div style="padding:10px 0;border-top:${i?'1px solid var(--line)':'0'}"><div class="row"><input type="checkbox" data-ch="hOn" data-id="${h.id}" ${h.on?'checked':''}><b class="grow" style="font-weight:500">${esc(h.label)}</b><button class="ib" data-a="hMove" data-id="${h.id}" data-v="-1" aria-label="Subir">↑</button><button class="ib" data-a="hMove" data-id="${h.id}" data-v="1" aria-label="Descer">↓</button></div>
  ${h.id==='treino'?'<small class="mut">Segue o cronograma de Treinos.</small>':`<div class="row" style="gap:8px;margin-top:6px"><select data-ch="hFreq" data-id="${h.id}" style="width:auto"><option value="daily" ${h.freq==='daily'?'selected':''}>Todos os dias</option><option value="days" ${h.freq==='days'?'selected':''}>Dias escolhidos</option></select></div>${h.freq==='days'?`<div class="days" style="margin-top:8px">${[0,1,2,3,4,5,6].map(d=>`<button class="${h.days.includes(d)?'on':''}" style="min-height:40px" data-a="hDay" data-id="${h.id}" data-v="${d}"><b style="font-size:13px">${DOW[d]}</b></button>`).join('')}</div>`:''}`}</div>`).join('')}</div>
  <div class="sec"><h2>Corrigir registros anteriores</h2></div><div class="card"><div class="row" style="gap:8px"><input type="date" id="fixd" value="${D.add(D.today(),-1)}" max="${D.today()}"><button class="btn sm" data-a="fixGo">Abrir dia</button></div><small class="mut tiny">Abre o checklist daquele dia para marcar ou desmarcar.</small></div>`};
A.hOn=(ds,el)=>{S.habits.find(h=>h.id===ds.id).on=el.checked;U.keepScroll=true;save()};
A.hFreq=(ds,el)=>{const h=S.habits.find(h=>h.id===ds.id);h.freq=el.value;if(h.freq==='days'&&!h.days.length)h.days=[1,3,5];U.keepScroll=true;save()};
A.hDay=(ds)=>{const h=S.habits.find(h=>h.id===ds.id),d=+ds.v;h.days=h.days.includes(d)?h.days.filter(x=>x!==d):[...h.days,d];U.keepScroll=true;save()};
A.hMove=(ds)=>{const hs=S.habits.slice().sort((a,b)=>a.order-b.order),i=hs.findIndex(h=>h.id===ds.id),j=i+(+ds.v);if(j<0||j>=hs.length)return;const t=hs[i].order;hs[i].order=hs[j].order;hs[j].order=t;if(hs[i].order===hs[j].order)hs[i].order+=+ds.v*.5;U.keepScroll=true;save()};
A.fixGo=()=>{const d=val('fixd');if(!d)return;U.page=null;U.tab='hoje';U.date=d;render();window.scrollTo(0,0)};

/* ---------- CONFIGURAÇÕES ---------- */
SCREENS.config=()=>{const s=S.set;
  return backTop('Configurações')+`<div class="sec"><h2>Acesso</h2></div><div class="card"><label class="fld" style="margin-top:0"><span>Código atual</span><input id="c0" type="password" autocomplete="off"></label><label class="fld"><span>Novo código</span><input id="c1" type="password" autocomplete="off"></label><button class="btn sm" style="margin-top:10px" data-a="codeSave">Trocar código</button>
   <label class="fld"><span>Tentativas antes do bloqueio (1 min)</span><input inputmode="numeric" data-ch="setNum" data-k="maxTries" value="${s.maxTries}"></label>
   <button class="btn sm line" style="margin-top:12px" data-a="logout">Encerrar sessão</button>
   <p class="note demo">${demo('acesso local')} No artefato, o código é conferido neste aparelho. Na publicação, o servidor valida o código, limita tentativas e encerra sessões.</p></div>
  <div class="sec"><h2>Expediente</h2></div><div class="card"><div class="grid2"><label class="fld" style="margin-top:0"><span>Horas de trabalho/dia</span><input inputmode="decimal" data-ch="setNum" data-k="workH" value="${s.workH}"></label><label class="fld" style="margin-top:0"><span>Margem p/ imprevistos (%)</span><input inputmode="numeric" data-ch="setNum" data-k="margin" value="${s.margin}"></label></div><label class="fld"><span>Início do expediente</span><input type="time" data-ch="setStr" data-k="dayStart" value="${s.dayStart}"></label><small class="mut tiny">Capacidade útil: ${dur(usable())} por dia.</small></div>
  <div class="sec"><h2>Revisão semanal</h2></div><div class="card"><div class="grid2"><label class="fld" style="margin-top:0"><span>Dia</span><select data-ch="setNum" data-k="reviewDow">${[1,2,3,4,5,6,0].map(d=>`<option value="${d}" ${s.reviewDow===d?'selected':''}>${DOWL[d]}</option>`).join('')}</select></label><label class="fld" style="margin-top:0"><span>Horário</span><input type="time" data-ch="setStr" data-k="reviewTime" value="${s.reviewTime}"></label></div></div>
  <div class="card"><button class="li" data-a="go" data-v="ckedit"><span class="t"><b>Itens do checklist</b><small class="mut">Ordem, frequência e correções</small></span>${IC.r}</button><button class="li" data-a="go" data-v="notif"><span class="t"><b>Avisos</b><small class="mut">Quais, quando e com que antecedência</small></span>${IC.r}</button><button class="li" data-a="go" data-v="conexoes"><span class="t"><b>Conexões</b><small class="mut">Status de cada recurso</small></span>${IC.r}</button></div>
  <div class="sec"><h2>Modelos de IA por fluxo</h2></div><div class="card">${[['ideias','Ideias e rascunhos'],['relatos','Relatos e fechamento']].map(([k,l])=>`<label class="row" style="padding:6px 0"><span class="grow">${l}</span><select style="width:auto" data-ch="model" data-k="${k}">${['Claude','ChatGPT'].map(m=>`<option ${s.models[k]===m?'selected':''}>${m}</option>`).join('')}</select></label>`).join('')}<small class="mut tiny">Os dois usam o mesmo perfil editorial. Só os dados necessários são enviados, com aviso antes de enviar áudio ou relato pessoal.</small></div>
  <div class="sec"><h2>Frases do dia</h2></div><div class="card">${S.quotes.map(q=>`<div class="li"><span class="t"><b style="font-weight:400;${q.hidden?'color:var(--ink3)':''}">${esc(q.text)}</b><small class="mut">${esc(q.by)}</small></span><button class="ib" data-a="qfav" data-id="${q.id}" aria-label="Favoritar">${q.fav?'★':'☆'}</button><button class="ib" data-a="qTog" data-id="${q.id}" aria-label="Ocultar">${q.hidden?'○':'●'}</button></div>`).join('')}<input id="nqt" placeholder="Nova frase" style="margin-top:8px"><div class="row" style="gap:8px;margin-top:8px"><input id="nqb" placeholder="Referência / autor"><button class="btn sm" data-a="qAdd">Adicionar</button></div><label class="row" style="margin-top:12px"><input type="checkbox" data-ch="qShow" ${s.quoteHidden?'':'checked'}><span>Mostrar frase em Hoje</span></label></div>
  <div class="sec"><h2>Dados</h2></div><div class="card"><p style="margin:0" class="tiny">${persistLine()}.</p><div class="row wrap" style="gap:8px;margin-top:10px"><button class="btn sm sec2" data-a="export">Copiar backup</button><button class="btn sm sec2" data-a="importOpen">Importar backup</button><button class="btn sm line" data-a="reset">Restaurar dados de exemplo</button></div><div id="rsc"></div></div>`};
A.setNum=(ds,el)=>{S.set[ds.k]=num(el.value);U.keepScroll=true;save()};
A.setStr=(ds,el)=>{S.set[ds.k]=el.value;U.keepScroll=true;save()};
A.model=(ds,el)=>{S.set.models[ds.k]=el.value;save({quiet:true});toast('Modelo definido para o fluxo')};
A.codeSave=()=>{if(norm(val('c0'))!==norm(S.set.code)){toast('Código atual incorreto');return}const n=val('c1');if(n.length<4){toast('Use pelo menos 4 caracteres');return}S.set.code=n;save({quiet:true});toast('Código trocado');render()};
A.logout=()=>{AUTH.ok=false;ls(AKEY,'');U.page=null;U.tab='hoje';render()};
A.qTog=(ds)=>{const q=S.quotes.find(x=>x.id===ds.id);q.hidden=!q.hidden;U.keepScroll=true;save()};
A.qAdd=()=>{const t=val('nqt');if(!t)return;S.quotes.push({id:uid(),text:t,by:val('nqb')||'Minha referência',fav:false,hidden:false});U.keepScroll=true;save()};
A.qShow=(ds,el)=>{S.set.quoteHidden=!el.checked;save({quiet:true})};
A.export=async()=>{const j=JSON.stringify(S);try{await navigator.clipboard.writeText(j);toast('Backup copiado. Cole no outro aparelho em Importar backup.')}catch(e){$('#rsc').innerHTML=`<p class="tiny mut" style="margin-top:10px">Copie todo o texto abaixo (toque, Selecionar tudo, Copiar):</p><textarea readonly style="min-height:120px;font-size:12px">${esc(j)}</textarea>`;const t=$('#rsc textarea');t.focus();t.select()}};
A.importOpen=()=>{$('#rsc').innerHTML=`<p class="tiny mut" style="margin-top:10px">Cole aqui o backup copiado do MMV no Claude. Ele substitui os dados deste aparelho.</p><textarea id="impj" style="min-height:120px;font-size:12px" placeholder="Cole o backup aqui"></textarea><button class="btn sm pes" style="margin-top:8px" data-a="importDo">Importar</button>`};
A.importDo=()=>{let d;try{d=JSON.parse(val('impj'))}catch(e){toast('Esse texto não é um backup válido');return}if(!d||!d.v||!d.tasks||!d.fin){toast('Esse texto não é um backup do MMV');return}const code=S.set.code;S=d;delete S.fresh;runMigrations();S.set.code=S.set.code||code;save({quiet:true});U.page=null;U.tab='hoje';U.date=null;render();toast('Backup importado ✓')};
A.reset=()=>{$('#rsc').innerHTML=`<div class="warn" style="margin-top:10px">Isso apaga seus registros e volta aos dados de exemplo.<div class="row" style="gap:8px;margin-top:8px"><button class="btn sm" style="background:var(--red)" data-a="resetOk">Apagar e restaurar</button><button class="btn sm sec2" data-a="go" data-v="config">Cancelar</button></div></div>`};
A.resetOk=()=>{const code=S.set.code;S=seed();S.set.code=code;save({quiet:true});U.page=null;U.tab='hoje';U.date=null;render();toast('Dados de exemplo restaurados')};

/* ---------- CONEXÕES ---------- */
SCREENS.conexoes=()=>{const row=(n,st,txt)=>`<div class="li"><span class="t"><b>${n}</b><small class="mut">${txt}</small></span><span class="pill ${st==='ok'?'ok':st==='demo'?'demo':''}">${st==='ok'?'funciona':st==='demo'?'demonstração':'após publicar'}</span></div>`;
  return backTop('Conexões')+`<div class="card">
  ${row('Checklist, agenda, finanças, desejos, leitura, treinos',`ok`,'Tudo interativo neste artefato.')}
  ${row('Salvar neste aparelho','ok',STORE_OK?'Seus registros ficam salvos ao reabrir neste navegador.':'Este navegador bloqueou o armazenamento local.')}
  ${row('Banco na sua conta Claude',CLOUD.state==='sincronizado'?'ok':'demo','Estado: '+CLOUD.state+'. Quando ativo, guarda uma cópia privada (só você vê) e sincroniza entre aparelhos.')}
  ${row('Ditado por voz',MIC.d?'ok':'demo',MIC.d?'Disponível neste navegador.':'No iPhone, use o microfone do teclado; o áudio de demonstração testa o fluxo.')}
  ${row('Acesso por código','demo','Conferido localmente. Validação no servidor, limite de tentativas e sessões na publicação.')}
  ${row('Transcrição de áudio enviado','pub','Pelo modelo escolhido, com aviso antes do envio.')}
  ${row('Claude e ChatGPT (ideias e relatos)','pub','Rascunhos e organização hoje são locais. Captura pelas duas interfaces chega ao mesmo banco quando houver integração compatível.')}
  ${row('Google Agenda','pub','Consultar disponibilidade, criar e remarcar blocos aprovados, sem duplicar.')}
  ${row('Google Drive e Docs','pub','Buscar e vincular arquivos. Hoje: colar URLs.')}
  ${row('Sistemas financeiros','pub','Receber os gastos gravados no banco do MMV, com estado de sincronização e reenvio sem duplicar.')}
  ${row('Notificações no iPhone (PWA + Web Push)','pub','Ícone na tela de início, HTTPS, manifesto, service worker e envio agendado pelo servidor.')}
  </div><p class="note">Na versão publicada, as credenciais ficam no servidor, nunca no aparelho.</p>`};

/* ---------- LOGIN ---------- */
const AUTH={ok:false};
function renderLogin(){
  $('#tabs').hidden=true;$('#mini').hidden=true;
  let lk={};try{lk=JSON.parse(ls('mmv.lock')||'{}')||{}}catch(e){}
  const wait=lk.until&&lk.until>Date.now()?Math.ceil((lk.until-Date.now())/1000):0;
  $('#app').innerHTML=`<form class="login" id="lf"><div class="mk">MMV<span>.</span></div><p class="mut" style="margin:6px 0 28px">Minha Melhor Versão</p>
  <label class="fld"><span>Código de acesso</span><input id="code" type="password" autocomplete="current-password" autocapitalize="none" autocorrect="off" spellcheck="false" placeholder="Seu código" ${wait?'disabled':''}></label>
  <button class="btn full dune" style="margin-top:14px;min-height:54px;font-size:16px" type="submit" ${wait?'disabled':''}>Entrar</button>
  <p class="tiny" id="lmsg" style="min-height:20px;color:var(--red);margin-top:10px">${wait?`Muitas tentativas. Tente de novo em ${wait} s.`:lk.fails?`Código incorreto. ${Math.max(0,S.set.maxTries-lk.fails)} tentativa(s) restante(s).`:''}</p>
  ${window.claude?'<p class="tiny mut3" style="margin-top:28px">Demonstração: o código é <b>Didis</b>. Sem cadastro, e-mail ou senha de conta.</p>':''}</form>`;
  $('#lf').onsubmit=e=>{e.preventDefault();
    const c=val('code');let l={};try{l=JSON.parse(ls('mmv.lock')||'{}')||{}}catch(x){}
    if(norm(c)===norm(S.set.code)){AUTH.ok=true;ls(AKEY,'1');ls('mmv.lock','{}');U.tab='hoje';U.page=null;render();window.scrollTo(0,0);return}
    l.fails=(l.fails||0)+1;if(l.fails>=S.set.maxTries){l.until=Date.now()+60000;l.fails=0}ls('mmv.lock',JSON.stringify(l));renderLogin();
    if(l.until)setTimeout(renderLogin,61000)};
  if(!wait)setTimeout(()=>{const e=$('#code');if(e)e.focus()},50);
}
