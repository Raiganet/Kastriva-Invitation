import {elegantStoryChapters,storyChapters} from '@/lib/invitation-extras';

type StoryVariant='default'|'elegant-rose'|'modern-minimalist';

function modernCopy(text:string,index:number){
 const lines=text.split(/\n+/).map(line=>line.trim()).filter(Boolean);
 if(lines.length>1&&lines[0].length<=90)return {title:lines[0],body:lines.slice(1).join('\n')};
 return {title:`Chapter ${String(index+1).padStart(2,'0')}`,body:text};
}

export default function InvitationStory({
 story,cinematic,variant='default',photos=[],
}:{story:string;cinematic:boolean;variant?:StoryVariant;photos?:string[]}) {
 if(variant==='elegant-rose'){
  const chapters=elegantStoryChapters(story),storyPhotos=photos.filter(Boolean);
  return <ol className="inv-timeline elegant-story-timeline">{chapters.map((chapter,i)=>{
   const photo=storyPhotos[i];
   return <li key={i}>
    <span className="timeline-dot elegant-story-dot" aria-hidden="true">{'\u2665'}</span>
    <article className="elegant-story-card">
     {photo?<div className="elegant-story-photo"><img src={photo} alt="" loading="lazy" referrerPolicy="no-referrer"/><span aria-hidden="true"/></div>:<div className="elegant-story-placeholder" aria-hidden="true"><span>{'\u2665'}</span></div>}
     <div className="elegant-story-copy">
      <span className="timeline-year">{chapter.label}</span>
      <h3>{chapter.title}</h3>
      {chapter.body&&<p>{chapter.body}</p>}
     </div>
    </article>
   </li>;
  })}</ol>;
 }
 if(variant==='modern-minimalist'){
  const chapters=storyChapters(story),storyPhotos=photos.filter(Boolean);
  return <ol className="modern-story-list">{chapters.map((chapter,i)=>{
   const copy=modernCopy(chapter.text,i),photo=storyPhotos[i];
   return <li key={i}>
    <span className="modern-story-marker" aria-hidden="true">{chapter.label}</span>
    <article className="modern-story-card">
     {photo?<div className="modern-story-media"><img src={photo} alt="" loading="lazy" referrerPolicy="no-referrer"/></div>:<div className="modern-story-placeholder" aria-hidden="true"/>}
     <div className="modern-story-copy">
      <small>{chapter.label}</small>
      <h3>{copy.title}</h3>
      {copy.body&&<p>{copy.body}</p>}
     </div>
    </article>
   </li>;
  })}</ol>;
 }
 if(!cinematic)return <p className="story-text">{story}</p>;
 return <ol className="inv-timeline">{storyChapters(story).map((chapter,i)=><li key={i}><span className="timeline-dot" aria-hidden="true"/><span className="timeline-year">{chapter.label}</span><p>{chapter.text}</p></li>)}</ol>;
}