'use strict';
// Contratos locais aditivos. Nenhuma leitura/escrita de navegador neste módulo.
const BRIO_DATA=(()=>{
 const collections=['journeys','sources','claims','evidence','arguments','questions','reflections','attempts','newsCases','socraticSessions','reviewEvents','drafts','links'];
 const object=x=>!!x&&typeof x==='object'&&!Array.isArray(x),clone=x=>JSON.parse(JSON.stringify(x));
 const assert=(ok,message)=>{if(!ok)throw new Error(message);};
 const id=x=>(typeof x==='string'&&/^[A-Za-z0-9_-]{1,160}$/.test(x))||(Number.isSafeInteger(x)&&x>=0);
 const text=(row,fields)=>{for(const k of fields)assert(typeof row[k]==='string','Texto pedagógico inválido: '+k);};
 const ref=x=>x===null||(object(x)&&typeof x.collection==='string'&&id(x.id));
 const uid=prefix=>prefix+'_'+(globalThis.crypto?.randomUUID?.().replaceAll('-','')||Date.now().toString(36)+Math.random().toString(36).slice(2));
 const empty=()=>Object.fromEntries([['version',1],...collections.map(k=>[k,[]])]);
 const safetyCollections=['trash','revisions','editDrafts','recordsTrash','pendingPosts','commentDrafts','moderationReports','moderationHidden'];
 const safety=()=>({version:1,...Object.fromEntries(safetyCollections.map(k=>[k,[]]))});
 function list(rows,label,check){assert(Array.isArray(rows)&&rows.length<=100000,'Lista inválida: '+label);const seen=new Set();for(const row of rows){assert(object(row)&&id(row.id)&&!seen.has(String(row.id)),'ID inválido/duplicado: '+label);seen.add(String(row.id));check(row);}}
 function validateLearning(value){
  assert(object(value)&&value.version===1,'Versão de percurso incompatível. Os dados foram preservados.');
  for(const key of collections)list(value[key],key,row=>{
   if(key!=='journeys'&&row.journeyId!==null&&row.journeyId!==undefined)assert(id(row.journeyId),'Percurso inválido.');
   for(const field of ['ref','paraRef','targetRef','originRef','cardRef'])if(row[field]!==undefined)assert(ref(row[field]),'Referência inválida: '+field);
   for(const field of ['createdAt','updatedAt','at'])if(row[field]!==undefined)assert(Number.isFinite(row[field])&&row[field]>=0,'Data pedagógica inválida.');
   if(key==='journeys'){text(row,['title','problem','hypothesis','status']);assert(['rascunho','investigando','revisando','concluido','concluido_com_pendencias','arquivado'].includes(row.status),'Situação do percurso inválida.');}
   if(key==='drafts'){text(row,['kind']);assert(object(row.values)&&Object.values(row.values).every(v=>typeof v==='string'),'Rascunho do percurso inválido.');}
   if(key==='sources'){text(row,['title','author','date','url','excerpt','limits']);if(row.url){const url=new URL(row.url);assert(['https:','http:'].includes(url.protocol)&&!url.username&&!url.password,'URL de fonte inválida.');}}
   if(key==='claims')text(row,['text','nature','assessment']);
   if(key==='evidence'){text(row,['excerpt','interpretation','position','limits']);assert(id(row.sourceId),'Fonte da evidência inválida.');assert(['sustenta','contradiz','contextualiza'].includes(row.position),'Direção da evidência inválida.');}
   if(key==='arguments')text(row,['thesis','premises','conclusion','warrant','objection','evidenceNotes','humanAssessment']);
   if(key==='questions'){text(row,['text','status','nextStep','answer']);assert(['aberta','resolvida','adiada'].includes(row.status),'Situação da dúvida inválida.');}
   if(key==='reflections')text(row,['phase','prior','strategy','difficulties','changes','nextStep','conclusion','limits']);
   if(key==='attempts')text(row,['question','response','comparison']);
   if(key==='newsCases')text(row,['title','text','author','date','genre','conclusion','uncertainties']);
   if(key==='socraticSessions')text(row,['promptId','prompt','reason','response']);
   if(key==='reviewEvents')assert([0,1,2].includes(row.rating)&&[1,3,7].includes(row.intervalDays),'Revisão de card inválida.');
   if(key==='links'){text(row,['role']);assert(ref(row.ref)&&row.ref!==null,'Alvo do vínculo inválido.');}
  });return value;
 }
 function note(row){assert(object(row)&&id(row.id)&&typeof row.titulo==='string','Nota preservada inválida.');for(const k of ['conteudo','interp','contexto','limite','contra','emocao','data','pasta'])if(row[k]!==undefined)text(row,[k]);if(row.conexoes!==undefined)assert(Array.isArray(row.conexoes)&&row.conexoes.every(x=>typeof x==='string'),'Conexões da nota inválidas.');}
 function validateSafety(value){
  assert(object(value)&&value.version===1,'Versão da proteção de notas incompatível.');
  list(value.trash,'lixeira',row=>{note(row.note);assert(Number.isFinite(row.removedAt),'Data da lixeira inválida.');});
  list(value.revisions,'histórico',row=>{note(row.snapshot);assert(id(row.noteId)&&Number.isFinite(row.savedAt),'Revisão da nota inválida.');});
  if(value.editDrafts!==undefined)list(value.editDrafts,'rascunhos de edição',row=>{note(row.snapshot);assert(id(row.noteId)&&typeof row.baseFingerprint==='string','Rascunho de edição inválido.');});
  if(value.recordsTrash!==undefined)list(value.recordsTrash,'registros preservados',row=>{assert(typeof row.kind==='string'&&object(row.record)&&Number.isFinite(row.savedAt),'Registro preservado inválido.');});
  if(value.pendingPosts!==undefined)list(value.pendingPosts,'envios',row=>{assert(typeof row.online==='boolean'&&typeof row.uid==='string'&&object(row.values)&&typeof row.fingerprint==='string'&&['pending','confirmed'].includes(row.status),'Envio preservado inválido.');});
  if(value.commentDrafts!==undefined)list(value.commentDrafts,'comentários em rascunho',row=>{assert(id(row.postId)&&typeof row.online==='boolean'&&typeof row.uid==='string'&&typeof row.text==='string','Comentário em rascunho inválido.');});
  if(value.analysisDraft!==undefined)assert(object(value.analysisDraft)&&object(value.analysisDraft.values)&&Object.values(value.analysisDraft.values).every(v=>typeof v==='string'),'Rascunho de análise inválido.');
  for(const field of ['moderationReports','moderationHidden'])if(value[field]!==undefined)list(value[field],'moderação local',row=>{
   assert(['post','comment'].includes(row.kind)&&id(row.postId)&&typeof row.commentKey==='string'&&(row.kind==='post'?row.commentKey==='':id(row.commentKey))&&typeof row.online==='boolean','Alvo de moderação inválido.');
   if(field==='moderationReports')assert(['spam','assedio','odio','desinformacao','privacidade','outro'].includes(row.reason)&&typeof row.details==='string'&&row.details.length<=500&&row.status==='local_only'&&Number.isFinite(row.createdAt),'Denúncia local inválida.');
   else assert(typeof row.hidden==='boolean'&&Number.isFinite(row.updatedAt),'Ocultação local inválida.');
  });
  return value;
 }
 function remap(row,maps){
  const out=clone(row),mapped=(collection,value)=>maps[collection]?.get(String(value))??value;
  for(const [field,collection]of Object.entries({journeyId:'brioLearning.journeys',sourceId:'brioLearning.sources',claimId:'brioLearning.claims',noteId:'notas',restoredNoteId:'notas'}))if(out[field]!==undefined&&out[field]!==null)out[field]=mapped(collection,out[field]);
  if(Array.isArray(out.claimIds))out.claimIds=out.claimIds.map(x=>mapped('brioLearning.claims',x));
  if(out.kind&&out.values)for(const [field,collection]of Object.entries({sourceId:'brioLearning.sources',claimId:'brioLearning.claims',project:'pkm.projetos'}))if(out.values[field])out.values[field]=String(mapped(collection,out.values[field]));
  if(out.baseFingerprint&&out.snapshot&&out.noteId!==row.noteId){try{const baseline=JSON.parse(out.baseFingerprint);baseline.id=out.noteId;out.baseFingerprint=JSON.stringify(baseline);out.snapshot.id=out.noteId;}catch{}}
  for(const field of ['ref','paraRef','targetRef','originRef','cardRef'])if(out[field]){out[field].id=mapped(out[field].collection,out[field].id);if(out[field].revisionId)out[field].revisionId=mapped('brioSafety.revisions',out[field].revisionId);}
  return out;
 }
 return {collections,safetyCollections,empty,safety,uid,clone,validateLearning,validateSafety,remap};
})();
