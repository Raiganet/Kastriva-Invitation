import ThemeMotif from './ThemeMotif';

export function invitationOpeningStyle(slug:string){
 if(['modern-minimalist','corporate-event'].includes(slug))return 'slide';
 if(['galaxy-night','aurora-modern'].includes(slug))return 'light';
 return 'album';
}

/** Decorative leaves stay behind the invitation and never take focus. */
export default function InvitationCoverPanels({slug}:{slug:string}){
 return <div className="inv-cover-panels" aria-hidden="true">
  {['start','end'].map(side=><span className="inv-cover-leaf" data-inv-door={side} key={side}>
   <span className="inv-cover-leaf-frame"/>
   <span className="inv-cover-leaf-motif"><ThemeMotif slug={slug}/></span>
  </span>)}
 </div>;
}
