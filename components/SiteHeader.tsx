'use client';
import Link from 'next/link';
import BrandLogo from '@/components/BrandLogo';
import {useAccountNavigation} from '@/components/useAccountNavigation';
import type {CmsContent} from '@/lib/cms';
import defaults from '@/data/cms-defaults.json';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
export default function SiteHeader({content=defaults as CmsContent}:{content?:CmsContent}={}) {
  const path=usePathname(); const [open,setOpen]=useState(false);
  const hidden=path.startsWith('/u/') || path.startsWith('/demo/') || path.endsWith('/preview');
  const account=useAccountNavigation(!hidden);
  useEffect(()=>setOpen(false),[path]);
  useEffect(()=>{const onKey=(e:KeyboardEvent)=>{if(e.key==='Escape')setOpen(false);};document.addEventListener('keydown',onKey);return()=>document.removeEventListener('keydown',onKey);},[]);
  if(hidden) return null;
  const links=[['/','Beranda'],['/tema','Koleksi tema'],['/harga','Harga'],['/panduan','Panduan']];
  return <header className="site-header"><div className="container nav-row">
    <BrandLogo brandName={content.brandName} tagline={content.tagline} placement="header"/>
    <nav className="desktop-nav" aria-label="Navigasi utama">{links.map(([href,name])=><Link aria-current={path===href?'page':undefined} key={href} href={href}>{name}</Link>)}</nav>
    <div className="nav-actions"><Link className="login-link" href={account.href}>{account.label}</Link><Link className="button small" href="/tema">Buat undangan <span aria-hidden>↗</span></Link><button className="menu-toggle" aria-expanded={open} aria-controls="mobile-menu" aria-label={open?'Tutup menu':'Buka menu'} onClick={()=>setOpen(!open)}>{open?'✕':'☰'}</button></div>
  </div>{open&&<nav id="mobile-menu" className="mobile-nav" aria-label="Navigasi ponsel">{[...links,[account.href,account.label]].map(([href,name])=><Link key={href} href={href} onClick={()=>setOpen(false)}>{name}</Link>)}</nav>}</header>;
}
