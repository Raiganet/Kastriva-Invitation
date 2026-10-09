import {notFound} from 'next/navigation';
import InvitationView from '@/components/InvitationView';
import {publicBackend} from '@/lib/config';
import {demoContent,getTemplate} from '@/lib/templates';

export const dynamic='force-dynamic';
export const metadata={title:'Fixture undangan lokal',robots:{index:false,follow:false}};

export default async function InvitationFixture({searchParams}:{searchParams:Promise<{theme?:string;embedded?:string;broken?:string}>}){
 if(process.env.KI_E2E_DEMO!=='true'||process.env.VERCEL==='1'||process.env.NEXT_PUBLIC_SITE_URL!=='http://127.0.0.1:3000'||publicBackend())notFound();
 const query=await searchParams;
 const template=getTemplate(query.theme||'tropical-paradise');
 if(!template)notFound();
 const photoUrls=['#799484','#ab8979','#788ba4','#b9a677'].map((color,index)=>`data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="750"><rect width="600" height="750" fill="${color}"/><circle cx="300" cy="320" r="140" fill="#ffffff22"/><text x="300" y="535" text-anchor="middle" font-family="sans-serif" font-size="24" fill="white">FOTO UJI ${index+1}</text></svg>`)}`);
 const content={...demoContent(template),groom:'Muhammad Arif Firmansyah',bride:'Nadia Puspitasari',music:'none' as const,story:'## Kisah Kami\n\n### 2022 — Pertemuan pertama\nCerita uji dengan judul yang ditulis oleh pemilik undangan.\n\n'+('Paragraf panjang untuk menguji animasi saat digulir. '.repeat(30))+'\n\n### 2026 — Hari bahagia\nBab terakhir tetap muncul setelah bagian panjang di atas.'};
 if(query.broken==='true')photoUrls[0]='data:image/png;base64,invalid';
 return <InvitationView template={template} content={content} guest="Keluarga Bapak Muhammad Abdurrahman" photoUrls={photoUrls} coverUrl="" embedded={query.embedded==='true'}/>;
}
