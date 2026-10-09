import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {categoryForTheme,fieldsForCategory} from '../lib/invitation-category.ts';
import {blankContentForTheme,editableDocument,completion,parseDocument,createBackup,readBackup} from '../lib/editor-document.ts';
import {readyToPublish} from '../lib/commerce.ts';
const owner='11111111-1111-4111-8111-111111111111';
const catalog=JSON.parse(readFileSync(new URL('../data/templates.json',import.meta.url),'utf8')) as {slug:string;category:string}[];
test('every renderer has the correct immutable category',()=>{
 for(const t of catalog)assert.equal(categoryForTheme(t.slug),t.category);
 assert.equal(categoryForTheme('unknown'),undefined);
});
for(const t of catalog.filter(t=>t.category!=='pernikahan'))test(t.slug+' can save, restore, complete and order with one primary name',()=>{
 const blank=blankContentForTheme(t.slug);
 assert.equal(blank.bride,'');assert.equal(blank.brideParents,'');
 const content={...blank,groom:'Nama Contoh',groomParents:'Tuan Rumah',eventDate:'2027-12-25',venue:'Tempat Contoh',address:'Alamat Contoh'};
 const doc=editableDocument(content,t.slug);
 assert.equal(doc.content.events?.[0].label,fieldsForCategory(t.category).event);
 assert.deepEqual(parseDocument(doc,owner).content,doc.content);
 assert.deepEqual(readBackup(createBackup(doc,owner),owner),doc);
 assert.deepEqual(readyToPublish(doc.content,t.category),[]);
 assert.ok(completion(doc.content,t.category).filter(c=>c.required).every(c=>c.done));
 assert.equal(readyToPublish({...doc.content,groom:''},t.category).length,1);
 assert.throws(()=>parseDocument({...doc,content:{...doc.content,bride:'Hidden spouse'}},owner),/Kategori/);
 assert.throws(()=>parseDocument({...doc,content:{...doc.content,brideParents:'Hidden family'}},owner),/Kategori/);
 assert.ok(readyToPublish({...doc.content,address:'',events:undefined},t.category).length);
});
test('wedding validation still requires both names and uses the legacy event default',()=>{
 const doc=editableDocument({...blankContentForTheme('elegant-rose'),groom:'Ahmad',eventDate:'2027-12-25',venue:'Place',address:'Address'},'elegant-rose');
 assert.equal(doc.content.events?.[0].label,'Akad & resepsi');
 assert.deepEqual(readyToPublish(doc.content),['Lengkapi nama kedua mempelai.']);
 assert.equal(completion(doc.content)[0].done,false);
});
