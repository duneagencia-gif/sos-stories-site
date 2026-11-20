'use strict';
/* navegação */
A.tab=(ds)=>{U.page=null;U.tab=ds.v;if(ds.v==='hoje'&&U.tab==='hoje'){}render();window.scrollTo(0,0)};
A.go=(ds)=>{U.prev=U.page||U.tab;U.page=ds.v;render();window.scrollTo(0,0)};
A.back=()=>{const p=U.page;U.page=['ckedit','notif','conexoes'].includes(p)&&U.prev&&U.prev!==p&&SCREENS[U.prev]&&U.prev!=='hoje'&&U.prev!=='agenda'&&U.prev!=='fin'?U.prev:null;if(!U.page)U.tab=['hoje','agenda','fin'].includes(U.prev)?U.prev:'mais';U.prev=null;render();window.scrollTo(0,0)};
A.sheet=(ds)=>openSheet(ds.v,{id:ds.id,date:ds.d||U.date||D.today(),d:ds.d,k:ds.k});
A.goSheet=(ds)=>{closeSheet();U.page=ds.v;render()};
A.setU=(ds)=>{U[ds.k]=ds.v;U.keepScroll=true;render()};
A.closeSheet=()=>closeSheet();
A.undo=()=>{const f=U.undo;U.undo=null;$('#toast').classList.remove('on');if(f)f()};

/* eventos delegados */
document.addEventListener('click',e=>{
  const ban=e.target.closest('#ban');if(ban){let o=[];try{o=JSON.parse(ban.dataset.open||'[]')}catch(x){}openTarget(o);return}
  if(e.target.id==='scrim'){closeSheet();return}
  const el=e.target.closest('[data-a]');if(!el)return;
  const f=A[el.dataset.a];if(!f)return;
  if(el.tagName==='BUTTON')e.preventDefault();
  try{f(el.dataset,el,e)}catch(err){console.error(err);toast('Algo deu errado: '+err.message)}
});
document.addEventListener('change',e=>{const el=e.target.closest('[data-ch]');if(!el)return;const f=A[el.dataset.ch];if(f)try{f(el.dataset,el)}catch(err){console.error(err)}});
document.addEventListener('input',e=>{const el=e.target.closest('[data-in]');if(!el)return;const f=A[el.dataset.in];if(f)f(el)});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&SH)closeSheet()});

/* teclado do iPhone: mantém Salvar/Concluir visíveis */
function vv(){const v=window.visualViewport;if(!v)return;const kb=Math.max(0,window.innerHeight-v.height-v.offsetTop);document.documentElement.style.setProperty('--kb',kb+'px');document.documentElement.style.setProperty('--vvh',v.height+'px');document.body.classList.toggle('kb',kb>80)}
if(window.visualViewport){visualViewport.addEventListener('resize',vv);visualViewport.addEventListener('scroll',vv)}
document.addEventListener('focusin',e=>{if(e.target.matches('input,textarea,select')&&e.target.closest('.sh-b'))setTimeout(()=>e.target.scrollIntoView({block:'center',behavior:'smooth'}),320)});

function afterRender(){
  if(U.tab==='hoje'&&!U.page&&!SH&&typeof missingGoals==='function'&&missingGoals().length&&S.promptSeen!==D.today()){S.promptSeen=D.today();save({quiet:true});setTimeout(()=>{if(!SH&&AUTH.ok)openSheet('goalPost')},700)}
  if(U.pop){const el=document.querySelector(`.ci[data-k="${CSS.escape(U.pop)}"]`);if(el)el.classList.add('pop');U.pop=null}
  const t=$('#trk');if(t)t.addEventListener('touchstart',()=>{carTick=1},{passive:true});
}

/* relógio: cronômetro, leitor, carrossel, virada do dia */
let lastDay=null;
setInterval(()=>{if(!AUTH.ok||!S)return;trainTick();readerTick();carouselStep();const d=D.today();if(lastDay&&d!==lastDay&&!SH){if(!U.date||U.date===lastDay)U.date=null;render()}lastDay=d},1000);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'&&RD.on)readerFlush(true)});

/* início */
loadState();
AUTH.ok=ls(AKEY)==='1';
if(S.fresh){notifDiff();S.nlog=[]}
render();
cloudInit();
initDictation();
assetsInit();
