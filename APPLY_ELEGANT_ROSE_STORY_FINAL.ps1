$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$storyPath = Join-Path $root 'components\InvitationStory.tsx'
$extrasPath = Join-Path $root 'lib\invitation-extras.ts'
$testPath = Join-Path $root 'tests\elegant-rose-story-parser.test.ts'

if (-not (Test-Path -LiteralPath $storyPath)) { throw "Tidak menemukan components/InvitationStory.tsx. Jalankan dari root Kastriva-Invitation." }
if (-not (Test-Path -LiteralPath $extrasPath)) { throw "Tidak menemukan lib/invitation-extras.ts." }

$storyCurrent = [System.IO.File]::ReadAllText($storyPath)
$extrasCurrent = [System.IO.File]::ReadAllText($extrasPath)

if ($storyCurrent.Contains('const photo=storyPhotos[i]') -and $extrasCurrent.Contains('export function elegantStoryChapters')) {
  Write-Host 'Patch story Elegant Rose sudah terpasang.' -ForegroundColor Yellow
  exit 0
}

if (-not $storyCurrent.Contains('photos[i%photos.length]')) {
  throw "Struktur InvitationStory.tsx berbeda dari versi yang diharapkan. Hentikan agar perubahan lokal tidak tertimpa."
}

if (-not $extrasCurrent.Contains('export function storyChapters')) {
  throw "Struktur invitation-extras.ts berbeda dari versi yang diharapkan."
}

$story = @'
import {elegantStoryChapters,storyChapters} from '@/lib/invitation-extras';

type StoryVariant='default'|'elegant-rose';

export default function InvitationStory({
 story,cinematic,variant='default',photos=[],
}:{story:string;cinematic:boolean;variant?:StoryVariant;photos?:string[]}) {
 if(variant==='elegant-rose'){
  const chapters=elegantStoryChapters(story),storyPhotos=photos.filter(Boolean);
  return <ol className="inv-timeline elegant-story-timeline">{chapters.map((chapter,i)=>{
   const photo=storyPhotos[i];
   return <li key={i}>
    <span className="timeline-dot elegant-story-dot" aria-hidden="true">♥</span>
    <article className="elegant-story-card">
     {photo?<div className="elegant-story-photo"><img src={photo} alt="" loading="lazy" referrerPolicy="no-referrer"/><span aria-hidden="true"/></div>:<div className="elegant-story-placeholder" aria-hidden="true"><span>♥</span></div>}
     <div className="elegant-story-copy">
      <span className="timeline-year">{chapter.label}</span>
      <h3>{chapter.title}</h3>
      {chapter.body&&<p>{chapter.body}</p>}
     </div>
    </article>
   </li>;
  })}</ol>;
 }
 if(!cinematic)return <p className="story-text">{story}</p>;
 return <ol className="inv-timeline">{storyChapters(story).map((chapter,i)=><li key={i}><span className="timeline-dot" aria-hidden="true"/><span className="timeline-year">{chapter.label}</span><p>{chapter.text}</p></li>)}</ol>;
}
'@

$extras = @'
import type {GiftAccount} from './types.ts';

export function completeGift(gift:GiftAccount):boolean {
 return !!gift.bank.trim() && !!gift.holder.trim() && /^[0-9]{5,30}$/.test(gift.account);
}

/** Blank lines delimit chapters; a year is shown only when supplied by the author. */
export function storyChapters(story:string) {
 return story.trim().split(/\n\s*\n/).filter(Boolean).map((paragraph,index)=>{
  const match=/^(\d{4})\s*(?:[—–-]\s*|\n)([\s\S]+)$/.exec(paragraph.trim());
  return {label:match?.[1]||String(index+1).padStart(2,'0'),text:match?.[2]||paragraph.trim()};
 });
}

export type ElegantStoryChapter={label:string;title:string;body:string};

function cleanMarkdownHeading(value:string) {
 return value.trim()
  .replace(/^#{1,6}\s+/, '')
  .replace(/\s+#{1,6}\s*$/, '')
  .replace(/^(?:\*\*|__)([\s\S]*?)(?:\*\*|__)$/, '$1')
  .trim();
}

function compactBody(lines:string[]) {
 return lines.join('\n').replace(/[ \t]+$/gm,'').replace(/\n{3,}/g,'\n\n').trim();
}

function plainElegantChapters(story:string):ElegantStoryChapter[] {
 return storyChapters(story).map((chapter,index)=>{
  const lines=chapter.text.split(/\n+/).map(line=>line.trim()).filter(Boolean);
  const first=cleanMarkdownHeading(lines[0]||'');
  const hasTitle=lines.length>1&&first.length>0&&first.length<=90;
  return {
   label:chapter.label,
   title:hasTitle?first:`Bab ${String(index+1).padStart(2,'0')}`,
   body:hasTitle?lines.slice(1).join('\n'):chapter.text.trim(),
  };
 });
}

/**
 * Elegant Rose accepts normal plain-text stories and Markdown-style headings.
 * A top-level heading such as "## Kisah Kami" is treated as a section label,
 * not as its own timeline chapter. Heading markers are never rendered to guests.
 */
export function elegantStoryChapters(story:string):ElegantStoryChapter[] {
 const source=story.replace(/\r\n?/g,'\n').trim();
 if(!source)return [];

 const lines=source.split('\n');
 const hasMarkdownHeading=lines.some(line=>/^#{1,6}\s+\S/.test(line.trim()));
 if(!hasMarkdownHeading)return plainElegantChapters(source);

 type Section={heading:string;body:string[]};
 const sections:Section[]=[];
 const prelude:string[]=[];
 let current:Section|undefined;

 const flush=()=>{
  if(current&&(current.heading||current.body.some(line=>line.trim())))sections.push(current);
  current=undefined;
 };

 for(const line of lines){
  const trimmed=line.trim();
  const heading=/^#{1,6}\s+(.+?)\s*#*\s*$/.exec(trimmed);
  if(heading){
   flush();
   current={heading:cleanMarkdownHeading(heading[1]),body:[]};
  }else if(current){
   current.body.push(line);
  }else if(trimmed){
   prelude.push(line);
  }
 }
 flush();
 if(prelude.length)sections.unshift({heading:'',body:prelude});

 const genericHeading=/^(?:(?:kisah|cerita|perjalanan)\s+(?:kami|kita)|our\s+(?:story|journey)|love\s+story)$/i;
 const result:ElegantStoryChapter[]=[];
 let pendingIntro='';

 for(const section of sections){
  const heading=cleanMarkdownHeading(section.heading);
  let body=compactBody(section.body);

  if(heading&&genericHeading.test(heading)){
   if(body)pendingIntro=[pendingIntro,body].filter(Boolean).join('\n\n');
   continue;
  }

  if(pendingIntro){
   body=[pendingIntro,body].filter(Boolean).join('\n\n');
   pendingIntro='';
  }

  const displayIndex=result.length;
  let label=String(displayIndex+1).padStart(2,'0');
  let title=heading||`Bab ${String(displayIndex+1).padStart(2,'0')}`;

  const yearTitle=/^(\d{4})\s*(?:[—–-]\s*|[:|]\s*)(.+)$/.exec(title);
  if(yearTitle){
   label=yearTitle[1];
   title=cleanMarkdownHeading(yearTitle[2]);
  }else if(/^\d{4}$/.test(title)){
   label=title;
   const bodyLines=body.split(/\n+/).map(line=>line.trim()).filter(Boolean);
   if(bodyLines.length){
    title=cleanMarkdownHeading(bodyLines[0]);
    body=bodyLines.slice(1).join('\n');
   }else{
    title=`Bab ${String(displayIndex+1).padStart(2,'0')}`;
   }
  }

  result.push({label,title:cleanMarkdownHeading(title),body});
 }

 if(pendingIntro){
  if(result.length)result[0]={...result[0],body:[pendingIntro,result[0].body].filter(Boolean).join('\n\n')};
  else result.push({label:'01',title:'Cerita kami',body:pendingIntro});
 }

 return result;
}
'@

$test = @'
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
 const chapters=elegantStoryChapters(`### 2022 — Pertemuan pertama
Berawal dari sebuah pertemuan.

### 2026 - Hari yang dinanti
Kami membagikan kebahagiaan bersama.`);

 assert.deepEqual(chapters.map(chapter=>chapter.label),['2022','2026']);
 assert.deepEqual(chapters.map(chapter=>chapter.title),['Pertemuan pertama','Hari yang dinanti']);
});

test('Elegant Rose remains compatible with existing plain-text year chapters',()=>{
 const chapters=elegantStoryChapters(`2022 — Pertemuan pertama
Berawal dari pertemuan sederhana.

2025 — Menetapkan langkah
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
'@

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($storyPath,$story,$utf8NoBom)
[System.IO.File]::WriteAllText($extrasPath,$extras,$utf8NoBom)
[System.IO.File]::WriteAllText($testPath,$test,$utf8NoBom)

Write-Host ''
Write-Host 'OK - Elegant Rose story final patch berhasil diterapkan.' -ForegroundColor Green
Write-Host 'Markdown heading dibersihkan dan foto story tidak lagi diulang.' -ForegroundColor Cyan
Write-Host 'Lanjutkan: npm test ; npm run typecheck ; npm run build' -ForegroundColor Yellow
