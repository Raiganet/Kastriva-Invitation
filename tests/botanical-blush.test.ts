import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {parseCmsDocument,parseCmsCatalog,restoreCmsDocument} from '../lib/cms.ts';
import {parseDocument,createBackup,readBackup} from '../lib/editor-document.ts';
import {parseCheckout,parsePublicInvitation} from '../lib/commerce.ts';
import {blankContent} from '../lib/domain.ts';
const read=(file:string)=>readFileSync(new URL('../'+file,import.meta.url),'utf8');
const themes=JSON.parse(read('data/templates.json'));
const current=()=>parseCmsDocument({version:1,content:JSON.parse(read('data/cms-defaults.json')),catalog:themes.map(({slug,name,description,price,active}:Record<string,unknown>)=>({slug,name,description,price,active}))});
const owner='00000000-0000-4000-8000-000000000001',theme='botanical-blush';

test('Every historical catalog generation restores the missing botanical price from the live catalog',()=>{
 for(const length of [8,13,14]){
  const old={...current(),catalog:current().catalog.slice(0,length)};old.content.heroTitle='Teks dari riwayat';old.catalog[0].price=160000;
  const live=current();live.catalog[14].price=210000;live.catalog[14].active=false;
  const restored=restoreCmsDocument(old,live.catalog);
  assert.equal(restored.catalog.length,15);assert.equal(restored.catalog[14].price,210000);assert.equal(restored.catalog[14].active,false);assert.equal(restored.catalog[0].price,160000);assert.equal(restored.content.heroTitle,'Teks dari riwayat');
 }
 assert.throws(()=>parseCmsCatalog(current().catalog.slice(1))); // Invalid fourteen-row subset.
 assert.equal(parseCmsCatalog([current().catalog[14]],false).length,1);
});
test('Botanical invitations retain maps, music and gift details through backup and publication parsing',()=>{
 const content={...blankContent,groom:'Nama Pria',bride:'Nama Wanita',eventDate:'2026-12-25',eventTime:'09:00',endTime:'12:00',venue:'Tempat contoh',address:'Alamat contoh',mapUrl:'https://maps.app.goo.gl/example',music:'serenade' as const,gifts:[{bank:'Bank Contoh',account:'0000000000',holder:'Nama Contoh'}]};
 const doc=parseDocument({theme,content},owner);const backup=readBackup(createBackup(doc,owner),owner);assert.equal(backup.theme,theme);assert.equal(backup.content.events?.[0].mapUrl,content.mapUrl);assert.deepEqual(backup.content.gifts,content.gifts);
 assert.equal(parseCheckout({invitation_id:owner,draft_revision:1,theme,quoted_price:200000,quoted_days:365,settings_revision:1,customer_name:'Nama Contoh',customer_phone:'6281234567890',request_id:owner}).theme,theme);
 const pub=parsePublicInvitation({slug:'contoh-botanical',theme_slug:theme,content,photo_count:0,revision:1,expires_at:'2027-12-25T00:00:00Z'});assert.equal(pub.theme_slug,theme);assert.equal(pub.content.music,'serenade');
});
test('Selected ornament is a reproducible small WebP with recorded provenance',()=>{
 const manifest=JSON.parse(read('data/imported/botanical-blush-assets.json'));
 const data=readFileSync(new URL('../public'+manifest.output,import.meta.url));
 assert.equal(data.subarray(0,4).toString(),'RIFF');assert.equal(data.subarray(8,12).toString(),'WEBP');assert.equal(createHash('sha256').update(data).digest('hex'),manifest.outputSha256);assert.equal(data.length,manifest.outputBytes);assert.ok(data.length<100000);assert.ok(data.length<manifest.sourceBytes);
});
test('Migration 011 preserves existing generations, privileges and customer records',()=>{
 const sql=read('supabase/migrations/011_botanical_blush.sql');assert.match(sql,/not in \(8,13,14,15\)/);assert.match(sql,/jsonb_array_length\(d->'catalog'\)=14/);assert.match(sql,/on conflict\(slug\) do nothing/);assert.match(sql,/History compatibility failed/);
 assert.equal((sql.match(/insert into public\.ki_templates\(/g)||[]).length,1);assert.doesNotMatch(sql,/^\s*(grant|revoke|drop|truncate|alter table)/im);assert.doesNotMatch(sql,/update public\.(ki_sales|ki_invitations|ki_publications|ki_commerce_settings|ki_guest_platform)\b/i);
});
