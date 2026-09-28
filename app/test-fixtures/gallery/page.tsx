import {notFound} from 'next/navigation';
import InvitationGallery from '@/components/InvitationGallery';
import {publicBackend} from '@/lib/config';
export const dynamic='force-dynamic';
export const metadata={title:'Fixture galeri lokal',robots:{index:false,follow:false}};
export default function GalleryFixture(){
 if(process.env.KI_E2E_DEMO!=='true'||process.env.VERCEL==='1'||process.env.NEXT_PUBLIC_SITE_URL!=='http://127.0.0.1:3000'||publicBackend())notFound();
 return <main className="container prose page-space"><h1>Galeri — data uji sintetis</h1><p>Hanya untuk browser test lokal. Tidak memakai foto pelanggan atau Supabase.</p><InvitationGallery urls={['data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAIAAABvFaqvAAAAIklEQVR4nGN0SA9hoAZgooopowaNGjRq0KhBowaNGkQRAABfPwErSBEa/AAAAABJRU5ErkJggg==', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAIAAABvFaqvAAAAIklEQVR4nGMsdgljoAZgooopowaNGjRq0KhBowaNGkQRAADafAE9MM0T8wAAAABJRU5ErkJggg==']}/></main>;
}
