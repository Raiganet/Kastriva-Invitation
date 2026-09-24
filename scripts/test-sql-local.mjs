// ONLY an empty disposable local PostgreSQL database. Never reads .env or connects to Supabase.
import {spawnSync} from 'node:child_process';
import {mkdirSync,writeFileSync,readdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
if(process.env.KI_SQL_TEST_ALLOW_CREATE!=='yes'){console.log('SKIP: local SQL fixture disabled. Requires explicit KI_SQL_TEST_ALLOW_CREATE=yes on an EMPTY disposable local database.');process.exit(2);}
// Do not accept a URL, host, database name, service file or credentials for any real account.
const env={PATH:process.env.PATH,HOME:process.env.HOME,SystemRoot:process.env.SystemRoot,TEMP:process.env.TEMP,TMP:process.env.TMP,
 PGHOST:'127.0.0.1',PGPORT:'55432',PGDATABASE:'ki_isolated_test',PGUSER:'postgres',PGPASSWORD:'ki_local_fixture_only',
 PGCONNECT_TIMEOUT:'5',PGSSLMODE:'disable',PGOPTIONS:'-c statement_timeout=30000 -c lock_timeout=5000',PGAPPNAME:'ki-isolated-fixture'};
const probe=spawnSync('psql',['--version'],{env,encoding:'utf8',timeout:10000});
if(probe.status!==0){console.error('FAIL: psql client not available. No database was touched. See docs/UJI_RILIS_TAHAP7.md.');process.exit(1);}
mkdirSync(root+'.sql-test',{recursive:true});let passed=true;const steps=[];
function run(file){const r=spawnSync('psql',['-X','--no-password','-v','ON_ERROR_STOP=1','--file',root+file],{env,encoding:'utf8',timeout:120000,maxBuffer:4*1024*1024});const name=file.split('/').at(-1);writeFileSync(root+'.sql-test/'+String(steps.length).padStart(2,'0')+'-'+name+'.log',(r.stdout||'')+(r.stderr||''));steps.push({file,status:r.status,passed:r.status===0});console.log(`${r.status===0?'PASS':'FAIL'}: ${file}`);if(r.status!==0){passed=false;console.error((r.stderr||r.error?.message||'psql failed').slice(-6000));return false;}return true;}
// Bootstrap refuses any existing auth/storage schemas or app objects. Does not DROP/TRUNCATE/reset.
if(run('supabase/tests/local-bootstrap.sql')){
 for(const name of readdirSync(root+'supabase/migrations').filter(x=>/^00[1-6]_.*\.sql$/.test(x)).sort()){if(!run('supabase/migrations/'+name))break;}
 if(passed)for(const name of ['003_editor_validation.sql','004_commerce_integration.sql','005_guestbook_integration.sql','006_cms_integration.sql']){if(!run('supabase/tests/'+name))break;}
 if(passed&&run('supabase/migrations/007_release_hardening.sql')&&run('supabase/tests/007_release_integration.sql')){
   // Verify repeated 007 and unchanged service flags, without downgrading historical migrations.
   if(run('supabase/migrations/007_release_hardening.sql'))run('supabase/tests/007_release_integration.sql');
 }
}
writeFileSync(root+'.sql-test/report.json',JSON.stringify({version:'1.7.3',passed,profile:'postgres-local-auth-storage-stubs',steps,liveSupabaseVerified:false,productionApproved:false},null,2));
console.log(passed?'PASS local SQL fixture only; NOT a Supabase/Auth/Storage HTTP test.':'FAIL; stopped at first SQL error. Empty test DB must be recreated manually before retry.');process.exitCode=passed?0:1;
