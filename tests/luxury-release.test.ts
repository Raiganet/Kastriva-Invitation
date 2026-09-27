import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseCmsDocument,parseCmsCatalog,restoreCmsDocument} from '../lib/cms.ts';
import {parseDocument,createBackup,readBackup} from '../lib/editor-document.ts';
import {parsePublicInvitation,parseCheckout,readyToPublish} from '../lib/commerce.ts';
import {blankContent} from '../lib/domain.ts';
import {WEDDING_THEME_SLUGS} from '../lib/theme-registry.ts';
const read=(file:string)=>readFileSync(new URL('../'+file,import.meta.url),'utf8');
const catalog=JSON.parse(read('data/templates.json')).map(({slug,name,description,price,active}:Record<string,unknown>)=>({slug,name,description,price,active}));
const current=()=>parseCmsDocument({version:1,content:JSON.parse(read('data/cms-defaults.json')),catalog});
const owner='00000000-0000-4000-8000-000000000001',theme='elementor-luxury-1';
test('Legacy CMS generations restore missing luxury metadata using current live price and availability',()=>{
 for(const length of [8,13]){
  const backup={...current(),catalog:current().catalog.slice(0,length)};
  backup.content.heroTitle='Judul dalam backup';backup.catalog[0].price=155000;
  const live=current();live.catalog[13].price=215000;live.catalog[13].active=false;
  const restored=restoreCmsDocument(backup,live.catalog);
  assert.equal(restored.catalog.length,15);assert.equal(restored.catalog[13].price,215000);assert.equal(restored.catalog[13].active,false);assert.equal(restored.catalog[0].price,155000);assert.equal(restored.content.heroTitle,backup.content.heroTitle);
  assert.equal(backup.catalog.length,length);assert.deepEqual(parseCmsCatalog([...backup.catalog].reverse()),[...backup.catalog].reverse());
 }
});
test('A thirteen-item catalog containing Luxury but missing a prior theme is not a historical backup',()=>{
 assert.throws(()=>parseCmsCatalog(current().catalog.slice(1,14)));
 assert.throws(()=>parseCmsCatalog([...current().catalog.slice(0,7),current().catalog[13]]));
 assert.equal(parseCmsCatalog([current().catalog[13]],false).length,1);
});
test('Luxury customer content survives draft backups, checkout parsing and public snapshot validation',()=>{
 const content={...blankContent,groom:'Adam',bride:'Hawa',eventDate:'2026-12-25',eventTime:'08:00',endTime:'12:00',venue:'Tempat contoh',address:'Alamat lengkap contoh',mapUrl:'https://maps.app.goo.gl/example',music:'serenade' as const,gifts:[{bank:'Bank Contoh',account:'0000000000',holder:'Nama Contoh'}]};
 const doc=parseDocument({theme,content},owner);assert.ok(WEDDING_THEME_SLUGS.includes(theme));const restored=readBackup(createBackup(doc,owner),owner).content;const {events,...base}=restored;assert.deepEqual(base,content);assert.equal(events?.[0].mapUrl,content.mapUrl);assert.deepEqual(readyToPublish(content),[]);
 const checkout=parseCheckout({invitation_id:owner,draft_revision:1,theme,quoted_price:200000,quoted_days:365,settings_revision:1,customer_name:'Nama Contoh',customer_phone:'6281234567890',request_id:owner});assert.equal(checkout.quoted_price,200000);assert.equal(checkout.theme,theme);
 const pub=parsePublicInvitation({slug:'contoh-luxury',theme_slug:theme,content,photo_count:0,revision:1,expires_at:'2027-12-25T00:00:00Z'});assert.equal(pub.theme_slug,theme);assert.equal(pub.content.mapUrl,content.mapUrl);assert.equal(pub.content.music,'serenade');
});
test('010 is an additive catalog migration preserving access controls, data and old history',()=>{
 const sql=read('supabase/migrations/010_luxury_emerald.sql');
 assert.match(sql,/not in \(8,13,14\)/);assert.match(sql,/jsonb_array_length\(d->'catalog'\)=13/);assert.match(sql,/on conflict\(slug\) do nothing/);
 assert.match(sql,/jsonb_array_length\(live_catalog\)/);assert.match(sql,/ki_has_confirmed_email\(\)/);assert.match(sql,/History compatibility failed/);
 assert.equal((sql.match(/insert into public\.ki_templates\(/g)||[]).length,1);
 assert.doesNotMatch(sql,/^\s*(grant|revoke|drop|truncate|alter table)/im);
 assert.doesNotMatch(sql,/update public\.(ki_sales|ki_invitations|ki_publications|ki_commerce_settings|ki_guest_platform)\b/i);
 assert.match(read('app/layout.tsx'),/import '.\/invitation-elementor.css'/);
});
