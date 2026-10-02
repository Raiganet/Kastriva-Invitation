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
    <span className="timeline-dot elegant-story-dot" aria-hidden="true">â™¥</span>
    <article className="elegant-story-card">
     {photo?<div className="elegant-story-photo"><img src={photo} alt="" loading="lazy" referrerPolicy="no-referrer"/><span aria-hidden="true"/></div>:<div className="elegant-story-placeholder" aria-hidden="true"><span>â™¥</span></div>}
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