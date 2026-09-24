import {spawn,spawnSync} from 'node:child_process';
import {redactLog} from './diagnostics-policy.mjs';
/** Launch only Node + explicit argument array, never a shell. Redact AFTER assembling chunks. */
export function runNode(args,{cwd,env=process.env,timeoutMs=600000,graceMs=1500,maxLogBytes=2*1024*1024}={}) {
 if(!Array.isArray(args)||!args.every(x=>typeof x==='string')||!Number.isFinite(timeoutMs)||timeoutMs<1||!Number.isFinite(graceMs)||graceMs<1)return Promise.reject(new Error('INVALID_PROCESS_POLICY'));
 return new Promise(resolve=>{
  let text='',timedOut=false,interrupted=false,finished=false,hardTimer,fallbackTimer;
  const child=spawn(process.execPath,args,{cwd,env,detached:process.platform!=='win32',stdio:['ignore','pipe','pipe']});
  const collect=chunk=>{text+=chunk;if(Buffer.byteLength(text)>maxLogBytes)text=text.slice(-Math.floor(maxLogBytes/4));};
  child.stdout.setEncoding('utf8');child.stderr.setEncoding('utf8');child.stdout.on('data',collect);child.stderr.on('data',collect);
  function killTree(hard=false){
   if(!child.pid)return;
   if(process.platform==='win32'){
    // Only the numeric PID of this exact child; /T includes Next/browser grandchildren.
    spawnSync('taskkill',['/PID',String(child.pid),'/T',...(hard?['/F']:[])],{stdio:'ignore',windowsHide:true,timeout:3000});
   }else{try{process.kill(-child.pid,hard?'SIGKILL':'SIGTERM');}catch{try{child.kill(hard?'SIGKILL':'SIGTERM');}catch{}}}
  }
  function finish(code){
   if(finished)return;finished=true;if(timedOut||interrupted)killTree(true);clearTimeout(timer);clearTimeout(hardTimer);clearTimeout(fallbackTimer);
   process.removeListener('SIGINT',onInterrupt);process.removeListener('SIGTERM',onInterrupt);
   resolve({status:timedOut?124:interrupted?130:Number.isInteger(code)?code:1,timedOut,output:redactLog(text)});
  }
  function stop(){
   killTree();hardTimer=setTimeout(()=>killTree(true),graceMs);
   fallbackTimer=setTimeout(()=>{killTree(true);child.stdout.destroy();child.stderr.destroy();child.unref();finish(1);},graceMs+4000);
  }
  function onInterrupt(){if(interrupted||timedOut)return;interrupted=true;stop();}
  process.once('SIGINT',onInterrupt);process.once('SIGTERM',onInterrupt);
  const timer=setTimeout(()=>{timedOut=true;stop();},timeoutMs);
  child.once('error',()=>finish(1));child.once('close',code=>finish(code));
 });
}
