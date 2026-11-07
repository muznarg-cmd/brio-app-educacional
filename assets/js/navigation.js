

// BRIO 2.2: somente navegação, teclado e apresentação, sem alteração de persistência.
(function(){
  'use strict';
  const menu=document.getElementById('briox-menu');
  const more=document.getElementById('nav-more');
  const extra=new Set(['cards','feed','foco','perfil']);
  function close(){ menu.hidden=true; more.setAttribute('aria-expanded','false'); }
  window.BRIOX_toggleMenu=function(){
    if(!menu.hidden){close();return;}
    menu.hidden=false; more.setAttribute('aria-expanded','true');
    menu.querySelector('button')?.focus();
  };
  const oldNavTo=window.navTo;
  if(typeof oldNavTo==='function'){
    window.navTo=function(pg){
      oldNavTo(pg);close();
      if(extra.has(pg)) more.classList.add('on');
      document.querySelectorAll('.nav-btn').forEach(b=>{
        if(b!==more) b.setAttribute('aria-current',b.id==='nav-'+pg?'page':'false');
      });
    };
  }
  document.addEventListener('pointerdown',e=>{
    if(!menu.hidden&&!menu.contains(e.target)&&!more.contains(e.target))close();
  });
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&!menu.hidden){close();more.focus();return;}
    const candidate=e.target.closest('.qa,.folder-head');
    if(candidate&&(e.key==='Enter'||e.key===' ')&&!e.target.closest('button,a,input,textarea,select')){
      e.preventDefault();candidate.click();
    }
  });
  // Mark generated folder headers operable by keyboard when they appear.
  const main=document.getElementById('main');
  function enableFolderKeys(){
    main?.querySelectorAll('.folder-head').forEach(header=>{
      if(!header.hasAttribute('tabindex')){header.tabIndex=0;header.setAttribute('role','button');}
    });
  }
  enableFolderKeys();
  if(main)new MutationObserver(enableFolderKeys).observe(main,{subtree:true,childList:true});
  document.querySelectorAll('.qa').forEach(e=>{e.setAttribute('role','button');e.tabIndex=0;});
})();

