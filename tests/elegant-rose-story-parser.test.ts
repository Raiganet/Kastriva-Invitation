import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {elegantStoryChapters} from '../lib/invitation-extras.ts';

test('Elegant Rose groups Markdown headings without rendering hash markers',()=>{
 const chapters=elegantStoryChapters(`## Kisah Kami

### Awal Pertemuan
Berawal dari pertemuan sederhana.
Kami mulai saling mengenal.

### Menetapkan Langkah
Dengan restu keluarga, kami memilih melangkah bersama.`);

 assert.equal(chapters.length,2);
 assert.deepEqual(chapters.map(chapter=>chapter.title),['Awal Pertemuan','Menetapkan Langkah']);
 assert.deepEqual(chapters.map(chapter=>chapter.label),['01','02']);
 assert.ok(chapters.every(chapter=>!chapter.title.includes('#')));
 assert.match(chapters[0].body,/Berawal dari pertemuan sederhana/);
});

test('Elegant Rose preserves explicit years from Markdown headings',()=>{
 const chapters=elegantStoryChapters(`### 2022 â€” Pertemuan pertama
Berawal dari sebuah pertemuan.

### 2026 - Hari yang dinanti
Kami membagikan kebahagiaan bersama.`);

 assert.deepEqual(chapters.map(chapter=>chapter.label),['2022','2026']);
 assert.deepEqual(chapters.map(chapter=>chapter.title),['Pertemuan pertama','Hari yang dinanti']);
});

test('Elegant Rose remains compatible with existing plain-text year chapters',()=>{
 const chapters=elegantStoryChapters(`2022 â€” Pertemuan pertama
Berawal dari pertemuan sederhana.

2025 â€” Menetapkan langkah
Dengan restu keluarga, kami melangkah bersama.`);

 assert.equal(chapters.length,2);
 assert.deepEqual(chapters.map(chapter=>chapter.label),['2022','2025']);
 assert.deepEqual(chapters.map(chapter=>chapter.title),['Pertemuan pertama','Menetapkan langkah']);
});

test('Elegant Rose story photos are consumed once and then fall back to floral placeholders',()=>{
 const source=readFileSync(new URL('../components/InvitationStory.tsx',import.meta.url),'utf8');
 assert.ok(source.includes('elegantStoryChapters(story)'));
 assert.ok(source.includes('const photo=storyPhotos[i]'));
 assert.ok(!source.includes('%photos.length'));
 assert.ok(source.includes('elegant-story-placeholder'));
});