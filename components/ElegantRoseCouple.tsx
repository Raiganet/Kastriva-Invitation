import type {DraftContent} from '@/lib/types';
import InvitationPhoto from './InvitationPhoto';

function Portrait({
  photo,name,parents,initial,side,
}:{photo?:string;name:string;parents:string;initial:string;side:'bride'|'groom'}){
 return <article className={`elegant-couple-person elegant-couple-${side}`} data-name-long={name.length>24}>
  <div className="elegant-portrait-frame">
   <span className="elegant-portrait-flower elegant-flower-top" aria-hidden="true"/>
   <span className="elegant-portrait-flower elegant-flower-bottom" aria-hidden="true"/>
   <InvitationPhoto src={photo} alt={`Foto ${name}`} initials={initial} className="elegant-portrait-image" loading="lazy"/>
  </div>
  <span className="person-label">{side==='bride'?'Mempelai wanita':'Mempelai pria'}</span><h3>{name}</h3>
  <p>{parents}</p>
 </article>;
}

export default function ElegantRoseCouple({
 content,photos=[],
}:{content:DraftContent;photos?:string[]}){
 const groom=content.groom||'Mempelai pria',bride=content.bride||'Mempelai wanita';
 // Existing drafts need no new fields: first two invitation photos become optional portraits.
 const groomPhoto=photos[0],bridePhoto=photos[1];
 return <div className="elegant-couple-stack">
  <Portrait photo={bridePhoto} name={bride} parents={content.brideParents} initial={bride.slice(0,1)||'S'} side="bride"/>
  <div className="elegant-couple-and" aria-hidden="true">&amp;</div>
  <Portrait photo={groomPhoto} name={groom} parents={content.groomParents} initial={groom.slice(0,1)||'A'} side="groom"/>
 </div>;
}
