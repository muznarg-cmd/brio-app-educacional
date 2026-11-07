'use strict';
const BRIO_UI=(()=>{
 const node=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;};
 function button(label,action,cls='btn btn-sm'){const b=node('button',cls,label);b.type='button';b.addEventListener('click',action);return b;}
 function field(parent,id,label,value='',kind='textarea',options=[]){const wrap=node('div','field'),l=node('label','label',label),input=node(kind,kind==='textarea'?'ta':'inp');l.htmlFor=id;input.id=id;
  if(kind==='select')for(const [v,t]of options){const o=node('option','',t);o.value=v;input.append(o);}else if(kind==='textarea')input.maxLength=40000;
  input.value=kind==='select'&&!options.some(([v])=>String(v)===String(value))?(options[0]?.[0]??''):value;wrap.append(l,input);parent.append(wrap);return input;
 }
 function dialog(id,title){document.getElementById(id)?.close();document.getElementById(id)?.remove();const origin=document.activeElement,d=node('dialog','brio3-dialog brio-work-dialog');d.id=id;d.setAttribute('aria-labelledby',id+'-title');
  const head=node('div','brio3-dialog-head'),h=node('h2','',title);h.id=id+'-title';head.append(h,button('Fechar',()=>d.close()));const body=node('div'),status=node('p','brio3-feedback');status.setAttribute('role','status');d.append(head,body,status);
  d.addEventListener('keydown',e=>{if(e.key!=='Tab')return;const items=BRIO_modalFocusable(d),a=items[0],z=items.at(-1);if(!a){e.preventDefault();return;}if(e.shiftKey&&document.activeElement===a){e.preventDefault();z.focus();}else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a.focus();}});
  d.addEventListener('close',()=>{if(origin?.isConnected&&!origin.closest('[inert]'))origin.focus();d.remove();});document.body.append(d);
  return {element:d,body,status,show(){if(typeof d.showModal!=='function'){toast('Navegador sem suporte a esta janela.');return;}d.showModal();},close(){d.close();}};
 }
 const writable=()=>BRIO_PERSIST_RESTORE_DONE&&!BRIO_READ_ONLY;
 async function persist(status){if(!writable())return false;salvarEstado();const ok=!BRIO_READ_ONLY&&await BRIO_SAVE_QUEUE;if(status)status.textContent=ok?'Registro salvo neste dispositivo.':'Registro em memória; mantenha a página aberta e exporte JSON.';return ok;}
 return {node,button,field,dialog,writable,persist};
})();
