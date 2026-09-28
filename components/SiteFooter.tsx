'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type {CmsContent} from '@/lib/cms';
import defaults from '@/data/cms-defaults.json';
export default function SiteFooter({content=defaults as CmsContent}:{content?:CmsContent}={}) {
 const path=usePathname(); if(path.startsWith('/u/') || path.startsWith('/demo/')||path.endsWith('/preview'))return null;
 return <footer className="site-footer"><div className="container footer-grid"><div><Link className="brand" href="/"><span className="brand-mark" aria-hidden>k<span>✦</span></span><span><strong className="brand-name" title={content.brandName}>{content.brandName}</strong><small title={content.tagline}>{content.tagline}</small></span></Link><p className="cms-linebreak">{content.footerText}</p></div><div><h3>Jelajahi</h3><Link href="/tema">Koleksi tema</Link><Link href="/harga">Harga tema</Link><Link href="/panduan">Panduan & status fitur</Link></div><div><h3>Hubungi Kastriva</h3><a href={content.companyUrl} target="_blank" rel="noopener noreferrer">{content.companyUrl.replace(/^https:\/\//,'')} ↗</a>{content.contactEmail&&<a href={`mailto:${content.contactEmail}`}>{content.contactEmail}</a>}{content.whatsapp&&<a href={`https://wa.me/${content.whatsapp}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>}</div></div><div className="container footer-bottom"><span>© 2026 Kastriva. All rights reserved.</span><Link href="/privasi">Privasi & penggunaan data</Link></div></footer>;
}
