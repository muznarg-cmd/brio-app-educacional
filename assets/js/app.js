
'use strict';
// ─────────────────────────────────────────────────────────
// FIREBASE · BRIO ONLINE
// ─────────────────────────────────────────────────────────
const BRIO_FIREBASE_CONFIG = {
  apiKey: "AIzaSyB3bFb9EkPAxaca52SHm-ZkWM3IDoKNPJg",
  authDomain: "brio-e1544.firebaseapp.com",
  databaseURL: "https://brio-e1544-default-rtdb.firebaseio.com",
  projectId: "brio-e1544",
  storageBucket: "brio-e1544.firebasestorage.app",
  messagingSenderId: "143551031555",
  appId: "1:143551031555:web:7f160fd48caa3af30ae136"
};
let BRIO_DB = null;
let BRIO_AUTH = null;
let BRIO_ONLINE = false;
let BRIO_UID = null;
let BRIO_EMULATORS_CONFIGURED=false;
let BRIO_FEED_NOTICE='Feed compartilhado desconectado. Seus registros continuam locais.';
let BRIO_FEED_INFO=null,BRIO_FEED_INFO_CALLBACK=null;
let BRIO_FEED_CONNECTING=false;
function BRIO_setFeedNotice(message){BRIO_FEED_NOTICE=message;for(const id of ['brio-feed-connection','brio-feed-profile-connection']){const el=document.getElementById(id);if(el)el.textContent=message;}}
function BRIO_watchFeedConnection(){
  if(BRIO_FEED_INFO&&BRIO_FEED_INFO_CALLBACK)BRIO_FEED_INFO.off('value',BRIO_FEED_INFO_CALLBACK);
  BRIO_FEED_INFO=BRIO_DB.ref('.info/connected');BRIO_FEED_INFO_CALLBACK=snap=>{if(BRIO_ONLINE)BRIO_setFeedNotice(snap.val()?'Conexão com o servidor ativa.':'Sem conexão com o servidor. O feed pode estar desatualizado; rascunhos são mantidos. Envios sem confirmação podem concluir quando a conexão voltar.');};BRIO_FEED_INFO.on('value',BRIO_FEED_INFO_CALLBACK);
}

// ─────────────────────────────────────────────────────────
// 0. ESTADO GLOBAL + PERSISTÊNCIA
// ─────────────────────────────────────────────────────────
const STORAGE_KEY = 'brio_app_v5_googie23_preview';

const DEFAULT_STATE = {
  onboarded: false,
  nome: '',
  nick: '',
  onlineFeed: false,
  xp: 0,
  streakDias: [false,false,false,false,false,false,false],
  ultimoAcesso: '',
  pkm: {
    projetos: [
      {id:1, titulo:'Congresso SESI-SP IV', desc:'Resumo aprovado → preparar slides e fala de 10min'},
      {id:2, titulo:'Artigo OCMT completo', desc:'Após aprovação: escrever 8-12 páginas'}
    ],
    areas: [
      {id:3, titulo:'Produção Acadêmica', desc:'IC, artigos, comunicações'},
      {id:4, titulo:'Planejamento de Aulas', desc:'Português 8º ano — argumentação'}
    ],
    recursos: [
      {id:5, titulo:'Clark & Chalmers (1998)', desc:'The Extended Mind — mente estendida'},
      {id:6, titulo:'Hutchins (1995)', desc:'Cognition in the Wild — cognição distribuída'},
      {id:7, titulo:'Tiago Forte — PARA', desc:'Building a Second Brain — método PKM'}
    ],
    arquivo: [
      {id:8, titulo:'Rascunhos iniciais OCMT', desc:'Ideias do primeiro semestre — concluído'}
    ]
  },
  notas: [],
  flashcards: [
    {id:'fc1', pergunta:'O que é cognição distribuída?', resposta:'O pensamento ocorre em rede entre sujeito, artefatos e ambiente — não apenas dentro da cabeça. (Hutchins, 1995)', cat:'ocmt', facilidade:0, proximaRevisao:0, revisoes:0},
    {id:'fc2', pergunta:'Qual a diferença entre PKM e simples organização digital?', resposta:'PKM é infraestrutura de externalização semântica: organiza para AGIR, não apenas acumular. Reduz custo epistêmico e amplia autonomia.', cat:'pkm', facilidade:0, proximaRevisao:0, revisoes:0},
    {id:'fc3', pergunta:'O que é inibição saudável na OCMT?', resposta:'Ignorância deliberada: a prática de filtrar conscientemente o que não consumir, protegendo atenção e autonomia cognitiva.', cat:'ocmt', facilidade:0, proximaRevisao:0, revisoes:0},
    {id:'fc4', pergunta:'Quais são três práticas de OCMT exploradas neste aplicativo?', resposta:'1) PKM estruturado (memória estendida)\n2) Verificação procedimental (EPVT)\n3) Inibição saudável (ignorância deliberada)', cat:'ocmt', facilidade:0, proximaRevisao:0, revisoes:0}
  ],
  feed: [
    {id:'p1', autor:'Beatriz C.', av:'📖', tipo:'reflexao', corpo:'A metacognição não é um talento — é uma prática. Todo dia você pode aprender a pensar melhor sobre como você pensa.', pergunta:'Você já parou para observar como você aprende?', reacoes:{entendi:14,duvida:3,exemplo:7}, minhaReacao:null, tempo:'2h'},
    {id:'p2', autor:'Lucas F.', av:'🧩', tipo:'insight', corpo:'Tente explicar o que aprendeu sem consultar. Depois compare sua explicação com a fonte e identifique o que precisa revisar.', pergunta:'Quando foi a última vez que escreveu sobre algo que aprendeu?', reacoes:{entendi:31,duvida:5,exemplo:12}, minhaReacao:null, tempo:'5h'}
  ],
  grafo: {
    nos: [
      {id:'g1', label:'OCMT', x:50, y:35},
      {id:'g2', label:'PKM', x:78, y:22},
      {id:'g3', label:'Cognição Distribuída', x:20, y:58},
      {id:'g4', label:'Metacognição', x:74, y:65}
    ],
    arestas: [['g1','g2'],['g1','g3'],['g1','g4'],['g2','g4']]
  },
  pomo: {rodando:false, fase:'foco', restante:25*60, sessoes:0},
  ignorancias: [],
  config: {limiteFeed:true, lembretes:true, darkMode:false, fontSize:'normal', onlineFeed:false, soundFx:true, sfxVolume:.55},
  postHoje: 0,
  dataPost: '',
  nextId: 200
};

let S = JSON.parse(JSON.stringify(DEFAULT_STATE));

// BRIO 2.0 — etapa crítica. Mantém as chaves legadas; nenhuma cópia é apagada.
const BRIO_SCHEMA_VERSION = 8;
const BRIO_IDB_NAME = 'brio_persistencia_googie23_preview';
const BRIO_IDB_STORE = 'estado';
const BRIO_IDB_KEY = STORAGE_KEY;
const BRIO_MAX_IMPORT = 64 * 1024 * 1024;
let BRIO_PERSIST_RESTORE_DONE = false;
let BRIO_READ_ONLY = false;
let BRIO_LAST_SAVED_PAYLOAD = '';
let BRIO_LAST_CONTENT = '';
let BRIO_SAVE_QUEUE = Promise.resolve();
let BRIO_AUTOSAVE_TIMER = null;
let BRIO_RECOVERY = [];
let BRIO_PENDING_IMPORT = null;
let BRIO_BOOT_PROMISE = null;
let BRIO_ACTIVE_PAYLOAD = null;
let BRIO_IDB_PROMISE = null;
let BRIO_CLOCK_TIMER = null;

const BRIO_clone = value => JSON.parse(JSON.stringify(value));
const BRIO_object = value => !!value && typeof value === 'object' && !Array.isArray(value);
function BRIO_assert(ok, message) { if (!ok) throw new Error(message); }
function BRIO_checkTree(value, depth=0) {
  BRIO_assert(depth < 60, 'Estrutura profunda demais.');
  if (typeof value === 'number') BRIO_assert(Number.isFinite(value), 'Número inválido.');
  if (value && typeof value === 'object') {
    BRIO_assert(Object.keys(value).length <= 100000, 'Estrutura grande demais.');
    for (const key of Object.keys(value)) {
      BRIO_assert(!['__proto__','prototype','constructor'].includes(key), 'Chave de objeto não permitida.');
      BRIO_checkTree(value[key], depth+1);
    }
  }
}
function BRIO_validateState(value, requireComplete=false) {
  BRIO_assert(BRIO_object(value), 'O estado deve ser um objeto.');
  BRIO_checkTree(value);
  if(value.brioSafety!==undefined)BRIO_DATA.validateSafety(value.brioSafety);
  if(value.brioLearning!==undefined)BRIO_DATA.validateLearning(value.brioLearning);
  if(value.__brioImportConflicts!==undefined)BRIO_assert(Array.isArray(value.__brioImportConflicts)&&value.__brioImportConflicts.every(c=>BRIO_object(c)&&typeof c.path==='string'&&Object.hasOwn(c,'current')&&Object.hasOwn(c,'incoming')),'Registro de conflitos inválido.');
  const version = value.__brioSchema || 5;
  BRIO_assert(Number.isInteger(version) && version >= 1 && version <= BRIO_SCHEMA_VERSION, 'Versão de dados não suportada; mantenha a cópia original.');
  if (requireComplete) for (const k of ['pkm','notas','flashcards','feed','grafo','pomo','config']) BRIO_assert(Object.hasOwn(value,k), 'Backup incompleto: '+k);
  const st = Object.assign(BRIO_clone(DEFAULT_STATE), BRIO_clone(value));
  for (const k of ['pkm','grafo','pomo','config']) {
    BRIO_assert(BRIO_object(st[k]), 'Objeto inválido: '+k);
    st[k] = Object.assign(BRIO_clone(DEFAULT_STATE[k]), st[k]);
  }
  const text = (v, name, optional=true) => { if (v === undefined && optional) return; BRIO_assert(typeof v === 'string', 'Texto inválido: '+name); };
  const num = (v, name, optional=true) => { if (v === undefined && optional) return; BRIO_assert(typeof v === 'number' && Number.isFinite(v) && v >= 0, 'Número inválido: '+name); };
  const id = v => BRIO_assert((typeof v === 'string' && /^[A-Za-z0-9_-]{1,160}$/.test(v)) || (typeof v === 'number' && Number.isSafeInteger(v) && v >= 0), 'Identificador inválido.');
  const list = (a, name, validate) => {
    BRIO_assert(Array.isArray(a) && a.length <= 100000, 'Lista inválida: '+name);
    const seen = new Set();
    for (const entry of a) {
      BRIO_assert(BRIO_object(entry), 'Registro inválido: '+name); id(entry.id);
      BRIO_assert(!seen.has(String(entry.id)), 'ID duplicado: '+name); seen.add(String(entry.id)); validate(entry);
    }
  };
  for (const k of ['nome','nick','ultimoAcesso','dataPost','avatarUrl']) text(st[k],k);
  for (const k of ['onboarded','onlineFeed']) if(st[k]!==undefined) BRIO_assert(typeof st[k]==='boolean','Opção inválida: '+k);
  for (const k of ['xp','nextId','postHoje','__brioSavedAt','__brioRevision']) num(st[k],k);
  BRIO_assert(Number.isSafeInteger(st.nextId), 'Contador de IDs inválido.');
  if(st.__brioSavedAt) BRIO_assert(st.__brioSavedAt<=Date.now()+86400000, 'Data de gravação incompatível.');
  BRIO_assert(Array.isArray(st.streakDias) && st.streakDias.every(x=>typeof x==='boolean'),'Sequência inválida.');
  for (const pasta of ['projetos','areas','recursos','arquivo']) list(st.pkm[pasta], 'PARA/'+pasta, x=>{text(x.titulo,'título',false);text(x.desc,'descrição');});
  list(st.notas,'notas', n=>{
    text(n.titulo,'título',false);
    for(const k of ['conteudo','interp','contexto','limite','contra','emocao','data','pasta'])text(n[k],k);
    if(n.conexoes!==undefined)BRIO_assert(Array.isArray(n.conexoes)&&n.conexoes.every(x=>typeof x==='string'),'Conexões inválidas.');
  });
  list(st.flashcards,'cards',c=>{
    text(c.pergunta,'pergunta',false);text(c.resposta,'resposta',false);text(c.cat,'categoria');
    for(const k of ['facilidade','proximaRevisao','revisoes'])num(c[k],k);
  });
  list(st.feed,'feed',p=>{
    for(const k of ['autor','av','tipo','corpo','pergunta','tempo'])text(p[k],k);
    if(p.links!==undefined)BRIO_assert(Array.isArray(p.links)&&p.links.every(x=>typeof x==='string'),'Links inválidos.');
    if(p.comentarios!==undefined)BRIO_assert(Array.isArray(p.comentarios)&&p.comentarios.every(c=>BRIO_object(c)&&typeof c.texto==='string'&&(c.autor===undefined||typeof c.autor==='string')),'Comentários inválidos.');
    if(p.reacoes!==undefined){BRIO_assert(BRIO_object(p.reacoes),'Reações inválidas.');for(const k of ['entendi','duvida','exemplo'])num(p.reacoes[k],k);}
    if(p.arquivo){BRIO_assert(BRIO_object(p.arquivo),'Anexo inválido.');for(const k of ['nome','tipo','data'])text(p.arquivo[k],k);}
  });
  window.BRIO_FILES?.validateRefs(st);
  list(st.grafo.nos,'nós',n=>{BRIO_assert(typeof n.id==='string','ID do nó deve ser texto.');text(n.label,'rótulo',false);num(n.x,'x',false);num(n.y,'y',false);BRIO_assert(n.x<=100&&n.y<=100,'Posição inválida.');text(n.kind,'tipo do nó');});
  const ids=new Set(st.grafo.nos.map(n=>n.id));
  BRIO_assert(Array.isArray(st.grafo.arestas)&&st.grafo.arestas.every(a=>Array.isArray(a)&&a.length===2&&ids.has(a[0])&&ids.has(a[1])),'Relação sem nós válidos.');
  list(st.ignorancias,'atenção',x=>text(x.texto,'escolha',false));
  BRIO_assert(['foco','pausa','grande'].includes(st.pomo.fase),'Fase de foco inválida.');
  BRIO_assert(typeof st.pomo.rodando==='boolean','Estado do cronômetro inválido.');
  num(st.pomo.restante,'tempo',false);num(st.pomo.sessoes,'sessões',false);
  BRIO_assert(Number.isInteger(st.pomo.restante)&&st.pomo.restante<=86400,'Tempo fora do limite.');
  for(const [k,v] of Object.entries(DEFAULT_STATE.config)) BRIO_assert(typeof st.config[k]===typeof v,'Configuração inválida: '+k);
  BRIO_assert(['normal','large','xlarge'].includes(st.config.fontSize),'Tamanho de texto inválido.');
  BRIO_assert(st.config.sfxVolume>=0&&st.config.sfxVolume<=1,'Volume fora do intervalo.');
  st.nextId=['projetos','areas','recursos','arquivo'].flatMap(k=>st.pkm[k]).concat(st.ignorancias).reduce((max,x)=>Math.max(max,typeof x.id==='number'?x.id:0),st.nextId);
  for(const p of st.feed){if(p.corpo===undefined)p.corpo='';}
  st.__brioSchema = BRIO_SCHEMA_VERSION;
  return st;
}
function BRIO_parseStatePayload(raw) { try { return raw ? BRIO_validateState(JSON.parse(raw),true) : null; } catch { return null; } }
function BRIO_chooseNewest(states) { return states.filter(Boolean).sort((a,b)=>(b.__brioSavedAt||0)-(a.__brioSavedAt||0)||(b.__brioRevision||0)-(a.__brioRevision||0))[0]||null; }
function BRIO_content(st=S) { const c={...st};delete c.__brioSavedAt;delete c.__brioRevision;return JSON.stringify(c); }
function BRIO_status(message, error=false) {
  const el=document.getElementById('brio-save-status');
  if(el){el.textContent=message;el.classList.toggle('save-error',error);}
}
function BRIO_timeout(promise, ms=(window.BRIO_NATIVE?.active?15000:5000)) {
  return new Promise((resolve,reject)=>{const t=setTimeout(()=>reject(new Error('Leitura/gravação não respondeu.')),ms);Promise.resolve(promise).then(v=>{clearTimeout(t);resolve(v);},e=>{clearTimeout(t);reject(e);});});
}
function BRIO_idbOpen() {
  if(!('indexedDB' in window))return Promise.resolve(null);
  if(!BRIO_IDB_PROMISE)BRIO_IDB_PROMISE=BRIO_timeout(new Promise((resolve,reject)=>{
    const req=indexedDB.open(BRIO_IDB_NAME,1);
    req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(BRIO_IDB_STORE))req.result.createObjectStore(BRIO_IDB_STORE);};
    req.onsuccess=()=>{const db=req.result;db.onversionchange=()=>{db.close();BRIO_IDB_PROMISE=null;};resolve(db);};
    req.onerror=()=>reject(req.error);req.onblocked=()=>reject(new Error('Banco bloqueado por outra aba.'));
  })).catch(e=>{BRIO_IDB_PROMISE=null;throw e;});
  return BRIO_IDB_PROMISE;
}
async function BRIO_idbSet(value, key=BRIO_IDB_KEY) {
  const db=await BRIO_idbOpen();if(!db)return false;
  await BRIO_timeout(new Promise((resolve,reject)=>{const tx=db.transaction(BRIO_IDB_STORE,'readwrite');tx.objectStore(BRIO_IDB_STORE).put(value,key);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('Transação abortada.'));}));return true;
}
async function BRIO_idbGet(key=BRIO_IDB_KEY) {
  const db=await BRIO_idbOpen();if(!db)return null;
  return BRIO_timeout(new Promise((resolve,reject)=>{const req=db.transaction(BRIO_IDB_STORE,'readonly').objectStore(BRIO_IDB_STORE).get(key);req.onsuccess=()=>resolve(req.result||null);req.onerror=()=>reject(req.error);}));
}
function BRIO_getPreferencesPlugin(){return window.BRIO_NATIVE?.plugins?.Preferences||window.Capacitor?.Plugins?.Preferences||null;}
async function BRIO_prefGet(){const p=BRIO_getPreferencesPlugin();if(!p)return null;const r=await BRIO_timeout(p.get({key:STORAGE_KEY}));return r?.value||null;}
async function BRIO_prefSet(value){const p=BRIO_getPreferencesPlugin();if(!p)return false;await BRIO_timeout(p.set({key:STORAGE_KEY,value}));return true;}
async function BRIO_archive(label, entries) {
  const key=STORAGE_KEY+'_recovery_'+label;
  const raw=JSON.stringify({format:'BRIO-RECOVERY',createdAt:new Date().toISOString(),entries});
  try{if(await BRIO_idbSet(raw,key))return key;}catch{}
  try{localStorage.setItem(key,raw);return key;}catch{throw new Error('Não foi possível preservar uma cópia anterior. Exporte a recuperação antes de continuar.');}
}
function BRIO_lock(message){BRIO_READ_ONLY=true;document.getElementById('app').inert=true;document.getElementById('ob-screen').inert=true;document.querySelectorAll('.overlay').forEach(el=>el.inert=true);BRIO_status(message,true);const screen=document.getElementById('brio-boot');screen.hidden=false;document.getElementById('brio-boot-message').textContent=message;document.getElementById('brio-recovery-actions').hidden=false;}
async function BRIO_restaurarEstadoForte() {
  const sources=[['local',()=>localStorage.getItem(STORAGE_KEY)],['backup',()=>localStorage.getItem(STORAGE_KEY+'_backup')],['sessão',()=>sessionStorage.getItem(STORAGE_KEY+'_session')],['IndexedDB',()=>BRIO_idbGet()],['Preferences',()=>BRIO_prefGet()]];
  BRIO_RECOVERY=await Promise.all(sources.map(async([source,read])=>{try{return {source,raw:await read()};}catch(e){return {source,error:e.message};}}));
  const candidates=[];let invalid=false;
  for(const entry of BRIO_RECOVERY)if(entry.raw){try{entry.state=BRIO_validateState(JSON.parse(entry.raw),true);candidates.push(entry.state);}catch(e){entry.error=e.message;invalid=true;}}
  const newest=BRIO_chooseNewest(candidates);
  // Falha incerta de leitura nunca autoriza sobrescrever uma camada não lida.
  if(BRIO_RECOVERY.some(e=>e.error&&!e.raw)){BRIO_lock('Uma camada de armazenamento não pôde ser lida. Os dados não serão sobrescritos. Exporte as cópias e tente reabrir.');return false;}
  if(BRIO_RECOVERY.some(e=>e.raw&&(()=>{try{return (JSON.parse(e.raw).__brioSchema||0)>BRIO_SCHEMA_VERSION;}catch{return false;}})())){BRIO_lock('Há dados de uma versão mais recente. Use a versão correspondente; nenhuma cópia será sobrescrita.');return false;}
  if(invalid&&!newest){BRIO_lock('Há dados que esta versão não consegue abrir. As cópias originais foram mantidas. Exporte a recuperação.');return false;}
  const needsArchive=BRIO_RECOVERY.some(e=>e.raw&&(e.error||JSON.parse(e.raw).__brioSchema!==BRIO_SCHEMA_VERSION));
  if(needsArchive){try{await BRIO_archive('pre_v'+BRIO_SCHEMA_VERSION+'_'+Date.now(),BRIO_RECOVERY.map(({source,raw,error})=>({source,raw,error})));}catch(e){BRIO_lock(e.message);return false;}}
  if(newest)S=newest;
  // O setInterval não sobrevive ao fechamento: retoma em pausa no mesmo tempo.
  S.pomo.rodando=false;
  const originalLocal=BRIO_RECOVERY.find(e=>e.source==='local');BRIO_ACTIVE_PAYLOAD=originalLocal?.raw||null;
  BRIO_LAST_CONTENT='';BRIO_PERSIST_RESTORE_DONE=true;
  document.getElementById('brio-boot').hidden=true;document.getElementById('app').inert=false;document.getElementById('ob-screen').inert=false;
  salvarEstado();return true;
}
function carregarEstado(){/* Restauração acontece uma única vez, no boot assíncrono. */}
function salvarEstado() {
  if(!BRIO_PERSIST_RESTORE_DONE||BRIO_READ_ONLY)return false;
  let content;try{
    content=BRIO_content();
    // Sem alterações: não clonar e validar toda a base a cada 1,5 segundo.
    if(content===BRIO_LAST_CONTENT)return true;
    S=BRIO_validateState(S);content=BRIO_content();
  }catch(e){BRIO_lock('Salvamento interrompido: '+e.message);return false;}
  let localNow;try{localNow=localStorage.getItem(STORAGE_KEY);}catch{}
  if(localNow!==undefined&&localNow!==BRIO_ACTIVE_PAYLOAD){BRIO_lock('Outra aba alterou os dados. Exporte esta sessão e reabra para evitar sobrescrita.');return false;}
  S.__brioSavedAt=Math.max(Date.now(),(S.__brioSavedAt||0)+1);S.__brioRevision=(S.__brioRevision||0)+1;
  const payload=JSON.stringify(S),rev=S.__brioRevision;
  let localSaved=false;
  try{if(localNow&&BRIO_parseStatePayload(localNow))localStorage.setItem(STORAGE_KEY+'_backup',localNow);}catch{}
  try{localStorage.setItem(STORAGE_KEY,payload);BRIO_ACTIVE_PAYLOAD=payload;localSaved=true;}catch{}
  try{sessionStorage.setItem(STORAGE_KEY+'_session',payload);}catch{}
  BRIO_LAST_CONTENT=content;BRIO_LAST_SAVED_PAYLOAD=payload;
  BRIO_status(localSaved?'Salvo neste navegador; confirmando cópias…':'Confirmando armazenamento; mantenha a página aberta…',!localSaved);
  // Escritas nativas/IDB em ordem: um save antigo não termina por cima de um novo.
  BRIO_SAVE_QUEUE=BRIO_SAVE_QUEUE.catch(()=>{}).then(async()=>{
    const results=await Promise.allSettled([BRIO_idbSet(payload),BRIO_prefSet(payload)]);
    const durable=localSaved||results.some(r=>r.status==='fulfilled'&&r.value===true);
    if(rev===S.__brioRevision){if(durable)BRIO_status('Salvo neste dispositivo · faça também uma exportação JSON.');else{BRIO_LAST_CONTENT='';BRIO_status('Falha ao salvar. Os dados estão só nesta sessão: exporte JSON agora.',true);}}
    return durable;
  });return localSaved;
}
function BRIO_instalarAutosave(){
  if(BRIO_AUTOSAVE_TIMER)return;
  BRIO_AUTOSAVE_TIMER=setInterval(salvarEstado,1500);
  ['pagehide','blur','freeze','beforeunload'].forEach(evt=>window.addEventListener(evt,()=>salvarEstado(),{passive:true}));
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')salvarEstado();});
  const app=window.BRIO_NATIVE?.plugins?.App||window.Capacitor?.Plugins?.App;
  if(app?.addListener){app.addListener('pause',()=>salvarEstado());app.addListener('appStateChange',({isActive})=>{if(!isActive)salvarEstado();});}
  window.addEventListener('storage',ev=>{if(ev.key===STORAGE_KEY&&ev.newValue!==BRIO_ACTIVE_PAYLOAD)BRIO_lock('Outra aba alterou os dados. Exporte esta sessão e reabra.');});
}
function BRIO_renderTudo(){iniciarApp();window.BRIO_ANALYSIS?.restore();}
function BRIO_mergeState(value){S=BRIO_validateState(value);return true;}
async function BRIO_BOOT_INICIAL(){
  if(BRIO_BOOT_PROMISE)return BRIO_BOOT_PROMISE;
  BRIO_BOOT_PROMISE=(async()=>{try{
    if(!await BRIO_restaurarEstadoForte())return;
    if(S.onboarded)document.getElementById('ob-screen').classList.add('hidden');
    BRIO_instalarAutosave();iniciarApp();
    if(S.avatarUrl&&BRIO_safeImage(S.avatarUrl)){document.getElementById('pav-emoji').style.display='none';const img=document.getElementById('pav-img');img.src=S.avatarUrl;img.style.display='block';}
  }catch(e){BRIO_lock('Restauração interrompida. Exporte as cópias antes de tentar novamente. '+e.message);}})();return BRIO_BOOT_PROMISE;
}
async function BRIO_download(name,data,options){try{if(window.BRIO_FILES)return await BRIO_FILES.exportData(name,data,options);const raw=JSON.stringify(data,null,2);if(window.BRIO_NATIVE?.active){await window.BRIO_NATIVE.exportJSON(name,raw);return {pack:false};}const blob=new Blob([raw],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);return {pack:false};}catch(error){BRIO_status('Exportação não concluída. Os dados ativos foram mantidos.',true);toast('Não foi possível concluir a exportação: '+error.message,6000);return false;}}
function BRIO_exportar(){window.BRIO3?.flush();window.BRIO_NOTES?.flush();window.BRIO_LEARNING?.flush();window.BRIO_COMPOSER?.flush();window.BRIO_ANALYSIS?.flush();return BRIO_download('BRIO-backup-'+new Date().toISOString().slice(0,10)+'.json',{format:'BRIO',version:1,exportedAt:new Date().toISOString(),state:S});}
async function BRIO_exportarRecuperacao(){
  window.BRIO3?.flush();
  window.BRIO_NOTES?.flush();window.BRIO_LEARNING?.flush();window.BRIO_COMPOSER?.flush();window.BRIO_ANALYSIS?.flush();
  const archives=await BRIO_recoveryArchives();
  return BRIO_download('BRIO-recuperacao.json',{format:'BRIO-RECOVERY',entries:BRIO_RECOVERY.map(({source,raw,error})=>({source,raw,error})),archives,currentState:S});
}
async function BRIO_recoveryArchives(){
  const archives=[];
  try{const db=await BRIO_idbOpen();if(db)await BRIO_timeout(new Promise((resolve,reject)=>{const tx=db.transaction(BRIO_IDB_STORE,'readonly'),req=tx.objectStore(BRIO_IDB_STORE).openCursor();req.onsuccess=()=>{const c=req.result;if(!c)return; if(String(c.key).startsWith(STORAGE_KEY+'_recovery_'))archives.push({source:String(c.key),raw:c.value});c.continue();};tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);}));}catch{}
  try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k.startsWith(STORAGE_KEY+'_recovery_'))archives.push({source:k,raw:localStorage.getItem(k)});}}catch{}
  return archives;
}
function BRIO_readImport(raw){
  BRIO_assert(typeof raw==='string'&&new Blob([raw]).size<=BRIO_MAX_IMPORT,'Arquivo maior que 64 MiB.');
  const parsed=JSON.parse(raw);BRIO_checkTree(parsed);
  if(parsed.format){BRIO_assert(parsed.format==='BRIO'&&parsed.version===1,'Formato de backup não suportado.');return BRIO_validateState(parsed.state,true);}
  return BRIO_validateState(parsed,true);
}
// Inspeção de recuperação é somente leitura: não modifica S nem os armazenamentos.
function BRIO_inspectRecovery(raw){
  BRIO_assert(typeof raw==='string'&&new Blob([raw]).size<=BRIO_MAX_IMPORT,'Arquivo maior que 64 MiB.');
  const root=JSON.parse(raw.replace(/^\uFEFF/,''));
  BRIO_assert(BRIO_object(root)&&root.format==='BRIO-RECOVERY','Escolha um arquivo de recuperação BRIO-RECOVERY.');
  BRIO_assert(root.version===undefined||root.version===1,'Versão de recuperação não suportada.');
  const result={candidates:[],issues:[],complete:true};
  const queue=[{value:root,source:'Recuperação',depth:0}],seen=new Map();
  const MAX_ENTRIES=250,MAX_DEPTH=8,MAX_PARSED_BYTES=BRIO_MAX_IMPORT*2;
  let parsedBytes=new Blob([raw]).size,limitReported=false,examinedEntries=0;
  const issue=(source,reason)=>result.issues.push({source,reason:String(reason).slice(0,500)});
  const limited=(source,reason)=>{result.complete=false;if(!limitReported){issue(source,reason);limitReported=true;}};
  function schedule(value,source,depth){
    if(queue.length>=MAX_ENTRIES){limited(source,'O limite de entradas foi atingido; parte do arquivo não foi analisada. Guarde o original.');return false;}
    queue.push({value,source:source.slice(0,800),depth});return true;
  }
  for(let cursor=0;cursor<queue.length;cursor++){
    let {value,source,depth}=queue[cursor];
    if(depth>MAX_DEPTH){limited(source,'O limite de aninhamento foi atingido; parte do arquivo não foi analisada. Guarde o original.');continue;}
    try{
      if(typeof value==='string'){
        const size=new Blob([value]).size;
        if(parsedBytes+size>MAX_PARSED_BYTES){limited(source,'O limite de processamento foi atingido; parte do arquivo não foi analisada. Guarde o original.');continue;}
        parsedBytes+=size;value=JSON.parse(value.replace(/^\uFEFF/,''));
      }
      if(BRIO_object(value)&&value.format==='BRIO-RECOVERY'){
        BRIO_assert(value.version===undefined||value.version===1,'Versão de recuperação não suportada.');
        let available=false;
        if(Object.hasOwn(value,'currentState')){available=true;schedule(value.currentState,source+' / sessão exportada',depth+1);}
        for(const field of ['entries','archives']){
          if(!Object.hasOwn(value,field))continue;
          if(!Array.isArray(value[field])){issue(source,'Coleção de recuperação inválida: '+field);continue;}
          if(value[field].length)available=true;
          for(let index=0;index<value[field].length;index++){
            if(++examinedEntries>MAX_ENTRIES){limited(source,'O limite de entradas foi atingido; parte do arquivo não foi analisada. Guarde o original.');break;}
            const entry=value[field][index],label=source+' / '+field+'['+index+'] · '+(typeof entry?.source==='string'?entry.source.slice(0,160):'origem não informada');
            if(!BRIO_object(entry)||typeof entry.raw!=='string'||!entry.raw.trim()){issue(label,'Cópia indisponível ou vazia'+(typeof entry?.error==='string'?': '+entry.error.slice(0,180):'.'));continue;}
            if(!schedule(entry.raw,label,depth+1))break;
          }
        }
        if(!available)issue(source,'Nenhuma cópia de estado foi encontrada neste arquivo.');
        continue;
      }
      const state=BRIO_readImport(JSON.stringify(value)),signature=BRIO_canonical(state);
      if(seen.has(signature)){result.candidates[seen.get(signature)].sources.push(source);continue;}
      seen.set(signature,result.candidates.length);result.candidates.push({sources:[source],state});
    }catch(error){issue(source,error.message);}
  }
  return result;
}
function BRIO_recoveryBackup(candidate){
  BRIO_assert(BRIO_object(candidate)&&Array.isArray(candidate.sources)&&candidate.sources.length>0&&candidate.sources.every(s=>typeof s==='string'),'Selecione uma cópia de recuperação válida.');
  // Revalidar a seleção antes da exportação; dados pedagógicos passam pelo mesmo leitor do backup comum.
  const state=BRIO_readImport(JSON.stringify(candidate.state));
  const backup={format:'BRIO',version:1,exportedAt:new Date().toISOString(),recoveredFrom:[...candidate.sources],state};
  BRIO_assert(new Blob([JSON.stringify(backup,null,2)]).size<=BRIO_MAX_IMPORT,'A exportação desta cópia excederia 64 MiB. Guarde o arquivo original para recuperação assistida de um arquivo maior.');
  return backup;
}
function BRIO_openRecoveryInspector(){
  let dialog=document.getElementById('brio-recovery-inspector');
  if(!dialog){
    const make=(tag,cls,text)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=text;return node;};
    dialog=make('dialog','brio3-dialog');dialog.id='brio-recovery-inspector';dialog.setAttribute('aria-labelledby','brio-recovery-inspector-title');
    const view={generation:0,result:null,origin:null};dialog._brioRecoveryView=view;
    const header=make('div','brio3-dialog-head'),title=make('h2','','Inspecionar recuperação');title.id='brio-recovery-inspector-title';
    const close=make('button','btn btn-sm','Fechar');close.type='button';close.addEventListener('click',()=>dialog.close());header.append(title,close);
    const help=make('p','brio3-help','Escolha um arquivo BRIO-recuperacao.json. Você poderá examinar as cópias compatíveis e exportar uma delas. A inspeção não aplica dados ao aplicativo. Guarde o arquivo original.');
    const caveat=make('p','brio3-help','Se a abertura original falhou, a sessão exportada pode conter apenas o estado inicial. Confira a origem, as contagens e os títulos. A validação de estrutura não confirma o conteúdo.');
    const field=make('div','field'),fileLabel=make('label','label','Arquivo de recuperação · até 64 MiB'),input=make('input','inp');
    input.id='brio-recovery-file';input.type='file';input.accept='.json,.brio,application/json,application/octet-stream';fileLabel.htmlFor=input.id;
    const choose=make('button','btn','Escolher arquivo de recuperação');choose.id='brio-recovery-choose';choose.type='button';choose.addEventListener('click',()=>input.click());field.append(fileLabel,input,choose);
    const status=make('p','brio3-feedback');status.id='brio-recovery-inspector-status';status.setAttribute('role','status');
    const selection=make('div','field'),selectLabel=make('label','label','Cópia para examinar'),select=make('select','inp');
    select.id='brio-recovery-candidate';selectLabel.htmlFor=select.id;selection.append(selectLabel,select);
    const preview=make('p','brio3-preserve brio3-help');preview.id='brio-recovery-candidate-preview';
    const issues=make('details','brio3-details'),summary=make('summary'),list=make('ul');issues.id='brio-recovery-inspector-issues';list.style.paddingLeft='1.25rem';issues.append(summary,list);
    const download=make('button','btn btn-g','Exportar cópia selecionada');download.id='brio-recovery-export';download.type='button';
    function reset(){
      view.result=null;select.replaceChildren();const placeholder=make('option','','Selecione uma cópia');placeholder.value='';select.append(placeholder);
      select.disabled=true;download.disabled=true;preview.textContent='';status.textContent='';list.replaceChildren();issues.hidden=true;
    }
    function selected(){return select.value===''?null:view.result?.candidates[Number(select.value)]||null;}
    select.addEventListener('change',()=>{
      const candidate=selected();download.disabled=!candidate;
      if(!candidate){preview.textContent='';return;}
      const state=candidate.state,folders=['projetos','areas','recursos','arquivo'].map(k=>k+': '+state.pkm[k].length).join(' · ');
      preview.textContent='Notas: '+state.notas.length+' · Flashcards: '+state.flashcards.length+' · Feed local: '+state.feed.length+'\nPARA — '+folders+'\nGrafo: '+state.grafo.nos.length+' nós / '+state.grafo.arestas.length+' relações\nRoteiros Pólya: '+(state.brio3?.plans?.length||0)+' · Rascunho pedagógico: '+(state.brio3?.noteDraft?'presente':'ausente')+'\nPrimeiros títulos: '+(state.notas.slice(0,3).map(n=>n.titulo.slice(0,120)).join(' · ')||'nenhuma nota')+'\nOrigem: '+candidate.sources.join('\n');
    });
    input.addEventListener('change',async()=>{
      const file=input.files?.[0],generation=++view.generation;reset();if(!file)return;
      status.textContent='Lendo e validando as cópias…';
      try{
        const opened=window.BRIO_FILES?await BRIO_FILES.read(file):null;
        if(!opened)BRIO_assert(file.size<=BRIO_MAX_IMPORT,'Arquivo maior que 64 MiB.');
        const raw=opened?JSON.stringify(opened.document):await file.text();if(generation!==view.generation||!dialog.open)return;
        const result=BRIO_inspectRecovery(raw);result.fileRecords=opened?.records;view.result=result;
        for(const [index,candidate]of result.candidates.entries()){
          const option=make('option','','Cópia '+(index+1)+' · '+candidate.state.notas.length+' notas · '+candidate.state.flashcards.length+' cards · '+candidate.sources[0]);option.value=String(index);select.append(option);
        }
        select.disabled=!result.candidates.length;
        status.textContent=result.candidates.length+' cópia(s) compatível(is) · '+result.issues.length+' aviso(s). '+(result.complete?'Inspeção concluída. Selecione uma cópia para examinar.':'Análise incompleta por limite de processamento; algumas cópias não foram examinadas. Guarde o original.');
        if(!result.candidates.length)status.textContent+=' Nenhuma cópia foi selecionada ou aplicada.';
        summary.textContent='Cópias recusadas e avisos ('+result.issues.length+')';
        for(const issue of result.issues)list.append(make('li','',issue.source+': '+issue.reason));
        issues.hidden=!result.issues.length;issues.open=!!result.issues.length;
      }catch(error){if(generation===view.generation&&dialog.open)status.textContent='Arquivo recusado: '+error.message+' Os dados ativos foram mantidos.';}
      finally{if(generation===view.generation)input.value='';}
    });
    download.addEventListener('click',async()=>{
      try{
        const candidate=selected();BRIO_assert(candidate,'Selecione uma cópia.');
        const backup=BRIO_recoveryBackup(candidate),records=view.result.fileRecords??(window.BRIO_FILES&&!BRIO_FILES.references(backup).size?[]:undefined);
        const result=await BRIO_download('BRIO-recuperado-'+new Date().toISOString().slice(0,10)+'.json',backup,{records,allowMissing:true});
        if(result)status.textContent=result.pack?'Pacote .brio exportado com os arquivos disponíveis. Confira qualquer aviso de arquivo ausente antes de restaurar. Os dados ativos foram mantidos.':'Cópia exportada como backup JSON comum. Os dados ativos foram mantidos. Confira o arquivo; para incorporá-lo depois, use Escolher backup JSON e Mesclar registros.';
      }catch(error){status.textContent='Não foi possível exportar: '+error.message;}
    });
    dialog.addEventListener('keydown',event=>{
      if(event.key!=='Tab')return;
      const items=BRIO_modalFocusable(dialog),first=items[0],last=items.at(-1);
      if(!first){event.preventDefault();return;}
      if(event.shiftKey&&(document.activeElement===first||!dialog.contains(document.activeElement))){event.preventDefault();last.focus();}
      else if(!event.shiftKey&&(document.activeElement===last||!dialog.contains(document.activeElement))){event.preventDefault();first.focus();}
    });
    dialog.addEventListener('close',()=>{
      view.generation++;reset();input.value='';
      if(view.origin?.isConnected&&!view.origin.closest('[inert]'))view.origin.focus();view.origin=null;
    });
    dialog.append(header,help,caveat,field,status,selection,preview,issues,download);reset();document.body.append(dialog);
  }
  if(typeof dialog.showModal!=='function'){toast('Este navegador não oferece suporte à janela de recuperação. O arquivo original foi mantido.');return;}
  if(dialog.open)return;
  dialog._brioRecoveryView.origin=document.activeElement;dialog.showModal();document.getElementById('brio-recovery-choose').focus();
}
async function BRIO_importarArquivo(input){
  const target=document.getElementById('brio-import-preview');BRIO_PENDING_IMPORT=null;target.textContent='';
  try{const f=input.files[0];if(!f)return;const opened=window.BRIO_FILES?await BRIO_FILES.read(f):null;if(!opened)BRIO_assert(f.size<=BRIO_MAX_IMPORT,'Arquivo maior que 64 MiB.');const st=BRIO_readImport(opened?JSON.stringify(opened.document):await f.text());let absent=[];if(opened){absent=await BRIO_FILES.missing({format:'BRIO',state:st},opened.records||[]);if(absent.length&&!confirm('Faltam '+absent.length+' arquivo(s). Importar somente os registros, preservando as referências aos arquivos ausentes?'))return;if(opened.records?.length)await BRIO_FILES.addRecords(opened.records);}BRIO_PENDING_IMPORT=st;target.textContent='Validado: '+st.notas.length+' notas, '+st.flashcards.length+' cards, '+st.grafo.nos.length+' nós. '+(absent.length?absent.length+' arquivo(s) ausente(s); referências preservadas. ':'')+'Mesclar preserva versões diferentes com novos IDs e registra conflitos de campos/rascunhos para recuperação. Restaurar substitui o estado ativo após confirmação e cópia de segurança.';document.getElementById('brio-import-actions').hidden=false;}catch(e){document.getElementById('brio-import-actions').hidden=true;target.textContent='Importação recusada: '+e.message;}finally{input.value='';}
}
// Mesclagem aditiva: versões diferentes nunca são descartadas silenciosamente.
function BRIO_canonical(value) {
  if(Array.isArray(value))return '['+value.map(BRIO_canonical).join(',')+']';
  if(BRIO_object(value))return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+BRIO_canonical(value[k])).join(',')+'}';
  return JSON.stringify(value);
}
function BRIO_mergeRecords(current,incoming,allocate) {
  const rows=BRIO_clone(current),ids=new Map(rows.map(x=>[String(x.id),x])),remap=new Map();
  const signature=x=>{const v={...x};delete v.id;return BRIO_canonical(v);};
  const content=new Map(rows.map(x=>[signature(x),x]));
  for(const original of incoming){
    const row=BRIO_clone(original),old=ids.get(String(row.id));
    if(old){
      if(BRIO_canonical(old)===BRIO_canonical(row)){remap.set(String(original.id),old.id);continue;}
      const identical=content.get(signature(row));
      if(identical){remap.set(String(original.id),identical.id);continue;}
      row.id=allocate(row.id,ids);
    }
    rows.push(row);ids.set(String(row.id),row);content.set(signature(row),row);remap.set(String(original.id),row.id);
  }
  return {rows,remap};
}
function BRIO_mergeFields(current,incoming,path,conflicts,skip=new Set()) {
  const out=BRIO_clone(current);
  for(const [key,value]of Object.entries(incoming)){
    if(skip.has(key))continue;
    const field=path?path+'.'+key:key;
    if(!Object.hasOwn(out,key)){out[key]=BRIO_clone(value);continue;}
    if(BRIO_canonical(out[key])===BRIO_canonical(value))continue;
    // Rascunhos são unidades: não combinar campos de dois textos diferentes.
    if(BRIO_object(out[key])&&BRIO_object(value)&&!['noteDraft','postDraft','analysisDraft'].includes(key))out[key]=BRIO_mergeFields(out[key],value,field,conflicts);
    else {
      const conflict={path:field,current:BRIO_clone(out[key]),incoming:BRIO_clone(value)};
      if(!conflicts.some(c=>BRIO_canonical(c)===BRIO_canonical(conflict)))conflicts.push(conflict);
    }
  }
  return out;
}
function BRIO_mergeImport(current,incoming){
  current=BRIO_validateState(current,true);incoming=BRIO_validateState(incoming,true);
  const conflicts=Array.isArray(current.__brioImportConflicts)?BRIO_clone(current.__brioImportConflicts):[];
  const maps={};
  const reserved=new Set(['notas','flashcards','feed','ignorancias','pkm','grafo','brio3','brioSafety','brioLearning','nextId','__brioSchema','__brioSavedAt','__brioRevision','__brioImportConflicts']);
  const result=BRIO_mergeFields(current,incoming,'',conflicts,reserved);
  result.nextId=Math.max(current.nextId,incoming.nextId);
  const allocate=(old,ids)=>{let id;do{id=typeof old==='number'?++result.nextId:String(old).slice(0,120)+'_import_'+(++result.nextId);}while(ids.has(String(id)));return id;};
  for(const key of ['notas','flashcards','feed','ignorancias']){const m=BRIO_mergeRecords(current[key],incoming[key],allocate);result[key]=m.rows;maps[key]=m.remap;}
  const folders=['projetos','areas','recursos','arquivo'];
  result.pkm=BRIO_mergeFields(current.pkm,incoming.pkm,'pkm',conflicts,new Set(folders));
  let projectMap=new Map();
  for(const key of folders){const merged=BRIO_mergeRecords(current.pkm[key],incoming.pkm[key],allocate);result.pkm[key]=merged.rows;maps['pkm.'+key]=merged.remap;if(key==='projetos')projectMap=merged.remap;}
  result.grafo=BRIO_mergeFields(current.grafo,incoming.grafo,'grafo',conflicts,new Set(['nos','arestas']));
  const nodes=BRIO_mergeRecords(current.grafo.nos,incoming.grafo.nos,allocate);result.grafo.nos=nodes.rows;
  maps['grafo.nos']=nodes.remap;
  const edges=new Set(result.grafo.arestas.map(BRIO_canonical));
  for(const edge of incoming.grafo.arestas){const mapped=edge.map(id=>nodes.remap.get(String(id)));const key=BRIO_canonical(mapped);if(!edges.has(key)){result.grafo.arestas.push(mapped);edges.add(key);}}
  if(incoming.brio3!==undefined){
    const received=BRIO_clone(incoming.brio3);
    if(Array.isArray(received.plans))for(const plan of received.plans)if(plan.projectId!==null&&projectMap.has(String(plan.projectId)))plan.projectId=projectMap.get(String(plan.projectId));
    if(current.brio3===undefined){result.brio3=received;maps['brio3.plans']=new Map(received.plans.map(p=>[String(p.id),p.id]));}
    else {
      result.brio3=BRIO_mergeFields(current.brio3,received,'brio3',conflicts,new Set(['plans']));
      const plans=BRIO_mergeRecords(current.brio3.plans,received.plans,allocate);result.brio3.plans=plans.rows;maps['brio3.plans']=plans.remap;
    }
  }
  if(incoming.brioSafety){
    const previous=current.brioSafety||BRIO_DATA.safety(),received=BRIO_clone(incoming.brioSafety);
    for(const key of BRIO_DATA.safetyCollections){const rows=received[key];if(!Array.isArray(rows))continue;received[key]=rows.map(x=>{const row=BRIO_DATA.remap(x,maps);if(key==='pendingPosts'&&!row.online)row.id=maps.feed.get(String(row.id))??row.id;if(['commentDrafts','moderationReports','moderationHidden'].includes(key)&&!row.online)row.postId=String(maps.feed.get(String(row.postId))??row.postId);return row;});}
    if(received.postDraft?.pendingId){const original=incoming.brioSafety.pendingPosts?.find(x=>x.id===received.postDraft.pendingId);if(original&&!original.online)received.postDraft.pendingId=maps.feed.get(String(original.id))??original.id;}
    result.brioSafety=BRIO_mergeFields(previous,received,'brioSafety',conflicts,new Set(BRIO_DATA.safetyCollections));
    for(const key of BRIO_DATA.safetyCollections){const m=BRIO_mergeRecords(previous[key]||[],received[key]||[],allocate);result.brioSafety[key]=m.rows;maps['brioSafety.'+key]=m.remap;}
    if(previous.postDraft===undefined&&received.postDraft?.pendingId)result.brioSafety.postDraft.pendingId=maps['brioSafety.pendingPosts'].get(String(received.postDraft.pendingId))??received.postDraft.pendingId;
  }
  if(incoming.brioLearning){
    const previous=current.brioLearning||BRIO_DATA.empty();result.brioLearning=BRIO_mergeFields(previous,incoming.brioLearning,'brioLearning',conflicts,new Set(BRIO_DATA.collections));
    for(const key of BRIO_DATA.collections){const m=BRIO_mergeRecords(previous[key],incoming.brioLearning[key].map(x=>BRIO_DATA.remap(x,maps)),allocate);result.brioLearning[key]=m.rows;maps['brioLearning.'+key]=m.remap;}
    if(previous.activeJourneyId===undefined&&incoming.brioLearning.activeJourneyId)result.brioLearning.activeJourneyId=maps['brioLearning.journeys'].get(String(incoming.brioLearning.activeJourneyId))||incoming.brioLearning.activeJourneyId;
    if(previous.noteContext===undefined&&incoming.brioLearning.noteContext)result.brioLearning.noteContext=BRIO_DATA.remap(incoming.brioLearning.noteContext,maps);
  }
  for(const entry of incoming.__brioImportConflicts||[]){if(!conflicts.some(c=>BRIO_canonical(c)===BRIO_canonical(entry)))conflicts.push(BRIO_clone(entry));}
  if(conflicts.length)result.__brioImportConflicts=conflicts;
  return BRIO_validateState(result);
}
function BRIO_exportarConflitos(){BRIO_download('BRIO-conflitos-preservados.json',{format:'BRIO-MERGE-CONFLICTS',version:1,conflicts:S.__brioImportConflicts||[]});}
async function BRIO_aplicarImportacao(replace=false){
  if(!BRIO_PENDING_IMPORT||BRIO_READ_ONLY)return;
  if(replace&&!confirm('Restaurar este backup como estado ativo? Os registros ativos serão substituídos. Uma cópia integral anterior será mantida em Recuperação. Exporte JSON também antes de prosseguir.'))return;
  const buttons=document.querySelectorAll('#brio-import-actions button');buttons.forEach(b=>b.disabled=true);document.getElementById('app').inert=true;document.getElementById('brio-boot-message').textContent='Aplicando o backup com cópia anterior…';document.getElementById('brio-boot').hidden=false;
  try{window.BRIO3?.flush();window.BRIO_NOTES?.flush();window.BRIO_LEARNING?.flush();window.BRIO_COMPOSER?.flush();window.BRIO_ANALYSIS?.flush();await BRIO_SAVE_QUEUE;await BRIO_archive('before_import_'+Date.now(),[{source:'estado anterior',raw:JSON.stringify(S)},{source:'backup recebido',raw:JSON.stringify(BRIO_PENDING_IMPORT)}]);
    BRIO_assert(!BRIO_READ_ONLY,'Outra sessão alterou o armazenamento; reabra antes de importar.');
    const updated=replace?BRIO_clone(BRIO_PENDING_IMPORT):BRIO_mergeImport(S,BRIO_PENDING_IMPORT);
    desligarFeedOnlineBRIO();clearInterval(pomoTimer);updated.pomo.rodando=false;S=updated;S.__brioRevision=(S.__brioRevision||0)+1;BRIO_PENDING_IMPORT=null;
    filaEstudo=[];cardAtual=null;notaAtualId=null;noSelecionado=null;
    salvarEstado();const durable=await BRIO_SAVE_QUEUE;BRIO_renderTudo();window.BRIO_COMPOSER?.restore();window.BRIO_COMMENTS?.restoreFields();document.getElementById('ob-screen').classList.toggle('hidden',S.onboarded);document.getElementById('brio-import-preview').textContent=durable?'Dados aplicados. Versões diferentes foram preservadas. Conflitos de campos/rascunhos: '+(S.__brioImportConflicts?.length||0)+'. Use “Exportar conflitos preservados” para inspecioná-los.':'Dados carregados em memória, mas o salvamento falhou. Mantenha esta página aberta e exporte JSON agora.';document.getElementById('brio-import-actions').hidden=true;
  }catch(e){document.getElementById('brio-import-preview').textContent='Importação não concluída: '+e.message;}finally{buttons.forEach(b=>b.disabled=false);if(!BRIO_READ_ONLY){document.getElementById('app').inert=false;document.getElementById('brio-boot').hidden=true;}}
}


function gerarId(prefixo='') {
  return prefixo + (++S.nextId) + '_' + Date.now().toString(36);
}

function xpGanhar(n) {
  S.xp = (S.xp || 0) + n;
  const hoje = new Date().toDateString();
  if (S.ultimoAcesso !== hoje) {
    S.ultimoAcesso = hoje;
    S.streakDias = [...(S.streakDias || [false,false,false,false,false,false,false]).slice(1), true];
  }
  salvarEstado();
  atualizarStats();
}

// ─────────────────────────────────────────────────────────
// 1. UTILITÁRIOS UI
// ─────────────────────────────────────────────────────────
function toast(msg, dur=2400) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), dur);
}

function limparNick(v) {
  return String(v || '')
    .trim()
    .replace(/^@+/, '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 18);
}

function pedirNickBRIO(forcar=false) {
  let salvo = limparNick(S.nick || localStorage.getItem('brio_nick_googie23_preview') || '');
  if (salvo && salvo.length >= 3) return salvo;
  if (!forcar) return '';
  let n = '';
  while (!n || n.length < 3) {
    n = limparNick(prompt('Escolha seu nick para aparecer no feed online do BRIO. Ex: camila_ocmt') || '');
    if (!n) { toast('Modo online não ativado. Você continua usando o BRIO local.'); return ''; }
    if (n.length < 3) alert('Use pelo menos 3 caracteres.');
  }
  return n;
}

function tempoRelativoBRIO(ts) {
  if (!ts) return 'agora';
  const dif = Math.max(0, Date.now() - ts);
  const min = Math.floor(dif / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return min + 'min';
  const h = Math.floor(min / 60);
  if (h < 24) return h + 'h';
  const d = Math.floor(h / 24);
  return d + 'd';
}



async function prepararFirebaseBRIO() {
  if (!window.firebase || !firebase.initializeApp) throw new Error('Firebase SDK não carregou');
  if (!firebase.apps.length) firebase.initializeApp(BRIO_FIREBASE_CONFIG);
  BRIO_assert(firebase.app().options.projectId===BRIO_FIREBASE_CONFIG.projectId,'Outra aplicação Firebase está ativa. Nenhuma escrita foi iniciada.');
  BRIO_AUTH = firebase.auth();
  BRIO_DB = firebase.database();
  if(window.BRIO_FIREBASE_EMULATOR&&!BRIO_EMULATORS_CONFIGURED){
    BRIO_assert(['127.0.0.1','localhost'].includes(location.hostname)&&BRIO_FIREBASE_CONFIG.projectId==='demo-brio-security','Emulador permitido somente no projeto demo e em loopback.');
    BRIO_AUTH.useEmulator('http://127.0.0.1:19099',{disableWarnings:true});BRIO_DB.useEmulator('127.0.0.1',19000);BRIO_EMULATORS_CONFIGURED=true;
  }
  let stop;try{await BRIO_SHARED.timed(new Promise((resolve,reject)=>{stop=BRIO_AUTH.onAuthStateChanged(resolve,reject);}));}finally{stop?.();}
  if (!BRIO_AUTH.currentUser) {
    const cred = await BRIO_SHARED.timed(BRIO_AUTH.signInAnonymously());
    BRIO_UID = cred.user.uid;
  } else {
    BRIO_UID = BRIO_AUTH.currentUser.uid;
  }
}



const BRIO_MODAL_STACK=[];
const BRIO_MODAL_ORIGINS=new WeakMap();
function BRIO_modalFocusable(el){return [...el.querySelectorAll('button:not([disabled]),input:not([disabled]):not([type=hidden]),textarea:not([disabled]),select:not([disabled]),a[href],[tabindex="0"]')].filter(e=>e.getClientRects().length&&!e.closest('[hidden],.hidden,[inert]'));}
function openModal(id) {
  const el = document.getElementById(id);
  if (!el||BRIO_READ_ONLY) return;
  if(el.classList.contains('hidden'))BRIO_MODAL_ORIGINS.set(el,document.activeElement);
  const previous=BRIO_MODAL_STACK.at(-1);if(previous&&previous!==el)previous.inert=true;
  if(!BRIO_MODAL_STACK.includes(el))BRIO_MODAL_STACK.push(el);
  el.inert=false;
  el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');
  const title=el.querySelector('.modal-title');if(title){if(!title.id)title.id=id+'-title';el.setAttribute('aria-labelledby',title.id);}
  el.classList.remove('hidden');
  document.getElementById('app').inert=true;
  const focus=el.querySelector('input:not([type=hidden]),textarea,select')||BRIO_modalFocusable(el)[0]||el;
  if(focus===el)el.tabIndex=-1;focus.focus({preventScroll:true});
}
function closeModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add('hidden');
  const index=BRIO_MODAL_STACK.indexOf(el);if(index>=0)BRIO_MODAL_STACK.splice(index,1);
  const previous=BRIO_MODAL_STACK.at(-1);if(previous)previous.inert=BRIO_READ_ONLY;
  document.getElementById('app').inert=BRIO_READ_ONLY||BRIO_MODAL_STACK.length>0;
  const origin=BRIO_MODAL_ORIGINS.get(el);if(origin?.isConnected&&!origin.closest('[inert],.hidden'))origin.focus({preventScroll:true});
  const main = document.getElementById('main');
  if (main) main.style.overflowY = 'auto';
}
document.addEventListener('keydown',event=>{
  // Os diálogos nativos da extensão gerenciam o próprio teclado.
  if(document.querySelector('dialog[open]'))return;
  const modal=BRIO_MODAL_STACK.at(-1);if(!modal||BRIO_READ_ONLY)return;
  if(event.key==='Escape'){event.preventDefault();closeModal(modal.id);return;}
  if(event.key!=='Tab')return;
  const items=BRIO_modalFocusable(modal),first=items[0],last=items.at(-1);
  if(!items.length){event.preventDefault();modal.focus();}
  else if(event.shiftKey&&(document.activeElement===first||!modal.contains(document.activeElement))){event.preventDefault();last.focus();}
  else if(!event.shiftKey&&(document.activeElement===last||!modal.contains(document.activeElement))){event.preventDefault();first.focus();}
});
// close on backdrop
document.querySelectorAll('.overlay').forEach(ov => {
  ov.addEventListener('click', e => { if (e.target === ov) { closeModal(ov.id); } });
});

function navTo(pg) {
  document.querySelectorAll('.pg').forEach(p => p.classList.remove('on'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('on'));
  const p = document.getElementById('pg-' + pg);
  const b = document.getElementById('nav-' + pg);
  if (p) p.classList.add('on');
  if (b) b.classList.add('on');
  const mainScroll = document.getElementById('main'); if (mainScroll) { try { mainScroll.scrollTo({top:0,left:0,behavior:'auto'}); } catch(e) { mainScroll.scrollTop = 0; } }
  // page-specific renders
  if (pg === 'para')    renderPARA();
  if (pg === 'notas')   renderNotas();
  if (pg === 'cards')   renderFlashcards();
  if (pg === 'grafo')   renderGrafo();
  if (pg === 'analise') renderIgnorancias();
  if (pg === 'perfil')  renderPerfil();
  if (pg === 'feed')    renderFeed();
  if (pg === 'foco')    renderPomoUI();
}

function toggleNField(head) {
  const body = head.nextElementSibling;
  const open = body.classList.contains('open');
  body.classList.toggle('open', !open);
  head.classList.toggle('open', !open);
}

function setarData() {
  const d = new Date();
  const opts = {weekday:'long', day:'2-digit', month:'long', year:'numeric'};
  const dataEl = document.getElementById('tbar-date');
  const clockEl = document.getElementById('tbar-clock');
  if (dataEl) dataEl.textContent = d.toLocaleDateString('pt-BR', {weekday:'short', day:'2-digit', month:'short'});
  if (clockEl) clockEl.textContent = d.toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit', second:'2-digit'});
  const dd = document.getElementById('dash-daystr');
  if (dd) dd.textContent = d.toLocaleDateString('pt-BR', opts);
  const h = d.getHours();
  const saud = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
  const dg = document.getElementById('dash-greeting');
  if (dg) dg.textContent = saud + (S.nome ? ', ' + S.nome : '') + '!';
  const ds = document.getElementById('dash-sub');
  if (ds) ds.textContent = h < 12 ? 'Que tal começar com uma nota?' : h < 18 ? 'Hora de estudar com foco.' : 'Revise antes de dormir.';
}

function atualizarStats() {
  const el = (id, v) => { const e = document.getElementById(id); if(e) e.textContent = v; };
  el('s-notas', S.notas.length);
  el('s-cards', S.flashcards.length);
  el('s-xp', S.xp || 0);
  // streak
  const sd = document.getElementById('streak-dots');
  if (sd && S.streakDias) {
    sd.innerHTML = S.streakDias.map((ok,i) =>
      `<div class="sdot${ok?' done':''}${i===6?' today':''}"></div>`
    ).join('');
  }
  // revisoes
  const agora = Date.now();
  const paraRevisar = S.flashcards.filter(c => c.proximaRevisao <= agora).slice(0,4);
  const rl = document.getElementById('dash-revisoes');
  if (rl) {
    if (!paraRevisar.length) {
      rl.innerHTML = '<div class="empty-msg">✨ Nenhum card para revisar agora!</div>';
    } else {
      rl.innerHTML = paraRevisar.map(c => `
        <div class="p-item" onclick="navTo('cards');iniciarEstudo()" style="cursor:pointer">
          <div class="p-dot" style="background:var(--yellow);border-color:var(--yellow)"></div>
          <div class="p-txt">
            <div class="p-title">${escHtml(c.pergunta.substring(0,55))}${c.pergunta.length>55?'...':''}</div>
            <div class="p-sub">Para revisão · ${escHtml(c.cat || 'geral')}</div>
          </div>
          <span style="font-size:.7rem;color:var(--yellow);font-family:'Courier Prime',monospace;flex-shrink:0">→ Revisar</span>
        </div>`).join('');
    }
  }
}

function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/\x27/g,'&#39;');
}


// ─────────────────────────────────────────────────────────
// PATCH: GRAFO DE PEIRCE DIDÁTICO + TEMA + LEMBRETES
// ─────────────────────────────────────────────────────────
const PEIRCE = {
  alfa:{titulo:'Alfa · lógica proposicional',texto:'Na folha de asserção, justaposição representa conjunção e um corte fechado representa negação. Cortes aninhados também permitem representar implicação: não (P e não Q) equivale a P → Q.',exemplo:'P e Q na mesma área: P ∧ Q. Dentro de um corte: ¬P. O editor de nós não implementa estas regras.',diagrama:'<div class="cut">P <span class="cut" style="display:inline-block">Q</span></div>'},
  beta:{titulo:'Beta · relações e quantificação',texto:'Amplia os recursos proposicionais com predicados e linhas de identidade; a disposição e o escopo dos cortes importam para a quantificação. Uma simples aresta entre conceitos não implementa esse sistema.',exemplo:'A frase “existe alguém que estuda” envolve quantificação existencial; exige notação e regras que não estão neste editor.',diagrama:'<p>Exemplo em notação convencional: ∃x Estuda(x)</p>'},
  gama:{titulo:'Gama · extensões, incluindo modalidades',texto:'Peirce explorou extensões para além de Alfa e Beta, incluindo possibilidade e necessidade. Há diferentes propostas e reconstruções; não se reduz a rotular qualquer hipótese “se... então”.',exemplo:'Possível P (◇P) e necessário P (□P) são distinções modais. Os símbolos aqui são convencionais, não um tutorial formal dos grafos Gama.',diagrama:'<p>◇P · □P — comparação com notação modal</p>'}
};

function showPeirce(nivel){const box=document.getElementById('peirce-dashboard');if(!box)return;document.querySelectorAll('.peirce-tab').forEach(b=>b.classList.remove('on'));const btn=document.getElementById('pt-'+nivel);if(btn)btn.classList.add('on');const p=PEIRCE[nivel]||PEIRCE.alfa;box.innerHTML=`<div class="peirce-card"><strong class="mono">${p.titulo}</strong><p style="font-size:.82rem;margin-top:.35rem;color:var(--ink2)">${p.texto}</p><div class="peirce-diagram">${p.diagrama}</div><p style="font-size:.78rem;color:var(--ink3)">💡 ${p.exemplo}</p></div>`}
function aplicarTema(){document.body.classList.toggle('dark',!!(S.config&&S.config.darkMode)); aplicarAcessibilidade()}
function aplicarAcessibilidade(){
  document.body.classList.remove('font-large','font-xlarge');
  const fs = (S.config && S.config.fontSize) || 'normal';
  document.documentElement.style.fontSize = fs === 'large' ? '18px' : fs === 'xlarge' ? '20px' : '16px';
  if (fs === 'large') document.body.classList.add('font-large');
  if (fs === 'xlarge') document.body.classList.add('font-xlarge');
}
function setFontSizeBRIO(size){
  S.config.fontSize = size; salvarEstado(); aplicarAcessibilidade(); renderPerfil();
  toast(size==='normal'?'Letra normal':size==='large'?'Letra maior ativada':'Letra extra grande ativada');
}
let lembreteTimer=null;function agendarLembreteRevisao(){clearTimeout(lembreteTimer);if(window.BRIO_NATIVE?.active)return;if(!S.config||!S.config.lembretes)return;const agora=new Date(),alvo=new Date();alvo.setHours(20,0,0,0);if(alvo<=agora)alvo.setDate(alvo.getDate()+1);lembreteTimer=setTimeout(()=>{toast('⏰ Hora da revisão diária no BRIO!');if('Notification'in window&&Notification.permission==='granted')new Notification('BRIO',{body:'Hora da revisão diária.'});agendarLembreteRevisao()},alvo-agora)}
function configurarPreviewArquivoPost(){const input=document.getElementById('post-arquivo'),status=document.getElementById('post-arquivo-status');if(!input||input._brioReady)return;input._brioReady=true;input.addEventListener('change',()=>{status.textContent=input.files[0]?'Selecionado: '+input.files[0].name:'Nenhum arquivo selecionado.'})}
function extrairLinks(texto){return[...String(texto||'').matchAll(/https?:\/\/[^\s<]+/gi)].map(m=>m[0])}


// ─────────────────────────────────────────────────────────
// 2. ONBOARDING
// ─────────────────────────────────────────────────────────
let obPasso = 0;
function obNext() {
  const passos = document.querySelectorAll('.ob-step');
  const dots   = document.querySelectorAll('.ob-dot');
  passos[obPasso].classList.remove('on');
  dots[obPasso].classList.remove('on');
  obPasso = Math.min(obPasso + 1, passos.length - 1);
  passos[obPasso].classList.add('on');
  dots[obPasso].classList.add('on');
}
function obFinish() {
  const nome = document.getElementById('ob-name').value.trim() || 'Estudante';
  S.nome = nome;
  S.onboarded = true;
  salvarEstado();
  document.getElementById('ob-screen').classList.add('hidden');
  iniciarApp();
}
if (S.onboarded) {
  document.getElementById('ob-screen').classList.add('hidden');
}

// ─────────────────────────────────────────────────────────
// 3. INICIALIZAÇÃO DO APP
// ─────────────────────────────────────────────────────────
function iniciarApp() {
  if (BRIO_PERSIST_RESTORE_DONE) { const hoje = new Date().toDateString(); if (S.ultimoAcesso !== hoje) { S.ultimoAcesso = hoje; S.streakDias = [...S.streakDias.slice(1), true]; salvarEstado(); } }
  aplicarTema();
  setarData();
  atualizarStats();
  renderPARA();
  renderNotas();
  renderFlashcards();
  renderFeed();
  renderGrafo();
  renderIgnorancias();
  renderPerfil();
  renderPomoUI();
  showPeirce('alfa');
  configurarPreviewArquivoPost();
  agendarLembreteRevisao();
  // Um único relógio por instância.
  if (!BRIO_CLOCK_TIMER) BRIO_CLOCK_TIMER = setInterval(setarData, 1000);
}
// Boot movido para depois de todas as declarações.

// ─────────────────────────────────────────────────────────
// 4. SISTEMA PARA
// ─────────────────────────────────────────────────────────
const PARA_CONFIG = {
  projetos: {icon:'📌', label:'Projetos', cor:'var(--red)',   desc:'Com prazo e resultado definido'},
  areas:    {icon:'🗂',  label:'Áreas',    cor:'var(--yellow)',desc:'Responsabilidades contínuas'},
  recursos: {icon:'📚', label:'Recursos', cor:'var(--green2)',desc:'Referências e interesses'},
  arquivo:  {icon:'🗃',  label:'Arquivo',  cor:'var(--ink3)', desc:'Material inativo ou concluído'}
};

function renderPARA() {
  const cont = document.getElementById('para-lista');
  if (!cont) return;
  cont.innerHTML = Object.entries(PARA_CONFIG).map(([k, cfg]) => {
    const items = S.pkm[k] || [];
    return `
      <div class="folder" id="folder-${k}">
        <div class="folder-head" role="button" tabindex="0" aria-expanded="false" aria-controls="body-${k}" onclick="toggleFolder('${k}')">
          <span class="fh-icon">${cfg.icon}</span>
          <span class="fh-label" style="color:${cfg.cor}">${cfg.label}</span>
          <span style="font-size:.72rem;color:var(--ink3);margin-right:.25rem">${cfg.desc}</span>
          <span class="fh-count">${items.length}</span>
          <span class="fh-arrow" id="arrow-${k}">▶</span>
        </div>
        <div class="folder-body" id="body-${k}">
          <button class="btn btn-sm btn-g btn-full" style="margin-bottom:.5rem" onclick="abrirAddPKMPasta('${k}','${cfg.label}')">
            + Adicionar em ${cfg.label}
          </button>
          ${items.length ? items.map(it => `
            <div class="p-item" id="pitem-${escHtml(it.id)}">
              <div class="p-dot" style="background:${cfg.cor};border-color:${cfg.cor}"></div>
              <div class="p-txt">
                <div class="p-title">${escHtml(it.titulo)}</div>
                ${it.desc ? `<div class="p-sub">${escHtml(it.desc)}</div>` : ''}
              </div>
              <button class="btn btn-xs" onclick="BRIO_RECORDS.editPara('${k}',${BRIO_arg(it.id)})">Editar</button>
              <button class="p-del" aria-label="Arquivar ${escHtml(it.titulo)}" onclick="deletarItemPKM('${k}',${BRIO_arg(it.id)},event)">✕</button>
            </div>`).join('') :
            `<div class="empty-msg">Nenhum item ainda</div>`}
        </div>
      </div>`;
  }).join('');
}

function toggleFolder(k) {
  const body  = document.getElementById('body-' + k);
  const arrow = document.getElementById('arrow-' + k);
  const open  = body.classList.contains('open');
  body.classList.toggle('open', !open);
  document.querySelector('#folder-'+k+' .folder-head')?.setAttribute('aria-expanded',String(!open));
  if (arrow) arrow.classList.toggle('open', !open);
}

function abrirAddPKM() {
  document.getElementById('pkm-modal-titulo').textContent = '+ Novo item';
  document.getElementById('pkm-pasta-alvo').value = 'recursos';
  document.getElementById('pkm-titulo').value = '';
  document.getElementById('pkm-desc').value = '';
  openModal('modal-pkm-add');
}
function abrirAddPKMPasta(pasta, label) {
  document.getElementById('pkm-modal-titulo').textContent = `+ Adicionar em ${label}`;
  document.getElementById('pkm-pasta-alvo').value = pasta;
  document.getElementById('pkm-titulo').value = '';
  document.getElementById('pkm-desc').value = '';
  openModal('modal-pkm-add');
}
function salvarItemPKM() {
  const titulo = document.getElementById('pkm-titulo').value.trim();
  if (!titulo) { toast('❌ Digite um título!'); return; }
  const pasta = document.getElementById('pkm-pasta-alvo').value;
  const item = { id: ++S.nextId, titulo, desc: document.getElementById('pkm-desc').value.trim() };
  S.pkm[pasta].push(item);
  xpGanhar(5);
  salvarEstado();
  renderPARA();
  closeModal('modal-pkm-add');
  toast('✅ Item adicionado ao ' + PARA_CONFIG[pasta].label + '!');
}
function deletarItemPKM(pasta, id, e) {
  e?.stopPropagation();
  window.BRIO_RECORDS?.archive('pkm:'+pasta,S.pkm[pasta].find(x=>x.id===id));
  S.pkm[pasta] = S.pkm[pasta].filter(x => x.id !== id);
  salvarEstado();
  renderPARA();
  toast('Item removido');
}

// ─────────────────────────────────────────────────────────
// 5. NOTAS
// ─────────────────────────────────────────────────────────
let conexoesPendentes = [];
let notaAtualId = null;

function addConexao() {
  const v = document.getElementById('nn-conn-input').value.trim();
  if (!v) return;
  if (!conexoesPendentes.includes(v)) conexoesPendentes.push(v);
  document.getElementById('nn-conn-input').value = '';
  renderConexoesPendentes();
}
function renderConexoesPendentes() {
  const c = document.getElementById('nn-conn-lista');
  if (!c) return;
  c.innerHTML = conexoesPendentes.map((cn, i) =>
    `<div class="conn-pill" onclick="removerConn(${i})">🔗 ${escHtml(cn)} ✕</div>`
  ).join('');
}
function removerConn(i) {
  conexoesPendentes.splice(i, 1);
  renderConexoesPendentes();
}

function salvarNotaRapida() {
  const titulo  = document.getElementById('nr-titulo').value.trim();
  const conteudo = document.getElementById('nr-corpo').value.trim();
  const pasta   = document.getElementById('nr-pasta').value;
  if (!titulo && !conteudo) { toast('❌ Escreva algo antes de salvar!'); return; }
  const nota = {
    id: gerarId('n'),
    titulo: titulo || 'Nota rápida',
    conteudo, pasta,
    data: new Date().toLocaleDateString('pt-BR'),
    interp:'', contexto:'', limite:'', contra:'', emocao:'',
    conexoes: []
  };
  S.notas.unshift(nota);
  xpGanhar(10);
  salvarEstado();
  renderNotas();
  atualizarStats();
  closeModal('modal-nota-rapida');
  document.getElementById('nr-titulo').value = '';
  document.getElementById('nr-corpo').value  = '';
  toast('✅ Nota salva! +10 XP ✍️');
}

function salvarNotaProfunda() {
  const titulo = document.getElementById('nn-titulo').value.trim();
  if (!titulo) { toast('❌ Dê um título à nota!'); return; }
  const nota = {
    id: gerarId('n'),
    titulo,
    conteudo:  document.getElementById('nn-conteudo').value.trim(),
    interp:    document.getElementById('nn-interp').value.trim(),
    contexto:  document.getElementById('nn-contexto').value.trim(),
    limite:    document.getElementById('nn-limite').value.trim(),
    contra:    document.getElementById('nn-contra').value.trim(),
    emocao:    document.getElementById('nn-emocao').value.trim(),
    conexoes:  [...conexoesPendentes],
    pasta:     document.getElementById('nn-pasta').value,
    data:      new Date().toLocaleDateString('pt-BR')
  };
  S.notas.unshift(nota);
  xpGanhar(20);

  // auto flashcard
  if (document.getElementById('opt-fc-auto')?.checked && nota.conteudo) {
    const fcs = gerarFlashcardsLocalDaNota(nota);
    fcs.forEach(f => S.flashcards.push(f));
    if (fcs.length) toast(`🃏 ${fcs.length} flashcard(s) gerado(s) automaticamente!`, 3000);
  }
  // auto grafo
  if (document.getElementById('opt-grafo-auto')?.checked) {
    S.grafo.nos.push({
      id: gerarId('g'),
      label: nota.titulo.substring(0, 22),
      x: 20 + Math.random() * 60,
      y: 20 + Math.random() * 60
    });
  }

  salvarEstado();
  renderNotas();
  renderFlashcards();
  atualizarStats();
  closeModal('modal-nota-nova');
  // limpar campos
  ['nn-titulo','nn-conteudo','nn-interp','nn-contexto','nn-limite','nn-contra','nn-emocao'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  conexoesPendentes = [];
  renderConexoesPendentes();
  toast('✅ Nota profunda salva! +20 XP 🧠');
}

// Gera flashcards localmente a partir da nota (sem IA externa)
function gerarFlashcardsLocalDaNota(nota) {
  const cards = [];
  if (nota.conteudo && nota.conteudo.length > 20) {
    cards.push({
      id: gerarId('fc'),
      pergunta: `O que você sabe sobre: "${nota.titulo}"?`,
      resposta: nota.conteudo.substring(0, 300),
      cat: nota.pasta === 'recursos' ? 'estudo' : 'geral',
      facilidade: 0, proximaRevisao: 0, revisoes: 0
    });
  }
  if (nota.limite) {
    cards.push({
      id: gerarId('fc'),
      pergunta: `Qual a limitação principal da ideia "${nota.titulo}"?`,
      resposta: nota.limite,
      cat: 'estudo', facilidade: 0, proximaRevisao: 0, revisoes: 0
    });
  }
  if (nota.contra) {
    cards.push({
      id: gerarId('fc'),
      pergunta: `Dê um contraexemplo para "${nota.titulo}":`,
      resposta: nota.contra,
      cat: 'estudo', facilidade: 0, proximaRevisao: 0, revisoes: 0
    });
  }
  return cards.slice(0, 3);
}

function renderNotas() {
  const cont = document.getElementById('notas-lista');
  if (!cont) return;
  if (!S.notas.length) {
    cont.innerHTML = '<div class="empty-msg">Nenhuma nota ainda.<br>Crie sua primeira!</div>';
    return;
  }
  cont.innerHTML = S.notas.map(n => {
    const tags = [];
    if (n.emocao)   tags.push('<span class="tag tag-y">💛 emoção</span>');
    if (n.conexoes?.length) tags.push(`<span class="tag tag-b">🔗 ${n.conexoes.length}</span>`);
    if (n.limite)   tags.push('<span class="tag tag-r">⚠️ limite</span>');
    return `
      <div class="note-card" onclick="verNota(${BRIO_arg(n.id)})">
        <div class="note-head">
          <div style="flex:1">
            <div class="note-title">${escHtml(n.titulo)}</div>
            <div class="note-meta">${escHtml(n.data || '')} · ${escHtml(PARA_CONFIG[n.pasta]?.label || n.pasta || '')}</div>
          </div>
        </div>
        ${n.conteudo ? `<div class="note-preview">${escHtml(n.conteudo)}</div>` : ''}
        ${tags.length ? `<div class="note-tags">${tags.join('')}</div>` : ''}
      </div>`;
  }).join('');
}

function verNota(id) {
  const n = S.notas.find(x => x.id === id);
  if (!n) return;
  notaAtualId = id;
  document.getElementById('vn-titulo').textContent = n.titulo;
  const campos = [
    ['📖 Conteúdo', n.conteudo],
    ['🔍 Interpretação', n.interp],
    ['🌍 Contexto', n.contexto],
    ['⚠️ Limitações', n.limite],
    ['❌ Contraexemplo', n.contra],
    ['💛 Emoção', n.emocao]
  ].filter(([, v]) => v);
  document.getElementById('vn-corpo').innerHTML = `
    <p class="mono" style="font-size:.68rem;color:var(--ink3);margin-bottom:.85rem">${escHtml(n.data || '')} · ${escHtml(PARA_CONFIG[n.pasta]?.label || n.pasta || '')}</p>
    ${campos.map(([l, v]) => `
      <div style="margin-bottom:.85rem">
        <div class="mono" style="font-size:.68rem;font-weight:700;color:var(--ink2);margin-bottom:.25rem;text-transform:uppercase;letter-spacing:.06em">${l}</div>
        <div style="font-size:.87rem;line-height:1.65;color:var(--ink2)">${escHtml(v)}</div>
      </div>`).join('')}
    ${n.conexoes?.length ? `
      <div style="margin-top:.75rem">
        <div class="mono" style="font-size:.68rem;font-weight:700;color:var(--ink2);margin-bottom:.35rem">🔗 CONEXÕES</div>
        <div style="display:flex;flex-wrap:wrap;gap:.25rem">${n.conexoes.map(c => `<div class="conn-pill">${escHtml(c)}</div>`).join('')}</div>
      </div>` : ''}`;
  openModal('modal-ver-nota');
}

function deletarNotaAtual() {
  if(window.BRIO_NOTES)BRIO_NOTES.trash(notaAtualId);
  else toast('A proteção de notas ainda está carregando. Tente novamente.');
}

function gerarFlashcardDaNota() {
  const n = S.notas.find(x => x.id === notaAtualId);
  if (!n) return;
  const fcs = gerarFlashcardsLocalDaNota(n);
  if (!fcs.length) { toast('❌ Nota sem conteúdo suficiente para gerar flashcards'); return; }
  fcs.forEach(f => S.flashcards.push(f));
  xpGanhar(5);
  salvarEstado();
  renderFlashcards();
  atualizarStats();
  closeModal('modal-ver-nota');
  toast(`🃏 ${fcs.length} flashcard(s) gerado(s)! +5 XP`);
}

// ─────────────────────────────────────────────────────────
// 6. FLASHCARDS + REPETIÇÃO ESPAÇADA
// ─────────────────────────────────────────────────────────
let filaEstudo = [];
let cardAtual  = null;
let cardVirado = false;

// Intervalos em dias por facilidade: 0=difícil, 1=ok, 2=fácil
const INTERVALOS = [1, 3, 7];

function iniciarEstudo() {
  const agora = Date.now();
  filaEstudo = S.flashcards.filter(c => c.proximaRevisao <= agora);
  if (!filaEstudo.length) {
    filaEstudo = [...S.flashcards].slice(0, Math.min(5, S.flashcards.length));
  }
  cardVirado = false;
  renderCardAtual();
}

function renderFlashcards() {
  // Área de estudo
  const area = document.getElementById('fc-estudo');
  if (!area) return;
  const agora = Date.now();
  const paraRevisar = S.flashcards.filter(c => c.proximaRevisao <= agora);
  if (!S.flashcards.length) {
    area.innerHTML = '<div class="empty-msg">Crie seu primeiro flashcard!</div>';
  } else if (!filaEstudo.length && !cardAtual) {
    area.innerHTML = `
      <div class="empty-msg" style="margin-bottom:.75rem">
        ✨ ${paraRevisar.length} card(s) para revisar agora
      </div>
      <button class="btn btn-b btn-full btn-lg" onclick="iniciarEstudo()">▶ Iniciar revisão</button>`;
  }
  // Lista de todos os cards
  const lista = document.getElementById('fc-lista');
  if (!lista) return;
  if (!S.flashcards.length) { lista.innerHTML = ''; return; }
  lista.innerHTML = S.flashcards.map(c => `
    <div class="fc-mini">
      <div class="p-dot" style="background:var(--yellow);border-color:var(--yellow);flex-shrink:0;margin-top:0"></div>
      <div class="fc-mini-q">${escHtml(c.pergunta)}</div>
      <span class="tag">${escHtml(c.cat || 'geral')}</span>
      <button class="btn btn-xs" onclick="BRIO_RECORDS.editCard(${BRIO_arg(c.id)})">Editar</button>
      <button class="p-del" style="opacity:1" aria-label="Arquivar flashcard" onclick="deletarCard(${BRIO_arg(c.id)},event)">✕</button>
    </div>`).join('');
}

function renderCardAtual() {
  const area = document.getElementById('fc-estudo');
  if (!area) return;
  if (!filaEstudo.length) {
    area.innerHTML = `
      <div class="alert alert-g" style="text-align:center;padding:1.25rem">
        🎉 Revisão completa! Muito bem!
      </div>
      <button class="btn btn-b btn-full" onclick="iniciarEstudo()">▶ Estudar todos</button>`;
    cardAtual = null;
    return;
  }
  cardAtual  = filaEstudo[0];
  cardVirado = false;
  const total = S.flashcards.length;
  const prog  = total - filaEstudo.length + 1;
  area.innerHTML = `
    <div class="mono" style="font-size:.65rem;color:var(--ink3);text-align:center;margin-bottom:.4rem">${prog}/${total} · ${escHtml(cardAtual.cat || 'geral')}</div>
    <div class="fc-stage">
      <div class="fc-card" id="fc-ativo" onclick="virarCard()">
        <div class="fc-face" id="fc-frente">
          <div class="fc-side-label">Pergunta</div>
          <div class="fc-text">${escHtml(cardAtual.pergunta)}</div>
          <div class="fc-hint">toque para revelar a resposta</div>
        </div>
        <div class="fc-face fc-back" id="fc-verso">
          <div class="fc-side-label">Resposta</div>
          <div class="fc-text" style="font-size:.95rem">${escHtml(cardAtual.resposta)}</div>
        </div>
      </div>
    </div>
    <div class="rate-row" id="rate-area" style="display:none">
      <div class="rate-btn hard" onclick="avaliarCard(0)">😰<br>Difícil<br><span style="font-size:.62rem">+1 dia</span></div>
      <div class="rate-btn ok"   onclick="avaliarCard(1)">🤔<br>Ok<br><span style="font-size:.62rem">+3 dias</span></div>
      <div class="rate-btn easy" onclick="avaliarCard(2)">😊<br>Fácil<br><span style="font-size:.62rem">+7 dias</span></div>
    </div>`;
}

function virarCard() {
  if (!cardAtual) return;
  cardVirado = !cardVirado;
  BRIO_SFX.play('flip');
  const el = document.getElementById('fc-ativo');
  if (el) el.classList.toggle('flipped', cardVirado);
  const ra = document.getElementById('rate-area');
  if (ra) ra.style.display = cardVirado ? 'grid' : 'none';
}

function avaliarCard(facilidade) {
  if (!cardAtual || !cardVirado || ![0,1,2].includes(facilidade)) return;
  const c = S.flashcards.find(x => x.id === cardAtual.id);
  if (c) {
    c.facilidade   = facilidade;
    c.revisoes     = (c.revisoes || 0) + 1;
    c.proximaRevisao = Date.now() + INTERVALOS[facilidade] * 86400000;
  }
  filaEstudo.shift();
  xpGanhar(3);
  salvarEstado();
  renderCardAtual();
  renderFlashcards();
}

function salvarFlashcard() {
  const p = document.getElementById('fc-pergunta').value.trim();
  const r = document.getElementById('fc-resposta').value.trim();
  if (!p || !r) { toast('❌ Preencha pergunta e resposta!'); return; }
  S.flashcards.push({
    id: gerarId('fc'),
    pergunta: p, resposta: r,
    cat: document.getElementById('fc-cat').value,
    facilidade: 0, proximaRevisao: 0, revisoes: 0
  });
  xpGanhar(5);
  salvarEstado();
  renderFlashcards();
  atualizarStats();
  closeModal('modal-fc-novo');
  document.getElementById('fc-pergunta').value = '';
  document.getElementById('fc-resposta').value = '';
  toast('🃏 Flashcard criado! +5 XP');
}

function deletarCard(id, e) {
  e?.stopPropagation();
  window.BRIO_RECORDS?.archive('card',S.flashcards.find(c=>c.id===id));
  filaEstudo=[];cardAtual=null;
  S.flashcards = S.flashcards.filter(c => c.id !== id);
  salvarEstado();
  renderFlashcards();
  atualizarStats();
  toast('Card removido');
}

// ─────────────────────────────────────────────────────────
// 7. GRAFO COGNITIVO
// ─────────────────────────────────────────────────────────
let grafoMode    = 'add';
let noSelecionado = null;
let arrastandoNo  = null;
let BRIO_GRAPH_POINTER = null;
let dragOffset    = {x:0, y:0};
let BRIO_GRAPH_INDEX=new Map(),BRIO_GRAPH_LINES=new Map(),BRIO_GRAPH_DRAG=null,BRIO_GRAPH_FRAME=null;
let BRIO_GRAPH_PAINTS=0;

function renderGrafo() {
  const canvas = document.getElementById('grafo-canvas');
  if (!canvas) return;
  BRIO_endGraphDrag();
  const focused=document.activeElement?.classList.contains('gnode')?document.activeElement.dataset.id:null;
  BRIO_GRAPH_INDEX=new Map(S.grafo.nos.map(n=>[String(n.id),n]));BRIO_GRAPH_LINES=new Map();
  const W = canvas.offsetWidth  || 320;
  const H = canvas.offsetHeight || 310;

  // Limpar canvas
  canvas.innerHTML = '';

  // SVG de arestas
  const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.classList.add('gsvg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

  S.grafo.arestas.forEach(([a, b]) => {
    const na = BRIO_GRAPH_INDEX.get(String(a));
    const nb = BRIO_GRAPH_INDEX.get(String(b));
    if (!na || !nb) return;
    const line = document.createElementNS('http://www.w3.org/2000/svg','line');
    line.setAttribute('x1', (na.x / 100) * W);
    line.setAttribute('y1', (na.y / 100) * H);
    line.setAttribute('x2', (nb.x / 100) * W);
    line.setAttribute('y2', (nb.y / 100) * H);
    line.setAttribute('stroke', 'var(--bdr2)');
    line.setAttribute('stroke-width', '2');
    line.setAttribute('stroke-dasharray', '5,4');
    svg.appendChild(line);
    for(const id of [a,b]){const key=String(id);if(!BRIO_GRAPH_LINES.has(key))BRIO_GRAPH_LINES.set(key,[]);BRIO_GRAPH_LINES.get(key).push({line,na,nb});}
  });
  canvas.appendChild(svg);

  // Nós
  S.grafo.nos.forEach(no => {
    const div = document.createElement('div');
    const kind = no.kind || 'beta';
    div.className = 'gnode ' + kind +
      (no.id === noSelecionado ? ' sel' : '') +
      (no.id === S.grafo.nos[0]?.id ? ' hub' : '');
    const kindIcon = kind === 'alfa' ? '⊖' : kind === 'gama' ? '◇' : '↔';
    div.innerHTML = `<span class="gkind">${kindIcon}</span>${escHtml(no.label)}`;
    div.style.left  = no.x + '%';
    div.style.top   = no.y + '%';
    div.dataset.id  = no.id;
    div.tabIndex=0;div.setAttribute('role','button');div.setAttribute('aria-label',no.label+'; conceito '+kind+'. Enter seleciona; setas movem.');div.setAttribute('aria-pressed',String(no.id===noSelecionado));
    div.addEventListener('pointerdown', iniciarArrastar);
    div.addEventListener('click', clicarNo);
    div.addEventListener('keydown',e=>{if(BRIO_READ_ONLY)return;if(e.key==='Enter'||e.key===' '){e.preventDefault();div.click();}else if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();const n=BRIO_GRAPH_INDEX.get(div.dataset.id),step=e.shiftKey?5:1;if(e.key==='ArrowLeft')n.x=Math.max(4,n.x-step);if(e.key==='ArrowRight')n.x=Math.min(96,n.x+step);if(e.key==='ArrowUp')n.y=Math.max(4,n.y-step);if(e.key==='ArrowDown')n.y=Math.min(96,n.y+step);BRIO_paintGraphNode(n,div,canvas.offsetWidth||320,canvas.offsetHeight||310);}});
    div.addEventListener('keyup',e=>{if(e.key.startsWith('Arrow'))salvarEstado();});
    canvas.appendChild(div);
    if(focused===String(no.id))div.focus({preventScroll:true});
  });

  // Relações
  const rl = document.getElementById('grafo-relacoes');
  if (rl) {
    if (!S.grafo.arestas.length) {
      rl.textContent = 'Nenhuma relação ainda. Adicione nós e conecte-os.';
    } else {
      rl.innerHTML = S.grafo.arestas.map(([a, b]) => {
        const na = BRIO_GRAPH_INDEX.get(String(a))?.label || a;
        const nb = BRIO_GRAPH_INDEX.get(String(b))?.label || b;
        return `<div>• ${escHtml(na)} ↔ ${escHtml(nb)} <span style="color:var(--ink3)">(ligação conceitual do BRIO)</span></div>`;
      }).join('');
    }
  }
}

function clicarNo(e) {
  const id = e.currentTarget.dataset.id;
  if (grafoMode === 'connect') {
    if (!noSelecionado) {
      noSelecionado = id;
      toast('Agora clique no 2º nó para conectar');
      renderGrafo();
      return;
    }
    if (noSelecionado !== id) {
      const existe = S.grafo.arestas.some(
        ([a, b]) => (a === id && b === noSelecionado) || (a === noSelecionado && b === id)
      );
      if (!existe) S.grafo.arestas.push([noSelecionado, id]);
      noSelecionado = null;
      grafoMode = 'add';
      document.getElementById('btn-conectar').classList.remove('btn-b');
      salvarEstado();
      renderGrafo();
      toast('✅ Conexão criada!');
    }
  } else if (grafoMode === 'select') {
    noSelecionado = id; grafoMode = 'add'; renderGrafo(); toast('Nó selecionado. Agora escolha Alfa, Beta, Gama ou Editar.');
  } else if (grafoMode === 'delete') {
    window.BRIO_RECORDS?.archive('graph',S.grafo);
    S.grafo.nos    = S.grafo.nos.filter(n => n.id !== id);
    S.grafo.arestas = S.grafo.arestas.filter(([a, b]) => a !== id && b !== id);
    grafoMode = 'add';
    document.getElementById('btn-deletar').classList.remove('btn-r');
    salvarEstado();
    renderGrafo();
    toast('Nó removido');
  } else {
    noSelecionado = (noSelecionado === id ? null : id);
    renderGrafo();
    if (noSelecionado) toast('Nó selecionado. Você pode editar, conectar ou marcar Alfa/Beta/Gama.');
  }
}

function iniciarArrastar(e) {
  if (grafoMode !== 'add'||BRIO_READ_ONLY||e.button!==0||arrastandoNo) return;
  arrastandoNo = e.currentTarget.dataset.id;
  BRIO_GRAPH_POINTER=e.pointerId;
  const canvas = document.getElementById('grafo-canvas');
  const rect   = canvas.getBoundingClientRect();
  const cl     = e.changedTouches ? e.changedTouches[0] : e;
  const no     = BRIO_GRAPH_INDEX.get(arrastandoNo);
  if (!no) return;
  dragOffset.x = (no.x / 100 * rect.width)  - (cl.clientX - rect.left);
  dragOffset.y = (no.y / 100 * rect.height) - (cl.clientY - rect.top);
  BRIO_GRAPH_DRAG={no,element:e.currentTarget,rect};
  e.preventDefault();
}

document.addEventListener('pointermove', e => {
  if (!BRIO_GRAPH_DRAG||e.pointerId!==BRIO_GRAPH_POINTER||BRIO_READ_ONLY) return;
  const {no,rect}=BRIO_GRAPH_DRAG,cl=e;
  no.x = Math.max(4, Math.min(96, ((cl.clientX - rect.left + dragOffset.x) / rect.width)  * 100));
  no.y = Math.max(4, Math.min(96, ((cl.clientY - rect.top  + dragOffset.y) / rect.height) * 100));
  if(BRIO_GRAPH_FRAME===null)BRIO_GRAPH_FRAME=requestAnimationFrame(()=>{BRIO_GRAPH_FRAME=null;if(BRIO_GRAPH_DRAG){const {no,element,rect}=BRIO_GRAPH_DRAG;BRIO_paintGraphNode(no,element,rect.width,rect.height);}});
});
function BRIO_paintGraphNode(no,element,width,height){BRIO_GRAPH_PAINTS++;element.style.left=no.x+'%';element.style.top=no.y+'%';for(const {line,na,nb}of BRIO_GRAPH_LINES.get(String(no.id))||[]){line.setAttribute('x1',na.x/100*width);line.setAttribute('y1',na.y/100*height);line.setAttribute('x2',nb.x/100*width);line.setAttribute('y2',nb.y/100*height);}}

function BRIO_endGraphDrag(event){
  if(event?.pointerId!==undefined&&event.pointerId!==BRIO_GRAPH_POINTER)return;
  if(!arrastandoNo)return;
  if(BRIO_GRAPH_FRAME!==null){cancelAnimationFrame(BRIO_GRAPH_FRAME);BRIO_GRAPH_FRAME=null;}
  if(BRIO_GRAPH_DRAG){const {no,element,rect}=BRIO_GRAPH_DRAG;BRIO_paintGraphNode(no,element,rect.width,rect.height);BRIO_GRAPH_DRAG=null;}
  arrastandoNo=null;BRIO_GRAPH_POINTER=null;salvarEstado();
}
document.addEventListener('pointerup',BRIO_endGraphDrag);
document.addEventListener('pointercancel',BRIO_endGraphDrag);
window.addEventListener('blur',()=>BRIO_endGraphDrag());
window.addEventListener('resize',()=>BRIO_endGraphDrag());

function addGrafoNode() {
  const label = prompt('Nome do nó (conceito ou ideia):');
  if (!label || !label.trim()) return;
  S.grafo.nos.push({
    id: gerarId('g'),
    label: label.trim().substring(0, 28),
    x: 25 + Math.random() * 50,
    y: 20 + Math.random() * 60
  });
  salvarEstado();
  renderGrafo();
  toast('Nó adicionado!');
}

function toggleGrafoMode(modo) {
  if (grafoMode === modo) {
    grafoMode = 'add';
    document.getElementById('btn-conectar').classList.remove('btn-b');
    document.getElementById('btn-deletar').classList.remove('btn-r');
    noSelecionado = null;
    toast('Modo normal');
  } else {
    grafoMode = modo;
    document.getElementById('btn-conectar').classList.toggle('btn-b', modo === 'connect');
    document.getElementById('btn-deletar').classList.toggle('btn-r', modo === 'delete');
    if (modo === 'connect') toast('Clique em um nó para iniciar conexão');
    if (modo === 'delete')  toast('Clique em um nó para removê-lo');
    noSelecionado = null;
  }
  renderGrafo();
}


function getNoSelecionadoOuPedir() {
  if (noSelecionado && S.grafo.nos.some(n => n.id === noSelecionado)) return noSelecionado;
  if (!S.grafo.nos.length) { toast('Crie um nó primeiro.'); return null; }
  toast('Toque em um nó para selecioná-lo, depois escolha Alfa/Beta/Gama.');
  grafoMode = 'select';
  return null;
}

function setGrafoKind(kind) {
  const id = getNoSelecionadoOuPedir();
  if (!id) return;
  const no = S.grafo.nos.find(n => n.id === id); if (!no) return;
  no.kind = kind;
  salvarEstado(); renderGrafo();
  const msg = kind === 'alfa' ? 'Marca local Alfa: contraste. Não é um corte formal de Peirce.' : kind === 'beta' ? 'Marca local Beta: relação. Não implementa quantificação.' : 'Marca local Gama: hipótese. Não é notação modal formal.';
  toast(msg, 3200);
}

function editarGrafoNode() {
  let id = noSelecionado;
  if (!id || !S.grafo.nos.some(n => n.id === id)) {
    toast('Toque em um nó para selecionar e depois clique em Editar.');
    grafoMode = 'select';
    return;
  }
  const no = S.grafo.nos.find(n => n.id === id); if (!no) return;
  const novo = prompt('Editar nome do nó:', no.label);
  if (!novo || !novo.trim()) return;
  no.label = novo.trim().substring(0, 32);
  salvarEstado(); renderGrafo(); toast('Nó editado.');
}



function clearGrafo() {
  if (!confirm('Limpar todos os nós e conexões do grafo?')) return;
  S.grafo = { nos:[], arestas:[] };
  salvarEstado();
  renderGrafo();
  toast('Grafo limpo');
}

// ─────────────────────────────────────────────────────────
// 8. POMODORO
// ─────────────────────────────────────────────────────────
let pomoTimer = null;

const FASES = {
  foco:   { tempo: 25*60, cor: 'var(--blue)', label: 'FOCO' },
  pausa:  { tempo:  5*60, cor: 'var(--green)', label: 'PAUSA CURTA' },
  grande: { tempo: 15*60, cor: 'var(--green2)', label: 'PAUSA LONGA' }
};

function renderPomoUI() {
  const fase = FASES[S.pomo.fase] || FASES.foco;
  const r = S.pomo.restante;
  const min = Math.floor(r / 60);
  const sec = r % 60;
  const disp = document.getElementById('pomo-display');
  const fase_el = document.getElementById('pomo-fase');
  if (disp) disp.textContent = `${String(min).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  if (fase_el) fase_el.textContent = fase.label;

  // Arco SVG
  const total  = fase.tempo;
  const pct    = 1 - (r / total);
  const circ   = Math.PI * 2 * 86; // r=86
  const arco   = document.getElementById('pomo-arco');
  if (arco) {
    arco.style.strokeDashoffset = circ * (1 - pct);
    arco.style.stroke = fase.cor;
  }

  const btn = document.getElementById('pomo-btn');
  if (btn) btn.textContent = S.pomo.rodando ? '⏸ Pausar' : '▶ Iniciar';
}

let BRIO_POMO_DEADLINE=0;
function BRIO_tickPomo(){
  if(!S.pomo.rodando||!BRIO_POMO_DEADLINE)return;
  // Um callback atrasado deve refletir o tempo decorrido, sem perder segundos.
  S.pomo.restante=Math.max(0,Math.ceil((BRIO_POMO_DEADLINE-Date.now())/1000));
  if(S.pomo.restante<=0){
    clearInterval(pomoTimer);BRIO_POMO_DEADLINE=0;S.pomo.rodando=false;
    const eraSess=S.pomo.fase==='foco';
    if(eraSess)S.pomo.sessoes=(S.pomo.sessoes||0)+1;
    S.pomo.fase=eraSess?(S.pomo.sessoes%4===0?'grande':'pausa'):'foco';
    S.pomo.restante=FASES[S.pomo.fase].tempo;
    if(eraSess){xpGanhar(15);toast('🎉 Sessão concluída! +15 XP');}
    else toast('✅ Pausa encerrada. Vamos lá!');
    BRIO_SFX.play('done');
    salvarEstado();
  }
  renderPomoUI();
}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')BRIO_tickPomo();});
function togglePomo() {
  if (S.pomo.rodando) {
    BRIO_tickPomo();
    clearInterval(pomoTimer);
    BRIO_POMO_DEADLINE=0;
    S.pomo.rodando = false;
    salvarEstado();
    renderPomoUI();
  } else {
    S.pomo.rodando = true;
    BRIO_POMO_DEADLINE=Date.now()+S.pomo.restante*1000;
    pomoTimer = setInterval(BRIO_tickPomo,1000);
    salvarEstado();
    renderPomoUI();
  }
}

function resetPomo() {
  clearInterval(pomoTimer);
  BRIO_POMO_DEADLINE=0;
  S.pomo = { ...S.pomo, rodando: false, fase: 'foco', restante: 25*60 };
  salvarEstado();
  renderPomoUI();
  document.getElementById('pomo-btn').textContent = '▶ Iniciar';
}

function iniciarSemConsulta() {
  const tema = document.getElementById('sem-consulta-tema').value.trim();
  if (!tema) { toast('❌ Digite um tema para testar!'); return; }
  document.getElementById('sc-desafio').innerHTML = `
    <strong class="mono" style="font-size:.7rem;letter-spacing:.08em">DESAFIO:</strong><br>
    Explique com suas palavras o que você sabe sobre <strong>"${escHtml(tema)}"</strong>.<br>
    Não consulte notas nem internet.`;
  document.getElementById('sc-resposta').value = '';
  openModal('modal-sem-consulta');
}

function enviarSemConsulta() {
  const r = document.getElementById('sc-resposta').value.trim();
  if (!r) { toast('❌ Escreva sua resposta!'); return; }
  // Salvar como nota de reflexão
  S.notas.unshift({
    id: gerarId('n'),
    titulo: 'Sessão Mental — ' + new Date().toLocaleDateString('pt-BR'),
    conteudo: r,
    pasta: 'arquivo',
    data: new Date().toLocaleDateString('pt-BR'),
    interp: 'Resposta espontânea sem consulta', contexto:'', limite:'', contra:'', emocao:'',
    conexoes: []
  });
  xpGanhar(10);
  salvarEstado();
  renderNotas();
  atualizarStats();
  closeModal('modal-sem-consulta');
  toast('🧠 Resposta registrada como nota! +10 XP');
}

// ─────────────────────────────────────────────────────────
// 9. FEED
// ─────────────────────────────────────────────────────────


function salvarPostComoNota(id) {
  const p = BRIO_getPost(id);
  if (!p) return;
  S.notas.unshift({
    id: gerarId('n'),
    titulo: 'Do feed: ' + p.corpo.substring(0, 42) + (p.corpo.length > 42 ? '...' : ''),
    conteudo: p.corpo,
    pasta: 'recursos',
    data: new Date().toLocaleDateString('pt-BR'),
    interp:'', contexto:'', limite:'', contra:'', emocao:'',
    conexoes: []
  });
  xpGanhar(5);
  salvarEstado();
  renderNotas();
  atualizarStats();
  toast('📝 Salvo como nota! +5 XP');
}

function gerarFCDoPost(id) {
  const p = BRIO_getPost(id);
  if (!p) return;
  S.flashcards.push({
    id: gerarId('fc'),
    pergunta: p.pergunta || `O que você aprendeu com: "${p.corpo.substring(0,50)}"?`,
    resposta: p.corpo,
    cat: 'geral', facilidade: 0, proximaRevisao: 0, revisoes: 0
  });
  xpGanhar(5);
  salvarEstado();
  renderFlashcards();
  atualizarStats();
  toast('🃏 Flashcard criado! +5 XP');
}

const TIPO_LABEL = {reflexao:'💭 Reflexão', insight:'💡 Insight', resumo:'📖 Resumo', duvida:'❓ Dúvida'};



// ─────────────────────────────────────────────────────────
// 10. PISTAS LINGUÍSTICAS — HEURÍSTICAS LOCAIS
// ─────────────────────────────────────────────────────────

// Padrões linguísticos para detecção de vieses
const PADROES_VIES = [
  {
    nome: 'Linguagem Absoluta',
    cor: 'var(--red)',
    regex: /\b(sempre|nunca|jamais|todos|ninguém|todo mundo|nenhum|absolutamente|impossível|inevitável|com certeza|certamente|obviamente|evidentemente|necessariamente|definitivamente|sem dúvida|claro que|é óbvio)\b/gi,
    explicacao: 'Usa termos que não admitem exceções, nuances ou contextos alternativos. Isso fragiliza a argumentação, pois realidades complexas raramente são absolutas.',
    dica: 'Substitua por linguagem mais precisa: "frequentemente", "na maioria dos casos", "em geral".'
  },
  {
    nome: 'Generalização Apressada',
    cor: 'var(--yellow)',
    regex: /\b(todo(s| o)? [a-záàâãéêíóôõúç]+ (são|é)|qualquer [a-záàâãéêíóôõúç]+ (é|são)|isso (sempre|nunca) acontece|típico de|eles (sempre|nunca|todos)|as pessoas (sempre|nunca))\b/gi,
    explicacao: 'Aplica características de casos particulares a grupos inteiros, sem evidência suficiente.',
    dica: 'Especifique o contexto: "alguns", "em determinadas situações", "segundo tal estudo..."'
  },
  {
    nome: 'Apelo à Autoridade Vaga',
    cor: 'var(--yellow)',
    regex: /\b(especialistas (dizem|afirmam|concordam)|estudos (provam|mostram|confirmam|comprovam)|pesquisas (indicam|revelam)|a ciência (diz|afirma|prova)|está (comprovado|provado)|já foi (demonstrado|comprovado)|todos os especialistas)\b/gi,
    explicacao: 'Apela a autoridades sem nomeá-las. "Estudos mostram" sem citar qual estudo é um argumento fraco.',
    dica: 'Cite a fonte específica: autor, ano, publicação. Ex: "Segundo Hutchins (1995)..."'
  },
  {
    nome: 'Linguagem Emocional',
    cor: 'var(--red)',
    regex: /\b(ridículo|absurdo|inacreditável|escandaloso|vergonhoso|horrível|terrível|maravilhoso|perfeito|incrível|ótimo demais|péssimo|odioso|revoltante|irritante|estúpido|idiota|burro|ignorante|lamentável)\b/gi,
    explicacao: 'Usa palavras que apelam à emoção em vez de argumentar com evidências e lógica. Isso dificulta o diálogo racional.',
    dica: 'Descreva fatos e evidências. Em vez de "ridículo", explique por que o argumento não se sustenta logicamente.'
  },
  {
    nome: 'Pensamento Dicotômico',
    cor: 'var(--red)',
    regex: /\b(ou (você|é|são|está)|se não é|quem não (é|está|concorda)|tudo ou nada|preto (e|no) branco|não tem meio termo|ou (comigo|favor)|a favor ou contra|certo ou errado)\b/gi,
    explicacao: 'Apresenta o mundo em apenas dois polos opostos, ignorando a complexidade e as posições intermediárias.',
    dica: 'Reconheça que há espectro de posições. Explore posições intermediárias e contextos variados.'
  },
  {
    nome: 'Viés de Confirmação',
    cor: 'var(--purple)',
    regex: /\b(como eu (sempre) disse|já (sabia|dizia)|confirma (o que|minha)|prova que eu (estava|tinha)|é exatamente o que|isso mostra que eu|como esperado|como sempre|isso só confirma)\b/gi,
    explicacao: 'Seleciona e interpreta informações de forma a confirmar crenças preexistentes, ignorando evidências contrárias.',
    dica: 'Ativamente procure evidências que contradigam sua posição antes de concluir.'
  },
  {
    nome: 'Falácia Ad Hominem',
    cor: 'var(--red)',
    regex: /\b(esse (tipo de pessoa|indivíduo)|eles (são assim|são todos)|quem (pensa assim|acredita nisso)|o problema com (eles|vocês)|pessoas como (elas|você|eles)|típico (de quem|desse tipo))\b/gi,
    explicacao: 'Ataca características do grupo ou da pessoa em vez de refutar o argumento em si.',
    dica: 'Foque no argumento, não em quem o defende. O argumento deve ser avaliado por seus méritos lógicos.'
  }
];

// Verificar ausência de evidências
function checarAusenciaEvidencia(texto) {
  const temCitacao = /\b(\d{4}|segundo|afirma|pesquisa|estudo de|dados de|fonte:|conforme|de acordo com|apud)\b/i.test(texto);
  const temEvidencia = /\b(por exemplo|como mostra|como ilustra|comparando|dados|porcentagem|%|número de|taxa de|resultado|experimento)\b/i.test(texto);
  const palavrasTotal = texto.split(/\s+/).length;
  if (palavrasTotal > 30 && !temCitacao && !temEvidencia) {
    return {
      nome: 'Ausência de Evidência',
      cor: 'var(--blue2)',
      trechos: [],
      explicacao: 'As regras não localizaram marcadores usuais de fontes ou exemplos. Isso não prova ausência de evidência; confira o texto e as fontes manualmente.',
      dica: 'Adicione dados, exemplos específicos, citações de pesquisas ou referências a fontes confiáveis.'
    };
  }
  return null;
}

function analisarVies() {
  const input = document.getElementById('bias-input');
  const btn = document.getElementById('btn-analisar');
  const box = document.getElementById('bias-resultado');
  const texto = (input?.value || '').trim();

  if (!texto) { toast('❌ Cole um texto para analisar!'); return; }
  if (texto.length < 15) { toast('❌ Texto muito curto para análise!'); return; }

  const finalizarBotao = () => {
    if (btn) {
      btn.disabled = false;
      btn.textContent = '🔬 Examinar padrões';
    }
  };

  if (btn) {
    btn.disabled = true;
    btn.textContent = '🔬 Analisando...';
  }
  if (box) {
    box.innerHTML = `<div class="pulse">🤖 Analisando padrões linguísticos<div style="display:flex;gap:4px"><div class="pdot"></div><div class="pdot"></div><div class="pdot"></div></div></div>`;
  }

  setTimeout(() => {
    try {
      const encontrados = [];
      const trechosDestacados = new Set();

      PADROES_VIES.forEach(padrao => {
        const regex = new RegExp(padrao.regex.source, padrao.regex.flags.includes('g') ? padrao.regex.flags : padrao.regex.flags + 'g');
        const matches = [];
        let match;
        while ((match = regex.exec(texto)) !== null) {
          matches.push(match);
          if (match.index === regex.lastIndex) regex.lastIndex++;
        }
        if (matches.length > 0) {
          const trechos = [...new Set(matches.map(m => m[0].toLowerCase()))].slice(0, 3);
          encontrados.push({ ...padrao, trechos, ocorrencias: matches.length });
          matches.forEach(m => trechosDestacados.add(m[0]));
        }
      });

      const semEvidencia = checarAusenciaEvidencia(texto);
      if (semEvidencia) encontrados.push({ ...semEvidencia, ocorrencias: 1 });



      let textoHL = escHtml(texto);
      [...trechosDestacados]
        .sort((a,b) => b.length - a.length)
        .forEach(t => {
          const re = new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'), 'gi');
          textoHL = textoHL.replace(re, `<mark class="highlight">$&</mark>`);
        });

      window._ultimaAnalise = { texto, encontrados };

      if (box) {
        box.innerHTML = `
          <div class="alert alert-b"><strong>Heurística textual: ${encontrados.length} categoria(s) para examinar.</strong> Não mede porcentagem de viés nem a verdade do texto. Cada ocorrência pode ter um uso legítimo. Confira contexto, premissas e fontes originais.</div>


          ${encontrados.length ? `
            <div style="margin-bottom:.6rem">
              <div class="sec-label" style="margin-bottom:.4rem">pistas para revisão humana</div>
              ${encontrados.map(v => `
                <div class="bias-card">
                  <div class="bias-name" style="color:${v.cor}">Possível pista: ${v.nome} ${(v.ocorrencias || 0) > 1 ? `<span class="tag tag-r">${v.ocorrencias}×</span>` : ''}</div>
                  ${v.trechos?.length ? `<div class="bias-quote">"${v.trechos.map(escHtml).join('" · "')}"</div>` : ''}
                  <div class="bias-desc">${v.explicacao}</div>
                  <div class="bias-tip">💡 ${v.dica}</div>
                </div>`).join('')}
            </div>` : `
            <div class="alert alert-g">
              <strong>Nenhuma expressão dos padrões cadastrados foi encontrada.</strong> Isso não demonstra neutralidade, ausência de vieses, qualidade da argumentação ou verdade factual.
            </div>`}

          <div style="margin-bottom:.75rem">
            <div class="sec-label" style="margin-bottom:.4rem">texto analisado</div>
            <div style="font-size:.8rem;line-height:1.7;color:var(--ink2);background:var(--bg);border:1.5px solid var(--bdr);border-radius:var(--r);padding:.75rem">${textoHL}</div>
          </div>

          ${encontrados.length > 0 ? `
            <div class="alert alert-b">
              📌 <strong>Contraponto sugerido:</strong> Para fortalecer o argumento, procure fontes que discordem da sua posição e incorpore as objeções mais fortes.
            </div>` : ''}

          <div style="display:flex;gap:.4rem;flex-wrap:wrap;margin-top:.5rem">
            <button class="btn btn-sm btn-g" onclick="salvarAnaliseComoNota()">📝 Salvar como nota</button>
            <button class="btn btn-sm" onclick="gerarFCDaAnalise()">🃏 Gerar flashcard</button>
            <span class="ai-badge">Regras locais · ${new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</span>
          </div>`;
      }

      xpGanhar(10);
    } catch (erro) {
      console.error('Erro no detector de vieses:', erro);
      if (box) {
        box.innerHTML = `<div class="alert alert-r">⚠️ O detector encontrou um erro interno, mas já destravei o botão. Tente analisar novamente com um texto menor ou sem caracteres muito incomuns.</div>`;
      }
      toast('⚠️ Detector destravado. Tente novamente.');
    } finally {
      finalizarBotao();
    }
  }, 350);
}

function salvarAnaliseComoNota() {
  const a = window._ultimaAnalise;
  if (!a) { toast('Execute a análise primeiro!'); return; }
  const resumoVieses = a.encontrados.map(v => `• ${v.nome}: ${v.explicacao}`).join('\n');
  S.notas.unshift({
    id: gerarId('n'),
    titulo: 'Análise de Viés — ' + new Date().toLocaleDateString('pt-BR'),
    conteudo: `Texto analisado: "${a.texto.substring(0,100)}..."\n\nCategorias sinalizadas: ${a.encontrados.length} (heurística sem validação científica)`,
    interp: resumoVieses || 'Nenhum padrão cadastrado encontrado; isso não comprova ausência de viés',
    contexto: '', limite: '', contra: '', emocao: '',
    pasta: 'recursos',
    data: new Date().toLocaleDateString('pt-BR'),
    conexoes: ['Análise Crítica', 'Pensamento Crítico']
  });
  xpGanhar(5);
  salvarEstado();
  renderNotas();
  atualizarStats();
  toast('📝 Análise salva como nota! +5 XP');
}

function gerarFCDaAnalise() {
  const a = window._ultimaAnalise;
  if (!a) { toast('Execute a análise primeiro!'); return; }
  if (a.encontrados.length) {
    const v = a.encontrados[0];
    S.flashcards.push({
      id: gerarId('fc'),
      pergunta: `O que é e como evitar "${v.nome}" em um argumento?`,
      resposta: `${v.explicacao}\n\nComo evitar: ${v.dica}`,
      cat: 'estudo', facilidade: 0, proximaRevisao: 0, revisoes: 0
    });
  } else {
    S.flashcards.push({
      id: gerarId('fc'),
      pergunta: 'Qual é o limite de uma análise de padrões linguísticos?',
      resposta: 'Uma expressão sinalizada pode ter uso legítimo. Ausência de padrões não demonstra ausência de viés. Verifique contexto, inferências e fontes.',
      cat: 'estudo', facilidade: 0, proximaRevisao: 0, revisoes: 0
    });
  }
  xpGanhar(5);
  salvarEstado();
  renderFlashcards();
  atualizarStats();
  toast('🃏 Flashcard criado! +5 XP');
}

// ─────────────────────────────────────────────────────────
// 11. VERIFICADOR DE ARGUMENTO (EPVT)
// ─────────────────────────────────────────────────────────


function salvarEpvtComoNota() {
  const e = window._ultimoEpvt;
  if (!e) { toast('Execute a verificação primeiro!'); return; }
  S.notas.unshift({
    id: gerarId('n'),
    titulo: 'Argumento: ' + (e.tese.substring(0, 45) + (e.tese.length > 45 ? '...' : '')),
    conteudo: e.arg,
    interp: `Checklist textual: ${e.count}/${e.criterios.length}. Não verifica validade nem fatos.`,
    contexto: '', limite: e.contra || '',
    contra: '', emocao: '',
    pasta: 'recursos',
    data: new Date().toLocaleDateString('pt-BR'),
    conexoes: ['EPVT', 'Argumento Crítico']
  });
  xpGanhar(5);
  salvarEstado();
  renderNotas();
  atualizarStats();
  toast('📝 Argumento salvo como nota! +5 XP');
}

function gerarFCDoEpvt() {
  const e = window._ultimoEpvt;
  if (!e) { toast('Execute a verificação primeiro!'); return; }
  const fracos = e.criterios.filter(c => !c.ok);
  if (fracos.length) {
    S.flashcards.push({
      id: gerarId('fc'),
      pergunta: `Como melhorar um argumento fraco sobre "${e.tese.substring(0,40)}"?`,
      resposta: fracos.map(c => `• ${c.q}: ${c.dica}`).join('\n'),
      cat: 'estudo', facilidade: 0, proximaRevisao: 0, revisoes: 0
    });
  } else {
    S.flashcards.push({
      id: gerarId('fc'),
      pergunta: `Que perguntas ajudam a revisar um argumento (roteiro EPVT)?`,
      resposta: e.criterios.map(c => `• ${c.q}`).join('\n'),
      cat: 'ocmt', facilidade: 0, proximaRevisao: 0, revisoes: 0
    });
  }
  xpGanhar(5);
  salvarEstado();
  renderFlashcards();
  atualizarStats();
  toast('🃏 Flashcard criado! +5 XP');
}

// ─────────────────────────────────────────────────────────
// 12. IGNORÂNCIA DELIBERADA
// ─────────────────────────────────────────────────────────
function addIgnorancia() {
  const v = document.getElementById('ig-novo').value.trim();
  if (!v) return;
  S.ignorancias.push({ id: ++S.nextId, texto: v });
  salvarEstado();
  renderIgnorancias();
  document.getElementById('ig-novo').value = '';
  toast('✅ Adicionado à lista!');
}

function renderIgnorancias() {
  const cont = document.getElementById('ig-lista');
  if (!cont) return;
  if (!S.ignorancias.length) {
    cont.innerHTML = '<p class="mono" style="font-size:.78rem;color:var(--ink4);font-style:italic">Nenhum item ainda.</p>';
    return;
  }
  cont.innerHTML = S.ignorancias.map(ig => `
    <div style="display:flex;align-items:center;gap:.5rem;padding:.45rem .7rem;background:var(--bg);border:1.5px solid var(--bdr);border-radius:var(--r);margin-bottom:.35rem">
      <span style="flex:1;font-size:.84rem">🌿 ${escHtml(ig.texto)}</span>
      <button style="background:none;border:none;color:var(--ink4);cursor:pointer;font-size:.85rem;padding:.1rem .2rem;transition:.12s" onmouseover="this.style.color='var(--red)'" onmouseout="this.style.color='var(--ink4)'" onclick="removerIgnorancia(${BRIO_arg(ig.id)})">✕</button>
    </div>`).join('');
}

function removerIgnorancia(id) {
  S.ignorancias = S.ignorancias.filter(x => x.id !== id);
  salvarEstado();
  renderIgnorancias();
}

// ─────────────────────────────────────────────────────────
// 13. PERFIL / XP / SKILLS
// ─────────────────────────────────────────────────────────


async function trocarNickBRIO() {
  const anterior = S.nick || '';
  const nomeAnterior=S.nome;
  localStorage.removeItem('brio_nick_googie23_preview'); S.nick = '';
  const nick = pedirNickBRIO(true);
  if (!nick) { S.nick = anterior; if (anterior) localStorage.setItem('brio_nick_googie23_preview', anterior); renderPerfil(); return; }
  S.nick = nick; S.nome = '@' + nick; localStorage.setItem('brio_nick_googie23_preview', nick); salvarEstado();
  if (BRIO_ONLINE && BRIO_DB && BRIO_UID)try{await BRIO_SHARED.saveProfile(BRIO_DB,BRIO_UID,nick);}catch(error){S.nick=anterior;S.nome=nomeAnterior;localStorage.setItem('brio_nick_googie23_preview',anterior);salvarEstado();renderPerfil();toast('Alteração do perfil não confirmada. '+BRIO_SHARED.errorMessage(error)+' Nick anterior mantido.',6000);return;}
  renderPerfil(); setarData(); toast('Nick atualizado para @' + nick);
}

function toggleConfig(key, el) {
  S.config[key] = !S.config[key];
  el.classList.toggle('on', S.config[key]);
  salvarEstado();
  if (key === 'darkMode') aplicarTema();
  if (key === 'lembretes') { if (S.config[key] && 'Notification' in window && Notification.permission === 'default') Notification.requestPermission(); agendarLembreteRevisao(); }
  renderPerfil();
  toast(S.config[key] ? '✅ Ativado' : '⭕ Desativado');
}



// ─────────────────────────────────────────────────────────
// 13.5. SONS DO SISTEMA · BRIO
// Sons leves gerados por Web Audio, sem arquivos MP3.
// ─────────────────────────────────────────────────────────
if (!S.config) S.config = {};
if (typeof S.config.soundFx === 'undefined') S.config.soundFx = true;
salvarEstado();

/* BRIO 2.3 — ORBITAL KEYS: substituir SOMENTE o bloco
   const BRIO_SFX = (() => {...})(); da versão 2.2 por este código.
   Mantenha os demais handlers, a configuração soundFx e a lógica do app.
   Gerador percussivo original, sem MP3, sem melodias e sem rede. */
const BRIO_SFX = (() => {
  let ctx = null;
  let noiseBuffer = null;
  let unlocked=false,pending=null,pendingTimer=null,emissions=0,lastKind=null;
  const priority={keytap:1,latch:2,flip:2,toggle:2,confirm:3,checkpoint:4,session:5,caution:6};
  const lastPlayed = new Map();
  const aliases = { click:'keytap', success:'confirm', error:'caution', xp:'checkpoint', done:'session' };
  const gapMs = { keytap:65, latch:85, flip:85, toggle:85, confirm:140, caution:180, checkpoint:240, session:260 };

  function enabled() { return !!(S && S.config && S.config.soundFx)&&S.config.sfxVolume!==0; }
  function getCtx() {
    try {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) return null;
      if (!ctx) ctx = new Audio();
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      if (!noiseBuffer) {
        noiseBuffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * .18), ctx.sampleRate);
        const samples = noiseBuffer.getChannelData(0);
        for (let i=0; i<samples.length; i++) samples[i] = Math.random()*2 - 1;
      }
      return ctx;
    } catch(_) { return null; }
  }
  function burst(c, delay, duration, freq, filterType, intensity) {
    const t = c.currentTime + Math.max(0, delay);
    const src = c.createBufferSource();
    src.buffer = noiseBuffer;
    const filter = c.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.value = freq;
    filter.Q.value = 0.7;
    const envelope = c.createGain();
    envelope.gain.setValueAtTime(.0001, t);
    envelope.gain.linearRampToValueAtTime(Math.max(.0002,intensity), t + .002);
    envelope.gain.exponentialRampToValueAtTime(.0001, t + duration);
    src.connect(filter); filter.connect(envelope); envelope.connect(c.destination);
    src.start(t, Math.random() * .08);
    src.stop(t + duration + .003);
    src.onended=()=>{src.disconnect();filter.disconnect();envelope.disconnect();};
  }
  // Dois impulsos filtrados: toque de tecla + golpe abafado da carcaça.
  function tap(c, delay=0, strength=1, bright=1) {
    const volume = (typeof S.config.sfxVolume === 'number')
      ? Math.max(0, Math.min(1, S.config.sfxVolume)) : .55;
    if (volume <= 0) return;
    burst(c,delay,.019,1250*bright,'highpass',.075*volume*strength);
    burst(c,delay+.002,.038,420,'lowpass',.19*volume*strength);
  }
  function emit(kind='keytap') {
    if (!enabled()||!unlocked) return;
    const name = aliases[kind] || kind;
    const now = performance.now();
    if (now - (lastPlayed.get(name) || -Infinity) < (gapMs[name] || 75)) return;
    lastPlayed.set(name,now);
    const c = getCtx(); if (!c) return;
    emissions++;lastKind=name;
    try {
      if (name === 'keytap') tap(c,0,.72,1.12);
      else if (name === 'latch') { tap(c,0,.65,.8); tap(c,.045,.37,1.3); }
      else if (name === 'flip') tap(c,0,.5,1.55);
      else if (name === 'toggle') { tap(c,0,.55,1); tap(c,.045,.32,.85); }
      else if (name === 'confirm') { tap(c,0,.82,.85); tap(c,.078,.6,1.32); }
      else if (name === 'caution') { tap(c,0,.66,.55); tap(c,.09,.42,.65); }
      else if (name === 'checkpoint') { tap(c,0,.52,1.1); tap(c,.062,.72,1.35); }
      else if (name === 'session') { tap(c,0,.7,.86); tap(c,.09,.7,1.05); tap(c,.19,.84,1.25); }
      else tap(c,0,.7,1);
    } catch(e) { console.warn('SFX indisponível',e); }
  }
  function play(kind='keytap'){
    if(!enabled()||!unlocked)return;const name=aliases[kind]||kind;
    if(!pending||(priority[name]||1)>(priority[pending]||1))pending=name;
    if(pendingTimer===null)pendingTimer=setTimeout(()=>{const next=pending;pending=null;pendingTimer=null;if(next)emit(next);},0);
  }
  function unlock() { unlocked=true;if (enabled()) getCtx(); }
  return { play, unlock, enabled,diagnostics:()=>({emissions,lastKind,contextCreated:!!ctx,unlocked}) };
})();

// Libera áudio no primeiro toque e adiciona som discreto aos controles.
document.addEventListener('pointerdown', () => BRIO_SFX.unlock(), { once:true, passive:true });
document.addEventListener('keydown', () => BRIO_SFX.unlock(), { once:true, passive:true });
document.addEventListener('click', (ev) => {
  const alvo = ev.target.closest('button,.btn,.nav-btn,.qa,.toggle-sw,.folder-head,.react-btn,.modal-close,.briox-menu-item,.rate-btn');
  if (alvo) {
    const tipo = alvo.matches('.modal-close') ? 'latch'
      : alvo.matches('.toggle-sw') ? 'toggle'
      : alvo.matches('.nav-btn,.qa,.briox-menu-item') ? 'latch'
      : alvo.matches('.rate-btn') ? 'flip' : 'keytap';
    BRIO_SFX.play(tipo);
  }
}, true);

// Reforça o toast com feedback sonoro contextual.
const toastBRIOOriginal = toast;
toast = function(msg, dur=2400) {
  const t = String(msg || '').toLowerCase();
  if (S.config && S.config.soundFx) {
    if (t.includes('erro') || t.includes('falha') || t.includes('⚠') || t.includes('indisponível') || t.includes('preencha')) BRIO_SFX.play('error');
    else if (t.includes('xp')) BRIO_SFX.play('xp');
    else if (t.includes('salv') || t.includes('public') || t.includes('atualiz') || t.includes('ativado') || t.includes('✅')) BRIO_SFX.play('success');
  }
  return toastBRIOOriginal(msg, dur);
};

// Ganha XP com som próprio, sem alterar a lógica original.
const xpGanharBRIOOriginal = xpGanhar;
xpGanhar = function(n) {
  const r = xpGanharBRIOOriginal(n);
  if ((n || 0) > 0) BRIO_SFX.play('xp');
  return r;
};

// ToggleConfig com retorno sonoro imediato para Sons do sistema.
const toggleConfigBRIOOriginal = toggleConfig;
toggleConfig = function(key, el) {
  const r = toggleConfigBRIOOriginal(key, el);
  if (key === 'soundFx') {
    if (S.config.soundFx) {
      BRIO_SFX.unlock();
      setTimeout(()=>BRIO_SFX.play('success'), 40);
      toast('🔊 Sons do sistema ativados');
    } else {
      toast('🔇 Sons do sistema desativados');
    }
  }
  return r;
};

// O Pomodoro emite Session End no evento de conclusão, sem polling adicional.

// ─────────────────────────────────────────────────────────
// 14. INICIALIZAÇÃO FINAL
// ─────────────────────────────────────────────────────────
// BRIO 2.0 — limites de conteúdo e separação entre feed privado/local e público.
let BRIO_REMOTE_FEED=[];
let BRIO_FEED_QUERY=null;
let BRIO_FEED_CALLBACK=null;
let BRIO_FEED_GENERATION=0;
let BRIO_SDK_PROMISE=null;
function BRIO_safeURL(value){try{const s=String(value||'').trim();if(!/^https?:\/\//i.test(s))return '';const u=new URL(s);return ['http:','https:'].includes(u.protocol)&&!u.username&&!u.password?u.href:'';}catch{return '';}}
function BRIO_safeImage(value){return typeof value==='string'&&value.length<BRIO_MAX_IMPORT&&/^data:image\/(png|jpe?g|gif|webp);base64,[A-Za-z0-9+/=\r\n]+$/i.test(value);}
function BRIO_arg(value){return escHtml(JSON.stringify(value));}
function BRIO_getPost(id){return (BRIO_ONLINE?BRIO_REMOTE_FEED:S.feed).find(x=>x.id===id);}
async function BRIO_loadSDK(){
  if(window.firebase?.auth&&window.firebase?.database)return;
  if(!BRIO_SDK_PROMISE)BRIO_SDK_PROMISE=(async()=>{
    for(const name of ['app','auth','database'])await BRIO_timeout(new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='https://www.gstatic.com/firebasejs/10.12.4/firebase-'+name+'-compat.js';s.onload=resolve;s.onerror=()=>reject(new Error('SDK online indisponível.'));document.head.appendChild(s);}),12000);
  })().catch(e=>{BRIO_SDK_PROMISE=null;throw e;});
  return BRIO_SDK_PROMISE;
}
function BRIO_carregarFontes(){
  if(document.getElementById('brio-fontes-online'))return;
  const l=document.createElement('link');l.id='brio-fontes-online';l.rel='stylesheet';l.href='https://fonts.googleapis.com/css2?family=Special+Elite&family=Courier+Prime:ital,wght@0,400;0,700;1,400&family=DM+Sans:wght@400;500;600&display=swap';document.head.appendChild(l);toast('Fontes solicitadas ao Google Fonts nesta sessão.');
}
function normalizarPostOnline(id,p){
  if(!/^[A-Za-z0-9_-]{1,160}$/.test(id)||!BRIO_object(p))return null;
  const text=(v,fallback='')=>typeof v==='string'?v.slice(0,100000):fallback;
  const reactions=BRIO_object(p.reactionsByUser)?p.reactionsByUser:{};
  const vals=Object.values(reactions),reacoes={};for(const k of ['entendi','duvida','exemplo'])reacoes[k]=vals.filter(x=>x===k).length;
  const comentarios=Object.entries(Array.isArray(p.comments)||BRIO_object(p.comments)?p.comments:{}).filter(([,c])=>BRIO_object(c)&&typeof c.texto==='string').sort(([,a],[,b])=>(Number(a.createdAt)||0)-(Number(b.createdAt)||0)).slice(0,100).map(([key,c])=>({key,autor:text(c.autor||c.autorNick,'alguém'),texto:text(c.texto),data:text(c.data)}));
  return {id,legacy:p.schemaVersion!==1,autorUid:p.autorUid,autor:text(p.autor||p.autorNick,'@brio'),av:text(p.av,'🧠'),tipo:text(p.tipo,'reflexao'),corpo:text(p.corpo),pergunta:text(p.pergunta),reacoes,minhaReacao:['entendi','duvida','exemplo'].includes(reactions[BRIO_UID])?reactions[BRIO_UID]:null,tempo:tempoRelativoBRIO(Number(p.createdAt)||0),links:Array.isArray(p.links)?p.links.filter(x=>typeof x==='string').slice(0,20):[],arquivo:BRIO_object(p.arquivo)?{nome:text(p.arquivo.nome),tipo:text(p.arquivo.tipo),data:typeof p.arquivo.data==='string'&&p.arquivo.data.length<BRIO_MAX_IMPORT?p.arquivo.data:'',isImage:p.arquivo.isImage===true}:null,comentarios};
}
async function iniciarFirebaseBRIO(forcarNick=false){
  if(!BRIO_PERSIST_RESTORE_DONE||BRIO_READ_ONLY||!forcarNick||BRIO_FEED_CONNECTING)return false;
  const nick=pedirNickBRIO(true);if(!nick)return false;
  const generation=++BRIO_FEED_GENERATION;
  BRIO_FEED_CONNECTING=true;renderPerfil();
  try{
    BRIO_setFeedNotice('Conectando ao feed compartilhado…');await BRIO_loadSDK();if(generation!==BRIO_FEED_GENERATION)return false;await prepararFirebaseBRIO();
    if(generation!==BRIO_FEED_GENERATION)return false;
    BRIO_DB.goOnline();await BRIO_SHARED.waitConnection(BRIO_DB);if(generation!==BRIO_FEED_GENERATION)return false;await BRIO_SHARED.saveProfile(BRIO_DB,BRIO_UID,nick);
    if(generation!==BRIO_FEED_GENERATION)return false;
    S.nick=nick;S.config.onlineFeed=true;try{localStorage.setItem('brio_nick_googie23_preview',nick);}catch{}
    BRIO_ONLINE=true;BRIO_watchFeedConnection();salvarEstado();escutarFeedOnline();renderFeed();renderPerfil();toast('Feed compartilhado selecionado como @'+nick);return true;
  }catch(e){if(generation!==BRIO_FEED_GENERATION)return false;desligarFeedOnlineBRIO(BRIO_SHARED.errorMessage(e));toast('Feed não conectado: '+BRIO_SHARED.errorMessage(e),6000);return false;}finally{if(generation===BRIO_FEED_GENERATION){BRIO_FEED_CONNECTING=false;renderPerfil();}}
}
function desligarFeedOnlineBRIO(message='Feed compartilhado desconectado. Seus registros continuam locais.'){
  BRIO_FEED_GENERATION++;
  BRIO_FEED_CONNECTING=false;
  if(BRIO_FEED_QUERY&&BRIO_FEED_CALLBACK)BRIO_FEED_QUERY.off('value',BRIO_FEED_CALLBACK);
  BRIO_FEED_QUERY=null;BRIO_FEED_CALLBACK=null;BRIO_REMOTE_FEED=[];
  if(BRIO_FEED_INFO&&BRIO_FEED_INFO_CALLBACK)BRIO_FEED_INFO.off('value',BRIO_FEED_INFO_CALLBACK);BRIO_FEED_INFO=null;BRIO_FEED_INFO_CALLBACK=null;BRIO_setFeedNotice(message);
  BRIO_ONLINE=false;S.config.onlineFeed=false;
  try{BRIO_DB?.goOffline();}catch{}
  salvarEstado();renderFeed();renderPerfil();
}
function escutarFeedOnline(){
  if(!BRIO_DB||!BRIO_ONLINE)return;
  if(BRIO_FEED_QUERY&&BRIO_FEED_CALLBACK)BRIO_FEED_QUERY.off('value',BRIO_FEED_CALLBACK);
  const generation=BRIO_FEED_GENERATION;BRIO_FEED_QUERY=BRIO_DB.ref('posts').orderByChild('createdAt').limitToLast(50);
  BRIO_FEED_CALLBACK=snap=>{
    if(!BRIO_ONLINE||generation!==BRIO_FEED_GENERATION)return;
    const val=snap.val();BRIO_REMOTE_FEED=Object.entries(BRIO_object(val)?val:{}).map(([id,p])=>normalizarPostOnline(id,p)).filter(Boolean).sort((a,b)=>(Number(val[b.id]?.createdAt)||0)-(Number(val[a.id]?.createdAt)||0));renderFeed();
  };
  BRIO_FEED_QUERY.on('value',BRIO_FEED_CALLBACK,error=>{if(generation!==BRIO_FEED_GENERATION)return;const message=BRIO_SHARED.errorMessage(error);desligarFeedOnlineBRIO(message);toast('Leitura do feed não confirmada: '+message,6000);});
}
function renderFeed(){
  const cont=document.getElementById('feed-lista');if(!cont)return;
  const posts=BRIO_ONLINE?BRIO_REMOTE_FEED:S.feed;
  const commentFocus=window.BRIO_COMMENTS?.captureFocus();
  const banner='<div class="alert alert-b">'+(BRIO_ONLINE?'Feed compartilhado: posts, nick, comentários, reações e links são acessíveis aos participantes. Anexos novos e notas privadas continuam locais.':'Feed local: este conteúdo fica neste dispositivo. O modo compartilhado é opcional e pode ser ativado no Perfil.')+'<p id="brio-feed-connection" role="status">'+escHtml(BRIO_FEED_NOTICE)+'</p></div>';
  cont.innerHTML=banner+(posts.length?posts.map(p=>{
    const comments=Array.isArray(p.comentarios)?p.comentarios:[],limited=(comments.length>=3&&!window.BRIO_COMMENTS?.hasPending(p.id))||(BRIO_ONLINE&&p.legacy);
    const pendingNotice=BRIO_ONLINE&&S.brioSafety?.pendingPosts?.some(o=>o.id===p.id&&o.uid===BRIO_UID&&o.online&&o.status==='pending')?'<p class="status-mini brio-feed-pending" role="status">Envio aguardando confirmação do servidor.</p>':'';
    const file=p.arquivo,media=window.BRIO_FILES?.stored(file)?'<div class="attachment-chip">'+escHtml(file.nome)+' · '+file.size+' bytes <button class="btn btn-xs" onclick="BRIO_FILES.download(BRIO_getPost('+BRIO_arg(p.id)+').arquivo)">Baixar original</button></div>':file?(file.isImage&&BRIO_safeImage(file.data)?'<div class="feed-media-grid"><img loading="lazy" src="'+escHtml(file.data)+'" alt="'+escHtml(file.nome||'Imagem anexada')+'"></div>':'<div class="attachment-chip">📎 '+escHtml(file.nome||'Anexo')+' (imagem incompatível ou arquivo preservado no backup)</div>'):'';
    const links=(p.links||extrairLinks(p.corpo||'')).map(l=>{const url=BRIO_safeURL(l);return url?'<a class="feed-link" href="'+escHtml(url)+'" target="_blank" rel="noopener noreferrer">🔗 '+escHtml(l)+'</a>':'<span class="attachment-chip">Link não aberto: '+escHtml(l)+'</span>';}).join('');
    const reactions=['entendi','duvida','exemplo'].map((tipo,i)=>'<button class="react-btn'+(p.minhaReacao===tipo?' on':'')+'" onclick="reagirPost('+BRIO_arg(p.id)+','+BRIO_arg(tipo)+')">'+['✅ Entendi','🤔 Dúvida','💡 Exemplo'][i]+' ('+(Number(p.reacoes?.[tipo])||0)+')</button>').join('');
    const demo=p.demo||(!BRIO_ONLINE&&['p1','p2'].includes(p.id));
    return '<article class="feed-card"><div class="feed-head"><div class="fav">'+escHtml(p.av||'🧠')+'</div><div><div class="feed-author">'+escHtml(p.autor||'Você')+'</div><div class="feed-time">'+escHtml(p.tempo||'')+' · '+escHtml(TIPO_LABEL[p.tipo]||p.tipo||'Reflexão')+(demo?' · DEMONSTRAÇÃO (autoria/reações ilustrativas; verifique alegações)':'')+'</div></div></div>'+pendingNotice+'<div class="feed-body">'+escHtml(p.corpo||'')+'</div>'+links+media+(p.pergunta?'<div class="feed-q">❓ '+escHtml(p.pergunta)+'</div>':'')+'<div class="feed-actions">'+(BRIO_ONLINE&&p.legacy?'<p>Registro anterior preservado. Interações aguardam revisão de compatibilidade.</p>':reactions)+'</div><div class="comment-box"><p>Comentários '+comments.length+'/3</p>'+comments.slice(0,3).map(c=>'<div class="comment-row"><strong>'+escHtml(c.autor||'Você')+':</strong> '+escHtml(c.texto)+'</div>').join('')+'<div class="comment-form"><input class="inp" aria-label="Comentário construtivo" id="coment-'+escHtml(p.id)+'" placeholder="Comentário construtivo" '+(limited?'disabled':'')+' maxlength="240"><button class="btn btn-xs btn-g" onclick="comentarPost('+BRIO_arg(p.id)+')" '+(limited?'disabled':'')+'>Enviar</button></div></div><div class="feed-integrations"><button class="btn btn-xs btn-g" onclick="salvarPostComoNota('+BRIO_arg(p.id)+')">📝 Nota</button><button class="btn btn-xs" onclick="gerarFCDoPost('+BRIO_arg(p.id)+')">🃏 Flashcard</button></div></article>';
  }).join(''):'<div class="empty-msg">Nenhum post neste modo.</div>');
  [...cont.querySelectorAll('article.feed-card')].forEach((article,index)=>{const info=posts[index]?.arquivo;if(window.BRIO_FILES?.stored(info)&&/^image\/(png|jpeg|gif|webp)$/i.test(info.tipo))article.querySelector('.attachment-chip')?.append(BRIO_UI.button('Ver imagem',()=>BRIO_FILES.preview(info),'btn btn-xs'));});
  window.BRIO_COMMENTS?.restoreFields(commentFocus);
}
async function publicarPost(){if(window.BRIO_COMPOSER)return BRIO_COMPOSER.publish();toast('Aguarde a inicialização do editor.');}
async function reagirPost(id,tipo){
  if(!['entendi','duvida','exemplo'].includes(tipo))return;const p=BRIO_getPost(id);if(!p)return;
  try{if(BRIO_ONLINE&&BRIO_DB&&BRIO_UID){if(p.legacy)throw Error('Registro anterior preservado.');await BRIO_SHARED.react(BRIO_DB,BRIO_UID,id,p.minhaReacao===tipo?null:tipo);return;}
    p.reacoes=p.reacoes||{entendi:0,duvida:0,exemplo:0};
    if(p.minhaReacao===tipo){p.reacoes[tipo]=Math.max(0,(p.reacoes[tipo]||0)-1);p.minhaReacao=null;}else{if(p.minhaReacao)p.reacoes[p.minhaReacao]=Math.max(0,(p.reacoes[p.minhaReacao]||0)-1);p.reacoes[tipo]=(p.reacoes[tipo]||0)+1;p.minhaReacao=tipo;}
    salvarEstado();renderFeed();
  }catch(e){toast('Reação não confirmada: '+BRIO_SHARED.errorMessage(e),6000);}
}
async function comentarPost(id){if(window.BRIO_COMMENTS)return BRIO_COMMENTS.submit(id);toast('Aguarde o editor.');}

function verificarArgumento(){
  const tese=document.getElementById('epvt-tese').value.trim(),arg=document.getElementById('epvt-arg').value.trim(),contra=document.getElementById('epvt-contra').value.trim();
  if(!tese&&!arg){toast('Preencha a tese ou o argumento.');return;}
  const criterios=[
    {q:'Campo de tese preenchido',ok:!!tese,dica:'Escreva a conclusão que pretende defender; preenchimento não demonstra clareza.'},
    {q:'Campo de argumento preenchido',ok:!!arg,dica:'Separe premissas, evidências e a passagem à conclusão.'},
    {q:'Marcador textual de fonte encontrado',ok:/\b(segundo|fonte|https?:|doi|estudo|pesquisa)\b|\d{4}/i.test(arg),dica:'Indique autor, data, link e trecho relevante. A presença do marcador não confirma a fonte.'},
    {q:'Campo de objeção preenchido',ok:!!contra,dica:'Formule a objeção mais forte e examine se ela muda sua conclusão.'}
  ];
  const count=criterios.filter(c=>c.ok).length;
  window._ultimoEpvt={tese,arg,contra,criterios,count};
  document.getElementById('epvt-resultado').innerHTML='<div class="alert alert-b"><strong>Checklist textual: '+count+'/'+criterios.length+' sinais de preenchimento.</strong><p>Estas regras locais não verificam validade lógica, coerência semântica ou veracidade factual. Uma notícia falsa pode preencher todos os campos.</p></div>'+criterios.map(c=>'<div class="bias-card"><strong>'+ (c.ok?'Presente: ':'Não identificado: ')+escHtml(c.q)+'</strong><p>'+escHtml(c.dica)+'</p></div>').join('')+'<div class="alert alert-y"><strong>Verificação humana:</strong> identifique as premissas e a conclusão. Se as premissas fossem verdadeiras, a conclusão teria de seguir? Depois confira cada premissa na fonte original, autoria, data, método e fontes independentes. Considere outra interpretação e um contraexemplo. O aplicativo não fez essa checagem.</div><button class="btn btn-sm btn-g" onclick="salvarEpvtComoNota()">📝 Salvar como nota</button> <button class="btn btn-sm" onclick="gerarFCDoEpvt()">🃏 Flashcard</button>';
}
function renderPerfil(){
  document.getElementById('perfil-nome').textContent=S.nome||'Estudante';
  const xp=S.xp||0,lvl=Math.floor(xp/100)+1,xpN=xp%100;
  document.getElementById('perfil-nivel').textContent=lvl;document.getElementById('perfil-xp-val').textContent=xp;document.getElementById('xp-fill').style.width=xpN+'%';document.getElementById('xp-label').textContent=xpN+'/100 pontos de interação para o nível '+(lvl+1)+' — não mede aprendizagem';
  const counts=[['Itens PARA',['projetos','areas','recursos','arquivo'].reduce((a,k)=>a+S.pkm[k].length,0)],['Cards criados',S.flashcards.length],['Notas com limites/objeções',S.notas.filter(n=>n.limite||n.contra).length],['Sessões (registro legado)',S.pomo.sessoes||0]];
  document.getElementById('skill-grid').innerHTML=counts.map(([label,count])=>'<div class="skill-card"><div class="skill-name">'+label+'</div><strong>'+count+'</strong><p class="status-mini">Registro de uso</p></div>').join('');
  const cfgs=[['limiteFeed','Limite de cinco posts/dia','Regra local; não é moderação do servidor.'],['lembretes','Lembrete diário às 20h','Requer página ativa; não é alarme nativo.'],['darkMode','Modo escuro','Versão noturna.'],['soundFx','Sons do sistema','Feedback opcional.']];
  document.getElementById('config-lista').innerHTML='<div class="online-card"><strong>Feed compartilhado opcional</strong><p class="status-mini">'+(BRIO_ONLINE?'Conectado como @'+escHtml(S.nick):'Desconectado. Ative quando desejar; não reconecta sozinho.')+'</p><p>Ativar conecta ao Firebase. Nick é um nome de exibição; a autenticação é anônima. Posts, comentários, reações e links publicados são compartilhados. Anexos desta versão ficam no cofre local. Notas e o grafo ficam locais. O acesso depende das regras de segurança publicadas pelo responsável. Posts anteriores permanecem preservados. Desconectar não encerra a sessão anônima.</p><button class="btn btn-sm" onclick="alternarFeedOnline()">'+(BRIO_ONLINE?'Desconectar':'Ativar feed compartilhado')+'</button> <button class="btn btn-xs" onclick="trocarNickBRIO()">Trocar nick</button></div><div class="setting-row"><span class="setting-label">Tamanho da letra</span><div class="a11y-row"><button class="btn btn-xs" onclick="setFontSizeBRIO(\'normal\')">Normal</button><button class="btn btn-xs" onclick="setFontSizeBRIO(\'large\')">Maior</button><button class="btn btn-xs" onclick="setFontSizeBRIO(\'xlarge\')">Extra</button></div></div>'+cfgs.map(([key,label,sub])=>'<div class="setting-row"><span class="setting-label">'+label+'<span class="status-mini" style="display:block">'+sub+'</span></span><button class="toggle-sw'+(S.config[key]?' on':'')+'" role="switch" aria-label="'+label+'" aria-checked="'+!!S.config[key]+'" onclick="toggleConfig('+BRIO_arg(key)+',this)"></button></div>').join('');
}
async function loadAvatar(input){
  const f=input.files[0];if(!f)return;
  if(f.size>2*1024*1024||!/^image\/(png|jpe?g|gif|webp)$/i.test(f.type)){toast('Use imagem PNG, JPEG, GIF ou WebP de até 2 MiB.');input.value='';return;}
  const r=new FileReader();r.onload=()=>{if(!BRIO_safeImage(r.result))return;S.avatarUrl=r.result;document.getElementById('pav-emoji').style.display='none';const img=document.getElementById('pav-img');img.src=r.result;img.style.display='block';salvarEstado();toast('Foto atualizada; confira a confirmação de salvamento.');};r.onerror=()=>toast('Não foi possível ler a foto.');r.readAsDataURL(f);
}
function criarExemploPeirce(){
  const nodes=[{id:gerarId('g'),label:'não verificar fonte',x:24,y:35,kind:'alfa'},{id:gerarId('g'),label:'argumento ↔ evidência',x:58,y:35,kind:'beta'},{id:gerarId('g'),label:'hipótese de estudo',x:48,y:70,kind:'gama'}];
  S.grafo.nos.push(...nodes);S.grafo.arestas.push([nodes[0].id,nodes[1].id],[nodes[1].id,nodes[2].id]);noSelecionado=null;grafoMode='add';salvarEstado();renderGrafo();toast('Exemplo acrescentado. As marcas do mapa são convenções do BRIO.');
}
async function alternarFeedOnline(){if(BRIO_ONLINE||BRIO_FEED_CONNECTING)desligarFeedOnlineBRIO();else await iniciarFirebaseBRIO(true);}

// Campos e nomes básicos acessíveis.
document.querySelectorAll('.field').forEach(field=>{const label=field.querySelector('label'),input=field.querySelector('input:not([type=hidden]),textarea,select');if(label&&input?.id)label.htmlFor=input.id;});
document.querySelectorAll('.nf-body textarea').forEach(input=>input.setAttribute('aria-label',input.closest('.nfield').querySelector('.nf-label').textContent));
document.querySelectorAll('.modal-close').forEach(b=>b.setAttribute('aria-label','Fechar janela'));
document.getElementById('toast').setAttribute('role','status');
document.querySelector('#topbar button').setAttribute('aria-label','Nova nota rápida');
BRIO_BOOT_INICIAL();


