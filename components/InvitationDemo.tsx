import Link from 'next/link';
import type {CSSProperties} from 'react';
import InvitationDemoStage from './InvitationDemoStage';
import ThemeMotif from './ThemeMotif';
import type {Template} from '@/lib/types';
import {categories,demoContent} from '@/lib/templates';
import {demoPhotos} from '@/lib/invitation-demo';
import {currency,eventDateLabel} from '@/lib/domain';

const centeredThemes=new Set(['elegant-rose','tropical-paradise','galaxy-night','islami-sakinah','botanical-blush','seraphine-garden','sweet-birthday','peach-confetti','jubilee-carousel','aqiqah-blessing','little-moon','nur-eden']);

export default function InvitationDemo({template,guest}:{template:Template;guest:string}){
 const query=new URLSearchParams({view:'screen',to:guest});
 const fullQuery=new URLSearchParams({view:'full',to:guest});
 const content=demoContent(template),photo=demoPhotos(template.category,template.slug).coverUrl;
 const wedding=template.category==='pernikahan';
 const names=wedding?`${content.groom} & ${content.bride}`:content.groom;
 return <InvitationDemoStage key={template.slug} slug={template.slug} title={template.name} src={`/demo/${template.slug}?${query}`} initialLayout={centeredThemes.has(template.slug)?'center':'split'}
  identity={<><Link href="/tema" className="demo-collection-link" aria-label="Kembali ke koleksi tema"><span aria-hidden="true">←</span><span>Koleksi</span></Link><div className="demo-preview-title"><span>{categories[template.category]} <i>· DEMO</i></span><h1>{template.name}</h1></div></>}
  actions={<><Link className="demo-fullscreen-link" href={`/demo/${template.slug}?${fullQuery}`}>Buka langsung ↗</Link><span className="demo-preview-price">{currency(template.price)}</span><Link className="button" href={`/order/${template.slug}`}>Pilih tema ↗</Link></>}
  mobileNavigation={<nav className="demo-mobile-toolbar" aria-label="Navigasi demo"><Link href="/tema">← Koleksi tema</Link><span>DEMO</span><Link href={`/order/${template.slug}`}>Pilih tema ↗</Link></nav>}
 >
  <aside className="demo-desktop-hero" aria-label={`Ilustrasi ${names}`} style={{'--demo-photo':`url("${photo}")`} as CSSProperties}>
   <div className="demo-photo-backdrop" aria-hidden="true"/>
   <img className="demo-hero-photo" src={photo} alt={`Ilustrasi ${wedding?'pasangan':'acara'} ${names}`} fetchPriority="high"/>
   <div className="demo-hero-shade" aria-hidden="true"/>
   <div className="demo-hero-border" aria-hidden="true"/>
   <span className="demo-hero-brand">KASTRIVA <span>INVITATION</span></span>
   <div className="demo-hero-copy"><p>{wedding?'THE WEDDING OF':categories[template.category].toUpperCase()}</p><h2><span>{content.groom}</span>{wedding&&<><i>&</i><span>{content.bride}</span></>}</h2><div className="demo-hero-rule"/><time dateTime={content.eventDate}>{eventDateLabel(content.eventDate)}</time><p className="demo-hero-caption">{wedding?'Sebuah kisah, satu perjalanan.':'Momen istimewa, kenangan selamanya.'}</p></div>
   <span className="demo-hero-footnote">{template.name} <span>DATA & FOTO CONTOH</span></span>
   <div className="demo-center-motif demo-center-motif-start" aria-hidden="true"><ThemeMotif slug={template.slug}/></div>
   <div className="demo-center-motif demo-center-motif-end" aria-hidden="true"><ThemeMotif slug={template.slug}/></div>
  </aside>
 </InvitationDemoStage>;
}
