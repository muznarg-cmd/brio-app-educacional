'use strict';
const BRIO_COMMENTS=(()=>{
 let timer=null;const inflight=new Set();
 function rows(){if(!S.brioSafety)S.brioSafety=BRIO_DATA.safety();if(!S.brioSafety.commentDrafts)S.brioSafety.commentDrafts=[];if(!Array.isArray(S.brioSafety.commentDrafts))throw Error('Rascunhos anteriores mantidos; formato incompatível.');return S.brioSafety.commentDrafts;}
 const key=id=>({postId:String(id),online:BRIO_ONLINE,uid:BRIO_ONLINE?BRIO_UID:'local'});
 function find(id,target=key(id)){return rows().find(r=>r.postId===target.postId&&r.online===target.online&&r.uid===target.uid);}
 function captureInput(input){if(!BRIO_UI.writable())return;const id=input.id.slice(7),target=key(id);let r=find(id,target);if(!r&&!input.value)return;if(!r){r={id:BRIO_DATA.uid('comment_draft'),...target,text:''};rows().push(r);}if(r.text===input.value)return;r.text=input.value;clearTimeout(timer);timer=setTimeout(salvarEstado,450);}
 function captureFocus(){const input=document.activeElement;if(!input?.id?.startsWith('coment-'))return null;captureInput(input);return {id:input.id,start:input.selectionStart,end:input.selectionEnd};}
 function restoreFields(focus){for(const input of document.querySelectorAll('input[id^="coment-"]')){const r=find(input.id.slice(7));if(r)input.value=r.text;}const input=focus&&document.getElementById(focus.id);if(input&&!input.disabled){input.focus({preventScroll:true});input.setSelectionRange(focus.start,focus.end);}}
 function hasPending(id){const r=find(id);return !!(r&&(r.pendingSlot!==undefined||r.localId));}
 async function durable(){salvarEstado();if(!await BRIO_SAVE_QUEUE)throw Error('Salvamento ainda não confirmado. Mantenha a página aberta e exporte a recuperação.');}
 async function submit(id){
  const post=BRIO_getPost(id),input=document.getElementById('coment-'+id);if(!post||!input||!BRIO_UI.writable()||inflight.has(id))return;captureInput(input);
  const target=key(id),text=input.value.trim();if(!text)return;if(text.length>240){toast('Use até 240 caracteres. Texto mantido.');return;}
  const draft=find(id,target);if(!draft)return;input.disabled=true;inflight.add(id);
  try{
   if(target.online){await BRIO_SHARED.comment(BRIO_DB,target.uid,S.nick,id,text,{pendingSlot:draft.pendingSlot,onSlot:async slot=>{find(id,target).pendingSlot=slot;await durable();}});}
   else{const comments=post.comentarios||(post.comentarios=[]);let existing=draft.localId&&comments.find(c=>c.id===draft.localId);if(existing&&existing.texto!==text)existing=null;if(!existing){if(comments.length>=3)throw Error('Limite de três comentários atingido.');const localId=gerarId('coment');find(id,target).localId=localId;comments.push({id:localId,autor:S.nome||'Você',autorUid:'local',texto:text,data:new Date().toLocaleDateString('pt-BR'),createdAt:Date.now()});}await durable();}
   const latest=find(id,target);if(latest&&latest.text.trim()===text){S.brioSafety.commentDrafts=rows().filter(r=>r!==latest);const current=document.getElementById('coment-'+id);if(current?.value.trim()===text)current.value='';}salvarEstado();renderFeed();toast('Comentário confirmado.');
  }catch(error){toast('Comentário não confirmado: '+BRIO_SHARED.errorMessage(error)+' Texto mantido.',6000);}
  finally{inflight.delete(id);const current=document.getElementById('coment-'+id),latest=BRIO_getPost(id);if(current)current.disabled=(latest?.comentarios?.length>=3&&!hasPending(id))||(target.online&&latest?.legacy);}
 }
 document.addEventListener('input',event=>{if(event.target.id?.startsWith('coment-'))try{captureInput(event.target);}catch(e){toast(e.message,5000);}});
 window.addEventListener('pagehide',()=>{clearTimeout(timer);salvarEstado();});
 return {submit,captureFocus,restoreFields,hasPending};
})();
window.BRIO_COMMENTS=BRIO_COMMENTS;
