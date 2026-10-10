import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ALL_THEME_SLUGS,PREMIUM_EDITION_SLUGS} from '../lib/theme-registry.ts';
import {parseCmsCatalog,parseCmsDocument,restoreCmsDocument} from '../lib/cms.ts';
import {parseDocument,createBackup,readBackup} from '../lib/editor-document.ts';
import {blankContent} from '../lib/domain.ts';
const read=(p:string)=>JSON.parse(readFileSync(new URL('../'+p,import.meta.url),'utf8'));
const themes=read('data/templates.json');
const catalog=themes.map(({slug,name,description,price,active}:Record<string,unknown>)=>({slug,name,description,price,active}));
test('premium editions map to every category and the wedding edition survives editor backup',()=>{
 assert.deepEqual(themes.map((t:{slug:string})=>t.slug),[...ALL_THEME_SLUGS]);
 assert.deepEqual(PREMIUM_EDITION_SLUGS.map(slug=>themes.find((t:{slug:string})=>t.slug===slug).category),['pernikahan','ulang-tahun','aqiqah','acara-kantor','pernikahan','ulang-tahun','aqiqah','acara-kantor']);
 const owner='00000000-0000-4000-8000-000000000001';
 const document=parseDocument({theme:'seraphine-garden',content:blankContent},owner);
 assert.equal(readBackup(createBackup(document,owner),owner).theme,'seraphine-garden');
});
test('restoring the previous 20-theme catalog preserves premium prices and availability',()=>{
 const old=parseCmsDocument({version:1,content:read('data/cms-defaults.json'),catalog:catalog.slice(0,20)});
 const current=structuredClone(catalog);current[20].price=275000;current[21].active=false;
 const restored=restoreCmsDocument(old,current);
 assert.equal(restored.catalog.length,28);assert.equal(restored.catalog[20].price,275000);assert.equal(restored.catalog[21].active,false);
 const substitution=structuredClone(old.catalog);substitution[0]=current[20];
 assert.throws(()=>parseCmsCatalog(substitution));assert.throws(()=>parseCmsCatalog(current.slice(0,23)));
});
