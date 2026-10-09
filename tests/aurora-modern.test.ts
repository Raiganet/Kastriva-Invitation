import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ALL_THEME_SLUGS,WEDDING_THEME_SLUGS} from '../lib/theme-registry.ts';
import {MUSIC_TRACKS,MUSIC_TRACK_IDS,ORIGINAL_MUSIC_TRACKS,musicTrack} from '../lib/music-library.ts';
import {demoMusic} from '../lib/invitation-demo.ts';
import {blankContent,parseDraft} from '../lib/domain.ts';
const read=(p:string)=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const templates=JSON.parse(read('data/templates.json'));
const owner='00000000-0000-4000-8000-000000000001';
test('Aurora Luxe Motion is a premium wedding renderer with full registry identity',()=>{const theme=templates.find((x:{slug:string})=>x.slug==='aurora-modern');assert.ok(theme);assert.equal(theme.active,true);assert.equal(theme.category,'pernikahan');assert.equal(theme.price,250000);assert.ok(ALL_THEME_SLUGS.includes('aurora-modern'));assert.ok(WEDDING_THEME_SLUGS.includes('aurora-modern'));assert.equal(ALL_THEME_SLUGS.length,24);});
test('premium music library keeps eight original built-in choices and supports imported tracks plus none',()=>{
 assert.equal(ORIGINAL_MUSIC_TRACKS.length,8);
 assert.equal(MUSIC_TRACK_IDS.length,MUSIC_TRACKS.length+1);
 assert.equal(new Set(MUSIC_TRACKS.map(x=>x.id)).size,MUSIC_TRACKS.length);

 for(const track of MUSIC_TRACKS){
  assert.ok(track.name&&track.mood&&track.detail);
  assert.equal(parseDraft({...blankContent,music:track.id},owner).music,track.id);
  assert.equal(musicTrack(track.id)?.name,track.name);
 }

 assert.throws(()=>parseDraft({...blankContent,music:'https://example.invalid/song.mp3'},owner));
});
test('Aurora demo defaults to Starlight and premium artwork is wired to renderer',()=>{const view=read('components/InvitationView.tsx'),art=read('components/AuroraModernArtwork.tsx'),css=read('app/invitation-aurora.css');assert.equal(demoMusic('aurora-modern'),'starlight');assert.match(view,/mode="ambient"/);assert.match(view,/mode="portrait"/);for(const token of ['aurora-ambient','aurora-portrait-stage','ki-aurora-ribbon','prefers-reduced-motion'])assert.ok((art+css).includes(token),token);});
test('migration 016 installs Aurora and expands music validation without touching customer tables',()=>{const sql=read('supabase/migrations/016_aurora_premium_music.sql');for(const token of ['aurora-modern','starlight','cinematic-bloom','known_count=16','diagnostics_migration\',16'])assert.ok(sql.includes(token),token);assert.doesNotMatch(sql,/update public\.(ki_sales|ki_invitations|ki_publications|ki_guest_platform|ki_open_wishes)\b/i);assert.match(sql,/History compatibility failed/);});
