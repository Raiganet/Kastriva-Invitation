import {elegantStoryChapters} from '@/lib/invitation-extras';

type StoryVariant='default'|'elegant-rose'|'modern-minimalist';

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
  const chapters=elegantStoryChapters(story),storyPhotos=photos.filter(Boolean);
  return <ol className="modern-story-list">{chapters.map((chapter,i)=>{
   const photo=storyPhotos[i];
   return <li key={i}>
    <span className="modern-story-marker" aria-hidden="true">{chapter.label}</span>
    <article className="modern-story-card">
     {photo&&<div className="modern-story-media"><img src={photo} alt="" loading="lazy" referrerPolicy="no-referrer"/></div>}
     <div className="modern-story-copy">
      <small>{chapter.label}</small>
      <h3>{chapter.title}</h3>
      {chapter.body&&<p>{chapter.body}</p>}
     </div>
    </article>
   </li>;
  })}</ol>;
 }
 return <ol className={`inv-story-timeline${cinematic?' inv-story-cinematic':''}`}>
  {elegantStoryChapters(story).map((chapter,i)=><li key={i}>
   <span className="inv-story-marker" aria-hidden="true">{String(i+1).padStart(2,'0')}</span>
   <article className="inv-story-card">
    {photos[i]&&<div className="inv-story-photo"><img src={photos[i]} alt="" loading="lazy" referrerPolicy="no-referrer"/></div>}
    <div className="inv-story-copy"><span className="timeline-year">{chapter.label}</span><h3>{chapter.title}</h3>{chapter.body&&<p>{chapter.body}</p>}</div>
   </article>
  </li>)}
 </ol>;
}
