import Link from 'next/link';
import {requireUser} from '@/lib/server-auth';
import {SALE_LABEL,saleTimestamp,type Sale} from '@/lib/commerce';
import {publishingAppEnabled} from '@/lib/commerce-server';
import {orderNextStep} from '@/lib/order-next-step';
import {currency} from '@/lib/domain';
import RefreshButton from '@/components/RefreshButton';
export const dynamic='force-dynamic';export const metadata={title:'Pesanan saya',robots:{index:false,follow:false}};
export default async function MyOrders({searchParams}:{searchParams:Promise<{page?:string}>}){
 const{db,user}=await requireUser('/dashboard/pesanan');
 const q=await searchParams,page=Math.max(1,Math.min(10000,Number.parseInt(q.page||'1',10)||1));
 const{data,error,count}=await db.from('ki_sales').select('*',{count:'exact'}).eq('owner_id',user.id).order('created_at',{ascending:false}).range((page-1)*20,page*20-1);
 const sales=(data||[]) as Sale[];
 const [{data:pubs,error:pe},{data:settings,error:se}]=sales.length?await Promise.all([
  db.from('ki_publications').select('sale_id,active').eq('owner_id',user.id).in('sale_id',sales.map(s=>s.id)),
  db.from('ki_commerce_settings').select('publishing_enabled').eq('id',1).single(),
 ]):[{data:[],error:null},{data:null,error:null}];
 const known=!pe&&!se,enabled=publishingAppEnabled()&&settings?.publishing_enabled===true,now=Date.now();
 return <main className="container workspace"><div className="workspace-heading"><div><span className="eyebrow">TRANSAKSI & PUBLIKASI</span><h1>Pesanan saya.</h1><p>Halaman {page} · {count??'—'} pesanan</p></div><div className="button-row"><RefreshButton/><Link href="/dashboard" className="button ghost">Kembali ke draft</Link></div></div>
 {!known&&<p className="notice" role="status">Status publikasi belum dapat dimuat. Gunakan Periksa ulang atau buka detail pesanan.</p>}
 {error?<p className="notice error" role="alert">Pesanan belum dapat dimuat. Coba Periksa ulang; pesan ini tidak berarti riwayat Anda kosong.</p>:!sales.length?<div className="empty-state"><h2>{page>1?'Tidak ada pesanan di halaman ini.':'Belum ada pesanan.'}</h2><p>{page>1?'Kembali ke halaman pertama untuk melihat pesanan Anda.':'Simpan dan lengkapi draft, kemudian pilih Pesan & terbitkan.'}</p><Link href={page>1?'/dashboard/pesanan':'/dashboard'} className="button">{page>1?'Ke halaman pertama':'Buka draft'}</Link></div>:<div className="dashboard-grid">{sales.map(s=>{
 const next=orderNextStep(s,pubs?.find(p=>p.sale_id===s.id)||null,enabled,known,now);
 return <article key={s.id} className="panel order-list-card"><span className={'badge sale-'+s.status}>{SALE_LABEL[s.status]}</span><h2>{s.theme_name}</h2><p className="order-code">{s.order_code}</p><strong>{currency(s.total_price)}</strong><p className="order-next-status">{next.label}</p><p className="muted">{s.status==='paid'&&s.expires_at?'Aktif sampai '+saleTimestamp(s.expires_at):s.active_days+' hari sejak pembayaran disetujui.'}</p><Link className="button small" href={'/dashboard/pesanan/'+s.id+next.hash}>{next.action} →</Link></article>;
 })}</div>}
 <nav className="button-row order-pagination" aria-label="Halaman pesanan">{page>1&&<Link className="button ghost" href={'?page='+(page-1)}>← Sebelumnya</Link>}{(count||0)>page*20&&<Link className="button ghost" href={'?page='+(page+1)}>Berikutnya →</Link>}</nav></main>;
}
