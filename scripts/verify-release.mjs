import {runNode} from './process-runner.mjs';
import {mkdirSync,writeFileSync} from 'node:fs';
import path from 'node:path';
import {executeRelease,demoEnvironment} from './release-policy.mjs';
const root=path.resolve(import.meta.dirname,'..');const out=path.join(root,'.release');mkdirSync(out,{recursive:true});
// Under npm run, npm_execpath is the actual npm CLI JS. No shell interpolation or cmd quoting.
const npmCli=process.env.npm_execpath;if(!npmCli){console.error('Gunakan npm run verify:release.');process.exit(1);}
console.log('Gerbang kode/build demo. Tidak mengubah Supabase dan tidak mengesahkan produksi.');
// Invalidate an old PASS before starting a fresh run.
writeFileSync(path.join(out,'report.json'),JSON.stringify({passed:false,state:'running',productionApproved:false}));
const report=await executeRelease(async id=>{
 console.log('Memeriksa: '+id);
 const result=await runNode([npmCli,'run',id],{cwd:root,env:demoEnvironment(process.env)});
 writeFileSync(path.join(out,id.replaceAll(':','-')+'.log'),result.output);
 process.stdout.write(result.output);
 return {status:result.status};
});
report.checkedAt=new Date().toISOString();writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');
console.log(report.passed?'PASS gerbang kode demo. Uji SQL/staging/backup tetap wajib.':'STOP: ada pemeriksaan yang gagal/belum tersedia. Baca .release/report.json.');process.exitCode=report.passed?0:1;
