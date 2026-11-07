'use strict';
const BRIO_COMPOSER=(()=>{
 const ids=['post-corpo','post-pergunta','post-link','post-tipo'];let generation=0,timer=null,attachment=null;
 const state=()=>{if(!S.brioSafety)S.brioSafety=BRIO_DATA.safety();return S.brioSafety;};
 const values=()=>Object.fromEntries(ids.map(id=>[id,document.getElementById(id).value]));
 function capture(){if(!BRIO_UI.writable())return;const previous=state().postDraft,fields=values();if(!fields['post-corpo']&&!fields['post-link']&&!fields['post-pergunta']&&!attachment){if(previous){state().postDraft=null;salvarEstado();}return;}if(previous&&JSON.stringify([previous.values,previous.arquivo])===JSON.stringify([fields,attachment]))return;state().postDraft={...(previous||{}),values:fields,arquivo:attachment,updatedAt:Date.now()};salvarEstado();}
 function operations(){if(state().pendingPosts&&!Array.isArray(state().pendingPosts))throw Error('Envios anteriores têm formato incompatível; os dados foram mantidos.');return state().pendingPosts||(state().pendingPosts=[]);}
 function flush(){clearTimeout(timer);capture();}
 async function durable(){salvarEstado();if(!await BRIO_SAVE_QUEUE)throw Error('O rascunho ainda não foi salvo no dispositivo. Mantenha a página aberta e exporte a recuperação.');}
 async function publish(){
  const button=document.querySelector('#modal-post-novo .modal-foot .btn-g');if(button.disabled||!BRIO_UI.writable())return;button.disabled=true;
  try{
   flush();const submitted=values(),file=document.getElementById('post-arquivo').files?.[0],version=generation,online=BRIO_ONLINE,db=BRIO_DB,uid=online?BRIO_UID:'local',nick=S.nick;
   const chosen=file?await BRIO_FILES.put(file):attachment;if(file&&generation===version)attachment=chosen;
   const corpo=submitted['post-corpo'].trim(),link=submitted['post-link'].trim(),pergunta=submitted['post-pergunta'].trim(),tipo=submitted['post-tipo'];
   if(!corpo&&!link&&!chosen)throw Error('Escreva algo ou escolha um arquivo.');if(link&&!BRIO_safeURL(link))throw Error('Use um link completo HTTP ou HTTPS.');
   const links=[...new Set([link,...extrairLinks(corpo)].filter(Boolean).map(BRIO_safeURL).filter(Boolean))],fingerprint=JSON.stringify([corpo,pergunta,tipo,links,chosen?.blobId||null]);
   if(online&&chosen)throw Error('Anexo preservado no rascunho local. Compartilhe um link ou publique no feed local.');
   const referenced=operations().find(o=>o.id===state().postDraft?.pendingId);if(referenced?.online&&referenced.uid!==uid)throw Error('Este envio pertence a outra identidade anônima. Confira o feed e exporte o rascunho antes de criar uma nova publicação.');
   let operation=operations().find(o=>o.uid===uid&&o.online===online&&o.fingerprint===fingerprint&&(o.status==='pending'||state().postDraft?.pendingId===o.id));
   if(!operation){operation={id:online?BRIO_SHARED.id(db):gerarId('p'),uid,online,fingerprint,values:submitted,arquivo:chosen,status:'pending',createdAt:Date.now()};operations().push(operation);}
   capture();if(state().postDraft)state().postDraft.pendingId=operation.id;
   if(online&&db){
    await durable();await BRIO_SHARED.publish(db,uid,nick,{corpo,pergunta,tipo,links},operation.id);
   }else{
    const today=new Date().toDateString(),count=S.dataPost===today?S.postHoje:0;
    const existing=S.feed.find(p=>p.id===operation.id);
    if(S.config.limiteFeed&&count>=5&&!existing)throw Error('Limite diário de cinco posts locais atingido.');
    const post={id:operation.id,autor:S.nome||'Você',autorNick:S.nome||'Você',autorUid:'local',av:'🧠',tipo,corpo,pergunta,links,arquivo:chosen,reacoes:existing?.reacoes||{entendi:0,duvida:0,exemplo:0},minhaReacao:existing?.minhaReacao||null,comentarios:existing?.comentarios||[],tempo:'agora',createdAt:existing?.createdAt||Date.now()};
    if(existing){if(JSON.stringify([existing.corpo,existing.pergunta,existing.tipo,existing.links,existing.arquivo?.blobId||null])!==JSON.stringify([corpo,pergunta,tipo,links,chosen?.blobId||null]))throw Error('ID já usado por outro conteúdo. Confira os envios preservados.');}else{S.feed.unshift(post);S.dataPost=today;S.postHoje=count+1;}await durable();
   }
   const confirmed=operations().find(o=>o.id===operation.id);confirmed.status='confirmed';if(!confirmed.awarded){confirmed.awarded=true;xpGanhar(8);}await durable();renderFeed();
   if(generation===version&&JSON.stringify(values())===JSON.stringify(submitted)){generation++;state().postDraft=null;attachment=null;for(const id of ['post-corpo','post-pergunta','post-link','post-arquivo'])document.getElementById(id).value='';document.getElementById('post-arquivo-status').textContent='Nenhum arquivo selecionado.';salvarEstado();closeModal('modal-post-novo');toast(online?'Post compartilhado e confirmado.':'Post salvo no feed local.');}
   else{capture();toast('Envio anterior confirmado. A edição mais recente foi mantida como rascunho.',5000);}
  }catch(error){toast('Publicação não confirmada: '+BRIO_SHARED.errorMessage(error)+' Rascunho mantido.',6500);}finally{button.disabled=false;}
 }
 function restore(){generation++;const draft=S.brioSafety?.postDraft;for(const id of ids)document.getElementById(id).value=typeof draft?.values?.[id]==='string'?draft.values[id]:(id==='post-tipo'?'reflexao':'');document.getElementById('post-arquivo').value='';attachment=draft?.arquivo||null;document.getElementById('post-arquivo-status').textContent=attachment?'Anexo recuperado: '+attachment.nome:'Nenhum arquivo selecionado.';}
 function openPending(){const box=BRIO_UI.dialog('brio-pending-posts','Envios preservados');box.body.append(BRIO_UI.node('p','brio3-help','Um envio sem confirmação pode já ter sido aplicado. Reabrir mantém o ID para conferir antes de repetir.'));for(const item of [...operations()].reverse()){const row=BRIO_UI.node('section','brio3-details');row.append(BRIO_UI.node('p','',(item.online?'Compartilhado':'Local')+' · '+(item.status==='confirmed'?'confirmado':'aguardando confirmação')+' · '+item.id),BRIO_UI.button('Reabrir como rascunho',()=>{generation++;state().postDraft={values:item.values,arquivo:item.arquivo,pendingId:item.id};restore();salvarEstado();box.close();openModal('modal-post-novo');}));box.body.append(row);}box.show();}
 function install(){restore();for(const id of ids)document.getElementById(id).addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(capture,450);});
  document.getElementById('post-arquivo').addEventListener('change',async event=>{const current=++generation,file=event.target.files?.[0];if(!file){attachment=null;capture();return;}try{const info=await BRIO_FILES.put(file);if(current!==generation)return;attachment=info;capture();document.getElementById('post-arquivo-status').textContent=info.nome+' · salvo no cofre local';}catch(error){document.getElementById('post-arquivo-status').textContent=error.message+' O arquivo original foi mantido.';}});
  document.querySelector('.backup-actions')?.append(BRIO_UI.button('Arquivos locais',BRIO_FILES.openLibrary));
  document.querySelector('.backup-actions')?.append(BRIO_UI.button('Cópias anteriores',BRIO_FILES.openCopies));
  document.querySelector('.backup-actions')?.append(BRIO_UI.button('Envios preservados',openPending));
  window.addEventListener('pagehide',flush);document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')flush();});
 }
 BRIO_BOOT_PROMISE.then(()=>{if(!BRIO_READ_ONLY)install();});return {publish,flush,restore};
})();
window.BRIO_COMPOSER=BRIO_COMPOSER;
