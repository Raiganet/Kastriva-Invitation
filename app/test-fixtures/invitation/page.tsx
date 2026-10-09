import {notFound} from 'next/navigation';
import InvitationView from '@/components/InvitationView';
import {publicBackend} from '@/lib/config';
import {demoContent,getTemplate} from '@/lib/templates';
import {invitationEvents,withEvents} from '@/lib/domain';
import type {DraftContent} from '@/lib/types';

export const dynamic='force-dynamic';
export const metadata={title:'Fixture undangan lokal',robots:{index:false,follow:false}};

export default async function InvitationFixture({searchParams}:{searchParams:Promise<{theme?:string;embedded?:string;broken?:string;mode?:string;aspect?:string;schedule?:string;gifts?:string;cover?:string;photos?:string;names?:string;music?:string}>}){
 if(process.env.KI_E2E_DEMO!=='true'||process.env.VERCEL==='1'||process.env.NEXT_PUBLIC_SITE_URL!=='http://127.0.0.1:3000'||publicBackend())notFound();
 const query=await searchParams;
 const template=getTemplate(query.theme||'tropical-paradise');
 if(!template)notFound();
 const [width,height]=query.aspect==='landscape'?[1000,600]:query.aspect==='square'?[700,700]:[600,750];
 const photoUrls=['#799484','#ab8979','#788ba4','#b9a677'].map((color,index)=>`data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="${color}"/><rect width="100%" height="20" fill="#f7d8a0"/><rect y="${height-20}" width="100%" height="20" fill="#efacb8"/><circle cx="${width/2}" cy="${height*.28}" r="80" fill="#ffffff66"/><text x="${width/2}" y="${height*.8}" text-anchor="middle" font-family="sans-serif" font-size="24" fill="white">FOTO UJI ${index+1}</text></svg>`)}`);
 let content:DraftContent={...demoContent(template),groom:'Muhammad Arif Firmansyah',bride:'Nadia Puspitasari',music:'none' as const,story:'## Kisah Kami\n\n### 2022 — Pertemuan pertama\nCerita uji dengan judul yang ditulis oleh pemilik undangan.\n\n'+('Paragraf panjang untuk menguji animasi saat digulir. '.repeat(30))+'\n\n### 2026 — Hari bahagia\nBab terakhir tetap muncul setelah bagian panjang di atas.'};
 if(query.music==='on')content={...content,music:'moonlight'};
 if(query.schedule==='multi'){
  const first=invitationEvents(content)[0];
  content=withEvents(content,[
   {...first,id:'akad',label:'Akad nikah',endTime:'10:00'},
   {...first,id:'resepsi',label:'Resepsi pernikahan',eventDate:'2026-12-26',eventTime:'11:00',endTime:'13:00',timezone:'Asia/Makassar',venue:'Taman Kenangan (contoh)',address:'Jalan Kenangan Nomor 26, Denpasar. Alamat sintetis untuk pengujian.'},
   {...first,id:'syukuran',label:'Silaturahmi dan syukuran bersama seluruh keluarga besar',eventDate:'2026-12-27',eventTime:'18:00',endTime:'20:00',timezone:'Asia/Jayapura',venue:'Gedung Serbaguna Keluarga Besar dan Sahabat (contoh)',address:'Alamat panjang untuk pengujian undangan pada layar kecil. '.repeat(8)},
  ]);
 }
 if(query.schedule==='incomplete')content={...content,eventDate:'',eventTime:'',venue:'',address:'',mapUrl:''};
 if(query.schedule==='invalid-time')content={...content,eventTime:''};
 if(query.gifts==='multi')content={...content,gifts:[
  {bank:'Bank Contoh',account:'0000000000',holder:'Penerima Contoh'},
  {bank:'Bank Dengan Nama Sangat Panjang Untuk Pengujian',account:'000000000000000000000000000000',holder:'Nama Penerima Contoh yang Panjang untuk Menguji Tampilan pada Layar Kecil'},
  {bank:'Rekening belum lengkap',account:'',holder:''},
 ]};
 if(query.gifts==='empty')content={...content,gifts:[{bank:'Belum lengkap',account:'',holder:''}]};
 if(query.names==='extended')content={...content,groom:'MuhammadAbdurrahmanFirmansyahPratamaWiratama',bride:'Nadia Putri Ayuningtyas Kusumawardani',groomParents:'Putra dari Bapak Muhammad Abdurrahman Firmansyah dan Ibu Siti Nurhaliza Kusumawardani',brideParents:'Putri dari Bapak Pratama Wiratama dan Ibu Ayuningtyas Kusumawardani'};
 if(query.broken==='true')photoUrls[0]='data:image/png;base64,invalid';
 if(query.photos==='empty')photoUrls.length=0;
 const cover=query.cover==='photo'?photoUrls[2]:query.cover==='broken'?'data:image/png;base64,invalid':'';
 return <InvitationView mode={query.mode==='public'?'public':query.mode==='draft'?'draft':'demo'} template={template} content={content} guest="Keluarga Bapak Muhammad Abdurrahman" photoUrls={photoUrls} coverUrl={cover} embedded={query.embedded==='true'}/>;
}
