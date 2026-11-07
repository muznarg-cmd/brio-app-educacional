'use strict';
// Prévia local: não faz chamadas Firebase, não possui credenciais nem função administrativa.
const BRIO_MODERATION=(()=>{
 const reasons=[['spam','Spam ou publicidade repetitiva'],['assedio','Assédio ou ameaça'],['odio','Discriminação ou discurso de ódio'],['desinformacao','Informação possivelmente enganosa'],['privacidade','Exposição de dados pessoais'],['outro','Outro motivo']];
 const rows=key=>S.brioSafety?.[key]||[];
 const target=(kind,postId,commentKey='')=>({kind,postId:String(postId),commentKey:String(commentKey),online:BRIO_ONLINE});
 const same=(a,b)=>a.kind===b.kind&&a.postId===b.postId&&a.commentKey===b.commentKey&&a.online===b.online;
 function collection(key){if(!S.brioSafety)S.brioSafety=BRIO_DATA.safety();return S.brioSafety[key]||(S.brioSafety[key]=[]);}
 const hidden=t=>rows('moderationHidden').some(r=>same(r,t)&&r.hidden);
 async function setHidden(t,value){if(!BRIO_UI.writable())return;let matches=collection('moderationHidden').filter(r=>same(r,t));if(!matches.length){const row={id:BRIO_DATA.uid('hidden'),...t};collection('moderationHidden').push(row);matches=[row];}for(const row of matches){row.hidden=value;row.updatedAt=Date.now();}const saved=await BRIO_UI.persist();renderFeed();toast(saved?(value?'Oculto apenas neste dispositivo.':'Conteúdo exibido novamente.'):'Alteração em memória; salvamento local ainda não confirmado.',5000);}
 function report(t){if(!BRIO_UI.writable())return;const box=BRIO_UI.dialog('brio-report','Registrar denúncia local');box.body.append(BRIO_UI.node('p','brio3-help','Esta denúncia será salva apenas neste dispositivo. Ainda não será enviada a uma equipe. Não inclua dados pessoais ou credenciais.'));
  const reason=BRIO_UI.field(box.body,'brio-report-reason','Motivo','spam','select',reasons),details=BRIO_UI.field(box.body,'brio-report-details','Detalhes opcionais (até 500 caracteres)');details.maxLength=500;
  const submit=BRIO_UI.button('Salvar denúncia local',async()=>{if(submit.disabled||!BRIO_UI.writable())return;submit.disabled=true;try{
   const list=collection('moderationReports'),now=Date.now(),day=now-now%86400000;
   if(!reasons.some(([v])=>v===reason.value)||details.value.length>500)throw Error('Revise o motivo e o tamanho dos detalhes.');
   if(list.some(r=>same(r,t)&&r.reason===reason.value)){box.status.textContent='Já existe uma denúncia local desse motivo para este conteúdo.';return;}
   if(list.length>=1000||list.filter(r=>r.createdAt>=day).length>=10)throw Error('Limite local de denúncias atingido. As anteriores foram preservadas.');
   list.push({id:BRIO_DATA.uid('report'),...t,reason:reason.value,details:details.value,status:'local_only',createdAt:now});
   if(await BRIO_UI.persist(box.status)){box.close();toast('Denúncia salva neste dispositivo; não enviada à equipe.',6000);}else box.status.textContent='Denúncia em memória; exporte uma recuperação antes de fechar a página.';
  }catch(e){box.status.textContent=e.message;}finally{submit.disabled=false;}});box.body.append(submit);box.show();
 }
 function policy(){const box=BRIO_UI.dialog('brio-community-policy','Privacidade e convivência — proposta');for(const text of [
  'No feed online, publicações, nick, identificação de autoria, comentários, reações e links são compartilhados com participantes autenticados, inclusive anônimos. Esse acesso não é restrito por convite.',
  'Notas, percursos, diário e grafo permanecem locais. Publicar é uma decisão sua; não publique dados pessoais de terceiros, credenciais ou conteúdo privado do PKM.',
  'Denúncias desta prévia são locais, entram no seu backup e não chegam automaticamente a uma equipe. Ocultar afeta apenas este dispositivo e pode ser desfeito.',
  'Respeite as pessoas, indique fontes e incertezas, não pratique assédio, discriminação, spam ou exposição de dados pessoais. Divergências devem tratar de ideias e evidências.',
  'Antes da liberação pública, o responsável, o canal de atendimento, a retenção de denúncias/evidências e o processo de revisão precisam ser definidos e aprovados. A administração não está disponível no aplicativo comum.'
 ])box.body.append(BRIO_UI.node('p','brio3-help',text));box.show();}
 function open(){const box=BRIO_UI.dialog('brio-moderation-local','Denúncias e ocultações locais');box.body.append(BRIO_UI.node('p','brio3-help','Os registros abaixo são locais. Nenhuma denúncia foi enviada à equipe. Seu backup pode conter os detalhes que você escreveu.'));
  for(const row of rows('moderationReports'))box.body.append(BRIO_UI.node('p','',row.kind+' · '+(reasons.find(([v])=>v===row.reason)?.[1]||row.reason)+' · salva localmente'));
  if(!rows('moderationReports').length)box.body.append(BRIO_UI.node('p','','Nenhuma denúncia local.'));
  for(const row of rows('moderationHidden').filter(r=>r.hidden)){const line=BRIO_UI.node('div','brio3-details');line.append(BRIO_UI.node('p','',row.kind==='post'?'Publicação oculta':'Comentário oculto'),BRIO_UI.button('Voltar a mostrar',async()=>{await setHidden(row,false);box.close();open();}));box.body.append(line);}box.body.append(BRIO_UI.button('Privacidade e convivência',policy));box.show();}
 function decorate(){const posts=BRIO_ONLINE?BRIO_REMOTE_FEED:S.feed;const cards=document.querySelectorAll('article.feed-card');cards.forEach((card,index)=>{const p=posts[index];if(!p)return;const t=target('post',p.id);
   if(hidden(t)){card.replaceChildren(BRIO_UI.node('p','','Publicação oculta apenas neste dispositivo.'),BRIO_UI.button('Mostrar publicação',()=>setHidden(t,false)));return;}
   const controls=BRIO_UI.node('div','feed-integrations');controls.append(BRIO_UI.button('Denunciar publicação',()=>report(t)),BRIO_UI.button('Ocultar publicação',()=>setHidden(t,true)));card.append(controls);
   card.querySelectorAll('.comment-row').forEach((line,i)=>{const c=p.comentarios?.[i];if(!c)return;const ct=target('comment',p.id,c.key??c.id??i);if(hidden(ct)){line.replaceChildren(BRIO_UI.node('span','','Comentário oculto neste dispositivo.'),BRIO_UI.button('Mostrar comentário',()=>setHidden(ct,false)));return;}line.append(BRIO_UI.button('Denunciar comentário',()=>report(ct),'btn btn-xs'),BRIO_UI.button('Ocultar comentário',()=>setHidden(ct,true),'btn btn-xs'));});
  });
  const feed=document.getElementById('feed-lista');if(feed&&!feed.querySelector('[data-local-moderation]')){const note=BRIO_UI.node('p','status-mini','Denúncias e ocultações desta prévia ficam apenas neste dispositivo.');note.dataset.localModeration='true';feed.prepend(note);}
 }
 const baseFeed=renderFeed;renderFeed=function(){baseFeed();decorate();};
 const baseProfile=renderPerfil;renderPerfil=function(){baseProfile();const host=document.querySelector('.backup-actions');if(host&&!host.querySelector('[data-moderation-button]')){const b=BRIO_UI.button('Denúncias e ocultações locais',open);b.dataset.moderationButton='true';host.append(b,BRIO_UI.button('Privacidade e convivência',policy));}};
 BRIO_BOOT_PROMISE.then(()=>{renderFeed();renderPerfil();});return {report,setHidden,hidden,open,policy};
})();
window.BRIO_MODERATION=BRIO_MODERATION;
