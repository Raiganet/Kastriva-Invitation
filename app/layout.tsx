import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import {publicSite} from '@/lib/cms-server';
import { siteUrl } from '@/lib/config';
import './globals.css';
import './invitation-cinematic.css';
import './invitation-heritage.css';
export const metadata: Metadata={metadataBase:new URL(siteUrl()),title:{default:'Kastriva Invitation — Undangan Digital Personal',template:'%s | Kastriva Invitation'},description:'Pilih tema, coba demo tanpa login, dan siapkan draft undangan pernikahan Anda bersama Kastriva.',robots:{index:false,follow:false},icons:{icon:'/icon.svg'}};
export default async function RootLayout({children}:{children:React.ReactNode}) {const cms=await publicSite();return <html lang="id"><body><a className="skip-link" href="#main-content">Lewati ke konten</a><SiteHeader content={cms.content}/><div id="main-content">{children}</div><SiteFooter content={cms.content}/></body></html>;}
