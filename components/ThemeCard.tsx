import BotanicalBlushArtwork from './BotanicalBlushArtwork';
import HeritageArtwork from './HeritageArtwork';
import ElementorLuxuryArtwork from './ElementorLuxuryArtwork';
import AuroraModernArtwork from './AuroraModernArtwork';
import OccasionArtwork from './OccasionArtwork';
import PremiumEditionArtwork from './PremiumEditionArtwork';
import {isPremiumEditionTheme} from '@/lib/theme-registry';
import ThemeMotif from '@/components/ThemeMotif';
import Link from 'next/link';
import type { Template } from '@/lib/types';
import { categories } from '@/lib/templates';
import { currency } from '@/lib/domain';
import {demoPhotos} from '@/lib/invitation-demo';
import PhoneFrame from './PhoneFrame';
export function ThemeArtwork({template,large=false,mobile=false}:{template:Template;large?:boolean;mobile?:boolean}) {
 const wedding=template.category==='pernikahan';
 return <div className={`theme-art theme-${template.slug} ${large?'large':''}${mobile?' art-mobile':''}${isPremiumEditionTheme(template.slug)?' premium-edition-preview':''}`} aria-label={`Contoh desain ${template.name}`}><BotanicalBlushArtwork slug={template.slug}/><ElementorLuxuryArtwork slug={template.slug}/><HeritageArtwork slug={template.slug}/><AuroraModernArtwork slug={template.slug} mode="preview"/><OccasionArtwork slug={template.slug}/><PremiumEditionArtwork slug={template.slug}/><PremiumEditionArtwork slug={template.slug} frame/><span className="theme-orbit orbit-one"/><span className="theme-orbit orbit-two"/><span className="art-corner corner-a"/><span className="art-corner corner-b"/><div className="art-inner">{mobile?<img className="art-preview-photo" src={demoPhotos(template.category,template.slug).coverUrl} alt="" loading="lazy" decoding="async" width="960" height="1200"/>:<span className="art-symbol" aria-hidden><ThemeMotif slug={template.slug}/></span>}<small>{wedding?'THE WEDDING OF':categories[template.category]?.toUpperCase()}</small><div className="art-names">{wedding?<>Ahmad <i>&</i> Siti</>:template.category==='ulang-tahun'?'Aruna':template.category==='aqiqah'?'Baby Aruna':'Together, We Grow'}</div><div className="art-line"/><span className="art-date">25 . 12 . 2026</span>{mobile?<><div className="art-preview-guest"><span>Kepada Yth.</span><strong>Tamu Undangan</strong></div><span className="art-preview-open"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" aria-hidden="true"><rect x="3" y="5" width="14" height="10" rx="2"/><path d="m3 6 7 5 7-5"/></svg>Buka undangan</span></>:<span className="art-label">{template.name}</span>}</div></div>;
}
export function ThemePhonePreview({template}:{template:Template}){
 return <div className={`theme-phone-stage theme-${template.slug}`}><PhoneFrame><ThemeArtwork template={template} mobile/></PhoneFrame><span className="theme-phone-caption" aria-hidden="true">PREVIEW MOBILE</span></div>;
}
export default function ThemeCard({template,priceLabel="Harga katalog saat ini"}:{template:Template;priceLabel?:string}) {
 return <article className="theme-card"><Link className="art-link" href={`/demo/${template.slug}`} tabIndex={-1} aria-hidden><ThemePhonePreview template={template}/></Link><div className="theme-info">{isPremiumEditionTheme(template.slug)&&<span className="premium-collection-badge">PREMIUM COLLECTION</span>}{template.slug==='aurora-modern'&&<span className="premium-theme-badge">PREMIUM MOTION</span>}<div className="eyebrow">{categories[template.category]}</div><h3>{template.name}</h3><p>{template.description}</p><div className="theme-bottom"><strong>{currency(template.price)}<small>{priceLabel}</small></strong><Link className="button ghost small" href={`/demo/${template.slug}`}>Lihat demo ↗</Link></div></div></article>;
}
