import {notFound} from 'next/navigation';
import {publicBackend} from '@/lib/config';
import PublicOpenWishes from '@/components/wishes/PublicOpenWishes';
export const dynamic='force-dynamic';
export const metadata={title:'Fixture ucapan lokal',robots:{index:false,follow:false}};
export default function WishesFixture(){
 if(process.env.KI_E2E_DEMO!=='true'||process.env.VERCEL==='1'||process.env.NEXT_PUBLIC_SITE_URL!=='http://127.0.0.1:3000'||publicBackend())notFound();
 return <main className="invitation theme-elegant-rose"><p className="notice">FIXTURE LOKAL — API ditiru oleh tes browser; bukan kiriman ke Supabase.</p><PublicOpenWishes slug="ki-general-wishes-fixture"/></main>;
}
