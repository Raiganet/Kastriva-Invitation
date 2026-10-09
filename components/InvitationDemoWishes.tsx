import {demoWishes} from '@/lib/invitation-demo';
import InvitationOrnaments,{InvitationDivider} from './InvitationOrnaments';

export default function InvitationDemoWishes({id,slug,category}:{id:string;slug:string;category:string}){
 return <section id={id} className="inv-section inv-demo-wishes" data-inv-section tabIndex={-1}>
  <InvitationOrnaments slug={slug} section/>
  <p className="overline">WITH LOVE & BEST WISHES</p><h2>Ucapan & doa</h2><InvitationDivider slug={slug}/>
  <p className="inv-caption">Ucapan ilustrasi untuk mencoba tema.</p>
  <div className="inv-demo-wish-list">{demoWishes(category).map(wish=><article className="wish-card" data-demo-wish key={wish.name}>
   <header><span className="inv-wish-avatar" aria-hidden="true">{wish.name.slice(0,1)}</span><div><strong>{wish.name}</strong><small>Contoh ucapan</small></div><span className="inv-wish-heart" aria-hidden="true">♡</span></header>
   <p>{wish.message}</p>
  </article>)}</div>
 </section>;
}
