'use strict';
// Mesmo contrato da proposta auditada. Nenhuma regra é publicada por este módulo.
const BRIO_SHARED=(()=>{
 const policy={schemaVersion:1,feedPageSize:50,postsPerUtcDay:5,postCooldownMs:60000,reactionCooldownMs:1000,commentCooldownMs:10000,commentSlots:3,bodyMax:6000,questionMax:500,commentMax:240,linksMax:5,urlMax:2048};
 const timestamp=()=>firebase.database.ServerValue.TIMESTAMP;
 function failure(code,message){return Object.assign(new Error(message),{code});}
 function timed(promise,ms=15000){return new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(failure('brio/feed-timeout','O servidor não confirmou a operação no prazo.')),ms);Promise.resolve(promise).then(value=>{clearTimeout(timer);resolve(value);},error=>{clearTimeout(timer);reject(error);});});}
 const read=async(db,path)=>(await timed(db.ref(path).once('value'))).val();
 async function requireConnection(db){if(!await read(db,'.info/connected'))throw failure('brio/feed-offline','Sem conexão com o servidor.');}
 function waitConnection(db,ms=15000){return new Promise((resolve,reject)=>{const ref=db.ref('.info/connected');let finished=false;const done=error=>{if(finished)return;finished=true;clearTimeout(timer);ref.off('value',callback);error?reject(error):resolve();},callback=snap=>{if(snap.val()===true)done();},timer=setTimeout(()=>done(failure('brio/feed-timeout','Não foi possível confirmar a conexão.')),ms);ref.on('value',callback,done);});}
 // O cache otimista do SDK não é um ACK. Conservar a promessa original até o servidor responder.
 const unacknowledged=new WeakMap();
 function pendingWrite(db,key,signature){const row=unacknowledged.get(db)?.get(key);if(row)check(row.signature===signature,'Um envio anterior desse alvo ainda aguarda confirmação. Confira antes de alterar o conteúdo.');return row;}
 async function waitPending(db,key,signature){const row=pendingWrite(db,key,signature);if(!row)return false;await timed(row.promise);return true;}
 const rootUpdate=async(db,patch,key,signature)=>{await requireConnection(db);const previous=pendingWrite(db,key,signature);if(previous)return timed(previous.promise);const promise=db.ref().update(patch);if(key){let rows=unacknowledged.get(db);if(!rows){rows=new Map();unacknowledged.set(db,rows);}const row={promise,signature};rows.set(key,row);const settled=()=>{if(rows.get(key)===row)rows.delete(key);};promise.then(settled,settled);}return timed(promise);};
 function errorMessage(error){const code=String(error?.code||'').toLowerCase(),message=String(error?.message||'');
  if(/permission.?denied|permission_denied/.test(code+' '+message.toLowerCase()))return 'Permissão negada pelo servidor. Dados locais preservados; confira as regras e sua sessão antes de repetir.';
  if(code==='auth/operation-not-allowed')return 'A autenticação anônima não está habilitada neste ambiente. O feed continua desconectado.';
  if(code==='brio/feed-timeout')return 'O servidor não confirmou no prazo. O envio pode ter sido aplicado; confira o mesmo ID antes de repetir.';
  if(/network|offline|unavailable|disconnected/.test(code))return 'Sem conexão com o servidor. Rascunho mantido; reconecte e confira o envio antes de repetir.';
  if(/too-many-requests/.test(code))return 'O serviço limitou as tentativas. Aguarde antes de tentar novamente; o rascunho foi mantido.';
  return message.slice(0,350)||'Operação não confirmada. Dados locais preservados.';
 }
 function check(ok,message){if(!ok)throw Error(message);}
 async function saveProfile(db,uid,nick){check(/^[a-z0-9_]{3,18}$/.test(nick),'Nick inválido.');await requireConnection(db);await timed(db.ref('users/'+uid).update({nick,nome:'@'+nick,atualizadoEm:timestamp()}));}
 function id(db){return db.ref('posts').push().key;}
 const stable=p=>JSON.stringify([p.autorUid,p.tipo,p.corpo,p.pergunta||'',p.links||[]]);
 async function publish(db,uid,nick,fields,postId){
  check(uid&&postId,'Sessão ou ID de publicação ausente.');check(!fields.arquivo,'O anexo está preservado localmente. O feed compartilhado aceita texto e links nesta versão.');
  await requireConnection(db);
  const links=[...new Set((fields.links||[]).map(BRIO_safeURL))];check(links.every(Boolean)&&links.length<=policy.linksMax&&links.every(l=>l.length<=policy.urlMax),'Use até cinco links HTTP/HTTPS válidos.');
  const post={schemaVersion:1,autor:'@'+nick,autorNick:'@'+nick,autorUid:uid,av:'🧠',tipo:fields.tipo,corpo:fields.corpo.trim(),pergunta:fields.pergunta.trim(),createdAt:timestamp()};if(links.length)post.links=links;
  check(post.corpo.length<=policy.bodyMax&&post.pergunta.length<=policy.questionMax&&(post.corpo||links.length),'Revise os limites de texto: 6.000 caracteres no post e 500 na pergunta.');
  const operationKey='post:'+uid+':'+postId,signature=stable(post);if(await waitPending(db,operationKey,signature))return postId;
  const old=await read(db,'posts/'+postId);if(old){check(old.schemaVersion===1&&stable(old)===stable(post),'Este ID já corresponde a outro conteúdo. O rascunho foi mantido.');return postId;}
  const [quota,offset]=await Promise.all([read(db,'postQuotas/'+uid),read(db,'.info/serverTimeOffset')]);const now=Date.now()+(offset||0),day=now-now%86400000,count=quota?.day===day?quota.count+1:1;
  check(count<=policy.postsPerUtcDay,'Limite compartilhado de cinco posts por dia UTC atingido.');check(!quota||now>=quota.lastAt+policy.postCooldownMs,'Aguarde pelo menos 60 segundos entre publicações.');
  await rootUpdate(db,{['posts/'+postId]:post,['postQuotas/'+uid]:{day,count,lastAt:timestamp(),lastPostId:postId}},operationKey,signature);return postId;
 }
 async function react(db,uid,postId,value){check(['entendi','duvida','exemplo',null].includes(value),'Reação inválida.');await rootUpdate(db,{['posts/'+postId+'/reactionsByUser/'+uid]:value,['interactionQuotas/'+uid]:{kind:'react',postId,targetKey:uid,lastAt:timestamp()}},'react:'+uid+':'+postId,JSON.stringify(value));}
 async function comment(db,uid,nick,postId,text,{pendingSlot,onSlot}={}){
  check(text.trim()&&text.length<=policy.commentMax,'Use de 1 a 240 caracteres no comentário.');
  await requireConnection(db);
  for(let attempt=0;attempt<3;attempt++){
   const post=await read(db,'posts/'+postId);check(post?.schemaVersion===1,'Registro anterior preservado. Novas interações dependem de revisão dos dados antigos.');
   const comments=post.comments||{};
   if(pendingSlot!==undefined&&comments[pendingSlot]?.autorUid===uid&&comments[pendingSlot]?.texto===text){await waitPending(db,'comment:'+uid+':'+postId+':'+pendingSlot,text);return pendingSlot;}
   const slot=['0','1','2'].find(s=>!comments[s]);check(slot!==undefined,'Limite de três comentários atingido.');if(onSlot)await onSlot(slot);
   try{await rootUpdate(db,{['posts/'+postId+'/comments/'+slot]:{autor:'@'+nick,autorUid:uid,texto:text,createdAt:timestamp()},['interactionQuotas/'+uid]:{kind:'comment',postId,targetKey:slot,lastAt:timestamp()}},'comment:'+uid+':'+postId+':'+slot,text);return slot;}
   catch(error){if(error.code==='brio/feed-offline'||error.code==='brio/feed-timeout')throw error;const occupied=await read(db,'posts/'+postId+'/comments/'+slot);if(occupied?.autorUid===uid&&occupied?.texto===text){await waitPending(db,'comment:'+uid+':'+postId+':'+slot,text);return slot;}if(!occupied)throw error;}
  }
  throw Error('As posições foram ocupadas durante o envio. O texto foi mantido.');
 }
 return {policy,saveProfile,id,publish,react,comment,timed,waitConnection,errorMessage};
})();
window.BRIO_SHARED=BRIO_SHARED;
