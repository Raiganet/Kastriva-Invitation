import {storyChapters} from '@/lib/invitation-extras';

export default function InvitationStory({story,cinematic}:{story:string;cinematic:boolean}) {
 if(!cinematic)return <p className="story-text">{story}</p>;
 return <ol className="inv-timeline">{storyChapters(story).map((chapter,i)=><li key={i}><span className="timeline-dot" aria-hidden="true"/><span className="timeline-year">{chapter.label}</span><p>{chapter.text}</p></li>)}</ol>;
}
