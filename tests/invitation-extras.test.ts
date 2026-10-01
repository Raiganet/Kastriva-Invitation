import {test} from 'node:test';
import assert from 'node:assert/strict';
import {blankContent,parseDraft} from '../lib/domain.ts';
import {MUSIC_TRACKS,ORIGINAL_MUSIC_TRACKS} from '../lib/music-library.ts';
import {completeGift,storyChapters} from '../lib/invitation-extras.ts';
import {readyToPublish,parsePublicInvitation} from '../lib/commerce.ts';
import {createBackup,readBackup} from '../lib/editor-document.ts';
const owner='00000000-0000-4000-8000-000000000001';
const gift={bank:'Contoh',account:'0012345678',holder:'Contoh'};
const content={...blankContent,groom:'A',bride:'B',venue:'Contoh',address:'Contoh',eventDate:'2027-12-25',music:'serenade' as const,musicVolume:75,gifts:[gift]};
test('old drafts retain their exact shape and optional extras survive backup and public projection',()=>{
 assert.deepEqual(parseDraft(blankContent,owner),blankContent);
 assert.equal(parseDraft(content,owner).gifts?.[0].account,'0012345678');
 const restored=readBackup(createBackup({theme:'galaxy-night',content},owner),owner);
 assert.equal(restored.content.music,'serenade');assert.deepEqual(restored.content.gifts,[gift]);
 const pub=parsePublicInvitation({slug:'example-wedding',theme_slug:'galaxy-night',content,photo_count:0,revision:1,expires_at:'2028-01-01T00:00:00Z'});
 assert.deepEqual(pub.content.gifts,[gift]);assert.equal(pub.content.music,'serenade');assert.equal(pub.content.musicVolume,75);
});
test('all configured music tracks are accepted; original collection remains eight',()=>{for(const track of MUSIC_TRACKS)assert.equal(parseDraft({...blankContent,music:track.id},owner).music,track.id);assert.equal(ORIGINAL_MUSIC_TRACKS.length,8);});
test('music volume is optional for legacy drafts and accepts only integer 0-100',()=>{assert.equal(parseDraft(blankContent,owner).musicVolume,undefined);for(const volume of [0,25,75,100])assert.equal(parseDraft({...blankContent,music:'serenade',musicVolume:volume},owner).musicVolume,volume);for(const volume of [-1,101,75.5,'75',null])assert.throws(()=>parseDraft({...blankContent,music:'serenade',musicVolume:volume},owner));});
test('rejects unknown music, malformed or over-limit gift accounts and unintended fields',()=>{
 for(const extras of [{music:'https://bad.invalid/a.mp3'},{music:'wedding-64'},{music:null},{gifts:null},{gifts:[{...gift,account:'1e10'}]},{gifts:[{...gift,account:12345}]},{gifts:Array(4).fill(gift)},{gifts:[{...gift,privateToken:'secret'}]},{gifts:[{...gift,bank:'x'.repeat(61)}]}])assert.throws(()=>parseDraft({...blankContent,...extras},owner));
});
test('partial accounts can be saved privately, but cannot be published or displayed',()=>{
 const partial={bank:'',account:'',holder:''};
 assert.deepEqual(parseDraft({...content,gifts:[partial]},owner).gifts,[partial]);
 assert.equal(completeGift(partial),false);assert.equal(completeGift(gift),true);
 assert.equal(readyToPublish(content).length,0);assert.match(readyToPublish({...content,gifts:[partial]}).join(' '),/rekening hadiah/);
});
test('timeline preserves supplied text and uses a year only when provided',()=>{
 assert.deepEqual(storyChapters('2024 — Bertemu\nDi kampus.\n\nSebuah babak baru.'),[{label:'2024',text:'Bertemu\nDi kampus.'},{label:'02',text:'Sebuah babak baru.'}]);
 assert.deepEqual(storyChapters('  '),[]);
});
