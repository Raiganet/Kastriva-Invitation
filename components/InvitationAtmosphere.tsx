import ThemeMotif from './ThemeMotif';

/** Theme-colored decoration; never captures gestures or conveys information. */
export default function InvitationAtmosphere({slug}:{slug:string}){
 return <div className="inv-atmosphere" aria-hidden="true"><div className="inv-orbit"/><span className="inv-sprig sprig-left"><ThemeMotif slug={slug}/></span><span className="inv-sprig sprig-right"><ThemeMotif slug={slug}/></span><span className="inv-glint glint-one"/><span className="inv-glint glint-two"/><span className="inv-glint glint-three"/></div>;
}
