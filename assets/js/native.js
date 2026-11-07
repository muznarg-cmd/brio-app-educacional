'use strict';
// Este adaptador não usa plugins nem grava arquivos na versão web.
window.BRIO_NATIVE=(()=>{
 const cap=window.Capacitor;
 if(!cap?.isNativePlatform?.())return {active:false,plugins:{}};
 document.body.classList.add('brio-native');
 // O runtime injetado no WebView fornece Plugins; registerPlugin pertence
 // ao bundle web do core e pode não existir numa aplicação sem bundler.
 const plugins={};for(const name of ['Preferences','Filesystem','Share','LocalNotifications','App']){
  plugins[name]=cap.Plugins?.[name]||cap.registerPlugin?.(name);
  if(!plugins[name])throw new Error('Plugin Android indisponível: '+name);
 }
 async function exportBlob(name,blob){
  const path='brio-backups/'+Date.now()+'_'+name.replace(/[^A-Za-z0-9._-]/g,'_');
  for(let offset=0;offset<blob.size;offset+=262144){const bytes=new Uint8Array(await blob.slice(offset,offset+262144).arrayBuffer());let raw='';for(let i=0;i<bytes.length;i+=8192)raw+=String.fromCharCode(...bytes.subarray(i,i+8192));const options={path,data:btoa(raw),directory:'CACHE'};if(!offset)await plugins.Filesystem.writeFile({...options,recursive:true});else await plugins.Filesystem.appendFile(options);}
  const stat=await plugins.Filesystem.stat({path,directory:'CACHE'});if(stat.size!==blob.size)throw new Error('Arquivo nativo incompleto; compartilhamento cancelado.');
  const result=await plugins.Filesystem.getUri({path,directory:'CACHE'});
  await plugins.Share.share({title:'Backup BRIO',files:[result.uri],dialogTitle:'Salvar ou compartilhar backup'});
  return result.uri;
 }
 async function exportJSON(name,data){return exportBlob(name,new Blob([data],{type:'application/json'}));}
 async function reminders(){
  const permission=await plugins.LocalNotifications.requestPermissions();
  if(permission.display!=='granted')throw new Error('Permissão de notificação não concedida.');
  await plugins.LocalNotifications.cancel({notifications:[{id:20001}]});
  await plugins.LocalNotifications.schedule({notifications:[{id:20001,isExactNotification:false,title:'BRIO',body:'Qual ideia vale revisar hoje?',schedule:{on:{hour:20,minute:0},repeats:true},extra:{kind:'daily-review'}}]});
 }
 async function cancelReminder(){await plugins.LocalNotifications.cancel({notifications:[{id:20001}]});}
 return {active:true,plugins,exportBlob,exportJSON,reminders,cancelReminder};
})();
