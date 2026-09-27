/** Source-contract inspections only: these do NOT execute PostgreSQL or Next.js. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {systemChecks} from '../lib/system-status.ts';
const read=(name:string)=>fs.readFileSync(new URL('../'+name,import.meta.url),'utf8');
const sql=read('supabase/migrations/003_editor_events.sql');
test('003 is transactional, version bounded and contains no destructive data statement',()=>{
 assert.match(sql,/\nbegin;/);assert.match(sql,/commit;\s*$/);
 assert.ok(sql.includes('not in (2,3)'));assert.ok(sql.includes('Install 001 and 002 before 003'));
 assert.ok(!/^\s*(drop|truncate|delete|update|insert|alter table)\s/im.test(sql));
 assert.ok(!sql.includes('create or replace function public.ki_save_draft'));
});
test('003 keeps legacy content valid and requires strict event bounds/primary projection',()=>{
 for(const token of ["if not (p_content ? 'events') then return true",'jsonb_array_length(events)>3','jsonb_array_length(events)<1','event ?& allowed','where not(key=any(allowed))','(event->>\'id\')=any(ids)','base->field is distinct from (events->0)->field','count(distinct value)'])assert.ok(sql.includes(token),token);
});
test('003 helper functions fix search_path and revoke public execution',()=>{
 for(const[,name,body]of sql.matchAll(/create or replace function public\.(\w+)([\s\S]*?)(?=create or replace function|notify pgrst|$)/g)){
  assert.ok(body.includes("set search_path=''"),name);assert.ok(body.includes('revoke all on function public.'+name),name);
 }
 assert.ok(!/grant execute on function public\.ki_valid_(base_)?content/.test(sql));
});
test('stage3 diagnostic schema is strict and detailed SQL still requires admin',()=>{
 assert.equal(systemChecks({schema_version:7}).find(r=>r.id==='schema')?.state,'pass');
 assert.equal(systemChecks({schema_version:2}).find(r=>r.id==='schema')?.state,'fail');
 assert.ok(sql.includes("if not public.ki_is_admin() then raise exception 'Admin required'"));
 assert.ok(!sql.includes('grant execute on function public.ki_system_status() to anon'));
});
test('both editor routes gate schema and key controller by owner and draft',()=>{
 for(const file of ['app/dashboard/baru/page.tsx','app/dashboard/undangan/[id]/page.tsx']){
  const src=read(file);assert.ok(src.includes('await requireUser('),file);assert.ok(src.includes('version!==7'),file);assert.ok(src.includes('<DraftEditor key={user.id+'),file);assert.ok(src.includes(".eq('owner_id',user.id)"),file);
 }
 assert.ok(read('app/dashboard/baru/page.tsx').includes('if(!draftId)redirect('));
});
test('photo links remain temporary in component memory and journal has no token/url fields',()=>{
 const src=read('components/editor/usePrivatePhotos.ts');assert.ok(src.includes('createSignedUrl(path,3600)'));
 assert.ok(!/localStorage|sessionStorage/.test(src));
 const editor=read('lib/editor-document.ts');assert.ok(!/access_token:|refresh_token:|signedUrl:/.test(editor));
 assert.ok(read('components/DraftEditor.tsx').includes('const current=controller.getSnapshot();'));
});
test('production save endpoint retains API guard and no automatic publish or paid field',()=>{
 const route=read('app/api/drafts/route.ts');assert.ok(route.includes('await apiUser(request)'));assert.ok(route.includes('parseSave(await readBody(request),user.id)'));
 assert.ok(route.includes("db.rpc('ki_save_draft'"));assert.ok(!/published|paid|service_role/.test(route));
 const health=read('app/api/health/route.ts');assert.ok(health.includes('productionReadinessVerified:false'));assert.ok(health.includes('backendConnectionVerified:false'));assert.ok(!health.includes('process.env'));
});
test('UI recovery and backup are explicit, with current privacy and guide disclosures',()=>{
 const editor=read('components/DraftEditor.tsx');assert.ok(editor.includes('controller.restore()'));assert.ok(editor.includes('controller.discardRecovery()'));assert.ok(editor.includes('setAutosave(false)'));
 const privacy=read('app/privasi/page.tsx');assert.ok(privacy.includes('tidak dienkripsi'));assert.ok(privacy.includes('sessionStorage'));
 const guide=read('app/admin/panduan/page.tsx');assert.ok(guide.includes('V1.7.0'));assert.ok(!guide.includes('Belum ada simpan otomatis'));
});
