import test from 'node:test';
import assert from 'node:assert/strict';
import { requestLogout } from '../lib/logout-transport.ts';
const json=(s:string,status=200)=>new Response(s,{status,headers:{'Content-Type':'application/json'}});
const rejects=(f:typeof fetch,timeout=200)=>assert.rejects(requestLogout(f,timeout),/Logout belum dapat dipastikan/);

test('logout: exact ack confirms once with same-origin and redirect rejection',async()=>{
 let calls=0;
 await requestLogout(async (input,init)=>{
  calls++;assert.equal(input,'/api/logout');assert.equal(init?.method,'POST');
  assert.equal(init?.credentials,'same-origin');assert.equal(init?.redirect,'error');
  assert.equal(init?.cache,'no-store');assert.ok(init?.signal);return json('{"ok":true}');
 });assert.equal(calls,1);
});
for(const body of ['{}','null','true','[]','{"ok":false}','{"ok":"true"}','{"ok":true,"error":"failed"}','{"ok":true']) {
 test('logout: unknown/incomplete body rejected '+body,()=>rejects(async()=>json(body)));
}
for (const status of [204,301,400,401,429,500,503]) {
 test('logout: status '+status+' is not an acknowledgement',()=>rejects(async()=>new Response(status===204?null:'{}',{status})));
}
test('logout: HTML 200 login page must not be treated as logged out',()=>rejects(async()=>new Response('<h1>Login</h1>',{headers:{'Content-Type':'text/html'}})));
test('logout: no automatic mutation retry on unknown result',async()=>{
 let calls=0;await rejects(async()=>{calls++;throw new Error('private error sb_secret_FIXTURE');});assert.equal(calls,1);
});
test('logout: slow connection that ignores AbortSignal still settles',()=>rejects(async()=>new Promise(()=>{}),15));
test('logout: deadline covers body, not only response headers',()=>rejects(async()=>new Response(new ReadableStream({cancel(){return new Promise(()=>{});}}),{headers:{'Content-Type':'application/json'}}),15));
test('logout: huge body with small Content-Length is rejected',()=>rejects(async()=>new Response(' '.repeat(3000),{headers:{'Content-Type':'application/json','Content-Length':'2'}})));
test('logout: declared huge body is cancelled before reading',async()=>{
 let cancelled=false;const stream=new ReadableStream({cancel(){cancelled=true;}});
 await rejects(async()=>new Response(stream,{headers:{'Content-Type':'application/json','Content-Length':'4000'}}));assert.equal(cancelled,true);
});
test('logout: invalid UTF8 is rejected even inside a JSON string',()=>rejects(async()=>new Response(new Uint8Array([0xff]),{headers:{'Content-Type':'application/json'}})));
test('logout: valid UTF8 chunks accepted',async()=>{
 const encoder=new TextEncoder();const stream=new ReadableStream({start(c){c.enqueue(encoder.encode('{"ok":'));c.enqueue(encoder.encode('true}'));c.close();}});
 await requestLogout(async()=>new Response(stream,{headers:{'Content-Type':'Application/JSON; charset=utf-8'}}));
});
test('logout: invalid timeout cannot start a request',async()=>{
 for(const timeout of [0,NaN,-1,60001])await assert.rejects(requestLogout(async()=>json('{"ok":true}'),timeout),/INVALID_LOGOUT_TIMEOUT/);
});
