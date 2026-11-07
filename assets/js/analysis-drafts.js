'use strict';
// Somente o texto do usuário; os resultados heurísticos continuam sob revisão humana.
const BRIO_ANALYSIS=(()=>{
 const ids=['bias-input','epvt-tese','epvt-arg','epvt-contra'];let timer=null;
 function flush(){clearTimeout(timer);if(!BRIO_UI.writable())return;const before=S.brioSafety?.analysisDraft,values={...(before?.values||{}),...Object.fromEntries(ids.map(id=>[id,document.getElementById(id).value]))};if(!before&&!ids.some(id=>values[id]))return;if(before&&BRIO_canonical(before.values)===BRIO_canonical(values))return;S.brioSafety??=BRIO_DATA.safety();S.brioSafety.analysisDraft={...(before||{}),values,updatedAt:Date.now()};salvarEstado();}
 function restore(){const values=S.brioSafety?.analysisDraft?.values||{};for(const id of ids)document.getElementById(id).value=typeof values[id]==='string'?values[id]:'';for(const id of ['bias-resultado','epvt-resultado'])document.getElementById(id).replaceChildren();}
 BRIO_BOOT_PROMISE.then(()=>{restore();if(!BRIO_UI.writable())return;for(const id of ids)document.getElementById(id).addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(flush,450);});window.addEventListener('pagehide',flush);document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')flush();});});
 return {flush,restore};
})();
window.BRIO_ANALYSIS=BRIO_ANALYSIS;
