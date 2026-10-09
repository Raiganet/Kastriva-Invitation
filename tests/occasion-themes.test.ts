import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ALL_THEME_SLUGS,OCCASION_THEME_SLUGS} from '../lib/theme-registry.ts';
import {parseCmsCatalog,parseCmsDocument,restoreCmsDocument} from '../lib/cms.ts';
import {parseDocument,createBackup,readBackup} from '../lib/editor-document.ts';
import {blankContent} from '../lib/domain.ts';
const read=(p:string)=>JSON.parse(readFileSync(new URL('../'+p,import.meta.url),'utf8'));
const themes=read('data/templates.json');
const catalog=themes.map(({slug,name,description,price,active}:Record<string,unknown>)=>({slug,name,description,price,active}));

test('occasion collection adds one original theme to each category',()=>{
 assert.deepEqual(themes.map((t:{slug:string})=>t.slug),[...ALL_THEME_SLUGS]);
 assert.deepEqual(OCCASION_THEME_SLUGS.map(slug=>themes.find((t:{slug:string})=>t.slug===slug).category),['pernikahan','ulang-tahun','aqiqah','acara-kantor']);
 const owner='00000000-0000-4000-8000-000000000001';
 const document=parseDocument({theme:'velvet-vow',content:blankContent},owner);
 assert.equal(readBackup(createBackup(document,owner),owner).theme,'velvet-vow');
});
test('restoring a 16-theme CMS backup retains the four current occasion rows and pricing',()=>{
 const old=parseCmsDocument({version:1,content:read('data/cms-defaults.json'),catalog:catalog.slice(0,16)});
 const current=structuredClone(catalog);current[16].price=225000;current[17].active=false;
 const restored=restoreCmsDocument(old,current);
 assert.equal(restored.catalog.length,20);assert.equal(restored.catalog[16].price,225000);assert.equal(restored.catalog[17].active,false);
 const substituted=structuredClone(old.catalog);substituted[0]=current[16];
 assert.throws(()=>parseCmsCatalog(substituted));
 assert.throws(()=>parseCmsCatalog(current.slice(0,19)));
});
