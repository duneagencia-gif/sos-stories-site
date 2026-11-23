'use strict';
/* ---------- LEITOR DE PDF DENTRO DO MMV ----------
   O PDF fica no armazenamento do artefato (sua conta Claude), ou só neste aparelho se ele não estiver disponível.
   Ao terminar o livro, você escolhe o que vai para o bloco de notas e o arquivo é apagado. */
const PDFV='3.11.174',CDN=`https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFV}/`;
const PDFC={id:null,doc:null,loading:null};
let ASSETS=null;
function assetsInit(){if(window.claude&&claude.use)claude.use('assets').then(a=>{ASSETS=a}).catch(()=>{})}
function loadScript(src){return new Promise((res,rej)=>{if(document.querySelector(`script[src="${src}"]`))return res();const s=document.createElement('script');s.src=src;s.onload=res;s.onerror=()=>rej(new Error('não consegui carregar o leitor de PDF'));document.head.appendChild(s)})}
async function pdfLib(){if(window.pdfjsLib&&window.pdfjsWorker)return window.pdfjsLib;await loadScript(CDN+'pdf.worker.min.js');await loadScript(CDN+'pdf.min.js');window.pdfjsLib.GlobalWorkerOptions.workerSrc=CDN+'pdf.worker.min.js';return window.pdfjsLib}
/* armazenamento local (reserva) */
function idb(){return new Promise((res,rej)=>{const r=indexedDB.open('mmv-pdf',1);r.onupgradeneeded=()=>r.result.createObjectStore('f');r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
async function idbPut(k,v){const d=await idb();return new Promise((res,rej)=>{const t=d.transaction('f','readwrite');t.objectStore('f').put(v,k);t.oncomplete=res;t.onerror=()=>rej(t.error)})}
async function idbGet(k){const d=await idb();return new Promise((res,rej)=>{const t=d.transaction('f');const q=t.objectStore('f').get(k);q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error)})}
async function idbDel(k){const d=await idb();return new Promise(res=>{const t=d.transaction('f','readwrite');t.objectStore('f').delete(k);t.oncomplete=res;t.onerror=res})}

A.pdfPick=async(ds,el)=>{
  const f=el.files&&el.files[0];if(!f)return;const b=S.books.find(x=>x.id===ds.id);
  if(f.type&&f.type!=='application/pdf'){toast('Escolha um arquivo PDF');return}
  const mb=(f.size/1048576).toFixed(1);
  toast(`Guardando “${f.name}” (${mb} MB)…`);
  try{
    if(b.pdf)await pdfRemove(b,true);
    let pdf;
    if(ASSETS){if(f.size>20*1048576){toast(`O PDF tem ${mb} MB; o limite é 20 MB. Tente uma versão menor.`);return}
      const r=await ASSETS.upload(f,{type:'application/pdf'});pdf={store:'conta',id:r.id,name:f.name,size:f.size}}
    else{const k='pdf_'+uid();await idbPut(k,f);pdf={store:'aparelho',id:k,name:f.name,size:f.size}}
    b.pdf=pdf;b.demo=false;b.current=b.current||0;
    try{const doc=await pdfOpen(b);b.pages=doc.numPages}catch(e){}
    save({quiet:true});render();if(SH)renderSheet();toast(`PDF vinculado · ${b.pages} páginas`);
  }catch(e){toast(e&&e.code==='quota_or_state'?'O espaço de arquivos está cheio. Apague o PDF de um livro já lido.':e&&e.code==='too_large'?'O PDF passa de 20 MB.':'Não consegui guardar o PDF: '+(e.message||e.code||'erro'))}
};
async function pdfBytes(b){
  if(b.pdf.store==='conta'){const r=await fetch('/_blob/'+b.pdf.id);if(!r.ok)throw new Error('arquivo não encontrado');return new Uint8Array(await r.arrayBuffer())}
  const blob=await idbGet(b.pdf.id);if(!blob)throw new Error('o PDF está guardado em outro aparelho');return new Uint8Array(await blob.arrayBuffer());
}
async function pdfOpen(b){
  if(PDFC.id===b.pdf.id&&PDFC.doc)return PDFC.doc;
  if(PDFC.loading&&PDFC.loadingId===b.pdf.id)return PDFC.loading;
  PDFC.loadingId=b.pdf.id;
  PDFC.loading=(async()=>{const lib=await pdfLib();const data=await pdfBytes(b);const doc=await lib.getDocument({data,isEvalSupported:false}).promise;PDFC.id=b.pdf.id;PDFC.doc=doc;PDFC.loading=null;return doc})();
  try{return await PDFC.loading}catch(e){PDFC.loading=null;throw e}
}
let PDFRT=null;
async function pdfRender(p){
  const b=curBook(),box=$('#rdp');if(!box||!b||!b.pdf)return;
  try{
    const doc=await pdfOpen(b);if(b.pages!==doc.numPages){b.pages=doc.numPages;save({quiet:true})}
    const page=await doc.getPage(Math.min(p+1,doc.numPages));
    const w=box.clientWidth-4,vp0=page.getViewport({scale:1}),scale=w/vp0.width,dpr=Math.min(2,window.devicePixelRatio||1),vp=page.getViewport({scale:scale*dpr});
    const c=document.createElement('canvas');c.width=vp.width;c.height=vp.height;c.style.width='100%';c.style.display='block';
    if(PDFRT)try{PDFRT.cancel()}catch(e){}
    PDFRT=page.render({canvasContext:c.getContext('2d'),viewport:vp});await PDFRT.promise;PDFRT=null;
    if($('#rdp')===box){box.innerHTML='';box.appendChild(c)}
    const pg=$('#rdpg');if(pg)pg.textContent=`Página ${Math.min(p+1,doc.numPages)} de ${doc.numPages}`;
  }catch(e){if(e&&e.name==='RenderingCancelledException')return;box.innerHTML=`<p class="warn">Não consegui abrir o PDF: ${esc(e.message||'erro')}.</p>`}
}
async function pdfRemove(b,quiet){
  if(!b.pdf)return;
  try{if(b.pdf.store==='conta'&&ASSETS)await ASSETS.delete(b.pdf.id);else if(b.pdf.store==='aparelho')await idbDel(b.pdf.id)}catch(e){}
  if(PDFC.id===b.pdf.id){PDFC.id=null;PDFC.doc=null}
  b.pdf=null;if(!quiet){save({quiet:true});render()}
}
A.pdfDel=async(ds)=>{const b=S.books.find(x=>x.id===ds.id);await pdfRemove(b);toast('PDF apagado do MMV. Seu progresso e notas continuam.')};

/* terminar o livro: notas escolhidas vão para o bloco de notas e o PDF é apagado */
A.bookDone=(ds)=>openSheet('bookDone',{id:ds.id||curBook().id});
SHEETS.bookDone=({id})=>{const b=S.books.find(x=>x.id===id);
  return {title:'Livro concluído 🎉',body:`<div class="card"><b>${esc(b.title)}</b><br><small class="mut">${esc(b.author||'')} · ${b.pages} páginas · ${Math.round(S.readS.filter(r=>r.book===b.id).reduce((a,r)=>a+r.min,0))} min lidos</small></div>
  <div class="sec"><h3>O que vai para o bloco de notas</h3></div>
  ${b.notes.length?`<div class="card">${b.notes.map((n,i)=>`<label class="row" style="padding:8px 0;align-items:flex-start"><input type="checkbox" id="bn${i}" checked><span>“${esc(n.text)}” <small class="mut">pág. ${n.page}</small></span></label>`).join('')}</div>`:'<p class="empty">Você não destacou trechos neste livro.</p>'}
  <label class="fld"><span>O que mais gostei / o que levo deste livro</span><textarea id="bnx" placeholder="Escreva ou use o microfone do teclado"></textarea></label>
  ${b.pdf?`<p class="note">O PDF (${esc(b.pdf.name)}, ${(b.pdf.size/1048576).toFixed(1)} MB) será apagado do MMV para não pesar. A cópia baixada no seu celular continua.</p>`:''}`,
  foot:`<button class="btn dune" data-a="bookDoneSave" data-id="${id}">Salvar no bloco e concluir</button>`}};
A.bookDoneSave=async(ds)=>{const b=S.books.find(x=>x.id===ds.id),T=D.today();
  const picked=b.notes.filter((n,i)=>val('bn'+i)),extra=val('bnx');
  const lines=[`📖 ${b.title}${b.author?' — '+b.author:''}`,...picked.map(n=>`• “${n.text}” (pág. ${n.page})`)];if(extra)lines.push('','O que levo: '+extra);
  if(picked.length||extra)S.captures.push({id:uid(),type:'nota',text:lines.join('\n'),raw:lines.join('\n'),at:T,ts:Date.now(),book:b.id});
  b.status='lido';b.finishedAt=T;b.current=b.pages;
  await pdfRemove(b,true);
  const g=S.goals.find(x=>/livro/i.test(x.ind||'')&&!x.auto&&T>=PER.start(x.level,x.period)&&T<=PER.end(x.level,x.period));if(g)g.cur=(+g.cur||0)+1;
  save({quiet:true});closeSheet();toast('Livro concluído · notas no bloco · PDF apagado');
};
