'use strict';
const BRIO_LEARNING=(()=>{
 const {node,button,field,dialog,writable,persist}=BRIO_UI;
 const forms=new Set();let workspace=null;
 const prompts=[
  {id:'hipotese',text:'Qual é sua hipótese? Como você a formularia antes de consultar outras respostas?',reason:'Pergunta do catálogo local sobre a hipótese inicial.'},
  {id:'evidencia',text:'Que evidências sustentam essa afirmação? Qual trecho pode ser conferido na fonte?',reason:'Pergunta do catálogo local sobre evidências; a presença de uma fonte não comprova a afirmação.'},
  {id:'alternativa',text:'Existe outra explicação para o que você observou?',reason:'Pergunta do catálogo local para examinar alternativas.'},
  {id:'refutacao',text:'Que observação ou evidência poderia fazer você revisar sua hipótese?',reason:'Pergunta do catálogo local sobre condições de revisão.'},
  {id:'lacuna',text:'O que você ainda não sabe? Qual seria um próximo passo possível?',reason:'Pergunta do catálogo local sobre lacunas e próximos passos.'},
  {id:'revisao',text:'O que mudou entre sua explicação inicial e a atual? Por quê?',reason:'Pergunta do catálogo local sobre mudança de entendimento.'}
 ];
 function data(){if(!S.brioLearning)S.brioLearning=BRIO_DATA.empty();return S.brioLearning;}
 function current(){const d=data();return d.journeys.find(j=>j.id===d.activeJourneyId)||d.journeys[0]||null;}
 function rows(key,jid=current()?.id){return data()[key].filter(x=>x.journeyId===jid);}
 function put(key,record){const list=data()[key],index=list.findIndex(x=>x.id===record.id);if(index<0)list.push(record);else list[index]=record;return record;}
 function resolve(ref){
  if(!ref)return null;if(ref.revisionId){const rev=S.brioSafety?.revisions.find(r=>r.id===ref.revisionId);if(rev)return rev.snapshot;}
  if(ref.collection==='notas')return S.notas.find(n=>n.id===ref.id)||S.brioSafety?.trash.find(t=>t.note.id===ref.id)?.note;
  if(ref.collection==='brio3.plans')return S.brio3?.plans.find(p=>p.id===ref.id);
  if(ref.collection==='grafo.nos')return S.grafo.nos.find(n=>n.id===ref.id);
  if(ref.collection==='flashcards')return S.flashcards.find(n=>n.id===ref.id);
  if(ref.collection.startsWith('pkm.'))return S.pkm[ref.collection.slice(4)]?.find(n=>n.id===ref.id);
  if(ref.collection.startsWith('brioLearning.'))return data()[ref.collection.slice(13)]?.find(n=>n.id===ref.id);return null;
 }
 function link(ref,role,jid=current()?.id,persistNow=true){
  if(!jid||!writable())return null;ref=BRIO_clone(ref);
  if(ref.collection==='notas'&&!ref.revisionId){const note=resolve(ref);if(note)ref.revisionId=BRIO_NOTES.snapshot(note,'vinculo_ao_percurso');}
  const previous=data().links.find(x=>x.journeyId===jid&&x.role===role&&BRIO_canonical(x.ref)===BRIO_canonical(ref));if(previous)return previous;
  const record={id:BRIO_DATA.uid('link'),journeyId:jid,ref,role,createdAt:Date.now()};data().links.push(record);if(persistNow)salvarEstado();return record;
 }
 function refresh(){if(workspace?.element.isConnected)draw(workspace);}
 function form(key,title,specs,transform=null){
  if(!writable())return;const jid=current()?.id||null;if(key!=='journeys'&&!jid){toast('Crie ou selecione um percurso.');return;}
  const draft=data().drafts.find(d=>d.kind===key&&d.journeyId===jid),box=dialog('brio-learning-form',title),inputs={},recordId=BRIO_DATA.uid(key),draftId=draft?.id||BRIO_DATA.uid('draft');
  for(const spec of specs)inputs[spec.key]=field(box.body,'brio-learn-'+spec.key,spec.label,draft?.values[spec.key]??spec.value??'',spec.kind||'textarea',spec.options||[]);
  let timer=null,dirty=false,finished=false;
  const capture=()=>Object.fromEntries(Object.entries(inputs).map(([k,e])=>[k,e.value]));
  function stash(){clearTimeout(timer);if(!dirty||finished)return;put('drafts',{id:draftId,journeyId:jid,kind:key,values:capture(),updatedAt:Date.now()});if(writable())salvarEstado();dirty=false;}
  for(const e of Object.values(inputs)){e.addEventListener('input',()=>{dirty=true;clearTimeout(timer);timer=setTimeout(stash,450);});e.addEventListener('change',()=>{dirty=true;stash();});}
  const save=button('Salvar registro',async()=>{
   if(!writable())return;const values=capture();if(specs.some(s=>s.required&&!values[s.key].trim())){box.status.textContent='Preencha os campos indicados. O rascunho será mantido.';return;}
   const previousState=BRIO_clone(S);let prepared=false;save.disabled=true;try{
    let record={id:recordId,journeyId:jid,...values,createdAt:Date.now(),updatedAt:Date.now()};if(transform)record=transform(record);
    put(key,record);if(key==='journeys')data().activeJourneyId=record.id;data().drafts=data().drafts.filter(d=>d.id!==draftId);
    BRIO_validateState(S);prepared=true;
    if(await persist(box.status)){finished=true;dirty=false;box.close();refresh();}
   }catch(error){if(!prepared){S=previousState;dirty=true;stash();}box.status.textContent='Registro não concluído: '+error.message;}finally{save.disabled=false;}
  },'btn btn-g');box.body.append(save);box.element.addEventListener('cancel',stash);box.element.addEventListener('close',()=>{stash();forms.delete(stash);});forms.add(stash);box.show();if(draft)box.status.textContent='Rascunho recuperado.';return box;
 }
 const spec=(key,label,required=false,kind='textarea',options=[])=>({key,label,required,kind,options});
 function newJourney(){return form('journeys','Começar um percurso',[
  spec('title','Título *',true,'input'),spec('problem','Qual problema ou dúvida você quer investigar? *',true),spec('hypothesis','O que você pensa inicialmente?'),spec('project','Projeto PARA (opcional)',false,'select',[['','Sem projeto'],...S.pkm.projetos.map(p=>[String(p.id),p.titulo])])
 ],r=>{const p=S.pkm.projetos.find(p=>String(p.id)===r.project);delete r.project;delete r.journeyId;return {...r,status:'rascunho',paraRef:p?{collection:'pkm.projetos',id:p.id}:null};});}
 function source(){return form('sources','Registrar uma fonte',[spec('title','Título ou identificação *',true,'input'),spec('author','Autoria (se conhecida)',false,'input'),spec('date','Data da publicação (se conhecida)',false,'input'),spec('url','Link HTTP/HTTPS (opcional)',false,'input'),spec('excerpt','Trecho e localização na fonte'),spec('limits','Limites, dúvidas e contexto')],r=>{if(r.url&&!BRIO_safeURL(r.url))throw new Error('Use URL HTTP/HTTPS sem usuário ou senha.');return r;});}
 function claim(){return form('claims','Examinar uma afirmação',[spec('text','Afirmação selecionada pelo usuário *',true),spec('nature','Natureza indicada por você',false,'select',[['factual','Afirmação factual'],['inferencia','Inferência'],['opiniao','Opinião'],['mista','Mista/indeterminada']]),spec('assessment','Exame contextual, sem selo automático de verdade',false,'select',[['nao_examinada','Não examinada'],['inconclusiva','Inconclusiva'],['corroborada_no_recorte','Corroborada no recorte examinado'],['contraditada_no_recorte','Contraditada no recorte examinado']])]);}
 function evidence(){const sources=data().sources;if(!sources.length){toast('Registre uma fonte primeiro.');return source();}
  return form('evidence','Relacionar evidência e interpretação',[spec('sourceId','Fonte examinada *',true,'select',[['','Selecione'],...sources.map(s=>[s.id,s.title])]),spec('claimId','Afirmação (ou problema geral)',false,'select',[['','Problema geral'],...rows('claims').map(c=>[c.id,c.text.slice(0,90)])]),spec('excerpt','Trecho ou observação *',true),spec('interpretation','Como isso se relaciona com a afirmação? *',true),spec('position','Direção indicada por você',false,'select',[['contextualiza','Contextualiza'],['sustenta','Sustenta'],['contradiz','Contradiz']]),spec('limits','Limites: método, relevância, independência e contexto')],r=>({...r,claimId:r.claimId||null}));
 }
 function question(){return form('questions','Registrar uma dúvida',[spec('text','Dúvida ou lacuna *',true),spec('nextStep','Qual próximo passo pode ajudar?')],r=>({...r,status:'aberta',answer:'',targetRef:null}));}
 function reflection(phase='durante'){return form('reflections','Diário metacognitivo',[{...spec('phase','Momento',false,'select',[['antes','Antes'],['durante','Durante'],['depois','Depois'],['comparacao','Comparação de explicações']]),value:phase},spec('prior','O que eu sabia ou imaginava antes?'),spec('strategy','Que estratégia utilizei?'),spec('difficulties','Onde tive dificuldade?'),spec('changes','O que mudou e quais evidências me fizeram mudar?'),spec('conclusion','Conclusão provisória ou reflexão *',true),spec('limits','Limites e dúvidas que permanecem'),spec('nextStep','Próximo passo')]);}
 function argument(){const previous=window._ultimoEpvt;return form('arguments','EPVT · exame humano do argumento',[
  {...spec('thesis','Tese *',true),value:previous?.tese||''},{...spec('premises','Premissas e razões'),value:previous?.arg||''},spec('conclusion','Conclusão defendida'),spec('warrant','Por que as premissas sustentariam a conclusão?'),{...spec('objection','Objeção ou contraexemplo'),value:previous?.contra||''},spec('evidenceNotes','Qualidade, fontes e verificação factual das evidências'),spec('humanAssessment','Seu exame: o que foi verificado e o que permanece incerto?')
 ]);}
 function news(){return form('newsCases','Laboratório de verificação de notícias',[
  spec('title','Título ou identificação *',true,'input'),spec('text','Texto/trecho que você quer investigar *',true),spec('author','Autoria (se conhecida)',false,'input'),spec('date','Data (se conhecida)',false,'input'),spec('genre','Gênero indicado por você',false,'select',[['indeterminado','Indeterminado'],['noticia','Notícia'],['editorial','Editorial'],['analise','Análise'],['opiniao','Opinião'],['misto','Misto']]),spec('claimsText','Afirmações verificáveis selecionadas por você, uma por linha'),spec('conclusion','Sua conclusão fundamentada, quando houver'),spec('uncertainties','Incertezas e informações ainda necessárias')
 ],r=>{r.claimIds=[];for(const text of [...new Set(r.claimsText.split('\n').map(x=>x.trim()).filter(Boolean))]){let c=data().claims.find(c=>c.journeyId===r.journeyId&&c.text===text&&c.nature==='factual');if(!c){c={id:BRIO_DATA.uid('claim'),journeyId:r.journeyId,text,nature:'factual',assessment:'nao_examinada',createdAt:Date.now()};put('claims',c);}r.claimIds.push(c.id);}delete r.claimsText;return r;});}
 function tutor(index=null){const j=current();if(!j)return newJourney();if(index===null){index=!j.hypothesis.trim()?0:!rows('evidence').length?1:2+rows('socraticSessions').length%4;}
  const p=prompts[index],box=dialog('brio-socratic','Tutor socrático · perguntas locais');box.body.append(node('p','brio3-preserve',p.text),node('p','brio3-help',p.reason+' Não há geração de respostas ou análise semântica. Você pode pular ou discordar.'));
  const response=field(box.body,'brio-socratic-response','Sua resposta, dúvida ou discordância');const id=BRIO_DATA.uid('socratic');let saved=false,timer=null;
  const capture=()=>{clearTimeout(timer);if(saved||!response.value.trim())return;put('socraticSessions',{id,journeyId:j.id,promptId:p.id,prompt:p.text,reason:p.reason,response:response.value,at:Date.now()});if(writable())salvarEstado();};response.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(capture,450);});
  box.body.append(button('Registrar minha resposta',async()=>{if(!response.value.trim()){box.status.textContent='Escreva uma resposta ou pule a pergunta.';return;}capture();if(await persist(box.status)){saved=true;box.close();refresh();}},'btn btn-g'),button('Pular esta pergunta',()=>{capture();box.close();tutor((index+1)%prompts.length);}));forms.add(capture);box.element.addEventListener('close',()=>{capture();forms.delete(capture);refresh();});box.show();
 }
 function polya(){const j=current();if(!j)return newJourney();workspace?.close();const previous=rows('links',j.id).find(l=>l.role==='polya'&&resolve(l.ref));
  if(previous){BRIO3.openPlanById(previous.ref.id);return;}
  const id=BRIO3.openNewPlan(j.paraRef?.collection==='pkm.projetos'?j.paraRef.id:null,j.title);if(id)link({collection:'brio3.plans',id},'polya',j.id);
 }
 function startNote(method){const j=current();if(!j)return newJourney();workspace?.close();openModal('modal-nota-nova');
  const pending=BRIO3.valid(S.brio3)&&S.brio3.noteDraft;const hasDraft=pending&&Object.entries(pending.core).some(([k,v])=>k!=='nn-pasta'&&v.trim());
  if(hasDraft&&!confirm('Há um rascunho preservado. Deseja vinculá-lo a este percurso ao salvar? Cancelar mantém o rascunho sem novo vínculo.')){data().noteContext=null;return;}
  data().noteContext={journeyId:j.id,role:method};const select=document.getElementById('brio3-note-template');select.value=method;select.dispatchEvent(new Event('change',{bubbles:true}));salvarEstado();
  let banner=document.getElementById('brio-note-context');if(!banner){banner=node('p','brio3-feedback');banner.id='brio-note-context';document.querySelector('#modal-nota-nova .modal-body').prepend(banner);}banner.textContent='Percurso: '+j.title+' · O conteúdo permanece de sua autoria.';
 }
 function attach(collection,role,items){const box=dialog('brio-learning-link','Vincular registro existente');if(!items.length){box.body.append(node('p','','Nenhum registro disponível.'));box.show();return;}
  const select=field(box.body,'brio-link-target','Registro','', 'select',items.map(x=>[String(x.id),x.titulo||x.title||x.label||x.pergunta||String(x.id)]));
  box.body.append(button('Vincular ao percurso',async()=>{const item=items.find(x=>String(x.id)===select.value);if(!item)return;link({collection,id:item.id},role);if(await persist(box.status)){box.close();refresh();}},'btn btn-g'));box.show();
 }
 function attempt(){const j=current();if(!j)return newJourney();const linked=rows('links').find(x=>x.ref.collection==='notas'&&resolve(x.ref)),note=linked?resolve(linked.ref):null,box=dialog('brio-learning-attempt','Recuperar antes de consultar');
  const q=field(box.body,'brio-attempt-question','Sua pergunta *'),response=field(box.body,'brio-attempt-response','Tente responder sem consulta *'),comparison=field(box.body,'brio-attempt-comparison','Depois de conferir: o que faltou ou precisa mudar?');comparison.disabled=true;
  const id=BRIO_DATA.uid('attempt');let revealed=false,timer=null;
  function save(){clearTimeout(timer);if(!response.value.trim()||!q.value.trim())return false;const previous=data().attempts.find(x=>x.id===id);put('attempts',{id,journeyId:j.id,question:q.value,response:previous?.revealedAt?previous.response:response.value,comparison:comparison.value,originRef:linked?.ref||null,at:previous?.at||Date.now(),revealedAt:revealed?(previous?.revealedAt||Date.now()):null});if(writable())salvarEstado();return true;}
  for(const e of [q,response,comparison])e.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(save,450);});
  box.body.append(button('Conferir a nota de origem',()=>{if(!save()){box.status.textContent='Registre a pergunta e sua tentativa antes de conferir.';return;}revealed=true;save();response.disabled=true;q.disabled=true;comparison.disabled=false;if(note)BRIO_NOTES.view(note,'Fonte para conferir sua tentativa');else box.status.textContent='Nenhuma nota vinculada. Consulte a fonte por sua iniciativa e registre a comparação.';}),button('Registrar tentativa',async()=>{if(!save()){box.status.textContent='Escreva a pergunta e sua tentativa.';return;}if(await persist(box.status)){box.close();refresh();}},'btn btn-g'));forms.add(save);box.element.addEventListener('close',()=>{save();forms.delete(save);refresh();});box.show();
 }
 function draw(box){
  box.body.replaceChildren();const d=data(),j=current();
  box.body.append(node('p','brio3-help','Os métodos são caminhos opcionais. Registre seu raciocínio e as dúvidas que permanecem; concluir não certifica domínio nem veracidade.'));
  const picker=field(box.body,'brio-journey-picker','Percurso ativo',j?.id||'','select',d.journeys.map(x=>[x.id,x.title]));picker.addEventListener('change',()=>{d.activeJourneyId=picker.value;salvarEstado();draw(box);});
  box.body.append(button('Novo percurso',newJourney,'btn btn-g'));if(!j){box.body.append(node('p','','Comece por uma dúvida ou um problema seu.'));return;}
  const statusLabel={rascunho:'rascunho',revisando:'em revisão',arquivado:'arquivado',investigando:'em investigação',concluido:'concluído',concluido_com_pendencias:'concluído com dúvidas abertas'};
  box.body.append(node('h3','',j.title),node('p','brio3-preserve',j.problem),node('p','brio3-help','Hipótese inicial: '+(j.hypothesis||'não registrada')+' · Situação: '+(statusLabel[j.status]||'em preparação')));
  const groups=[['Investigar o problema',[['Roteiro Pólya',polya],['Registrar fonte',source],['Examinar afirmação',claim],['Relacionar evidência',evidence],['Exame do argumento · EPVT',argument],['Verificar notícia',news]]],['Elaborar o que aprendeu',[['Explicar com Feynman',()=>startNote('feynman')],['Organizar com Cornell',()=>startNote('cornell')]]],['Rever e refletir',[['Registrar dúvida',question],['Diário metacognitivo',()=>reflection()],['Tutor socrático',()=>tutor()],['Recuperar sem consulta',attempt]]]];
  for(const [index,[title,actions]]of groups.entries()){const group=node('details','brio3-details');group.open=index===0;group.append(node('summary','',title));const area=node('div','brio3-actions');for(const [label,action]of actions)area.append(button(label,action));group.append(area);box.body.append(group);}
  const links=node('section');links.append(node('h3','','Registros do percurso'),button('Vincular nota existente',()=>attach('notas','nota',S.notas)),button('Vincular nó do grafo',()=>attach('grafo.nos','grafo',S.grafo.nos)),button('Vincular flashcard',()=>attach('flashcards','flashcard',S.flashcards)),button('Abrir grafo conceitual',()=>{box.close();navTo('grafo');}),button('Revisar flashcards',()=>{box.close();navTo('cards');}));
  for(const l of rows('links')){const item=resolve(l.ref),title=item?.titulo||item?.title||item?.label||item?.pergunta||String(l.ref.id);const row=node('p','brio3-preserve',l.role+' · '+title+(item?'':' · referência sem alvo disponível'));if(item&&l.ref.collection==='notas')row.append(button('Examinar versão vinculada',()=>BRIO_NOTES.view(item)),button('Versões da nota',()=>BRIO_NOTES.versions(l.ref.id)));if(item&&l.ref.collection==='brio3.plans')row.append(button('Retomar roteiro',()=>{box.close();BRIO3.openPlanById(l.ref.id);}));links.append(row);}box.body.append(links);
  const open=rows('questions').filter(q=>q.status==='aberta');const questions=node('section');questions.append(node('h3','','Dúvidas abertas: '+open.length));for(const q of rows('questions')){const row=node('div','brio3-details');row.append(node('p','brio3-preserve',q.text+' · '+q.status),node('p','brio3-help',q.nextStep));if(q.status!=='resolvida')row.append(button('Registrar resposta e revisão',()=>{const answer=dialog('brio-question-answer','Revisar a dúvida');const text=field(answer.body,'brio-question-answer-text','Qual sua resposta ou o que mudou?',q.answer);answer.body.append(button('Marcar como revisada',async()=>{if(!text.value.trim()){answer.status.textContent='Escreva sua revisão.';return;}const item=data().questions.find(x=>x.id===q.id);item.answer=text.value;item.status='resolvida';if(await persist(answer.status)){answer.close();refresh();}},'btn btn-g'));answer.show();}));questions.append(row);}box.body.append(questions);
  const history=node('section');history.append(node('h3','','Revisão do percurso intelectual'));
  const labels={title:'Título',text:'Texto/afirmação',author:'Autoria',date:'Data informada',url:'Link',excerpt:'Trecho',limits:'Limites',nature:'Natureza indicada',assessment:'Exame do usuário',interpretation:'Interpretação',position:'Direção indicada',thesis:'Tese',premises:'Premissas',conclusion:'Conclusão/reflexão',warrant:'Passagem à conclusão',objection:'Objeção',evidenceNotes:'Exame das evidências',humanAssessment:'Avaliação humana',phase:'Momento',prior:'Conhecimento anterior',strategy:'Estratégia',difficulties:'Dificuldades',changes:'Mudanças de entendimento',nextStep:'Próximo passo',question:'Pergunta',response:'Resposta própria',comparison:'Comparação após consulta',genre:'Gênero indicado',uncertainties:'Incertezas',prompt:'Pergunta do catálogo',reason:'Motivo da pergunta'};
  for(const key of ['sources','claims','evidence','arguments','reflections','attempts','newsCases','socraticSessions'])for(const r of rows(key)){const details=node('details','brio3-details');details.append(node('summary','',({sources:'Fonte',claims:'Afirmação',evidence:'Evidência',arguments:'Argumento',reflections:'Reflexão',attempts:'Recuperação',newsCases:'Notícia',socraticSessions:'Pergunta socrática'})[key]+' · '+(r.title||r.thesis||r.text||r.conclusion||r.question||r.prompt||r.interpretation||'Registro').slice(0,90)));for(const [k,v]of Object.entries(r))if(typeof v==='string'&&labels[k])details.append(node('p','brio3-preserve',labels[k]+': '+v));history.append(details);}box.body.append(history);
  box.body.append(button('Rever conclusão e limites',()=>reflection('depois'),'btn btn-g'),button('Encerrar percurso',async()=>{const item=current();item.status=open.length?'concluido_com_pendencias':'concluido';item.updatedAt=Date.now();await persist(box.status);draw(box);}),button('Continuar investigando',async()=>{current().status='investigando';await persist(box.status);draw(box);}));
 }
 function open(){if(!writable()){toast('Os dados estão protegidos; exporte a recuperação para examinar as cópias.');return;}workspace=dialog('brio-learning-workspace','Percurso de investigação');draw(workspace);workspace.show();}
 function flush(){for(const save of forms)save();}
 const baseSave=salvarNotaProfunda;salvarNotaProfunda=function(){const before=new Set(S.notas.map(n=>n.id)),cards=new Set(S.flashcards.map(n=>n.id)),nodes=new Set(S.grafo.nos.map(n=>n.id)),context=S.brioLearning?.noteContext;const result=baseSave();const note=S.notas.find(n=>!before.has(n.id));if(note&&context){link({collection:'notas',id:note.id},context.role,context.journeyId,false);for(const method of ['feynman','cornell'])if(Object.values(note.pedagogia?.fields?.[method]||{}).some(v=>typeof v==='string'&&v.trim()))link({collection:'notas',id:note.id},method,context.journeyId,false);for(const c of S.flashcards.filter(c=>!cards.has(c.id)))link({collection:'flashcards',id:c.id},'flashcard',context.journeyId,false);for(const n of S.grafo.nos.filter(n=>!nodes.has(n.id)))link({collection:'grafo.nos',id:n.id},'grafo',context.journeyId,false);data().noteContext=null;salvarEstado();}return result;};
 const baseRate=avaliarCard;avaliarCard=function(rating){const id=cardAtual?.id,previous=S.flashcards.find(x=>x.id===id)?.revisoes||0;const result=baseRate(rating);const card=S.flashcards.find(x=>x.id===id);if(card&&card.revisoes>previous&&S.brioLearning){const links=data().links.filter(l=>l.ref.collection==='flashcards'&&l.ref.id===id);for(const l of links)put('reviewEvents',{id:BRIO_DATA.uid('review'),journeyId:l.journeyId,cardRef:{collection:'flashcards',id},rating,intervalDays:INTERVALOS[rating],at:Date.now()});salvarEstado();}return result;};
 for(const target of [document.getElementById('pg-dash'),document.getElementById('pg-para')]){const section=node('section','brio3-guide');section.append(node('h3','','Percursos de investigação'),node('p','brio3-help','Conecte problema, fontes, explicações, revisão e dúvidas.'),button('Abrir percursos',open,'btn btn-g'));target.prepend(section);}
 document.querySelector('#pg-analise').append(button('Registrar exame no percurso',argument));
 window.addEventListener('pagehide',flush);document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')flush();});
 return {open,newJourney,source,claim,evidence,question,reflection,argument,news,tutor,polya,startNote,attempt,link,resolve,current,flush};
})();
window.BRIO_LEARNING=BRIO_LEARNING;
