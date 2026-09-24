// Real editor controller + auth decision code; SDK/storage are deliberate in-memory fixtures.
import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {EditorController} from '../lib/editor-controller.ts';
import {blankContent} from '../lib/domain.ts';
import {verifiedUser} from '../lib/auth-result.ts';
import {HttpError} from '../lib/http-errors.ts';
const owner='a0000000-0000-4000-8000-000000000001',id='b0000000-0000-4000-8000-000000000001';
function fixture() {
 let state:'down'|'valid'|'missing'='down',journal:string|null=null,writes=0;
 const sent: unknown[]=[];
 const controller=new EditorController({owner,id,revision:1,document:{theme:'elegant-rose',content:{...blankContent,photoPaths:[]}}},{
  read:()=>journal,write:x=>{journal=x;},remove:()=>{journal=null;},uuid:randomUUID,
  send:async payload=>{
   sent.push(structuredClone(payload));
   try {
    await verifiedUser(async()=>state==='down'?{data:{user:null},error:{status:503}}:
     state==='missing'?{data:{user:null},error:{name:'AuthSessionMissingError'}}:{data:{user:{id:owner}},error:null});
    writes++;return {ok:true,status:200,body:{draft:{id,revision:payload.expected_revision+1,updated_at:'2026-09-24T10:00:00Z'}}};
   } catch(e) {if(!(e instanceof HttpError))throw e;return {ok:false,status:e.status,body:{error:e.message}};}
  },
 });controller.initialize();
 const edit=(groom:string)=>controller.edit({...controller.getSnapshot().document,content:{...controller.getSnapshot().document.content,groom}});
 return {controller,edit,sent,set:(value:typeof state)=>{state=value;},journal:()=>journal,writes:()=>writes};
}
test('session flow: outage preserves pending save; restored service retries identical payload',async()=>{
 const f=fixture();f.edit('Versi A');await f.controller.save();
 assert.equal(f.controller.getSnapshot().phase,'error');assert.ok(f.controller.getSnapshot().pending);
 assert.equal(f.writes(),0);assert.ok(f.journal()?.includes('Versi A'));
 f.set('valid');await f.controller.save();assert.deepEqual(f.sent[0],f.sent[1]);
 assert.equal(f.writes(),1);assert.equal(f.controller.getSnapshot().phase,'idle');assert.equal(f.controller.getSnapshot().revision,2);
});
test('session flow: new typing during outage survives the retried older save',async()=>{
 const f=fixture();f.edit('Versi A');await f.controller.save();f.edit('Versi B');f.set('valid');await f.controller.save();
 assert.deepEqual(f.sent[0],f.sent[1]);assert.equal(f.controller.getSnapshot().document.content.groom,'Versi B');
 assert.equal(f.controller.isDirty(),true);await f.controller.save();assert.equal(f.controller.isDirty(),false);
 assert.equal(f.controller.getSnapshot().revision,3);assert.equal(f.writes(),2);
});
test('session flow: real missing session still blocks saving under a different identity',async()=>{
 const f=fixture();f.set('missing');f.edit('Privat');await f.controller.save();
 assert.equal(f.controller.getSnapshot().phase,'auth');assert.equal(f.writes(),0);
 assert.ok(f.journal()?.includes('Privat'));f.set('valid');await f.controller.save();assert.equal(f.sent.length,1);
});
const read=(file:string)=>readFileSync(new URL('../'+file,import.meta.url),'utf8');
test('session wiring: every Supabase factory uses bounded fetch without a secret in browser',()=>{
 for(const p of ['lib/supabase/server.ts','lib/supabase/client.ts','lib/commerce-server.ts','proxy.ts'])assert.ok(read(p).includes('createBoundedBackendFetch({origin:env.url})'),p);
 const browser=read('lib/supabase/client.ts');assert.ok(!browser.includes('SUPABASE_SECRET_KEY'));
});
test('session wiring: API/page authorization uses getUser and shared verified decision',()=>{
 for(const p of ['lib/http.ts','lib/server-auth.ts']) {
  const text=read(p);assert.ok(text.includes('verifiedUser(() => db.auth.getUser())'));assert.ok(!text.includes('.auth.getSession('));
 }
 assert.ok(read('lib/server-auth.ts').includes('error.status === 401'));
});
test('session wiring: admin mutations distinguish RPC error from denied role',()=>{
 for(const p of ['cms','commerce','guestbook','orders'])assert.ok(read('app/api/admin/'+p+'/route.ts').includes('requireAdminDecision(admin,'),p);
});
test('session wiring: logout redirects only after strict ack and suppresses double clicks',()=>{
 const source=read('components/LogoutButton.tsx');
 assert.ok(source.includes('if (lock.current) return;'));assert.ok(source.includes("await requestLogout(); window.location.assign('/login')"));
});
