import test from 'node:test';
import assert from 'node:assert/strict';
import {WEDDING_THEME_SLUGS,ALL_THEME_SLUGS} from '../lib/theme-registry.ts';
import {weddingMusic,resolveThemeMusic,WEDDING_MUSIC} from '../lib/theme-music.ts';
import {HERITAGE_MUSIC_TRACKS,isInvitationMusic,isSynthMusicTrack} from '../lib/music-library.ts';
import {blankContentForTheme,parseDocument,createBackup,readBackup} from '../lib/editor-document.ts';
import {demoMusic} from '../lib/invitation-demo.ts';
import {HERITAGE_ARRANGEMENTS} from '../lib/heritage-audio.ts';
import {parsePublicInvitation} from '../lib/commerce.ts';

const owner='00000000-0000-4000-8000-000000000001';
test('all wedding demos and new drafts share a resolvable instrumental pairing',()=>{
 assert.deepEqual(Object.keys(WEDDING_MUSIC).sort(),[...WEDDING_THEME_SLUGS].sort());
 for(const theme of WEDDING_THEME_SLUGS){
  const draft=blankContentForTheme(theme);
  assert.equal(draft.music,'theme');assert.equal(draft.musicVolume,45);
  assert.equal(resolveThemeMusic(theme,draft.music),demoMusic(theme));
  assert.ok(isSynthMusicTrack(demoMusic(theme)));
 }
 for(const theme of ALL_THEME_SLUGS.filter(s=>!WEDDING_THEME_SLUGS.includes(s)))assert.equal(blankContentForTheme(theme).music,undefined);
});
test('automatic music follows theme changes without overriding manual, silent or legacy choices',()=>{
 assert.notEqual(resolveThemeMusic('adat-sunda','theme'),resolveThemeMusic('adat-jawa','theme'));
 for(const theme of WEDDING_THEME_SLUGS){
  assert.equal(resolveThemeMusic(theme,'none'),'none');
  assert.equal(resolveThemeMusic(theme,'wedding-01'),'wedding-01');
  assert.equal(resolveThemeMusic(theme,'moonlight'),'moonlight');
  assert.equal(resolveThemeMusic(theme,undefined),'none');
 }
 assert.equal(weddingMusic('constructor'),undefined);
});
test('new music choices persist through validation and backup without allowing arbitrary URLs',()=>{
 for(const music of ['theme',...HERITAGE_MUSIC_TRACKS.map(t=>t.id)] as const){
  const document={theme:'adat-sunda',content:{...blankContentForTheme('adat-sunda'),music}};
  assert.equal(parseDocument(document,owner).content.music,music);
  assert.equal(readBackup(createBackup(document,owner),owner).content.music,music);
  assert.equal(parsePublicInvitation({slug:'fixture-music',theme_slug:'adat-sunda',content:document.content,photo_count:0,revision:1,expires_at:'2027-12-25T00:00:00Z'}).content.music,music);
 }
 assert.equal(isInvitationMusic('https://example.com/song.mp3'),false);
});
test('heritage arrangements have distinct melodies and bounded pitches and tempo',()=>{
 const motifs=new Set<string>();
 for(const track of HERITAGE_MUSIC_TRACKS){
  const score=HERITAGE_ARRANGEMENTS[track.id];motifs.add(JSON.stringify(score.melody));
  assert.ok(score.bpm>=50&&score.bpm<=100);
  assert.equal(score.melody.length,32);
  assert.ok([...score.melody,...score.answer,...score.flute].every(n=>n===0||n>=36&&n<=96));
 }
 assert.equal(motifs.size,4);
});
