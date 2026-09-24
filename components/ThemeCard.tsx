import Link from 'next/link';
import type { Template } from '@/lib/types';
import { categories } from '@/lib/templates';
import { currency } from '@/lib/domain';
export function ThemeArtwork({template,large=false}:{template:Template;large?:boolean}) {
 const wedding=template.category==='pernikahan';
 return <div className={`theme-art theme-${template.slug} ${large?'large':''}`} aria-label={`Contoh desain ${template.name}`}><span className="theme-orbit orbit-one"/><span className="theme-orbit orbit-two"/><span className="art-corner corner-a"/><span className="art-corner corner-b"/><div className="art-inner"><span className="art-symbol" aria-hidden>{template.thumbnail}</span><small>{wedding?'THE WEDDING OF':categories[template.category]?.toUpperCase()}</small><div className="art-names">{wedding?<>Ahmad <i>&</i> Siti</>:template.category==='ulang-tahun'?'Aruna':template.category==='aqiqah'?'Baby Aruna':'Together, We Grow'}</div><div className="art-line"/><span className="art-date">25 . 12 . 2026</span><span className="art-label">{template.name}</span></div></div>;
}
export default function ThemeCard({template,priceLabel="Harga katalog saat ini"}:{template:Template;priceLabel?:string}) {
 return <article className="theme-card"><Link className="art-link" href={`/demo/${template.slug}`} tabIndex={-1} aria-hidden><ThemeArtwork template={template}/></Link><div className="theme-info"><div className="eyebrow">{categories[template.category]}{template.category!=='pernikahan'?' · Demo tambahan':''}</div><h3>{template.name}</h3><p>{template.description}</p><div className="theme-bottom"><strong>{currency(template.price)}<small>{priceLabel}</small></strong><Link className="button ghost small" href={`/demo/${template.slug}`}>Lihat demo ↗</Link></div></div></article>;
}
