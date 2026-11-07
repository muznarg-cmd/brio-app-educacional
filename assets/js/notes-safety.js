'use strict';
const BRIO_NOTES=(()=>{
 const {node,button,field,dialog,writable,persist}=BRIO_UI;
 const openEditors=new Set();
 const labels={feynman:{explain:'Explicação em suas palavras',doubts:'Lacunas e dúvidas',example:'Exemplo',revision:'Revisão da explicação',source:'Fonte'},cornell:{cues:'Perguntas e pistas',notes:'Anotações',summary:'Síntese',review:'Recuperação ativa',source:'Fonte'}};
 function store(){if(!S.brioSafety)S.brioSafety=BRIO_DATA.safety();if(!S.brioSafety.editDrafts)S.brioSafety.editDrafts=[];return S.brioSafety;}
 function snapshot(note,reason='antes_de_editar'){
  const st=store(),fingerprint=BRIO_canonical(note),previous=st.revisions.find(r=>String(r.noteId)===String(note.id)&&BRIO_canonical(r.snapshot)===fingerprint);
  if(previous)return previous.id;
  const record={id:BRIO_DATA.uid('rev'),noteId:note.id,snapshot:BRIO_clone(note),savedAt:Date.now(),reason};st.revisions.push(record);return record.id;
 }
 function trash(id){
  if(!writable())return;const note=S.notas.find(n=>n.id===id);if(!note)return;
  if(!confirm('Mover esta nota para a lixeira? Ela poderá ser restaurada com todos os campos.'))return;
  store().trash.push({id:BRIO_DATA.uid('trash'),note:BRIO_clone(note),removedAt:Date.now(),restoredAt:null});
  S.notas=S.notas.filter(n=>n.id!==id);salvarEstado();renderNotas();atualizarStats();closeModal('modal-ver-nota');toast('Nota preservada na lixeira. Confira o salvamento.');
 }
 function restore(id){
  if(!writable())return null;const item=store().trash.find(x=>x.id===id);if(!item||item.restoredAt)return null;
  const note=BRIO_clone(item.note);if(S.notas.some(n=>String(n.id)===String(note.id)))note.id=BRIO_DATA.uid('n_restaurada');
  S.notas.unshift(note);item.restoredAt=Date.now();item.restoredNoteId=note.id;salvarEstado();renderNotas();atualizarStats();return note.id;
 }
 function view(note,title='Versão preservada'){
  const box=dialog('brio-note-snapshot',title);box.body.append(node('h3','',note.titulo));
  for(const [k,label]of [['conteudo','Conteúdo'],['interp','Interpretação'],['contexto','Contexto'],['limite','Limitações'],['contra','Contraexemplo'],['emocao','Reflexão']])if(note[k])box.body.append(node('h4','',label),node('p','brio3-preserve',note[k]));
  if(note.pedagogia?.fields)for(const [method,fields]of Object.entries(note.pedagogia.fields)){box.body.append(node('h4','',method));for(const [k,value]of Object.entries(fields))if(typeof value==='string'&&value)box.body.append(node('p','brio3-preserve',(labels[method]?.[k]||k)+': '+value));}
  box.show();
 }
 function openTrash(){const box=dialog('brio-trash','Notas preservadas na lixeira');box.body.append(node('p','brio3-help','Restaurar mantém todos os campos. Se o ID já existir, a nota recebe outro ID. O registro de recuperação é mantido.'));
  function draw(){const list=box.body.querySelector('[data-trash-list]');if(list)list.remove();const rows=node('div');rows.dataset.trashList='';const items=(S.brioSafety?.trash||[]).filter(x=>!x.restoredAt);
   if(!items.length)rows.append(node('p','','Nenhuma nota aguardando restauração.'));
   for(const item of items){const row=node('section','brio3-details');row.append(node('h3','',item.note.titulo),button('Examinar nota',()=>view(item.note)),button('Restaurar nota',async()=>{restore(item.id);await persist(box.status);draw();},'btn btn-g'));rows.append(row);}box.body.append(rows);
  }draw();box.show();
 }
 function versions(id){const box=dialog('brio-note-versions','Versões e rascunhos preservados');const rows=(S.brioSafety?.revisions||[]).filter(r=>String(r.noteId)===String(id));
  if(!rows.length)box.body.append(node('p','','Esta nota ainda não tem uma versão anterior registrada.'));
  for(const row of rows)box.body.append(button(new Date(row.savedAt).toLocaleString('pt-BR')+' · '+row.snapshot.titulo,()=>view(row.snapshot)));
  const current=S.notas.find(n=>n.id===id);if(current)box.body.append(button('Examinar versão atual',()=>view(current,'Versão atual')));box.show();
 }
 function edit(id){
  if(!writable())return;const original=S.notas.find(n=>n.id===id);if(!original)return;
  const draft=S.brioSafety?.editDrafts?.find(x=>String(x.noteId)===String(id));
  const baseline=BRIO_canonical(original),initial=draft?.snapshot||original,box=dialog('brio-note-edit','Editar nota preservando a versão anterior'),inputs={};
  box.body.append(node('p','brio3-help','A versão anterior será preservada. Edite os campos Feynman/Cornell abaixo quando existirem. Eles e o conteúdo livre são registros distintos; uma edição não reescreve automaticamente o outro.'));
  for(const [key,label]of [['titulo','Título'],['conteudo','Conteúdo'],['interp','Interpretação'],['contexto','Contexto'],['limite','Limitações'],['contra','Contraexemplo'],['emocao','Reflexão']])inputs[key]=field(box.body,'brio-edit-'+key,label,initial[key]||'',key==='titulo'?'input':'textarea');
  inputs.pasta=field(box.body,'brio-edit-pasta','Pasta PARA',initial.pasta||'recursos','select',Object.entries(PARA_CONFIG).map(([k,v])=>[k,v.label]));
  const structured=[];
  for(const [method,fields]of Object.entries(initial.pedagogia?.fields||{})){if(!labels[method])continue;const group=node('details','brio3-details');group.append(node('summary','',method==='feynman'?'Campos Feynman':'Campos Cornell'));for(const [key,value]of Object.entries(fields))if(typeof value==='string'){const input=field(group,'brio-edit-ped-'+method+'-'+key,labels[method][key]||key,value);structured.push({method,key,input});}box.body.append(group);}
  const draftId=draft?.id||BRIO_DATA.uid('edit');let timer=null,finished=false,dirty=false;
  const capture=()=>{const note=BRIO_clone(initial);for(const [key,input]of Object.entries(inputs))note[key]=input.value;for(const {method,key,input}of structured)note.pedagogia.fields[method][key]=input.value;note.id=original.id;return note;};
  function flush(){clearTimeout(timer);if(!dirty||finished)return;const st=store(),record={id:draftId,noteId:id,snapshot:capture(),baseFingerprint:draft?.baseFingerprint||baseline,savedAt:Date.now()};const i=st.editDrafts.findIndex(x=>String(x.noteId)===String(id));if(i<0)st.editDrafts.push(record);else st.editDrafts[i]=record;if(writable())salvarEstado();else box.status.textContent='Rascunho mantido em memória; exporte JSON antes de fechar a página.';dirty=false;}
  for(const input of [...Object.values(inputs),...structured.map(x=>x.input)])input.addEventListener('input',()=>{dirty=true;clearTimeout(timer);timer=setTimeout(flush,450);});inputs.pasta.addEventListener('change',()=>{dirty=true;flush();});
  const save=button('Salvar edição',async()=>{
   if(!writable())return;const note=capture();if(!note.titulo.trim()){box.status.textContent='Escreva um título. O rascunho será mantido.';return;}
   const current=S.notas.find(n=>n.id===id);if(!current){box.status.textContent='A nota não está ativa. O rascunho foi preservado.';flush();return;}
   if(draft&&draft.baseFingerprint!==baseline){box.status.textContent='A nota mudou desde este rascunho. Confira a versão atual antes de aplicar; o rascunho foi mantido.';flush();return;}
   save.disabled=true;try{snapshot(current);note.updatedAt=Date.now();S.notas[S.notas.findIndex(n=>n.id===id)]=note;store().editDrafts=store().editDrafts.filter(x=>String(x.noteId)!==String(id));
    if(await persist(box.status)){finished=true;dirty=false;renderNotas();box.close();verNota(id);}
   }finally{save.disabled=false;}
  },'btn btn-g');box.body.append(save,button('Comparar versões preservadas',()=>versions(id)));
  box.element.addEventListener('cancel',flush);box.element.addEventListener('close',()=>{flush();openEditors.delete(flush);});openEditors.add(flush);box.show();if(draft)box.status.textContent='Rascunho de edição recuperado.';
 }
 function flush(){for(const save of openEditors)save();}
 window.addEventListener('pagehide',flush);document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')flush();});
  const baseVer=verNota;verNota=function(id){baseVer(id);let foot=document.querySelector('#modal-ver-nota .modal-foot');if(!foot){foot=node('div','modal-foot');document.querySelector('#modal-ver-nota .modal').append(foot);}if(!foot.querySelector('[data-edit-note]')){const editButton=button('Editar nota',()=>edit(notaAtualId));editButton.dataset.editNote='';foot.prepend(editButton,button('Versões anteriores',()=>versions(notaAtualId)));}};
 const target=document.querySelector('#backup-title')?.closest('.wbody').querySelector('.backup-actions');target?.append(button('Lixeira de notas',openTrash));
 return {snapshot,trash,restore,openTrash,edit,versions,view,flush};
})();
window.BRIO_NOTES=BRIO_NOTES;
