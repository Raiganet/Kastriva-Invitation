import type {GiftAccount} from './types.ts';

export function completeGift(gift:GiftAccount):boolean {
 return !!gift.bank.trim() && !!gift.holder.trim() && /^[0-9]{5,30}$/.test(gift.account);
}

/** Blank lines delimit chapters; a year is shown only when supplied by the author. */
export function storyChapters(story:string) {
 return story.trim().split(/\n\s*\n/).filter(Boolean).map((paragraph,index)=>{
  const match=/^(\d{4})\s*(?:[\u2014\u2013-]\s*|\n)([\s\S]+)$/.exec(paragraph.trim());
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
 *
 * Unicode punctuation is expressed with \u escapes in source so this file remains
 * ASCII-safe when patched from Windows PowerShell 5.1.
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

  const yearTitle=/^(\d{4})\s*(?:[\u2014\u2013-]|:|\|)\s*(.+)$/.exec(title);
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