import Link from 'next/link';
import PhoneFrame from './PhoneFrame';
import type {Template} from '@/lib/types';
import {categories} from '@/lib/templates';
import {currency} from '@/lib/domain';

export default function InvitationPhoneDemo({template,guest}:{template:Template;guest:string}){
 const query=new URLSearchParams({view:'screen',to:guest});
 const fullQuery=new URLSearchParams({view:'full',to:guest});
 return <main className={`demo-phone-layout theme-${template.slug}`}>
  <nav className="demo-mobile-toolbar" aria-label="Navigasi demo"><Link href="/tema">← Koleksi tema</Link><span>DEMO</span><Link href={`/order/${template.slug}`}>Pilih tema ↗</Link></nav>
  <div className="demo-phone-copy">
   <Link className="demo-back-link" href="/tema">← Kembali ke koleksi</Link>
   <span className="demo-phone-brand">KASTRIVA <span>INVITATION</span></span>
   <p className="eyebrow">{categories[template.category]} · PREVIEW MOBILE</p>
   <h1>{template.name}</h1>
   <p className="demo-phone-description">{template.description}</p>
   <div className="demo-phone-instruction"><span aria-hidden="true">↕</span><p>Ketuk <strong>Buka undangan</strong>, lalu nikmati cerita, animasi, dan musiknya. Anda juga bisa menggulir layar sendiri.</p></div>
   <div className="demo-phone-purchase"><strong>{currency(template.price)}</strong><Link className="button" href={`/order/${template.slug}`}>Pilih tema ↗</Link></div>
   <Link className="demo-fullscreen-link" href={`/demo/${template.slug}?${fullQuery}`}>Lihat tanpa bingkai ↗</Link>
   <small className="demo-phone-note">Data dan foto pada demo merupakan contoh.</small>
  </div>
  <div className="demo-phone-device-area"><PhoneFrame className="phone-frame-interactive"><iframe className="demo-device-content" src={`/demo/${template.slug}?${query}`} title={`Demo mobile ${template.name}`} allow="autoplay; fullscreen"/></PhoneFrame></div>
 </main>;
}
