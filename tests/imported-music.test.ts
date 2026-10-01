import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {IMPORTED_MUSIC_TRACKS} from '../lib/imported-music.generated.ts';
import {MUSIC_TRACKS,ORIGINAL_MUSIC_TRACKS,isInvitationMusic} from '../lib/music-library.ts';

const allowed=new Set([
 ...Array.from({length:63},(_,i)=>`wedding-${String(i+1).padStart(2,'0')}`),
 'aqiqah-01','aqiqah-02',
]);
test('original Kastriva music remains exactly eight tracks',()=>assert.equal(ORIGINAL_MUSIC_TRACKS.length,8));
test('generated imported catalog has only approved stable IDs and unique tracks',()=>{
 const ids=new Set<string>();
 for(const track of IMPORTED_MUSIC_TRACKS){
  assert.ok(allowed.has(track.id),track.id);assert.ok(!ids.has(track.id),track.id);ids.add(track.id);
  assert.equal(track.kind,'file');assert.ok(track.name.trim());assert.ok(track.artist.trim());
  assert.ok(['wedding','aqiqah'].includes(track.group));assert.match(track.src,/^\/music\/imported\/(?:wedding-\d{2}|aqiqah-\d{2})\.mp3$/);
  const disk=fileURLToPath(new URL('../public'+track.src,import.meta.url));assert.ok(existsSync(disk),disk);
 }
 assert.ok(IMPORTED_MUSIC_TRACKS.length<=65);
});
test('all catalog IDs validate locally while arbitrary URLs remain rejected',()=>{
 for(const track of MUSIC_TRACKS)assert.equal(isInvitationMusic(track.id),true);
 assert.equal(isInvitationMusic('https://example.com/a.mp3'),false);
 assert.equal(isInvitationMusic('wedding-64'),false);
});
