import type { Metadata } from 'next';
import { Cormorant_Garamond, Plus_Jakarta_Sans } from 'next/font/google';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import PremiumMotionBoot from '@/components/PremiumMotionBoot';
import {publicSite} from '@/lib/cms-server';
import { siteUrl } from '@/lib/config';
import { BRAND_ASSETS } from '@/lib/brand-identity';
import './globals.css';
import './invitation-cinematic.css';
import './invitation-heritage.css';
import './invitation-elementor.css';
import './invitation-botanical.css';
import './invitation-aurora.css';
import './invitation-premium-motion.css';
import './invitation-theme-premium.css';
import './invitation-theme-polish.css';
import './invitation-depth-effects.css';
import './invitation-reference-motion.css';
import './invitation-elegant-reference.css';
import './invitation-elegant-ornaments.css';
import './invitation-modern-reference.css';
import './invitation-refinement.css';
import './invitation-controls.css';
import './invitation-signatures.css';
import './invitation-mobile-finish.css';
import './invitation-typography.css';
import './brand-identity.css';
const modernDisplayFont = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['500','600','700'],
  display: 'swap',
  variable: '--font-mm-display',
});

const modernBodyFont = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400','500','600','700','800'],
  display: 'swap',
  variable: '--font-mm-body',
});

export const metadata: Metadata={metadataBase:new URL(siteUrl()),title:{default:'Kastriva Invitation — Undangan Digital Personal',template:'%s | Kastriva Invitation'},description:'Pilih tema, coba demo tanpa login, dan siapkan draft undangan pernikahan Anda bersama Kastriva.',robots:{index:false,follow:false},applicationName:'Kastriva Invitation',manifest:'/manifest.webmanifest',icons:{icon:[{url:BRAND_ASSETS.favicon32,sizes:'32x32',type:'image/png'},{url:BRAND_ASSETS.favicon16,sizes:'16x16',type:'image/png'}],apple:[{url:BRAND_ASSETS.apple,sizes:'180x180',type:'image/png'}]}};
export default async function RootLayout({children}:{children:React.ReactNode}) {const cms=await publicSite();return <html lang="id"><body className={`${modernDisplayFont.variable} ${modernBodyFont.variable}`}><PremiumMotionBoot/><a className="skip-link" href="#main-content">Lewati ke konten</a><SiteHeader content={cms.content}/><div id="main-content">{children}</div><SiteFooter content={cms.content}/></body></html>;}
