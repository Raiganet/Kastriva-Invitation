import {existsSync,readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {supportsNode,packageRequirements,matchesVersion,probePackage} from './diagnostics-policy.mjs';
import {loadProjectEnv,validateEnvironment} from './env-tools.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const pkg=JSON.parse(readFileSync(path.join(root,'package.json'),'utf8'));
const requirements=packageRequirements(pkg);
const offline=process.argv.includes('--no-network'), registryOnly=process.argv.includes('--registry-only'), installedOnly=process.argv.includes('--installed-only');
const checks=[{name:'Node.js',state:supportsNode(process.version)?'pass':'fail',code:'NODE_22_REQUIRED',actual:process.version}];
console.log('Diagnostik '+pkg.version+' — tidak mengubah .env, paket, SQL, GitHub, atau Vercel.');
if(!registryOnly){
  const env=validateEnvironment(loadProjectEnv({root}));
  if(!installedOnly)checks.push({name:'Environment',state:env.errors.length?'fail':'pass',code:env.config?'FORMAT_ONLY_NOT_CONNECTED':'DEMO_OR_INCOMPLETE',messages:env.errors});
  for(const item of requirements){
    let actual=null;try{actual=JSON.parse(readFileSync(path.join(root,'node_modules',item.name,'package.json'),'utf8')).version;}catch{}
    checks.push({name:item.name,requested:item.requested,actual,state:matchesVersion(actual,item.requested)?'pass':'fail',code:actual?'INSTALLED_VERSION_CHECK':'PACKAGE_NOT_INSTALLED'});
  }
  if(!installedOnly)checks.push({name:'package-lock.json',state:existsSync(path.join(root,'package-lock.json'))?'info':'fail',code:'RUN_CHECK_LOCK_FOR_VALIDATION'});
}
if(!offline&&!installedOnly){
  // A first network failure ends the probe; do not repeat eight DNS failures or imply other pins passed.
  const exact=requirements.filter(x=>x.exact);let unavailable=false;
  for(const item of exact){
    if(unavailable){checks.push({...item,state:'skip',code:'NETWORK_PREVIOUSLY_UNAVAILABLE'});continue;}
    const result=await probePackage(item);checks.push(result);
    if(['DNS_UNAVAILABLE','NETWORK_TIMEOUT','NETWORK_UNAVAILABLE','TLS_VERIFICATION_FAILED','REGISTRY_ACCESS_DENIED','REGISTRY_RATE_LIMIT'].includes(result.code))unavailable=true;
  }
}
for(const c of checks)console.log(`${c.state.toUpperCase()}: ${c.name} — ${c.code}${c.actual?' ('+c.actual+')':''}${c.advice?'\n  '+c.advice:''}${c.messages?.length?'\n  '+c.messages.join('\n  '):''}`);
const report={version:pkg.version,checkedAt:new Date().toISOString(),profile:installedOnly?'installed':registryOnly?'registry':offline?'local':'local-and-registry',passed:checks.every(x=>x.state!=='fail'),checks,buildVerified:false,liveSupabaseVerified:false,productionApproved:false};
const out=path.join(root,'.diagnostics');mkdirSync(out,{recursive:true});const filename=installedOnly?'installed.json':registryOnly?'registry.json':offline?'local.json':'report.json';
writeFileSync(path.join(out,filename),JSON.stringify(report,null,2)+'\n');
console.log('Laporan: .diagnostics/'+filename+'; kelulusan diagnostik bukan bukti build atau produksi.');
process.exitCode=report.passed?0:1;
