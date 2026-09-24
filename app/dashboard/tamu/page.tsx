import Link from 'next/link';
import {requireUser} from '@/lib/server-auth';
import {SALE_LABEL,type SaleState} from '@/lib/commerce';
export const dynamic='force-dynamic';export const metadata={title:'Buku tamu saya',robots:{index:false,follow:false}};
export default async function GuestBooks({searchParams}:{searchParams:Promise<{page?:string}>}){
 const {db,user}=await requireUser('/dashboard/tamu'),q=await searchParams,page=Math.max(1,Math.min(10000,Number.parseInt(q.page||'1',10)||1));
 const {data,error,count}=await db.from('ki_sales').select('id,order_code,theme_name,status',{count:'exact'}).eq('owner_id',user.id).order('created_at',{ascending:false}).range((page-1)*20,page*20-1);
 return <main className="container workspace"><div className="workspace-heading"><div><span className="eyebrow">RUANG TAMU ANDA</span><h1>Buku tamu.</h1><p>Pilih undangan untuk mengelola tamu dan konfirmasi kehadiran.</p></div><Link className="button ghost" href="/dashboard">← Dashboard</Link></div>
  {error?<p className="notice error">Pesanan belum dapat dimuat. Periksa koneksi atau migrasi; data tidak dianggap kosong.</p>:!data?.length?<div className="empty-state"><h2>Belum ada undangan pada halaman ini.</h2><p>Buat draft dan selesaikan pesanan sebelum menambahkan tamu.</p><Link className="button" href="/dashboard">Buka undangan saya</Link></div>:<div className="dashboard-grid">{data.map(s=><article className="panel" key={s.id}><span className="badge">{SALE_LABEL[s.status as SaleState]}</span><h2>{s.theme_name}</h2><p className="order-code">{s.order_code}</p><Link className="button" href={`/dashboard/pesanan/${s.id}/tamu`}>Kelola tamu & ucapan →</Link></article>)}</div>}
  <div className="button-row">{page>1&&<Link className="button ghost" href={'/dashboard/tamu?page='+(page-1)}>← Sebelumnya</Link>}{(count||0)>page*20&&<Link className="button ghost" href={'/dashboard/tamu?page='+(page+1)}>Berikutnya →</Link>}</div>
 </main>;
}
