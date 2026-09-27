import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ALL_THEME_SLUGS,HERITAGE_THEME_SLUGS,WEDDING_THEME_SLUGS} from '../lib/theme-registry.ts';
import {parseCmsDocument,restoreCmsDocument,parseCmsCatalog} from '../lib/cms.ts';
import {parseDocument,createBackup,readBackup} from '../lib/editor-document.ts';
import {blankContent} from '../lib/domain.ts';
const read=(file:string)=>readFileSync(new URL('../'+file,import.meta.url),'utf8');
const themes=JSON.parse(read('data/templates.json'));
const catalog=themes.map(({slug,name,description,price,active}:Record<string,unknown>)=>({slug,name,description,price,active}));
const doc=()=>parseCmsDocument({version:1,content:JSON.parse(read('data/cms-defaults.json')),catalog});
const owner='00000000-0000-4000-8000-000000000001';
test('new renderers have independent catalog identities and agreed prices',()=>{
 assert.deepEqual(themes.map((t:{slug:string})=>t.slug),[...ALL_THEME_SLUGS]);
 assert.equal(new Set(ALL_THEME_SLUGS).size,15);
 assert.deepEqual(themes.filter((t:{category:string})=>t.category==='pernikahan').map((t:{slug:string})=>t.slug),WEDDING_THEME_SLUGS);
 for(const slug of HERITAGE_THEME_SLUGS){const t=themes.find((row:{slug:string})=>row.slug===slug);assert.equal(t.price,200000);assert.equal(t.category,'pernikahan');assert.equal(t.active,true);}
});
test('each new theme survives customer validation and backup roundtrip',()=>{
 for(const theme of HERITAGE_THEME_SLUGS){const document={theme,content:blankContent};assert.equal(parseDocument(document,owner).theme,theme);assert.equal(readBackup(createBackup(document,owner),owner).theme,theme);}
 assert.throws(()=>parseDocument({theme:'unregistered-theme',content:blankContent},owner));
});
test('legacy CMS history remains readable and restoring it preserves added live themes',()=>{
 const current=doc();current.catalog[8].price=225000;current.catalog[8].active=false;
 const legacy=parseCmsDocument({...doc(),catalog:doc().catalog.slice(0,8)});legacy.content.heroTitle='Judul dari salinan lama';legacy.catalog[0].price=160000;
 const restored=restoreCmsDocument(legacy,current.catalog);
 assert.equal(restored.catalog.length,15);assert.equal(restored.catalog[8].price,225000);assert.equal(restored.catalog[8].active,false);assert.equal(restored.catalog[0].price,160000);assert.equal(restored.content.heroTitle,legacy.content.heroTitle);
 assert.deepEqual(restoreCmsDocument(restored,current.catalog),restored);
 assert.equal(legacy.catalog.length,8);assert.equal(current.catalog[0].price,150000);
});
test('legacy compatibility does not permit dropping arbitrary renderers',()=>{
 const incomplete=doc().catalog.slice(0,7);incomplete.push(doc().catalog[8]);assert.throws(()=>parseCmsCatalog(incomplete));
 assert.throws(()=>parseCmsCatalog(doc().catalog.slice(0,12)));assert.equal(parseCmsCatalog(doc().catalog.slice(8,13),false).length,5);
});
test('009 migration is additive, protects existing prices, and retains current access policy',()=>{
 const sql=read('supabase/migrations/009_heritage_themes.sql');
 assert.match(sql,/on conflict\(slug\) do nothing/);assert.doesNotMatch(sql,/^\s*(grant|revoke|drop|truncate|alter table)/im);
 assert.doesNotMatch(sql,/update public\.(ki_sales|ki_invitations|ki_publications|ki_commerce_settings|ki_guest_platform)\b/i);
 assert.ok(sql.includes("jsonb_array_length(live_catalog)"));assert.ok(sql.includes("History compatibility failed"));
 for(const slug of HERITAGE_THEME_SLUGS)assert.ok(sql.includes("'"+slug+"'"));
});
