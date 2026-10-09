import Link from 'next/link';
import InvitationOrnaments,{InvitationDivider} from './InvitationOrnaments';
import ThemeMotif from './ThemeMotif';

export default function InvitationClosing({slug,names,date,eventDate,wedding,showThemeLink}:{slug:string;names:string;date:string;eventDate:string;wedding:boolean;showThemeLink:boolean}){
 return <section className="inv-closing inv-closing-finale">
  <InvitationOrnaments slug={slug}/>
  <div className="inv-closing-seal" aria-hidden="true"><ThemeMotif slug={slug}/></div>
  <p className="overline">{wedding?'DENGAN CINTA & RASA SYUKUR':'SAMPAI BERJUMPA'}</p>
  <p className="inv-closing-message">Merupakan kebahagiaan bagi kami<br/>apabila Anda berkenan hadir.</p>
  <h2>{names}</h2>
  <p className="inv-closing-date"><time dateTime={eventDate||undefined}>{date}</time></p>
  <InvitationDivider slug={slug}/>
  <small>Made with care · Kastriva Invitation</small>
  {showThemeLink&&<div className="inv-closing-action"><Link className="inv-button" href={`/order/${slug}`}>Gunakan tema ini ↗</Link></div>}
 </section>;
}
