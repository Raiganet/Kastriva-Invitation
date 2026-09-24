import test from 'node:test';
import assert from 'node:assert/strict';
import { probeBackend, backendHeaders } from '../lib/readiness.ts';
const config = { url: 'https://test.supabase.co', key: 'sb_publishable_TEST_ONLY' };
const healthy = [ { external: { email: true }, disable_signup: false }, 7, [{ slug: 'elegant-rose' }] ];
function mock(bodies: unknown[] = healthy, statuses = [200,200,200]) {
  const calls: { url: string; init?: RequestInit }[] = [];
  const fetcher = (async (input: string | URL | Request, init?: RequestInit) => {
    const index = calls.length; calls.push({url:String(input),init});
    return new Response(JSON.stringify(bodies[index]),{status:statuses[index],headers:{'Content-Type':'application/json'}});
  }) as typeof fetch;
  return { fetcher, calls };
}
test('readiness without config does not touch network',async()=>{const m=mock();const r=await probeBackend(null,m);assert.equal(r.configured,false);assert.equal(r.readyForAccountTest,false);assert.equal(m.calls.length,0);assert.equal(r.checks[0].state,'skip');});
test('three successful probes allow account TEST, not a production-ready claim',async()=>{const m=mock();const r=await probeBackend(config,m);assert.equal(r.readyForAccountTest,true);assert.equal(r.checks.length,4);assert.equal(m.calls.length,3);assert.ok(!JSON.stringify(r).includes(config.key));assert.ok(!JSON.stringify(r).includes('https://test'));});
for (const i of [0,1,2]) test(`upstream failure ${i} blocks readiness`,async()=>{const statuses=[200,200,200];statuses[i]=503;const r=await probeBackend(config,mock(healthy,statuses));assert.equal(r.readyForAccountTest,false);assert.equal(r.checks[i+1].state,'fail');});
test('missing migration has an actionable message',async()=>{const r=await probeBackend(config,mock(healthy,[200,404,200]));assert.match(r.checks[2].detail,/001.*002/);});
test('invalid key is not printed in access-denied error',async()=>{const r=await probeBackend(config,mock([{token:config.key},null,null],[401,403,403]));assert.equal(r.readyForAccountTest,false);assert.ok(!JSON.stringify(r).includes(config.key));assert.match(r.checks[1].detail,/Akses ditolak/);});
test('schema mismatch and a string version are rejected',async()=>{for(const version of [1,2,3,4,5,6,'7',null,{}]){const r=await probeBackend(config,mock([healthy[0],version,healthy[2]]));assert.equal(r.checks[2].state,'fail');}});
test('closed signup or unknown auth shape is not marked ready',async()=>{for(const settings of [{external:{email:true},disable_signup:true},{external:{email:false},disable_signup:false},{},null]){const r=await probeBackend(config,mock([settings,7,healthy[2]]));assert.equal(r.checks[1].state,'warn');assert.equal(r.readyForAccountTest,false);}});
test('empty or malformed catalog fails instead of silently succeeding',async()=>{for(const rows of [[],null,[{slug:'<script>'}],[{no:'slug'}]]){const r=await probeBackend(config,mock([healthy[0],7,rows]));assert.equal(r.checks[3].state,'fail');}});
test('network exception is sanitized',async()=>{const fetcher=(async()=>{throw new Error(config.key)}) as typeof fetch;const r=await probeBackend(config,{fetcher});assert.equal(r.readyForAccountTest,false);assert.ok(!JSON.stringify(r).includes(config.key));});
test('hung fetch is bounded even if an adapter ignores abort',async()=>{const fetcher=(()=>new Promise(()=>{})) as typeof fetch;const start=Date.now();const r=await probeBackend(config,{fetcher,timeoutMs:10});assert.equal(r.readyForAccountTest,false);assert.ok(Date.now()-start<1000);});
test('read-only probes disallow redirects and use no-store',async()=>{const m=mock();await probeBackend(config,m);for(const c of m.calls){assert.equal(c.init?.cache,'no-store');assert.equal(c.init?.redirect,'error');assert.ok(!/ki_invitations|ki_orders|auth\/v1\/user/.test(c.url));}assert.equal(m.calls[1].init?.body,'{}');});
test('oversized metadata response fails without copying it into diagnostics',async()=>{const r=await probeBackend(config,mock([{secret:'x'.repeat(40000)},7,healthy[2]]));assert.equal(r.checks[1].state,'fail');assert.ok(JSON.stringify(r).length<5000);});
test('publishable key is sent as apikey, not a fake Bearer JWT',()=>{assert.equal(backendHeaders(config.key).Authorization,undefined);assert.equal(backendHeaders(config.key).apikey,config.key);});
test('legacy anon key uses expected authorization header',()=>{const token='e30.eyJyb2xlIjoiYW5vbiJ9.signature';assert.equal(backendHeaders(token).Authorization,`Bearer ${token}`);});
