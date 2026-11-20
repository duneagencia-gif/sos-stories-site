'use strict';
/* Dados fictícios e editáveis. As datas acompanham o dia em que o app é aberto pela primeira vez. */
function seed(){
  const T=D.today(),W=D.weekStart(T),M=D.add(W,7),P=D.add(W,-7);
  const t=o=>Object.assign({id:uid(),area:'dune',date:T,dur:30,done:false,reschedules:0,history:[],kind:'tarefa',prio:false,time:'',link:'',client:'',project:'',deps:[],fixed:false,created:T},o);
  const pastRec=t({title:'Gravar Reels de portfólio · DUNE',kind:'gravação',date:D.add(W,1),dur:60,reschedules:2,history:[{from:D.add(P,2),to:D.add(P,4),at:D.add(P,2)},{from:D.add(P,4),to:D.add(W,1),at:D.add(P,4)}],done:true,doneAt:D.add(W,1)});
  const pastRec2=t({title:'Gravar TikTok · rotina da semana',area:'df',kind:'gravação',date:D.add(W,3),dur:30,reschedules:1,history:[{from:D.add(W,1),to:D.add(W,3),at:D.add(W,1)}]});
  const tasks=[
    t({title:'Finalizar artes · Ana Beatriz',client:'Ana Beatriz',project:'Identidade Ana Beatriz',kind:'entrega',dur:120,prio:true,link:'https://drive.google.com/drive/folders/exemplo-ana-beatriz'}),
    t({title:'Gravar bastidores · DUNE',kind:'gravação',dur:45,time:'15:00',prio:true}),
    t({title:'Gravar TikTok pessoal',area:'df',kind:'gravação',dur:30}),
    t({title:'Roteiro da aula 3 · SOS Stories',area:'sos',dur:60,prio:true,project:'Curso SOS Stories'}),
    t({title:'Apresentação de marca · Café Aurora',client:'Café Aurora',project:'Rebranding Café Aurora',kind:'entrega',date:M,dur:120}),
    t({title:'Briefing · Studio Lume',client:'Studio Lume',project:'Site Studio Lume',date:D.add(M,1),dur:60,time:'10:00',fixed:true}),
    t({title:'Gravar aula 3 · SOS Stories',area:'sos',kind:'gravação',date:D.add(M,1),dur:90,project:'Curso SOS Stories'}),
    t({title:'Manual de marca · Ana Beatriz',client:'Ana Beatriz',project:'Identidade Ana Beatriz',kind:'entrega',date:D.add(M,2),dur:150}),
    t({title:'Mockups de embalagem · Café Aurora',client:'Café Aurora',project:'Rebranding Café Aurora',kind:'entrega',date:D.add(M,3),dur:120,due:D.add(M,7)}),
    t({title:'Call de aprovação · Studio Lume',client:'Studio Lume',project:'Site Studio Lume',date:D.add(M,3),dur:60,time:'14:00',fixed:true}),
    t({title:'Planejar posts de dezembro · DUNE',date:D.add(M,3),dur:86}),
    t({title:'Ajustes finais · Studio Lume',client:'Studio Lume',project:'Site Studio Lume',kind:'entrega',date:D.add(M,4),dur:90}),
    t({title:'Financeiro da semana',date:D.add(M,4),dur:60}),
    t({title:'Entrega identidade · Café Aurora',client:'Café Aurora',project:'Rebranding Café Aurora',kind:'entrega',date:D.add(P,2),dur:180,done:true,doneAt:D.add(P,2)}),
    t({title:'Reunião com gráfica · Café Aurora',client:'Café Aurora',date:D.add(P,4),dur:90,time:'14:00',done:true,doneAt:D.add(P,4)}),
    t({title:'Proposta · Studio Lume',client:'Studio Lume',kind:'entrega',date:D.add(W,1),dur:120,done:true,doneAt:D.add(W,1),prio:true}),
    t({title:'Post carrossel processo · DUNE',kind:'entrega',date:D.add(W,2),dur:60,done:true,doneAt:D.add(W,2),prio:true}),
    t({title:'Ajustes de logo · Ana Beatriz',client:'Ana Beatriz',kind:'entrega',date:D.add(W,1),dur:90,done:true,doneAt:D.add(W,1),unplanned:true}),
    pastRec,pastRec2
  ];
  const events=[{id:uid(),title:'Reunião · Café Aurora',date:T,time:'10:00',dur:60,area:'dune'}];
  const habits=[
    {id:'rezar',label:'Rezar',area:'fe',freq:'daily',days:[0,1,2,3,4,5,6],order:1,on:true,open:'rezar'},
    {id:'biblia',label:'Ler a Bíblia',area:'fe',freq:'days',days:[1,3,5],order:2,on:true,open:'biblia'},
    {id:'gratidao',label:'Três motivos de gratidão',area:'fe',freq:'daily',days:[0,1,2,3,4,5,6],order:3,on:true,open:'gratidao'},
    {id:'leitura',label:'Ler hoje',area:'pessoal',freq:'daily',days:[0,1,2,3,4,5,6],order:4,on:true,open:'leitura'},
    {id:'treino',label:'Treino',area:'pessoal',freq:'daily',days:[0,1,2,3,4,5,6],order:5,on:true,open:'treino'},
    {id:'revisao',label:'Revisão semanal · 30 min',area:'pessoal',freq:'days',days:[1],order:6,on:true,open:'revisao'},
    {id:'checkin',label:'Check-in pessoal',area:'pessoal',freq:'daily',days:[0,1,2,3,4,5,6],order:90,on:false,open:'checkin'},
    {id:'fechamento',label:'Fechamento do dia',area:'pessoal',freq:'daily',days:[0,1,2,3,4,5,6],order:99,on:true,open:'fechamento'}
  ];
  // histórico de exemplo (últimos 13 dias, sem hoje)
  const checks={},readS=[],trainS=[],closings=[],grat={},bible=[];
  const mood=['bem','cansada','animada','tranquila','ansiosa','bem','cansada'],en=[3,2,4,3,2,4,3];
  for(let i=13;i>=1;i--){
    const d=D.add(T,-i),k=i%7;
    if(i===9||i===4)continue; // dias sem registro (aparecem como lacuna)
    checks[d]={rezar:{at:0,via:'toque'}};
    if(k!==2){readS.push({date:d,min:8+((i*7)%17),pages:3+((i*5)%9),manual:i%4===0});checks[d].leitura={at:0,via:'leitor'}}
    const tr=S_trainSched()[D.dow(d)];
    if(tr&&i!==6){trainS.push({id:uid(),date:d,act:tr.act,min:tr.dur-(i%3)*5,manual:false});checks[d].treino={at:0,via:'cronômetro'}}
    if([1,3,5].includes(D.dow(d))&&i%3!==0){bible.push({date:d,book:['Salmos','Provérbios','João','Mateus'][i%4],chap:String(3+i),verse:'',refl:''});checks[d].biblia={at:0,via:'toque'}}
    if(i%2===1){grat[d]=['A conversa boa com a minha mãe','Um cliente que elogiou o processo','Ter terminado o dia com calma'];checks[d].gratidao={at:0,via:'formulário'}}
    closings.push({date:d,raw:'',done:[],pending:[],food:'',activity:'',mood:mood[k],energy:en[k],yield:i%3===0?'não rendeu':'rendeu',extra:[],source:'relato'});
    checks[d].fechamento={at:0,via:'relato'};
  }
  const bills=[
    {id:uid(),area:'dune',desc:'Internet da DUNE',value:129.9,due:T,status:'aberto',cat:'Fixas',rec:'mensal'},
    {id:uid(),area:'pessoal',desc:'Cartão de crédito pessoal',value:1240.5,due:D.add(T,7),status:'aberto',cat:'Cartão',rec:'mensal'},
    {id:uid(),area:'dune',desc:'Adobe Creative Cloud',value:224,due:D.add(T,3),status:'aberto',cat:'Ferramentas',rec:'mensal'},
    {id:uid(),area:'pessoal',desc:'Aluguel',value:1800,due:D.add(T,5),status:'aberto',cat:'Moradia',rec:'mensal'},
    {id:uid(),area:'dune',desc:'Parcela notebook (4/10)',value:389,due:D.add(T,12),status:'aberto',cat:'Parcelas',rec:'parcela'},
    {id:uid(),area:'pessoal',desc:'Plano de celular',value:69.9,due:D.add(T,-6),status:'pago',paidAt:D.add(T,-6),cat:'Fixas',rec:'mensal'},
    {id:uid(),area:'dune',desc:'Contador',value:450,due:D.add(T,-3),status:'pago',paidAt:D.add(T,-4),cat:'Serviços',rec:'mensal'}
  ];
  const inc=[
    {id:uid(),area:'dune',desc:'Ana Beatriz · identidade (50%)',value:1800,date:D.add(T,-8),status:'recebido'},
    {id:uid(),area:'dune',desc:'Café Aurora · parcela 2',value:2800,date:D.add(T,4),status:'previsto'},
    {id:uid(),area:'dune',desc:'Studio Lume · entrada',value:1500,date:D.add(T,9),status:'previsto'},
    {id:uid(),area:'pessoal',desc:'Pró-labore DUNE',value:3000,date:D.add(T,-15),status:'recebido'},
    {id:uid(),area:'pessoal',desc:'Pró-labore DUNE (2ª parte)',value:1500,date:D.add(T,8),status:'previsto'}
  ];
  const spend=[
    {id:uid(),area:'pessoal',desc:'Mercado',value:186.4,date:D.add(T,-2),cat:'Alimentação',pay:'Débito',sync:{mmv:'ok',claude:'demo',fin:'demo'}},
    {id:uid(),area:'dune',desc:'Banco de imagens',value:59,date:D.add(T,-4),cat:'Ferramentas',pay:'Cartão DUNE',sync:{mmv:'ok',claude:'demo',fin:'falhou'}},
    {id:uid(),area:'pessoal',desc:'Farmácia',value:42.8,date:D.add(T,-1),cat:'Saúde',pay:'Pix',sync:{mmv:'ok',claude:'demo',fin:'demo'}}
  ];
  const debts=[
    {id:uid(),area:'pessoal',name:'Empréstimo pessoal',balance:6400,monthly:450,pays:[{date:D.add(T,-20),value:450,kind:'parcela'}]},
    {id:uid(),area:'dune',name:'Parcelamento fornecedor',balance:2100,monthly:350,pays:[]}
  ];
  const wishes=[
    {id:uid(),name:'Meu carro',photos:['p_car'],term:'longo',prio:'alta',value:85000,target:'2028-06-30',why:'Liberdade para ir a clientes e visitar minha família sem depender de ninguém.',link:'',showToday:true,goal:{on:true,saved:3200,monthly:600,target:'2028-06-30',paused:false,contribs:[{date:D.add(T,-25),value:600}]}},
    {id:uid(),name:'Sítio com varanda',photos:['p_sitio'],term:'longo',prio:'média',value:0,target:'',why:'Um lugar com horta, silêncio e espaço para receber as pessoas que amo.',link:'',showToday:true,goal:{on:false,saved:0,monthly:0,target:'',paused:false,contribs:[]}},
    {id:uid(),name:'Cadeira ergonômica',photos:['p_cad'],term:'curto',prio:'alta',value:1290,target:D.add(T,60),why:'Trabalhar sem dor nas costas.',link:'',showToday:true,goal:{on:false,saved:0,monthly:0,target:'',paused:false,contribs:[]}}
  ];
  const books=[
    {id:'demo',title:'Pequeno manual do foco',author:'Texto de exemplo do MMV',pages:12,current:3,status:'atual',link:'',demo:true,notes:[{page:2,text:'Começar o dia pelo que importa, antes das mensagens.',hl:true}]},
    {id:uid(),title:'Essencialismo',author:'Greg McKeown',pages:272,current:0,status:'fila',link:'',notes:[]},
    {id:uid(),title:'Hábitos Atômicos',author:'James Clear',pages:320,current:0,status:'fila',link:'',notes:[]}
  ];
  readS.forEach(r=>r.book='demo');
  const goals=[
    {id:'g1',level:'tri',area:'dune',title:'Faturar R$ 45 mil no 1º trimestre de 2027',ind:'Faturamento recebido (R$)',target:45000,cur:0,due:'2027-03-31',next:'Fechar 2 propostas novas até 15/01',parent:''},
    {id:'g2',level:'mes',area:'dune',title:'Janeiro/2027: R$ 15 mil recebidos',ind:'Recebido no mês (R$)',target:15000,cur:0,due:'2027-01-31',next:'Enviar proposta de manutenção para Café Aurora',parent:'g1'},
    {id:'g3',level:'mes',area:'dune',title:'Dezembro/2026: R$ 12 mil recebidos',ind:'Recebido no mês (R$)',target:12000,cur:4300,due:'2026-12-31',next:'Cobrar a entrada do Studio Lume',parent:''},
    {id:'g4',level:'tri',area:'sos',title:'Lançar o SOS Stories em março de 2027',ind:'Aulas gravadas',target:8,cur:2,due:'2027-03-15',next:'Gravar a aula 3',parent:''},
    {id:'g5',level:'mes',area:'sos',title:'Janeiro/2027: 6 aulas gravadas',ind:'Aulas gravadas',target:6,cur:2,due:'2027-01-31',next:'Roteiro da aula 3',parent:'g4'},
    {id:'g6',level:'sem',area:'sos',title:'Esta semana: roteiro da aula 3',ind:'Roteiro pronto',target:1,cur:0,due:D.add(W,4),next:'Escrever os 3 tópicos principais',parent:'g5'},
    {id:'g7',level:'tri',area:'pessoal',title:'Ler 3 livros no 1º trimestre de 2027',ind:'Livros concluídos',target:3,cur:0,due:'2027-03-31',next:'Terminar o livro atual',parent:''}
  ];
  const projects=[
    {id:uid(),area:'dune',name:'Rebranding Café Aurora',client:'Café Aurora',status:'ativo',due:D.add(M,7),link:'https://drive.google.com/drive/folders/exemplo-cafe-aurora',dec:''},
    {id:uid(),area:'dune',name:'Identidade Ana Beatriz',client:'Ana Beatriz',status:'ativo',due:D.add(M,2),link:'',dec:''},
    {id:uid(),area:'dune',name:'Site Studio Lume',client:'Studio Lume',status:'ativo',due:'2027-01-20',link:'',dec:''},
    {id:uid(),area:'df',name:'Série “Reorganizando minha vida”',client:'',status:'ativo',due:'2027-02-28',link:'',dec:''},
    {id:uid(),area:'sos',name:'Curso SOS Stories',client:'',status:'ativo',due:'2027-03-15',link:'https://docs.google.com/document/d/exemplo-roteiro-curso',dec:''},
    {id:uid(),area:'sos',name:'Página de vendas SOS Stories',client:'',status:'pausado',due:'2027-02-15',link:'',dec:''},
    {id:uid(),area:'pessoal',name:'Organizar o escritório em casa',client:'',status:'ativo',due:'2026-12-20',link:'',dec:''}
  ];
  const clients=[{id:uid(),name:'Café Aurora',contact:'Marina',link:''},{id:uid(),name:'Ana Beatriz',contact:'Ana',link:''},{id:uid(),name:'Studio Lume',contact:'Rafael',link:''}];
  const contents=[
    {id:uid(),original:'Mostrar o antes e depois de uma identidade visual em 3 etapas',profile:'ig_dune',format:'video',stage:'captura',draft:null,post:'',plan:null,created:D.add(T,-3),ref:''},
    {id:uid(),original:'Meu domingo de planejamento: como organizo a semana da agência e da vida',profile:'tt_pes',format:'video',stage:'captura',draft:null,post:'',plan:null,created:D.add(T,-9),ref:''},
    {id:uid(),original:'3 erros de quem escolhe a paleta de cores da marca sozinho',profile:'ig_dune',format:'carrossel',stage:'publicado',draft:null,post:D.add(T,-5),plan:null,created:D.add(T,-14),ref:'',publishedAt:D.add(T,-5)}
  ];
  return {
    v:1,updated:0,fresh:true,
    set:{workH:6,margin:15,dayStart:'09:00',reviewDow:1,reviewTime:'09:00',readRule:{type:'pages',val:1},code:'Didis',maxTries:5,carousel:true,quoteHidden:false,models:{ideias:'Claude',relatos:'Claude'}},
    habits,checks,tasks,events,goals,projects,clients,contents,
    editorial:{
      ig_dune:{n:'Instagram DUNE',area:'dune',temas:'Portfólio de identidade visual, bastidores, conteúdo educativo, mais vídeos comigo aparecendo',tom:'Próximo, didático, confiante',ex:'“Essa marca nasceu de uma conversa de 40 minutos. Vem ver como.”'},
      tt_dune:{n:'TikTok DUNE',area:'dune',temas:'Bastidores da agência, processos de criação, aprendizados práticos',tom:'Leve, rápido, sincero',ex:'“Um dia de designer numa agência pequena, sem filtro.”'},
      tt_pes:{n:'TikTok pessoal',area:'df',temas:'Diário espontâneo: reorganizar minha vida, rotina, finanças e negócio',tom:'Espontâneo, honesto, acolhedor',ex:'“Dia 12 reorganizando minha vida: hoje foi difícil, mas rendeu.”'}
    },
    fin:{inc,spend,reserveDebt:500},bills,debts,wishes,books,readS,
    train:{schedule:S_trainSched(),override:{},sessions:trainS,active:null},
    faith:{bible,grat},closings,checkins:{},captures:[],
    quotes:[
      {id:uid(),text:'Feito com calma também é feito.',by:'Coleção MMV',fav:false,hidden:false},
      {id:uid(),text:'Um passo pequeno, todo dia, constrói o que você pediu em oração.',by:'Coleção MMV',fav:true,hidden:false},
      {id:uid(),text:'Organizar a vida é escolher, com carinho, o que fica para amanhã.',by:'Coleção MMV',fav:false,hidden:false}
    ],
    notif:{bills:true,billDay:true,bill7:true,billTime:'09:00',rec:true,recLead:60,del:true,tasks:false,taskTime:'08:30',summary:true,sumTime:'20:00',hideVal:false},
    nsnap:{},nlog:[],
    review:{adj:{}},
    conn:{gcal:'desconectado',gdrive:'desconectado',openai:'desconectado',fin:'desconectado'}
  };
}
function S_trainSched(){return {1:{act:'Cardio em casa',dur:30},3:{act:'Yoga',dur:40},5:{act:'Bike em casa',dur:30}}}
const DEMO_BOOK=[
  'Abertura. Este é um texto curto escrito para testar o Caderno de Leitura do MMV. Avance as páginas, pause, volte depois: o app guarda onde você parou e quanto tempo leu de verdade.',
  'Comece pelo que importa. Antes de abrir as mensagens, escolha uma única coisa que faria o dia valer a pena. Escreva em uma linha. Ela vira a primeira prioridade.',
  'O tamanho certo da tarefa. Uma tarefa boa cabe numa frase com verbo: "gravar o vídeo de bastidores", não "conteúdo". Quando a tarefa é vaga, a cabeça adia.',
  'Blocos e respiros. Agenda cheia não é agenda boa. Deixe uma margem para o imprevisto, porque ele sempre aparece, e quase sempre na quinta-feira.',
  'Energia não é tempo. Uma hora cansada rende menos que vinte minutos inteiros. Coloque o trabalho criativo onde a sua energia costuma estar mais alta.',
  'Registrar sem julgar. O fechamento do dia não é prova. É um mapa: o que foi feito, o que ficou, como você estava. Com o mapa, a próxima semana fica mais honesta.',
  'Adiar com intenção. Remarcar não é falhar. O problema é remarcar sem olhar o motivo. Se uma gravação muda de data três vezes, alguma coisa está ocupando o lugar dela.',
  'Dinheiro com nome. Cada real que entra pode ter uma função antes de chegar: conta, dívida, reserva, desejo. Nomear o dinheiro tira o peso da surpresa.',
  'Desejos à vista. Ver todos os dias a imagem do que você quer construir ajuda a escolher o que fazer com o tempo e com o dinheiro de hoje.',
  'Descanso faz parte. Um dia sem nada riscado também pode ter sido um dia bom. O descanso protege a constância.',
  'Revisar é cuidar. Trinta minutos na segunda-feira para olhar a semana que passou valem mais do que três horas tentando apagar incêndios.',
  'Fim. Você chegou à última página do texto de exemplo. Agora vincule um PDF ou arquivo do Drive de um livro seu e continue por lá.'
];
