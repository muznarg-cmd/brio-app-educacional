
/* BRIO · Etapa 3. Extensão aditiva; o núcleo da entrega anterior permanece intacto. */
(function () {
'use strict';
const G = {
  "dash": {
    "title": "Início",
    "essential": [
      "Um ponto de partida para escolher o que estudar.",
      "Definir uma intenção antes de abrir ferramentas ajuda a orientar a sessão.",
      "Escolha uma pergunta e abra a ferramenta adequada. Para um desafio, use o roteiro inspirado em Pólya.",
      "Quero comparar duas explicações de um mesmo conceito. Registro a pergunta e planejo como conferir as fontes.",
      "Que evidência mostraria que compreendi, além de ter usado o aplicativo?"
    ],
    "deep": [
      "O painel reúne atalhos e registros de uso; não diagnostica capacidades cognitivas.",
      "A escolha de metas torna explícito o objetivo da atividade. É uma hipótese de design, não uma garantia de aprendizagem.",
      "Defina uma tarefa observável, os conhecimentos prévios, as fontes disponíveis e uma forma de conferir o resultado. Reveja o plano quando necessário.",
      "Para preparar uma apresentação, delimite público e tempo, escolha um exemplo, ensaie e confronte a explicação com as fontes.",
      "Como distinguirei tempo de uso, sensação de facilidade e capacidade de explicar ou aplicar?"
    ],
    "question": "Você quer compreender um conceito difícil. Qual começo é mais útil?",
    "options": [
      "Acumular XP sem definir uma pergunta.",
      "Definir o que deseja explicar e como irá conferir.",
      "Abrir todas as ferramentas ao mesmo tempo."
    ],
    "answer": 1,
    "feedback": "Uma pergunta e um critério de conferência dão direção ao estudo. Você pode ajustar o plano durante a atividade."
  },
  "para": {
    "title": "PARA e projetos",
    "essential": [
      "Uma organização em Projetos, Áreas, Recursos e Arquivo.",
      "Relacionar o que guarda com o que precisa fazer.",
      "Abra uma pasta e adicione um item. Em Projetos, o botão Roteiro Pólya ajuda a trabalhar um problema ligado ao item.",
      "Entregar uma apresentação é projeto; docência contínua é área; artigo para consulta é recurso; trabalho concluído vai ao arquivo.",
      "Qual uso concreto justifica guardar este item?"
    ],
    "deep": [
      "PARA é uma proposta prática de organização orientada à ação, não uma teoria de aprendizagem validada pelo BRIO.",
      "A classificação pode facilitar recuperação e uso quando acompanha o contexto de trabalho.",
      "Distinga resultado com término de responsabilidade contínua. Formule o problema do projeto, planeje, registre tentativas e revise. Voltar a uma fase é permitido.",
      "Uma sequência didática com entrega definida cabe em Projetos. Referências reutilizáveis podem ficar em Recursos. Notas e itens continuam coleções distintas.",
      "Minha classificação permite encontrar e utilizar o registro? Preciso reavaliar o contexto?"
    ],
    "question": "Preparar uma apresentação para uma data definida pertence inicialmente a:",
    "options": [
      "Projetos.",
      "Áreas, pois qualquer tarefa é contínua.",
      "Arquivo, mesmo estando em andamento."
    ],
    "answer": 0,
    "feedback": "Um resultado delimitado com término caracteriza projeto. Área é responsabilidade contínua; Arquivo é material inativo."
  },
  "notas": {
    "title": "Notas",
    "essential": [
      "Registros de conteúdo, interpretação, dúvidas e relações.",
      "Explicar com suas palavras e tornar visíveis lacunas de compreensão.",
      "Crie uma nota profunda. Escolha Livre, Feynman ou Cornell; os campos antigos continuam disponíveis. Trocar o template preserva os rascunhos.",
      "No Feynman, explique um conceito e registre onde travou. No Cornell, organize perguntas, anotações e síntese.",
      "O que consigo explicar sem copiar e o que ainda preciso verificar?"
    ],
    "deep": [
      "Notas separam registro externo de compreensão observada. Os templates são apoios, não avaliadores automáticos.",
      "Explicar, recuperar, confrontar fontes e revisar são ações diferentes de apenas transcrever.",
      "Feynman é aqui uma adaptação didática de explicar e revisar lacunas, sem atribuir um protocolo formal a Feynman. Cornell reúne pistas/perguntas, registro e síntese; tente responder com as anotações ocultas.",
      "Ao estudar um artigo, registre autoria e página. Diferencie citação literal de interpretação e formule uma pergunta de aplicação.",
      "A minha paráfrase conserva o sentido? Qual dificuldade pede outra fonte ou exemplo?"
    ],
    "question": "Sua explicação parece clara, mas você não consegue justificar um termo. O próximo passo é:",
    "options": [
      "Apagar a dúvida para a nota parecer pronta.",
      "Registrar a lacuna, consultar uma fonte e revisar a explicação.",
      "Concluir que houve domínio completo."
    ],
    "answer": 1,
    "feedback": "A lacuna é informação útil para revisar. Clareza aparente e preenchimento do template não comprovam compreensão."
  },
  "cards": {
    "title": "Flashcards",
    "essential": [
      "Perguntas com respostas para revisão.",
      "Tentar lembrar antes de consultar e depois conferir a própria resposta.",
      "Crie ou gere um card; tente responder, revele o verso e escolha Difícil, Ok ou Fácil.",
      "Em vez de só pedir uma definição, pergunte como aplicar o conceito em um caso.",
      "Eu lembrei antes de revelar ou apenas reconheci a resposta?"
    ],
    "deep": [
      "A prática de recuperação envolve produzir uma resposta antes de consultar. O verso pode precisar de correção pela fonte.",
      "A agenda atual distribui tentativas com intervalos fixos de 1, 3 e 7 dias; não estima retenção científica.",
      "Use perguntas conceituais, comparativas e de aplicação. Compare sua resposta com critérios de conteúdo; o app não avalia a resposta mental.",
      "Compare dois conceitos próximos e justifique uma diferença. Uma resposta apenas familiar pode esconder confusão.",
      "Minha avaliação de facilidade corresponde ao que realmente consegui produzir?"
    ],
    "question": "Para praticar recuperação, quando revelar a resposta?",
    "options": [
      "Antes de tentar lembrar.",
      "Depois de tentar responder.",
      "Somente depois de ganhar XP."
    ],
    "answer": 1,
    "feedback": "Tente produzir uma resposta primeiro. Depois confira o conteúdo e registre honestamente a dificuldade."
  },
  "grafo": {
    "title": "Mapa cognitivo",
    "essential": [
      "Um mapa de conceitos e ligações.",
      "Inspecionar relações e discutir o sentido de cada conexão.",
      "Adicione nós, conecte dois e explique o vínculo. Exemplo acrescenta uma estrutura sem substituir o mapa.",
      "Ligue afirmação, fonte e evidência, perguntando se a fonte sustenta a conclusão.",
      "A linha representa associação, causa proposta ou inferência justificada?"
    ],
    "deep": [
      "O editor usa convenções didáticas do BRIO; não implementa os grafos existenciais formais de Peirce.",
      "Externalizar relações permite inspecioná-las, mas uma ligação visual não demonstra validade lógica.",
      "A introdução distingue Alfa proposicional, Beta com relações/quantificação e extensões Gama, incluindo modalidades. Não confunda esses sistemas com os tipos de nó.",
      "Uma aresta entre dois termos mostra uma relação escolhida pelo usuário. Para afirmar implicação, é preciso justificar a passagem entre proposições.",
      "Que relação está faltando? O desenho tornou uma suposição mais visível?"
    ],
    "question": "Uma linha entre dois conceitos prova que um causa o outro?",
    "options": [
      "Sim, pois ambos aparecem no mapa.",
      "Não; o significado e a justificativa precisam ser examinados.",
      "Sim, se o nó tiver uma cor específica."
    ],
    "answer": 1,
    "feedback": "A linha registra uma relação proposta. Causalidade e validade exigem evidências e justificativas adicionais."
  },
  "foco": {
    "title": "Foco",
    "essential": [
      "Uma sessão de estudo com tempo e pausas.",
      "Reservar atenção a uma pergunta e observar a estratégia usada.",
      "Defina uma tarefa, inicie ou pause o timer e respeite suas necessidades. Ao final, tente explicar sem consulta.",
      "Vou explicar uma diferença entre dois conceitos e depois conferir na fonte.",
      "Que estratégia funcionou e que dificuldade permanece?"
    ],
    "deep": [
      "O ciclo de foco é um apoio à organização da atenção, não uma medida de aprendizagem ou saúde.",
      "O resultado relevante pode ser uma explicação revisada ou aplicação, não o número de minutos ou sessões.",
      "Use o movimento de compreender e planejar antes do foco; durante a execução registre obstáculos; ao revisar, compare com o objetivo. Você pode mudar de estratégia e fazer pausas.",
      "Se não consegue explicar um termo, uma próxima sessão pode trabalhar esse ponto, em vez de repetir a leitura inteira.",
      "Preciso de mais tempo, outro recurso, descanso ou uma revisão do problema?"
    ],
    "question": "O timer acabou, mas a dúvida permanece. Isso pede:",
    "options": [
      "Mais sessões obrigatórias até ganhar pontos.",
      "Revisar a estratégia e decidir o próximo passo, incluindo pausa.",
      "Considerar a tarefa aprendida automaticamente."
    ],
    "answer": 1,
    "feedback": "Tempo não comprova compreensão. Observe a dúvida e decida uma estratégia e um ritmo adequados."
  },
  "feed": {
    "title": "LearnFeed",
    "essential": [
      "Publicações locais e um modo compartilhado opcional.",
      "Trocar perguntas, explicações e referências com intenção.",
      "Publique uma reflexão e uma pergunta; informe a fonte. Desconectado, o post fica local. Compartilhar depende de ativar o modo online.",
      "Apresente uma interpretação e pergunte qual objeção deveria considerar.",
      "Meu post oferece fundamento ou só pede concordância?"
    ],
    "deep": [
      "O feed pode apoiar discussão, mas reações e comentários não são medidas de entendimento.",
      "Distinguir opinião, experiência e evidência evita atribuir força excessiva a uma publicação.",
      "No texto, explicite o tipo de afirmação, a origem e os limites. O botão Nota cria um registro local. As regras reais de privacidade/moderação do servidor continuam pendentes de auditoria.",
      "Uma experiência de aula pode levantar uma hipótese, sem demonstrar que a estratégia funcionará em qualquer turma.",
      "Que informação tornaria esta discussão mais verificável? Estou expondo algo que deveria ficar privado?"
    ],
    "question": "Qual afirmação é mais cuidadosa ao relatar uma experiência?",
    "options": [
      "Funcionou uma vez; por isso funciona sempre.",
      "Nesta situação observei isto; preciso examinar limites e outras evidências.",
      "Muitas reações provam que a conclusão é verdadeira."
    ],
    "answer": 1,
    "feedback": "Uma experiência tem contexto. Explique o que observou e diferencie hipótese de conclusão geral."
  },
  "analise": {
    "title": "Pistas linguísticas",
    "essential": [
      "Regras locais que destacam expressões para revisão.",
      "Fazer perguntas sobre contexto, afirmações e fontes.",
      "Cole um texto, leia as pistas e confira cada uma no contexto. Não tome o resultado como verificação de verdade.",
      "A frase estudos provam pede a identificação do estudo, do método e dos limites.",
      "O que consigo conferir e o que a ferramenta não pode determinar?"
    ],
    "deep": [
      "As regras são heurísticas textuais, sem modelo generativo ou diagnóstico de viés.",
      "Uma expressão pode ter uso legítimo; ausência de padrões não demonstra neutralidade.",
      "Identifique a alegação, localize fontes originais e procure uma interpretação alternativa. Mantenha distinção entre análise de linguagem e checagem factual.",
      "Um absoluto pode estar correto em uma definição matemática e inadequado numa generalização empírica. O contexto decide.",
      "Estou atribuindo autoridade ao indicador ou examinando as evidências?"
    ],
    "question": "Nenhum padrão foi encontrado. Posso concluir que a notícia é verdadeira?",
    "options": [
      "Sim.",
      "Não; a checagem de fatos continua necessária.",
      "Sim, se o texto for longo."
    ],
    "answer": 1,
    "feedback": "As regras examinam expressões cadastradas. Elas não verificam fatos nem validam conclusões."
  },
  "epvt": {
    "title": "Roteiro EPVT",
    "essential": [
      "Um registro de tese, razões, fontes e objeções.",
      "Organizar o que precisa ser examinado num argumento.",
      "Escreva a tese, o argumento e uma objeção. Confira premissas, inferências e fontes além do checklist.",
      "Uma data ou a palavra pesquisa pode indicar uma referência a verificar, não uma prova.",
      "A conclusão segue das premissas? As premissas têm apoio?"
    ],
    "deep": [
      "O preenchimento textual não demonstra coerência, validade ou verdade.",
      "Separar estrutura inferencial de correspondência factual evita confiar apenas na aparência de um texto.",
      "Explicite premissas e conclusão; imagine premissas verdadeiras e pergunte se a conclusão precisa seguir. Depois verifique as próprias premissas nas fontes.",
      "Um argumento pode ser válido com premissas falsas, ou ter conclusão verdadeira sustentada por uma inferência inválida.",
      "Qual objeção realmente enfrenta minha razão principal e o que mudaria minha conclusão?"
    ],
    "question": "Todos os campos preenchidos significam que o argumento foi comprovado?",
    "options": [
      "Sim, o checklist equivale a prova.",
      "Não; presença de texto não verifica validade nem fatos.",
      "Sim, se houver um ano no texto."
    ],
    "answer": 1,
    "feedback": "O checklist organiza o registro. A avaliação da inferência e a checagem das premissas permanecem tarefas humanas."
  },
  "atencao": {
    "title": "Escolhas de atenção",
    "essential": [
      "Uma lista de decisões sobre o que consumir.",
      "Proteger atenção sem evitar evidências relevantes.",
      "Registre uma escolha e a reavalie. O app não bloqueia sites ou notificações.",
      "Durante uma leitura, evitar vídeos sem fonte; depois avaliar se algum tema pede checagem.",
      "Estou reduzindo distração ou evitando discordância?"
    ],
    "deep": [
      "A proposta de inibição saudável pertence ao projeto OCMT; não é um diagnóstico ou bloqueador.",
      "Selecionar informações pede critérios revisáveis e consciência de limites.",
      "Defina motivo, contexto e prazo para rever a escolha. Mantenha abertura a fontes que possam contrariar sua posição.",
      "Silenciar notificações durante o estudo pode servir à tarefa; ignorar toda crítica relevante enfraquece a verificação.",
      "Como perceber que um filtro útil virou uma barreira à revisão de crenças?"
    ],
    "question": "Um critério de filtragem mais cuidadoso é:",
    "options": [
      "Nunca ler algo que contrarie minhas ideias.",
      "Reduzir interrupções e manter abertura a evidências relevantes.",
      "Consumir tudo sem escolher."
    ],
    "answer": 1,
    "feedback": "Filtrar deve ajudar a escolher com consciência e permitir revisão, sem eliminar a possibilidade de aprender com discordâncias."
  },
  "perfil": {
    "title": "Perfil e preferências",
    "essential": [
      "Ajustes pessoais de apresentação e uso.",
      "Escolher um ambiente confortável e compreensível.",
      "Ajuste letra, tema, som e orientação. Em Cor do aplicativo, escolha o neorretrô padrão, azul, vermelho ou amarelo para os fundos, janelas e cartões.",
      "Use orientação Essencial para começar e Aprofundado para explorar fundamentos e limites.",
      "Que ajuste me ajuda a compreender, além de agradar visualmente?"
    ],
    "deep": [
      "Preferências mudam a apresentação; não medem o perfil cognitivo de uma pessoa.",
      "A escolha de cor não implica um efeito científico de aprendizagem. Conteúdo e significado também aparecem em palavras.",
      "As preferências da Etapa 3 são locais e entram no JSON. O modo online continua uma opção separada. A revisão integral de acessibilidade permanece pendente.",
      "As superfícies do aplicativo acompanham a cor escolhida. O modo escuro usa versões mais escuras da mesma paleta; os botões mantêm texto contrastante.",
      "A interface continua legível para mim em diferentes tamanhos e condições?"
    ],
    "question": "Escolher a cor do aplicativo significa:",
    "options": [
      "Mudar uma preferência visual.",
      "Escolher um tipo de inteligência.",
      "Garantir melhor retenção."
    ],
    "answer": 0,
    "feedback": "É uma preferência de apresentação. A cor não determina capacidade, estilo cognitivo ou ganho de aprendizagem."
  },
  "dados": {
    "title": "Backup e recuperação",
    "essential": [
      "Cópias dos registros em JSON.",
      "Preservar e transferir notas, roteiros e preferências.",
      "Exporte no Perfil. Ao importar, confira a prévia e escolha mesclar ou restaurar com confirmação.",
      "Antes de mudar de navegador, exporte e confira uma nota e seu roteiro no destino.",
      "Consigo recuperar um registro importante com a cópia que guardei?"
    ],
    "deep": [
      "O HTML contém o programa; o navegador/WebView guarda o estado. São coisas diferentes.",
      "Cópias internas no mesmo dispositivo não substituem um backup externo.",
      "As notas estruturadas e os roteiros da Etapa 3 entram no estado exportado. Mesclar preserva registros atuais nos conflitos. Pacotes de recuperação exigem inspeção técnica.",
      "Abrir o HTML em outro caminho pode mostrar outro armazenamento. Volte ao caminho anterior antes de concluir que perdeu dados.",
      "A cópia está acessível fora deste armazenamento? Contém informações privadas que preciso guardar com cuidado?"
    ],
    "question": "Copiar só o HTML para outro navegador transporta minhas notas?",
    "options": [
      "Sim.",
      "Não; exporte e importe o JSON do estado.",
      "Sim, se escolher a mesma cor."
    ],
    "answer": 1,
    "feedback": "O arquivo do programa e os dados salvos são separados. Use JSON e confira o resultado no destino."
  }
};
const LABELS = ['O que é?','Para que serve?','Como utilizar?','Exemplo aplicado','Reflexão metacognitiva'];
const MODES = ['essencial','aprofundado'], COLORS = ['original','azul','vermelho','amarelo'];
const FIELDS = {
 feynman: [['explain','Explique com suas palavras','Como explicaria esta ideia a alguém que ainda não a estudou?'],['doubts','Dúvidas e lacunas','Onde travou? Que termo não consegue justificar?'],['example','Exemplo e limites','Dê um exemplo e indique onde a explicação deixa de funcionar.'],['revision','Explicação revisada','Depois de conferir uma fonte, reescreva e diga o que mudou.'],['source','Fonte consultada','Autoria, obra, data, página ou link.']],
 cornell: [['cues','Perguntas e pistas','Crie perguntas que ajudem a recuperar o conteúdo.'],['notes','Anotações','Registre ideias, razões e exemplos. Identifique citações.'],['summary','Síntese própria','O que ficou mais importante e como as ideias se relacionam?'],['review','Recuperação e reflexão','Com as anotações ocultas, o que conseguiu responder? O que precisa revisar?'],['source','Fonte consultada','Autoria, obra, data, página ou link.']]
};
const CORE_IDS=['nn-titulo','nn-conteudo','nn-interp','nn-contexto','nn-limite','nn-contra','nn-emocao','nn-pasta'];
let noteTemplate='livre', noteTimer=null, noteSaving=false;
let activePlan=null, planTimer=null, planDirty=false;
let tutorialKey='dash', tutorialStep=0;
const tutorialAnswers={};
const $=id=>document.getElementById(id);
const text=(v,fallback='')=>typeof v==='string'?v:fallback;
const obj=v=>!!v&&typeof v==='object'&&!Array.isArray(v);
const clone=v=>JSON.parse(JSON.stringify(v));
function el(tag,cls,value){const e=document.createElement(tag);if(cls)e.className=cls;if(value!==undefined)e.textContent=value;return e;}
function button(label,action,cls='btn btn-sm'){const b=el('button',cls,label);b.type='button';b.addEventListener('click',action);return b;}
function empty(){return {version:1,preferences:{mode:'essencial',color:'original'},plans:[],noteDraft:null};}
function valid(data){
 if(!obj(data)||data.version!==1||!obj(data.preferences)||!MODES.includes(data.preferences.mode)||!COLORS.includes(data.preferences.color)||!Array.isArray(data.plans))return false;
 const seen=new Set();
 for(const p of data.plans){if(!obj(p)||typeof p.id!=='string'||!/^[A-Za-z0-9_-]{1,160}$/.test(p.id)||seen.has(p.id))return false;seen.add(p.id);
  for(const k of ['title','understand','plan','execute','review','source'])if(typeof p[k]!=='string')return false;
  if(!['rascunho','registrado'].includes(p.status)||!Number.isFinite(p.updatedAt)||p.updatedAt<0)return false;
  if(p.projectId!==null&&typeof p.projectId!=='number'&&typeof p.projectId!=='string')return false;
 }
 if(data.noteDraft!==null){const d=data.noteDraft;if(!obj(d)||!['livre','feynman','cornell'].includes(d.template)||!obj(d.core)||!obj(d.fields)||!Array.isArray(d.connections)||!d.connections.every(x=>typeof x==='string'))return false;
  for(const k of CORE_IDS)if(typeof d.core[k]!=='string')return false;
  for(const type of Object.keys(FIELDS)){if(!obj(d.fields[type]))return false;for(const [k]of FIELDS[type])if(typeof d.fields[type][k]!=='string')return false;}
 }
 return true;
}
function data(){return valid(S.brio3)?S.brio3:empty();}
function writable(){
 if(!BRIO_PERSIST_RESTORE_DONE||BRIO_READ_ONLY)return false;
 if(S.brio3!==undefined&&!valid(S.brio3)){toast('Dados da Etapa 3 incompatíveis foram preservados. Exporte JSON antes de tentar repará-los.',5000);return false;}
 return true;
}
function ensure(){if(S.brio3===undefined)S.brio3=empty();return S.brio3;}
function mode(){return data().preferences.mode;}
function level(g){return mode()==='aprofundado'?g.deep:g.essential;}
function notify(message){const e=$('brio3-status');if(e)e.textContent=message;}
function applyPreferences(){
 const state=data();document.body.dataset.brio3Color=state.preferences.color;document.body.dataset.brio3Mode=state.preferences.mode;
 document.querySelectorAll('.brio3-mode-select').forEach(s=>s.value=state.preferences.mode);
 document.querySelectorAll('input[name="brio3-color"]').forEach(r=>r.checked=r.value===state.preferences.color);
 document.querySelectorAll('[data-brio3-guide]').forEach(box=>drawGuide(box,box.dataset.brio3Guide));
 if($('brio3-tutorial').open)drawTutorial();
 document.querySelectorAll('[data-brio3-deep]').forEach(e=>e.hidden=mode()!=='aprofundado');
}
function setPreference(key,value){
 if(!writable()||!(key==='mode'?MODES:COLORS).includes(value))return;
 ensure().preferences[key]=value;salvarEstado();applyPreferences();
 notify(key==='mode'?'Nível de orientação alterado. Você pode voltar a qualquer momento.':'Cor do aplicativo alterada: fundos, janelas e cartões acompanham sua escolha.');
}
function modeSelect(id){
 const label=el('label','brio3-mode-label','Orientação');label.htmlFor=id;
 const select=el('select','inp brio3-mode-select');select.id=id;
 for(const [value,name]of [['essencial','Essencial'],['aprofundado','Aprofundado']]){const option=el('option','',name);option.value=value;select.append(option);}
 select.value=mode();select.addEventListener('change',()=>setPreference('mode',select.value));
 const wrap=el('div','brio3-mode-control');wrap.append(label,select);return wrap;
}
function drawGuide(box,key){
 const g=G[key],opened=box.querySelector('details')?.open||false;box.replaceChildren();
 const title=el('p','brio3-kicker','Guia · '+g.title);
 const intro=el('p','brio3-intro',level(g)[0]);const row=el('div','brio3-actions');
 row.append(button('Como usar · '+g.title,()=>openTutorial(key)),modeSelect('brio3-mode-'+key));
 const details=el('details','brio3-details');details.open=opened;details.append(el('summary','','Propósito, exemplo e reflexão'));
 const dl=el('dl','brio3-guide-dl');level(g).forEach((s,i)=>dl.append(el('dt','',LABELS[i]),el('dd','',s)));details.append(dl);
 box.append(title,intro,row,details);if(key==='dash'||key==='para')box.append(button(key==='dash'?'Resolver um problema · Pólya':'Abrir roteiro livre · Pólya',()=>openPlan(),'btn btn-g brio3-polya-open'));
}
function mountGuide(parent,key,prepend=true){
 const box=el('aside','brio3-guide');box.dataset.brio3Guide=key;box.setAttribute('aria-label','Orientações: '+G[key].title);
 if(prepend)parent.prepend(box);else parent.append(box);drawGuide(box,key);return box;
}
function trapDialog(dialog){dialog.addEventListener('keydown',event=>{if(event.key!=='Tab')return;const items=[...dialog.querySelectorAll('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),summary,a[href],[tabindex]')].filter(e=>e.tabIndex>=0&&e.getClientRects().length&&!e.closest('[hidden]'));if(!items.length){event.preventDefault();return;}const first=items[0],last=items.at(-1),current=document.activeElement;if(event.shiftKey&&(current===first||!items.includes(current))){event.preventDefault();last.focus();}else if(!event.shiftKey&&(current===last||!dialog.contains(current))){event.preventDefault();first.focus();}});dialog.addEventListener('close',()=>{const origin=dialog._brio3Origin;if(origin?.isConnected&&!origin.closest('[inert]'))origin.focus();});}
function openDialog(dialog){if(typeof dialog.showModal!=='function'){toast('Este recurso precisa de um navegador com suporte a janelas de diálogo.');return false;}if(!dialog.open){dialog._brio3Origin=document.activeElement;dialog.showModal();}return true;}
function openTutorial(key){
 if(!G[key])return;tutorialKey=key;tutorialStep=0;drawTutorial();openDialog($('brio3-tutorial'));$('brio3-tutorial-title').focus();
}
function drawTutorial(){
 const g=G[tutorialKey],steps=level(g),body=$('brio3-tutorial-body');body.replaceChildren();
 $('brio3-tutorial-title').textContent='Como usar · '+g.title;
 $('brio3-tutorial-progress').textContent='Etapa '+(tutorialStep+1)+' de 5 · '+(mode()==='essencial'?'Essencial':'Aprofundado');
 body.append(el('h3','',LABELS[tutorialStep]),el('p','',steps[tutorialStep]));
 if(tutorialStep===2){
  const field=el('fieldset','brio3-exercise');field.append(el('legend','',g.question));const feedback=el('p','brio3-feedback');feedback.setAttribute('role','status');
  g.options.forEach((option,index)=>{const label=el('label','brio3-choice'),radio=el('input');radio.type='radio';radio.name='brio3-tutorial-answer';radio.value=String(index);radio.checked=tutorialAnswers[tutorialKey]===index;
   radio.addEventListener('change',()=>{tutorialAnswers[tutorialKey]=index;feedback.textContent=(index===g.answer?'Neste exemplo: ':'Vale reconsiderar: ')+g.feedback;});label.append(radio,el('span','',option));field.append(label);});
  if(tutorialAnswers[tutorialKey]!==undefined)feedback.textContent=g.feedback;
  field.append(feedback);body.append(field);
 }
 if(tutorialStep===4)body.append(el('p','brio3-help','Você pode retornar a este tutorial sem perder notas ou roteiros. O exercício é de treino; não gera pontuação nem mede competência.'));
 $('brio3-tutorial-prev').disabled=tutorialStep===0;
 $('brio3-tutorial-next').textContent=tutorialStep===4?'Concluir tutorial':'Próxima etapa';
}
function installTutorial(){
 const dialog=el('dialog','brio3-dialog');dialog.id='brio3-tutorial';dialog.setAttribute('aria-labelledby','brio3-tutorial-title');
 const head=el('div','brio3-dialog-head'),title=el('h2');title.id='brio3-tutorial-title';title.tabIndex=-1;
 head.append(title,button('Fechar tutorial',()=>dialog.close()));const progress=el('p','brio3-help');progress.id='brio3-tutorial-progress';progress.setAttribute('role','status');
 const body=el('div');body.id='brio3-tutorial-body';const controls=el('div','brio3-actions');
 const prev=button('Etapa anterior',()=>{tutorialStep--;drawTutorial();title.focus();});prev.id='brio3-tutorial-prev';
 const next=button('Próxima etapa',()=>{if(tutorialStep===4)dialog.close();else{tutorialStep++;drawTutorial();title.focus();}});next.id='brio3-tutorial-next';controls.append(prev,next);
 dialog.append(head,progress,body,controls);trapDialog(dialog);document.body.append(dialog);
}
function installPreferences(){
 const box=el('section','brio3-guide');box.setAttribute('aria-labelledby','brio3-preferences-title');
 const h=el('h3','','Aprender no seu ritmo');h.id='brio3-preferences-title';box.append(h,modeSelect('brio3-mode-settings'));
 box.append(el('p','brio3-help','Essencial traz orientações breves. Aprofundado acrescenta fundamentos, critérios e limites. Os dois preservam os mesmos recursos.'));
 const colors=el('fieldset','brio3-colors');colors.append(el('legend','','Cor do aplicativo (opcional)'));
 for(const color of COLORS){const label=el('label','brio3-choice brio3-color-option'),radio=el('input');radio.type='radio';radio.name='brio3-color';radio.value=color;radio.addEventListener('change',()=>setPreference('color',color));
  const swatch=el('span','brio3-swatch');swatch.dataset.color=color;swatch.setAttribute('aria-hidden','true');label.append(radio,swatch,el('span','',color==='original'?'Neorretrô padrão':color[0].toUpperCase()+color.slice(1)));colors.append(label);}
 const status=el('p','brio3-help');status.id='brio3-status';status.setAttribute('role','status');
 box.append(colors,el('p','brio3-help','Escolha o tom de fundo que prefere para o aplicativo. Você pode voltar ao neorretrô padrão a qualquer momento.'),status);
 $('pg-perfil').append(box);
}
function newPlan(project){
 return {id:'p3_'+crypto.randomUUID().replace(/-/g,''),projectId:project?.id??null,title:project?'Problema do projeto: '+project.titulo:'',understand:'',plan:'',execute:'',review:'',source:'',updatedAt:Date.now(),status:'rascunho'};
}
function updatePlanPicker(){const select=$('brio3-plan-picker');select.replaceChildren();const fresh=el('option','','Novo problema');fresh.value='';select.append(fresh);for(const p of data().plans){const opt=el('option','',p.title||'Problema sem título');opt.value=p.id;select.append(opt);}select.value=data().plans.some(p=>p.id===activePlan?.id)?activePlan.id:'';}
function fillPlan(plan){
 activePlan=clone(plan);planDirty=false;
 for(const k of ['title','understand','plan','execute','review','source'])$('brio3-plan-'+k).value=plan[k];
 $('brio3-plan-context').textContent=plan.projectId===null?'Roteiro livre. Você pode voltar às etapas e reformular o problema.':'Vinculado a um projeto PARA. O roteiro complementa o item original.';
 $('brio3-plan-feedback').textContent=plan.status==='registrado'?'Registro recuperado. Revise quando necessário.':'Rascunho: registre uma pergunta e avance no seu ritmo.';
 updatePlanPicker();
 $('brio3-polya-0').open=true;
}
function readPlan(){if(!activePlan)return null;const p=clone(activePlan);for(const k of ['title','understand','plan','execute','review','source'])p[k]=$('brio3-plan-'+k).value;return p;}
function savePlan(markRegistered=false){
 clearTimeout(planTimer);if(!activePlan||!writable())return false;
 const p=readPlan();if(!planDirty&&!markRegistered)return true;
 if(!p.title.trim()&&!['understand','plan','execute','review','source'].some(k=>p[k].trim()))return false;
 p.updatedAt=Date.now();p.status=markRegistered?'registrado':'rascunho';
 const store=ensure(),index=store.plans.findIndex(x=>x.id===p.id);if(index<0)store.plans.push(p);else store.plans[index]=p;
 activePlan=clone(p);planDirty=false;salvarEstado();updatePlanPicker();
 const missing=['understand','plan','execute','review'].filter(k=>!p[k].trim()).map(k=>({understand:'compreender',plan:'planejar',execute:'executar',review:'revisar'})[k]);
 $('brio3-plan-feedback').textContent=markRegistered?(missing.length?'Registro guardado. Você pode desenvolver: '+missing.join(', ')+'.':'As quatro etapas têm registros. Confira a solução e as fontes; preenchimento não comprova correção.'):'Rascunho registrado. Confira também a confirmação de salvamento do aplicativo.';
 return true;
}
function openPlan(projectId=null){
 if(!writable())return;savePlan();const project=projectId===null?null:S.pkm.projetos.find(p=>String(p.id)===String(projectId));
 const old=project?data().plans.find(p=>String(p.projectId)===String(project.id)):null;
 fillPlan(old||newPlan(project));openDialog($('brio3-polya'));$('brio3-plan-title').focus();
}
function installPolya(){
 const dialog=el('dialog','brio3-dialog');dialog.id='brio3-polya';dialog.setAttribute('aria-labelledby','brio3-polya-title');
 const head=el('div','brio3-dialog-head'),h=el('h2','','Resolver um problema · inspiração em Pólya');h.id='brio3-polya-title';
 head.append(h,button('Fechar roteiro',()=>{savePlan();dialog.close();}));
 dialog.append(head,el('p','brio3-help','Compreender, planejar, executar e revisar. Este é um roteiro didático adaptado para estudo e projetos, não uma garantia de solução. Você pode voltar, reformular ou deixar etapas em aberto.'));
 const context=el('p','brio3-help');context.id='brio3-plan-context';dialog.append(context);
 const pickerLabel=el('label','label','Retomar ou iniciar');pickerLabel.htmlFor='brio3-plan-picker';const picker=el('select','inp');picker.id='brio3-plan-picker';
 picker.addEventListener('change',()=>{const id=picker.value;savePlan();fillPlan(id?data().plans.find(p=>p.id===id)||newPlan():newPlan());});dialog.append(pickerLabel,picker);
 function input(k,label,placeholder,container=dialog,area=true){const field=el('div','field'),lab=el('label','label',label);lab.htmlFor='brio3-plan-'+k;const inp=el(area?'textarea':'input',area?'ta':'inp');inp.id='brio3-plan-'+k;inp.placeholder=placeholder;inp.maxLength=40000;
  inp.addEventListener('input',()=>{planDirty=true;clearTimeout(planTimer);planTimer=setTimeout(()=>savePlan(),450);});field.append(lab,inp);container.append(field);}
 input('title','Qual problema você quer trabalhar?','Formule uma pergunta, não apenas um tema.',dialog,false);
 const phases=[
 ['understand','1. Compreender','O que preciso descobrir? Quais dados e condições tenho?','Delimite a incógnita, as condições, os conhecimentos prévios e o que falta saber. Reformule com suas palavras e teste se as condições fazem sentido.'],
 ['plan','2. Planejar','Qual estratégia vou tentar e por quê?','Considere um caso mais simples, uma analogia, um desenho, uma divisão em partes ou trabalhar de trás para frente. Registre por que a estratégia parece adequada e como poderá testá-la.'],
 ['execute','3. Executar','O que tentei? Quais passos e obstáculos apareceram?','Registre os passos, confira cada passagem e separe observação de suposição. Se houver impasse, volte à compreensão ou ao plano; mudar a estratégia pode ser produtivo.'],
 ['review','4. Revisar e transferir','A solução atende ao problema? Como posso conferi-la?','Reexamine resultado e caminho, procure outro modo de conferir, identifique limites e pense em outro contexto de aplicação. Uma resposta preenchida pode continuar errada.']
 ];
 for(const [i,[k,title,short,deep]]of phases.entries()){const d=el('details','brio3-phase');d.id='brio3-polya-'+i;d.append(el('summary','',title),el('p','',short));const more=el('p','brio3-help',deep);more.dataset.brio3Deep='';more.hidden=mode()!=='aprofundado';d.append(more);input(k,'Seu registro · '+title,short,d);
  if(i<3)d.append(button('Ir para a próxima etapa',()=>{d.open=false;$('brio3-polya-'+(i+1)).open=true;$('brio3-plan-'+phases[i+1][0]).focus();}));dialog.append(d);}
 input('source','Fontes e critérios usados','Quais referências ou verificações apoiam seu trabalho?');
 const example=el('details','brio3-details');example.append(el('summary','','Ver exemplo sem preencher meu roteiro'),el('p','','Problema: distribuir seis horas de preparação em três dias. Compreender: confirmar tempo disponível e entregas. Planejar: testar uma divisão de duas horas por dia e prever ensaio. Executar: registrar o tempo real e dificuldades. Revisar: conferir se o plano coube e se a apresentação ficou compreensível. Divisão de tempo não demonstra aprendizagem.'));
 const feedback=el('p','brio3-feedback');feedback.id='brio3-plan-feedback';feedback.setAttribute('role','status');
 dialog.append(example,feedback,button('Salvar registro do roteiro',()=>savePlan(true),'btn btn-g'));
 dialog.addEventListener('close',()=>savePlan());dialog.addEventListener('cancel',()=>savePlan());trapDialog(dialog);document.body.append(dialog);
}
function attachProjects(){
 for(const p of S.pkm.projetos){const row=$('pitem-'+p.id);if(!row||row.querySelector('.brio3-project-action'))continue;
  const b=button('Roteiro Pólya',event=>{event.stopPropagation();openPlan(p.id);},'btn btn-xs brio3-project-action');b.setAttribute('aria-label','Abrir roteiro Pólya: '+p.titulo);row.querySelector('.p-txt').append(b);}
}
function captureDraft(){
 const core={};for(const k of CORE_IDS)core[k]=$(k).value;
 const fields={};for(const type of Object.keys(FIELDS)){fields[type]={};for(const [k]of FIELDS[type])fields[type][k]=$('brio3-'+type+'-'+k).value;}
 return {template:noteTemplate,core,fields,connections:[...conexoesPendentes]};
}
function draftHasContent(d){return CORE_IDS.filter(k=>k!=='nn-pasta').some(k=>d.core[k].trim())||Object.values(d.fields).some(group=>Object.values(group).some(s=>s.trim()))||d.connections.length>0;}
function saveDraft(){
 clearTimeout(noteTimer);if(noteSaving||!writable())return;
 const d=captureDraft();if(!draftHasContent(d)&&data().noteDraft===null)return;ensure().noteDraft=d;salvarEstado();
 $('brio3-note-status').textContent='Rascunho registrado no dispositivo; confira a confirmação geral de salvamento.';
}
function restoreDraft(){
 const draft=data().noteDraft;if(!draft||draftHasContent(captureDraft()))return;
 for(const k of CORE_IDS)$(k).value=draft.core[k];for(const type of Object.keys(FIELDS))for(const [k]of FIELDS[type])$('brio3-'+type+'-'+k).value=draft.fields[type][k];
 conexoesPendentes=[...draft.connections];renderConexoesPendentes();noteTemplate=draft.template;$('brio3-note-template').value=noteTemplate;showTemplate();
 $('brio3-note-status').textContent='Rascunho recuperado. Trocar de template preserva os campos já escritos.';
}
function showTemplate(){
 for(const type of Object.keys(FIELDS))$('brio3-fields-'+type).hidden=noteTemplate!==type;
 $('brio3-note-template').value=noteTemplate;
}
function installNotes(){
 const body=$('modal-nota-nova').querySelector('.modal-body'),box=el('section','brio3-note-tools');
 box.append(el('h3','','Como deseja elaborar esta nota?'));
 const lab=el('label','label','Template opcional');lab.htmlFor='brio3-note-template';const select=el('select','inp');select.id='brio3-note-template';
 for(const [v,t]of [['livre','Livre · campos originais'],['feynman','Feynman · explicar e revisar'],['cornell','Cornell · perguntas, notas e síntese']]){const o=el('option','',t);o.value=v;select.append(o);}
 select.addEventListener('change',()=>{noteTemplate=select.value;showTemplate();saveDraft();});
 box.append(lab,select,el('p','brio3-help','Os campos originais continuam abaixo. Trocar de template mantém o que você escreveu. Ao salvar, todos os campos preenchidos dos dois templates são preservados na nota.'),
  button('Como usar os templates',()=>openTutorial('notas')));
 for(const type of Object.keys(FIELDS)){
  const section=el('div','brio3-template');section.id='brio3-fields-'+type;section.hidden=true;
  section.append(el('p','brio3-help',type==='feynman'?'Adaptação didática: explique, identifique lacunas, confira uma fonte e revise. Não é uma avaliação automática ou um protocolo formal atribuído a Feynman.':'Use as perguntas como pistas de recuperação; tente responder sem olhar as anotações e depois confira.'));
  const grid=el('div',type==='cornell'?'brio3-cornell-grid':'');
  for(const [k,label,placeholder]of FIELDS[type]){const field=el('div','field');field.id='brio3-field-'+type+'-'+k;const l=el('label','label',label);l.htmlFor='brio3-'+type+'-'+k;const t=el('textarea','ta');t.id=l.htmlFor;t.placeholder=placeholder;t.maxLength=40000;field.append(l,t);grid.append(field);}
  section.append(grid);
  if(type==='cornell'){const toggle=button('Ocultar anotações para tentar responder',()=>{const f=$('brio3-field-cornell-notes');f.hidden=!f.hidden;toggle.textContent=f.hidden?'Mostrar anotações para conferir':'Ocultar anotações para tentar responder';toggle.setAttribute('aria-expanded',String(!f.hidden));});toggle.setAttribute('aria-controls','brio3-field-cornell-notes');toggle.setAttribute('aria-expanded','true');section.append(toggle);}
  box.append(section);
 }
 const status=el('p','brio3-help');status.id='brio3-note-status';status.setAttribute('role','status');box.append(status);$('nn-titulo').closest('.field').after(box);
 body.addEventListener('input',()=>{if(noteSaving)return;clearTimeout(noteTimer);noteTimer=setTimeout(saveDraft,450);});
 body.addEventListener('change',()=>{if(!noteSaving){clearTimeout(noteTimer);noteTimer=setTimeout(saveDraft,450);}});
}
function composeFields(fields){
 const sections=[];for(const type of Object.keys(FIELDS)){const rows=FIELDS[type].filter(([k])=>fields[type][k].trim()).map(([k,label])=>label+':\n'+fields[type][k]);if(rows.length)sections.push((type==='feynman'?'Roteiro Feynman — adaptação didática':'Organização Cornell')+'\n\n'+rows.join('\n\n'));}
 return sections.join('\n\n────────\n\n');
}
function saveDeepNote(){
 if(!writable())return;
 const draft=captureDraft(),oldContent=$('nn-conteudo').value,structured=composeFields(draft.fields);
 if(!$('nn-titulo').value.trim()){baseSaveNote();return;}
 // Apenas conteúdo adicional é concatenado; nenhum campo anterior é substituído.
 $('nn-conteudo').value=[oldContent.trim(),structured].filter(Boolean).join('\n\n────────\n\n');
 const oldId=S.notas[0]?.id;noteSaving=true;clearTimeout(noteTimer);
 try{
  baseSaveNote();const note=S.notas[0];
  if(note&&note.id!==oldId){if(structured||draft.template!=='livre')note.pedagogia={version:1,template:draft.template,fields:clone(draft.fields)};
   if(S.brio3!==undefined)ensure().noteDraft=null;salvarEstado();
   for(const type of Object.keys(FIELDS))for(const [k]of FIELDS[type])$('brio3-'+type+'-'+k).value='';
   noteTemplate='livre';showTemplate();$('brio3-note-status').textContent='';
  }else $('nn-conteudo').value=oldContent;
 }finally{noteSaving=false;}
}
function appendNoteStructure(id){
 const note=S.notas.find(n=>n.id===id),p=note?.pedagogia;if(!obj(p)||p.version!==1||!obj(p.fields))return;
 const details=el('details','brio3-details');details.append(el('summary','','Organização estruturada desta nota'));
 for(const type of Object.keys(FIELDS)){if(!obj(p.fields[type]))continue;const group=el('section');group.append(el('h4','',type==='feynman'?'Feynman · adaptação didática':'Cornell'));
  for(const [k,label]of FIELDS[type])if(typeof p.fields[type][k]==='string'&&p.fields[type][k]){group.append(el('h5','',label),el('p','brio3-preserve',p.fields[type][k]));}details.append(group);}
 $('vn-corpo').append(details);
}
function flush(){if($('brio3-note-template')&&!noteSaving&&(! $('modal-nota-nova').classList.contains('hidden')||noteTimer))saveDraft();if(activePlan&&planDirty)savePlan();}
const baseSaveNote=salvarNotaProfunda,baseOpen=openModal,baseClose=closeModal,basePARA=renderPARA,basePerfil=renderPerfil,baseTema=aplicarTema,baseVer=verNota,baseRead=BRIO_readImport,baseMerge=BRIO_mergeImport,baseApplyImport=BRIO_aplicarImportacao;
salvarNotaProfunda=saveDeepNote;
openModal=function(id){if(id==='modal-nota-nova'&&$('brio3-note-template'))restoreDraft();return baseOpen(id);};
closeModal=function(id){if(id==='modal-nota-nova'&&$('brio3-note-template')&&!noteSaving)saveDraft();return baseClose(id);};
renderPARA=function(){const result=basePARA();if(BRIO_PERSIST_RESTORE_DONE)attachProjects();return result;};
renderPerfil=function(){const result=basePerfil();if($('brio3-mode-settings'))applyPreferences();return result;};
aplicarTema=function(){const result=baseTema();if($('brio3-mode-settings'))applyPreferences();return result;};
verNota=function(id){const result=baseVer(id);appendNoteStructure(id);return result;};
BRIO_readImport=function(raw){const result=baseRead(raw);if(result.brio3!==undefined&&!valid(result.brio3))throw new Error('Estrutura da Etapa 3 inválida ou de versão não suportada.');return result;};
BRIO_mergeImport=function(current,incoming){
 if((incoming.brio3!==undefined&&!valid(incoming.brio3))||(current.brio3!==undefined&&!valid(current.brio3)))throw new Error('Não é possível mesclar dados incompatíveis da Etapa 3.');
 return baseMerge(current,incoming);
};
BRIO_aplicarImportacao=async function(replace=false){const pending=BRIO_PENDING_IMPORT;if(pending&&!BRIO_READ_ONLY)flush();const result=await baseApplyImport(replace);if(pending&&BRIO_PENDING_IMPORT===null&&!BRIO_READ_ONLY){clearTimeout(noteTimer);clearTimeout(planTimer);activePlan=null;planDirty=false;for(const k of CORE_IDS)$(k).value=k==='nn-pasta'?'recursos':'';for(const type of Object.keys(FIELDS))for(const [k]of FIELDS[type])$('brio3-'+type+'-'+k).value='';conexoesPendentes=[];renderConexoesPendentes();noteTemplate='livre';showTemplate();restoreDraft();applyPreferences();}return result;};
installTutorial();installPolya();installNotes();installPreferences();
for(const key of ['dash','para','notas','cards','grafo','foco','feed','analise','perfil'])mountGuide($('pg-'+key),key);
const analysisWindows=$('pg-analise').querySelectorAll('.win');mountGuide(analysisWindows[1].querySelector('.wbody'),'epvt');mountGuide(analysisWindows[2].querySelector('.wbody'),'atencao');
const backup=$('backup-title').closest('.wbody');backup.prepend(button('Como usar · Backup e recuperação',()=>openTutorial('dados')));
backup.querySelector('.backup-actions').append(button('Exportar conflitos preservados',()=>BRIO_exportarConflitos()));
backup.querySelector('.backup-actions').append(button('Inspecionar recuperação',()=>BRIO_openRecoveryInspector()));
$('brio-recovery-actions').append(button('Inspecionar arquivo de recuperação',()=>BRIO_openRecoveryInspector()));
window.addEventListener('pagehide',flush);window.addEventListener('beforeunload',flush);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')flush();});
BRIO_BOOT_PROMISE.then(()=>{applyPreferences();if(!BRIO_READ_ONLY){attachProjects();restoreDraft();}if(S.brio3!==undefined&&!valid(S.brio3))notify('Dados da Etapa 3 incompatíveis foram preservados. Exporte JSON antes de repará-los.');});
function openPlanById(id){if(!writable())return false;const plan=data().plans.find(p=>p.id===id);if(!plan)return false;savePlan();fillPlan(plan);openDialog($('brio3-polya'));return true;}
function openNewPlan(projectId,title){if(!writable())return null;savePlan();const project=S.pkm.projetos.find(p=>String(p.id)===String(projectId));const plan=newPlan(project);plan.title=title;fillPlan(plan);planDirty=true;savePlan();openDialog($('brio3-polya'));return plan.id;}
window.BRIO3={version:1,modules:Object.keys(G),openTutorial,openPlan,openPlanById,openNewPlan,setPreference,savePlan,saveDraft,flush,valid,composeFields};
})();
