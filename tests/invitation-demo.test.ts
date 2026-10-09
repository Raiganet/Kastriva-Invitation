import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,statSync} from 'node:fs';
import {demoPhotos,demoMusic,demoWishes} from '../lib/invitation-demo.ts';
import {ALL_THEME_SLUGS} from '../lib/theme-registry.ts';
import {isSynthMusicTrack} from '../lib/music-library.ts';

test('all 16 demo themes have an original music track',()=>{
 for(const slug of ALL_THEME_SLUGS)assert.ok(isSynthMusicTrack(demoMusic(slug)),slug);
});
test('demo photo sets are local, optimized and suitable for each event category',()=>{
 for(const category of ['pernikahan','ulang-tahun','aqiqah','acara-kantor']){
  const {coverUrl,photoUrls}=demoPhotos(category);
  assert.ok(photoUrls.length>=2);
  for(const url of [coverUrl,...photoUrls]){
   assert.match(url,/^\/images\/demo\/[a-z-]+\.webp$/);
   const file=new URL('../public'+url,import.meta.url);
   assert.ok(existsSync(file),url);assert.ok(statSync(file).size<220000,url);
  }
  const wishes=demoWishes(category);
  assert.equal(wishes.length,3);assert.ok(wishes.every(w=>w.name&&w.message));
 }
 const wedding=demoPhotos('pernikahan');
 assert.match(wedding.photoUrls[0],/groom/);assert.match(wedding.photoUrls[1],/bride/);
 assert.match(demoPhotos('aqiqah').coverUrl,/aqiqah/);
 assert.match(demoPhotos('acara-kantor').coverUrl,/corporate/);
});
