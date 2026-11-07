'use strict';
(()=>{
 const base=renderPerfil;
 renderPerfil=function(){base();const target=document.getElementById('config-lista');
  const online=target.querySelector('.online-card');if(online){const status=BRIO_UI.node('p','status-mini',BRIO_FEED_NOTICE);status.id='brio-feed-profile-connection';status.setAttribute('role','status');online.prepend(status);const identity=online.querySelector('p.status-mini:not(#brio-feed-profile-connection)');if(identity)identity.textContent=BRIO_ONLINE?'Identidade selecionada: @'+S.nick:'Modo local selecionado.';if(BRIO_FEED_CONNECTING)online.querySelector('button').textContent='Cancelar conexão';}
  target.querySelector('.online-card')?.append(BRIO_UI.node('p','status-mini','Limites compartilhados: 5 posts por dia UTC; 60 s entre posts; 1 s entre reações; 10 s entre comentários; 3 comentários por post. Nick não comprova identidade nem é exclusivo. O limite local não modifica essas regras.'));
  if(target.querySelector('#brio-volume'))return;
  const row=BRIO_UI.node('div','setting-row'),label=BRIO_UI.node('label','setting-label','Volume dos sons'),input=BRIO_UI.node('input'),value=BRIO_UI.node('output','mono');
  input.id='brio-volume';input.type='range';input.min='0';input.max='1';input.step='.05';input.value=String(S.config.sfxVolume??.55);label.htmlFor=input.id;value.htmlFor=input.id;value.textContent=Math.round(Number(input.value)*100)+'%';
  let timer=null;function update(){if(!BRIO_UI.writable())return;S.config.sfxVolume=Number(input.value);value.textContent=Math.round(Number(input.value)*100)+'%';clearTimeout(timer);timer=setTimeout(salvarEstado,450);}
  input.addEventListener('input',update);input.addEventListener('change',()=>{update();clearTimeout(timer);salvarEstado();BRIO_SFX.unlock();BRIO_SFX.play('toggle');});row.append(label,input,value);target.append(row);
  if(window.BRIO_NATIVE?.active){target.querySelector('[aria-label="Lembrete diário às 20h"]')?.closest('.setting-row')?.remove();const status=BRIO_UI.node('p','brio3-help');target.append(BRIO_UI.button('Configurar lembrete Android por volta das 20h',async()=>{try{await BRIO_NATIVE.reminders();S.config.lembretes=true;salvarEstado();status.textContent='Lembrete nativo configurado. A entrega depende das permissões e das restrições do Android.';}catch(error){status.textContent=error.message;}}),BRIO_UI.button('Cancelar lembrete Android',async()=>{try{await BRIO_NATIVE.cancelReminder();S.config.lembretes=false;salvarEstado();status.textContent='Lembrete nativo cancelado.';}catch(error){status.textContent=error.message;}}),status);}
 };
 BRIO_BOOT_PROMISE.then(()=>{if(!BRIO_READ_ONLY)renderPerfil();});
})();
