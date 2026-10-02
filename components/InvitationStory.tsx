import {storyChapters} from '@/lib/invitation-extras';

type StoryVariant='default'|'elegant-rose';

function splitChapter(text:string,index:number){
 const lines=text.split(/\n+/).map(line=>line.trim()).filter(Boolean);
 if(lines.length>1&&lines[0].length<=90)return {title:lines[0],body:lines.slice(1).join('\n')};
 return {title:`Bab ${String(index+1).padStart(2,'0')}`,body:text};
}

export default function InvitationStory({
 story,cinematic,variant='default',photos=[],
}:{story:string;cinematic:boolean;variant?:StoryVariant;photos?:string[]}) {
 if(variant==='elegant-rose'){
  const chapters=storyChapters(story);
  return <ol className="inv-timeline elegant-story-timeline">{chapters.map((chapter,i)=>{
   const copy=splitChapter(chapter.text,i),photo=photos.length?photos[i%photos.length]:undefined;
   return <li key={i}>
    <span className="timeline-dot elegant-story-dot" aria-hidden="true">♥</span>
    <article className="elegant-story-card">
     {photo?<div className="elegant-story-photo"><img src={photo} alt="" loading="lazy" referrerPolicy="no-referrer"/><span aria-hidden="true"/></div>:<div className="elegant-story-placeholder" aria-hidden="true"><span>♥</span></div>}
     <div className="elegant-story-copy">
      <span className="timeline-year">{chapter.label}</span>
      <h3>{copy.title}</h3>
      <p>{copy.body}</p>
     </div>
    </article>
   </li>;
  })}</ol>;
 }
 if(!cinematic)return <p className="story-text">{story}</p>;
 return <ol className="inv-timeline">{storyChapters(story).map((chapter,i)=><li key={i}><span className="timeline-dot" aria-hidden="true"/><span className="timeline-year">{chapter.label}</span><p>{chapter.text}</p></li>)}</ol>;
}
