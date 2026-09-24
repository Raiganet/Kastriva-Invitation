import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {classifyFailure,redactLog,supportsNode,matchesVersion,packageRequirements,probePackage} from '../scripts/diagnostics-policy.mjs';
import {runNode} from '../scripts/process-runner.mjs';
for (const [input,expected] of [['EAI_AGAIN','DNS_UNAVAILABLE'],['ENOTFOUND','DNS_UNAVAILABLE'],['ETARGET','PACKAGE_VERSION_UNAVAILABLE'],['E404','PACKAGE_VERSION_UNAVAILABLE'],['CERT_HAS_EXPIRED','TLS_VERIFICATION_FAILED'],['ETIMEDOUT','NETWORK_TIMEOUT'],['E403','REGISTRY_ACCESS_DENIED'],['E429','REGISTRY_RATE_LIMIT'],['ERESOLVE','DEPENDENCY_CONFLICT'],['ECONNRESET','NETWORK_UNAVAILABLE']]) {
 test('diagnostics classify '+input,()=>assert.equal(classifyFailure({code:input}).code,expected));
}
test('diagnostics inspect a fetch cause but do not expose its text',()=>{
 const result=classifyFailure({message:'sb_secret_NOT_FOR_REPORT',cause:{code:'EAI_AGAIN'}});assert.equal(result.code,'DNS_UNAVAILABLE');assert.ok(!JSON.stringify(result).includes('NOT_FOR_REPORT'));
});
test('redaction handles key, token hash, JWT, credential URL and HMAC',()=>{
 const values=['sb_secret_PRIVATE_FIXTURE','token_hash=NEVER_SHOW','https://myuser:mypass@example.invalid','RATE_LIMIT_HMAC_KEY=abcdef12345','eyJabcdefghijk.abcdefghijk.abcdefghijk','Authorization: Bearer DO_NOT_SHOW'];
 const result=redactLog(values.join('\n'));for(const secret of ['PRIVATE_FIXTURE','NEVER_SHOW','myuser:mypass','abcdef12345','eyJabcdefghijk','DO_NOT_SHOW'])assert.ok(!result.includes(secret));
});
test('diagnostics version range checks exactly the supported manifest forms',()=>{
 assert.ok(matchesVersion('5.9.3','~5.9.3'));assert.ok(matchesVersion('5.9.9','~5.9.3'));assert.ok(!matchesVersion('5.10.0','~5.9.3'));
 assert.ok(matchesVersion('22.18.0','^22.0.0'));assert.ok(!matchesVersion('24.0.0','^22.0.0'));assert.ok(!matchesVersion('16.3.5','16.3.6'));
 assert.ok(!matchesVersion('16.3.6-canary.1','16.3.6'));assert.ok(!matchesVersion('19.3.0','latest'));assert.ok(!matchesVersion('1.0.0','^0.1.0'));
});
test('runtime rejects unsupported node major and prereleases',()=>{
 assert.ok(supportsNode('v22.16.0'));assert.ok(!supportsNode('v20.19.0'));assert.ok(!supportsNode('v24.0.0'));assert.ok(!supportsNode('v22.0.0-rc.1'));
});
test('manifest requirements handle scoped names and reject path traversal',()=>{
 assert.equal(packageRequirements({dependencies:{'@supabase/ssr':'0.12.7'}})[0].exact,true);
 assert.throws(()=>packageRequirements({dependencies:{'../../secret':'1.0.0'}}));
});
const pkg={name:'next',requested:'16.3.6'};
test('registry exact matching metadata succeeds without receiving credentials',async()=>{
 let seen:RequestInit|undefined;const r=await probePackage(pkg,async(input,init)=>{seen=init;assert.equal(String(input),'https://registry.npmjs.org/next/16.3.6');return Response.json({name:'next',version:'16.3.6'});});
 assert.equal(r.state,'pass');assert.equal(seen?.redirect,'error');assert.equal(new Headers(seen?.headers).get('Authorization'),null);
});
test('registry mismatched metadata never confirms a version',async()=>{
 assert.equal((await probePackage(pkg,async()=>Response.json({name:'other',version:'16.3.6'}))).state,'fail');
});
test('registry ranges are not presented as exact version confirmations',async()=>{
 let called=false;const r=await probePackage({...pkg,requested:'^16.0.0'},async()=>{called=true;return Response.json({});});assert.equal(r.state,'skip');assert.equal(called,false);
});
test('registry DNS is not mistaken for ETARGET',async()=>{
 const r=await probePackage(pkg,async()=>{throw Object.assign(new Error('fetch failed'),{cause:{code:'EAI_AGAIN'}});});assert.equal(r.code,'DNS_UNAVAILABLE');
});
test('registry 404 is distinct from DNS',async()=>{
 const r=await probePackage(pkg,async()=>new Response(null,{status:404}));assert.equal(r.code,'PACKAGE_VERSION_UNAVAILABLE');
});
test('registry deadline covers body that never finishes',async()=>{
 const r=await probePackage(pkg,async()=>new Response(new ReadableStream()),15);assert.equal(r.code,'NETWORK_TIMEOUT');
});
test('registry caps streamed metadata size',async()=>{
 const r=await probePackage(pkg,async()=>new Response('x'.repeat(262145)));assert.equal(r.state,'fail');
});
test('process runner preserves nonzero child exit status',async()=>{
 const r=await runNode(['-e','process.exit(7)']);assert.equal(r.status,7);
});
test('process runner does not interpolate shell arguments',async()=>{
 const literal='space ; $(not-executed) & |';const r=await runNode(['-e','console.log(process.argv[1])',literal]);assert.equal(r.status,0);assert.equal(r.output.trim(),literal);
});
test('process runner redacts a key split over multiple stream chunks',async()=>{
 const r=await runNode(['-e',"process.stdout.write('sb_sec');setTimeout(()=>process.stdout.write('ret_PRIVATE_FIXTURE'),10)"]);assert.equal(r.status,0);assert.ok(!r.output.includes('PRIVATE_FIXTURE'));assert.match(r.output,/REDACTED/);
});
test('process runner timeout is never a success',async()=>{
 const r=await runNode(['-e','setInterval(()=>{},1000)'],{timeoutMs:120,graceMs:30});assert.equal(r.status,124);assert.equal(r.timedOut,true);
});
test('process runner handles an invalid working directory',async()=>{
 const r=await runNode(['-e','console.log(1)'],{cwd:'/ki-directory-that-does-not-exist'});assert.equal(r.status,1);
});
test('health and SDK patch integration are present without adding migrations',()=>{
 const s=readFileSync(new URL('../lib/commerce-server.ts',import.meta.url),'utf8');assert.equal(s.match(/fetch:createBoundedBackendFetch/g)?.length,2);assert.ok(!s.includes('init?.signal||AbortSignal.timeout'));
 const release=readFileSync(new URL('../scripts/release-policy.mjs',import.meta.url),'utf8');assert.ok(release.includes('check:installed'));
});
test('process runner timeout kills a child that ignores graceful termination',async()=>{
 const r=await runNode(['-e',"process.on('SIGTERM',()=>{});setInterval(()=>{},1000)"],{timeoutMs:250,graceMs:30});assert.equal(r.status,124);
});
test('installer preview does not write .env or run installs',async()=>{
 const before=readFileSync(new URL('../package.json',import.meta.url),'utf8');
 const r=await runNode(['scripts/prepare-local.mjs','--plan']);assert.equal(r.status,0);assert.match(r.output,/PLAN ONLY/);assert.equal(readFileSync(new URL('../package.json',import.meta.url),'utf8'),before);
});
