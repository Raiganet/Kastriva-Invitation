// ONLY an empty disposable local PostgreSQL database. Never reads .env or connects to Supabase.
import {spawnSync} from 'node:child_process';
import {mkdirSync,writeFileSync,readdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import manifest from '../package.json' with {type:'json'};
import {sqlTestPlan} from './sql-test-plan.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
// Do not accept a URL, host, database name, service file or credentials for any real account.
const env={PATH:process.env.PATH,HOME:process.env.HOME,SystemRoot:process.env.SystemRoot,TEMP:process.env.TEMP,TMP:process.env.TMP,
 PGHOST:'127.0.0.1',PGPORT:'55432',PGDATABASE:'ki_isolated_test',PGUSER:'postgres',PGPASSWORD:'ki_local_fixture_only',
 PGCONNECT_TIMEOUT:'5',PGSSLMODE:'disable',PGOPTIONS:'-c statement_timeout=30000 -c lock_timeout=5000',PGAPPNAME:'ki-isolated-fixture'};
mkdirSync(root+'.sql-test',{recursive:true});
let passed=false; const steps=[];
function report(state) { writeFileSync(root+'.sql-test/report.json',JSON.stringify({version:manifest.version,checkedAt:new Date().toISOString(),passed,state,
 profile:'postgres-local-auth-storage-stubs',steps,liveSupabaseVerified:false,productionApproved:false},null,2)+'\n'); }
if(process.env.KI_SQL_TEST_ALLOW_CREATE!=='yes'){report('skipped');console.log('SKIP: local SQL fixture disabled. Requires explicit KI_SQL_TEST_ALLOW_CREATE=yes on an EMPTY disposable local database.');process.exit(2);}
report('running'); // invalidate any old PASS, including prerequisite failures
let plan;
try { plan=sqlTestPlan(readdirSync(root+'supabase/migrations').filter(n=>n.endsWith('.sql'))); }
catch(error) { report('plan_failed');console.error(error.message);process.exit(1); }
const probe=spawnSync('psql',['--version'],{env,encoding:'utf8',timeout:10000});
if(probe.status!==0){report('psql_unavailable');console.error('FAIL: psql client not available. No database was touched. See docs/UPGRADE_v1.8.0.md.');process.exit(1);}
for(const file of plan){
 const r=spawnSync('psql',['-X','--no-password','-v','ON_ERROR_STOP=1','--file',root+file],{env,encoding:'utf8',timeout:120000,maxBuffer:4*1024*1024});
 writeFileSync(root+'.sql-test/'+String(steps.length).padStart(2,'0')+'-'+file.split('/').at(-1)+'.log',(r.stdout||'')+(r.stderr||'')+(r.error?.message||''));
 steps.push({file,status:r.status,passed:r.status===0});console.log(`${r.status===0?'PASS':'FAIL'}: ${file}`);
 report('running');
 if(r.status!==0){console.error((r.stderr||r.error?.message||'psql failed').slice(-6000));break;}
}
passed=steps.length===plan.length&&steps.every(s=>s.passed);report(passed?'passed':'failed');
console.log(passed?'PASS local SQL fixture only; NOT a Supabase/Auth/Storage HTTP test.':'FAIL; stopped at first SQL error. Empty test DB must be recreated manually before retry.');process.exitCode=passed?0:1;
