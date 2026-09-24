import test from 'node:test';
import assert from 'node:assert/strict';
import { createBoundedBackendFetch } from '../lib/backend-fetch.ts';
import { HttpError } from '../lib/http-errors.ts';
const origin = 'https://fixture.supabase.co';
const url = origin + '/rest/v1/rpc/test';
const expectUnavailable = (e: unknown) => e instanceof HttpError && e.status === 503;
function adapter(fetcher: typeof fetch, maxBytes = 1024, timeoutMs = 100) {
  return createBoundedBackendFetch({ origin, fetcher, maxBytes, timeoutMs });
}
test('backend: exact JSON body and headers are preserved', async () => {
  let init: RequestInit | undefined;
  const f = adapter(async (_input, value) => { init = value; return Response.json({ ok: true }); });
  const r = await f(url, { method: 'POST', headers: { apikey: 'fixture-only' }, body: '{}' });
  assert.deepEqual(await r.json(), { ok: true });
  assert.equal(init?.redirect, 'error'); assert.equal(init?.cache, 'no-store');
  assert.equal(new Headers(init?.headers).get('apikey'), 'fixture-only');
});
test('backend: errors keep original status and Retry-After', async () => {
  const r = await adapter(async () => new Response('{"error":"fixture"}', {status:429,headers:{'Retry-After':'30'}}))(url);
  assert.equal(r.status,429); assert.equal(r.headers.get('retry-after'),'30');
});
test('backend: 204 with no body remains valid', async () => {
  const r = await adapter(async () => new Response(null,{status:204}))(url);
  assert.equal(r.status,204); assert.equal(r.body,null);
});
test('backend: body exceeds limit without Content-Length', async () => {
  await assert.rejects(adapter(async()=>new Response('x'.repeat(65)),64)(url),expectUnavailable);
});
test('backend: false small Content-Length cannot bypass actual stream bound', async () => {
  await assert.rejects(adapter(async()=>new Response('x'.repeat(65),{headers:{'Content-Length':'1'}}),64)(url),expectUnavailable);
});
test('backend: declared oversized body cancelled before reading', async () => {
  let cancelled=false;
  const stream=new ReadableStream({cancel(){cancelled=true;}});
  await assert.rejects(adapter(async()=>new Response(stream,{headers:{'Content-Length':'65'}}),64)(url),expectUnavailable);
  assert.equal(cancelled,true);
});
test('backend: multiple chunks exact limit accepted', async () => {
  const stream=new ReadableStream({start(c){c.enqueue(new Uint8Array([1,2]));c.enqueue(new Uint8Array([3,4]));c.close();}});
  const r=await adapter(async()=>new Response(stream),4)(url);
  assert.deepEqual([...new Uint8Array(await r.arrayBuffer())],[1,2,3,4]);
});
test('backend: deadline enforced with caller signal and fetch ignoring cancellation', async () => {
  const caller=new AbortController(); let observed:AbortSignal|null|undefined;
  const f=adapter(async(_input,init)=>{observed=init?.signal;return new Promise(()=>{});},100,15);
  await assert.rejects(f(url,{signal:caller.signal}),expectUnavailable);
  assert.equal(observed?.aborted,true); assert.equal(caller.signal.aborted,false);
});
test('backend: slow body times out even after headers', async () => {
  let cancelled=false;
  await assert.rejects(adapter(async()=>new Response(new ReadableStream({cancel(){cancelled=true;}})),100,15)(url),expectUnavailable);
  assert.equal(cancelled,true);
});
test('backend: cancel that never resolves cannot trap the deadline', async () => {
  await assert.rejects(adapter(async()=>new Response(new ReadableStream({cancel(){return new Promise(()=>{});}})),100,15)(url),expectUnavailable);
});
test('backend: caller abort cancels operation but is not labelled success', async () => {
  const caller=new AbortController(); const f=adapter(async()=>new Promise(()=>{}));
  const result=f(url,{signal:caller.signal}); caller.abort();
  await assert.rejects(result,expectUnavailable);
});
test('backend: already aborted caller never reaches network', async () => {
  let calls=0; const c=new AbortController();c.abort();
  await assert.rejects(adapter(async()=>{calls++;return Response.json({});})(url,{signal:c.signal}),expectUnavailable);assert.equal(calls,0);
});
for (const other of ['https://other.invalid/path','http://fixture.supabase.co/path','https://user:pass@fixture.supabase.co/path']) {
  test('backend: rejects foreign or credentialed target '+other,async()=>{
    let called=false;await assert.rejects(adapter(async()=>{called=true;return Response.json({});})(other),expectUnavailable);assert.equal(called,false);
  });
}
test('backend: never follows a redirect with server credentials',async()=>{
  await assert.rejects(adapter(async()=>new Response(null,{status:302,headers:{Location:'https://evil.invalid'}}))(url),expectUnavailable);
});
test('backend: upstream exception URL/key is not leaked',async()=>{
  try { await adapter(async()=>{throw new Error('sb_secret_DO_NOT_LEAK https://secret.invalid');})(url);assert.fail(); }
  catch(e){assert.ok(expectUnavailable(e));assert.ok(!String(e).includes('DO_NOT_LEAK'));assert.ok(!String(e).includes('secret.invalid'));}
});
test('backend: decoded compressed body gets corrected headers',async()=>{
  const r=await adapter(async()=>new Response('hello',{headers:{'Content-Encoding':'gzip','Content-Length':'3'}}))(url);
  assert.equal(await r.text(),'hello');assert.equal(r.headers.get('content-encoding'),null);assert.equal(r.headers.get('content-length'),'5');
});
test('backend: Request caller signal is respected',async()=>{
  const c=new AbortController();c.abort();await assert.rejects(adapter(async()=>Response.json({}))(new Request(url,{signal:c.signal})),expectUnavailable);
});
test('backend: errors and not only successful responses obey size limit',async()=>{
  await assert.rejects(adapter(async()=>new Response('x'.repeat(101),{status:500}),100)(url),expectUnavailable);
});
test('backend: invalid policies rejected before a call',()=>{
  for (const maxBytes of [0,-1,NaN,9*1024*1024]) assert.throws(()=>createBoundedBackendFetch({origin,maxBytes}));
  for (const timeoutMs of [0,-1,Infinity,60001]) assert.throws(()=>createBoundedBackendFetch({origin,timeoutMs}));
  assert.throws(()=>createBoundedBackendFetch({origin:'http://insecure.invalid'}));
});
