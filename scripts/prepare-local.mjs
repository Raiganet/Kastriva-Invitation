import {existsSync,copyFileSync,readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {runNode} from './process-runner.mjs';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {supportsNode,classifyFailure} from './diagnostics-policy.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));const pkg=JSON.parse(readFileSync(path.join(root,'package.json'),'utf8'));
const npmCli=process.env.npm_execpath;const req=createRequire(import.meta.url);const out=path.join(root,'.diagnostics');
const hasLock=existsSync(path.join(root,'package-lock.json'));
const plan=['Periksa Node (registry opsional melalui npm run diagnose)',...(hasLock?['Validasi lockfile lama']:[]),hasLock?'npm ci':'npm install','Pasang Chromium Playwright','Verifikasi rilis mode demo'];
console.log('Persiapan lokal '+pkg.version+'. Tidak melakukan deploy, menjalankan SQL, atau membuka transaksi.');
for(let i=0;i<plan.length;i++)console.log(`${i+1}. ${plan[i]}`);
if(process.argv.includes('--plan')){console.log('PLAN ONLY: belum ada perintah dijalankan atau berkas diubah.');process.exit(0);}
if(!supportsNode(process.version)||!npmCli){console.error('STOP: gunakan Node 22.x dan npm run setup:local.');process.exit(1);}
mkdirSync(out,{recursive:true});const report={version:pkg.version,startedAt:new Date().toISOString(),passed:false,steps:[],liveSupabaseVerified:false,productionApproved:false};
const save=()=>writeFileSync(path.join(out,'setup-report.json'),JSON.stringify(report,null,2)+'\n');save();
async function run(id,args,timeoutMs=600000){
 console.log('Menjalankan: '+id);
 const outcome=await runNode(args,{cwd:root,env:process.env,timeoutMs});
 writeFileSync(path.join(out,id+'.log'),outcome.output);
 const passed=outcome.status===0;report.steps.push({id,exitCode:outcome.status,passed,...(!passed?classifyFailure(outcome.timedOut?'ETIMEDOUT':outcome.output):{})});save();
 console.log((passed?'PASS: ':'STOP: ')+id+'; log .diagnostics/'+id+'.log');
 if(!passed){console.log(outcome.output.slice(-4000));process.exitCode=1;}
 return passed;
}
// npm itself is the authority for installation and respects the user's existing proxy configuration.
// The optional direct registry probe must not block a working npm proxy.
{

 if(!hasLock||await run('lock-before-ci',[npmCli,'run','check:lock'])){
  if(!existsSync(path.join(root,'.env.local')))copyFileSync(path.join(root,'.env.example'),path.join(root,'.env.local'));
  if(await run('install',[npmCli,hasLock?'ci':'install','--include=dev','--no-fund','--fetch-retries=1','--fetch-timeout=30000'])){
   let cli;try{cli=req.resolve('@playwright/test/cli');}catch{}
   if(!cli){report.steps.push({id:'browser',passed:false,exitCode:1,code:'PLAYWRIGHT_NOT_INSTALLED'});process.exitCode=1;}
   else if(await run('browser',[cli,'install','chromium'])&&await run('verify-release',[npmCli,'run','verify:release']))report.passed=true;
  }
 }
}
report.finishedAt=new Date().toISOString();save();
console.log(report.passed?'PASS kode demo; pengujian database/staging tetap diperlukan.':'STOP. Baca .diagnostics/setup-report.json; jangan membuka layanan pelanggan.');
process.exitCode=report.passed?0:1;
