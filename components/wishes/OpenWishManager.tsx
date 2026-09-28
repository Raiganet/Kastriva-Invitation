'use client';
import Link from 'next/link';
import {useEffect,useRef,useState} from 'react';
import {guestRequest} from '@/lib/guest-transport';
import {useRetainedRequest} from '@/components/guests/useRetainedRequest';
import {OPEN_WISH_FILTERS,wishFilter,parseWishWorkspace,parseWishOwnerCommand,parseWishOwnerAck,decodeOwnerWishPending,type OpenWishWorkspace,type OpenWishRow,type OpenWishFilter,type WishOwnerCommand,type WishOwnerAck} from '@/lib/open-wishes';
const LABELS:Record<OpenWishFilter,string>={all:'Semua',pending:'Perlu tindakan',approved:'Tampil',hidden:'Disembunyikan',private:'Privat',removed:'Dihapus'};
export default function OpenWishManager({owner,initial,appEnabled}:{owner:string;initial:OpenWishWorkspace;appEnabled:boolean}){
 const [workspace,setWorkspace]=useState(initial),[filter,setFilter]=useState<OpenWishFilter>('all'),[offset,setOffset]=useState(0),[loading,setLoading]=useState(false),[error,setError]=useState('');
 const [accepting,setAccepting]=useState(initial.settings.accepting),[showing,setShowing]=useState(initial.settings.showing);
 const version=useRef(0);useEffect(()=>()=>{++version.current;},[]);
 const dirty=accepting!==workspace.settings.accepting||showing!==workspace.settings.showing;
 async function load(nextFilter:OpenWishFilter=filter,nextOffset=offset){const id=++version.current;setLoading(true);setError('');try{
  const result=await guestRequest('/api/open-wishes/workspace',{sale_id:initial.sale_id,filter:nextFilter,offset:nextOffset},parseWishWorkspace);
  if(result.sale_id!==initial.sale_id)throw new Error('Balasan undangan berbeda.');if(id!==version.current)return;
  setWorkspace(result);setFilter(nextFilter);setOffset(nextOffset);setAccepting(result.settings.accepting);setShowing(result.settings.showing);
 }catch(e){if(id===version.current)setError(e instanceof Error?e.message:'Daftar belum dapat dimuat.');}finally{if(id===version.current)setLoading(false);}}
 const mutation=useRetainedRequest<WishOwnerCommand,WishOwnerAck>({storageKey:'ki:open-wish-owner:v1:'+owner+':'+initial.sale_id,
  decode:raw=>decodeOwnerWishPending(raw,owner,initial.sale_id),encode:body=>JSON.stringify({version:1,owner,body}),
  send:body=>guestRequest('/api/open-wishes/manage',body,v=>parseWishOwnerAck(v,body)),onSuccess:()=>{void load();}});
 async function action(kind:WishOwnerCommand['action'],row?:OpenWishRow){setError('');try{
  if(kind==='remove'&&!confirm('Hapus nama dan pesan dari ucapan ini secara permanen? Tidak menghapus RSVP atau pesanan.'))return;
  const body=parseWishOwnerCommand({sale_id:initial.sale_id,request_id:crypto.randomUUID(),action:kind,revision:row?.revision??workspace.settings.revision,entry_id:row?.id??null,data:kind==='settings'?{accepting,showing}:{}});await mutation.submit(body);
 }catch(e){setError(e instanceof Error?e.message:'Tindakan belum dapat diproses.');}}
 const locked=loading||mutation.locked;
 return <main className="container workspace"><div className="workspace-heading"><div><span className="eyebrow">DOA DARI PARA TAMU</span><h1>Ucapan & doa umum.</h1><p>Pesan dari tautan umum. Tidak menambah jumlah hadir atau membuka akses RSVP. Ucapan yang diberi izin tampil dapat dimunculkan otomatis.</p></div><div className="button-row"><Link className="button ghost" href={`/dashboard/pesanan/${initial.sale_id}`}>← Pesanan</Link><Link className="button ghost" href={`/dashboard/pesanan/${initial.sale_id}/tamu`}>RSVP personal</Link></div></div>
 {(!appEnabled||!workspace.platform_enabled||!workspace.live)&&<p className="notice">{!appEnabled?'ENABLE_PUBLIC_WISHES atau publikasi belum aktif pada deployment. ':''}{!workspace.platform_enabled?'Layanan ucapan umum pada admin masih ditutup. ':''}{!workspace.live?'Undangan belum terbit/aktif. ':''}Pengaturan di bawah tidak mengaktifkan pembayaran atau RSVP.</p>}
 {error&&<p className="notice error" role="alert">{error}</p>}{mutation.message&&<p className="notice" role="status">{mutation.message}</p>}
 {mutation.body&&<button className="button" disabled={mutation.busy||mutation.blocked} onClick={mutation.retry}>Coba ulang tindakan yang sama</button>}
 <section className="panel wish-owner-settings"><h2>Penerimaan & penayangan</h2><form onSubmit={e=>{e.preventDefault();void action('settings');}}><fieldset disabled={locked}>
 <label className="guest-checkbox"><input type="checkbox" checked={accepting} onChange={e=>setAccepting(e.target.checked)}/><span>Terima ucapan dari tautan umum, tanpa akun atau daftar tamu.</span></label>
 <label className="guest-checkbox"><input type="checkbox" checked={showing} onChange={e=>setShowing(e.target.checked)}/><span>Tampilkan ucapan yang mendapat izin tamu secara otomatis di halaman undangan.</span></label>
 <div className="button-row"><button className="button" type="submit" disabled={!dirty}>{mutation.busy?'Menyimpan…':'Simpan pengaturan'}</button>{dirty&&<button type="button" className="button ghost" onClick={()=>{setAccepting(workspace.settings.accepting);setShowing(workspace.settings.showing);}}>Batalkan perubahan</button>}</div></fieldset></form>
 <p className="muted">Menutup penerimaan tidak menyembunyikan ucapan yang sudah tampil. Untuk menyembunyikan semuanya, matikan penayangan juga. Ucapan dengan izin tampil dapat muncul otomatis; Anda tetap bisa menyembunyikan atau menghapusnya kapan saja. Maksimal 2.000 ucapan/penanda penghapusan per undangan pada versi ini.</p></section>
 <div className="wish-stat-grid">{[['Semua kiriman',workspace.stats.total],['Menunggu moderasi',workspace.stats.pending],['Disetujui',workspace.stats.approved],['Privat',workspace.stats.private]].map(([label,value])=><div className="panel" key={label}><small>{label}</small><strong>{value}</strong></div>)}</div>
 <section className="section compact"><div className="wish-list-toolbar"><label>Filter ucapan<select value={filter} disabled={locked||dirty} onChange={e=>void load(wishFilter(e.target.value),0)}>{OPEN_WISH_FILTERS.map(f=><option key={f} value={f}>{LABELS[f]}</option>)}</select></label><button className="button ghost" disabled={locked||dirty} onClick={()=>load()}>Muat ulang</button></div>{dirty&&<p className="notice">Simpan atau batalkan perubahan pengaturan sebelum memoderasi dan memuat ulang daftar.</p>}
 {loading&&<p role="status">Memuat ucapan…</p>}{!workspace.rows.length&&!loading&&<div className="empty-state"><h2>Belum ada ucapan pada halaman ini.</h2><p>Aktifkan penerimaan dan bagikan tautan umum. Ucapan yang diberi izin tampil akan muncul otomatis setelah fitur auto-publish diaktifkan.</p></div>}
 <div className="wish-owner-grid">{workspace.rows.map(row=>{const stamp=new Date(row.created_at).toLocaleString('id-ID',{timeZone:'Asia/Jakarta',day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});return <article className="panel wish-owner-card" key={row.id}><div className="wish-owner-card-head"><span className="badge">{row.removed?'DIHAPUS':!row.consent?'PRIVAT':LABELS[row.moderation]}</span><small>{stamp} WIB</small></div><h3>{row.removed?'Nama dan pesan telah dihapus':row.name}</h3><p className="wish-message">{row.message}</p>{!row.removed&&<p className="muted wish-owner-card-note">{!row.consent?'Tamu tidak memberi izin tampil. Pesan hanya terlihat di dashboard Anda.':row.moderation==='approved'?'Ucapan ini sedang tampil di halaman undangan.':row.moderation==='hidden'?'Ucapan ini disembunyikan dari halaman undangan.':'Ucapan ini masih menunggu tindakan dan dapat ditampilkan sekarang.'}</p>}
 {!row.removed&&<div className="button-row">{row.consent&&row.moderation!=='approved'&&<button className="button small" disabled={locked||dirty||!workspace.can_open} onClick={()=>action('approve',row)}>Tampilkan sekarang</button>}{row.moderation!=='hidden'&&<button className="button ghost small" disabled={locked||dirty} onClick={()=>action('hide',row)}>Sembunyikan</button>}<button className="button ghost small" disabled={locked||dirty} onClick={()=>action('remove',row)}>Hapus isi</button></div>}</article>;})}</div>
 <div className="button-row">{offset>0&&<button className="button ghost" disabled={locked||dirty} onClick={()=>load(filter,Math.max(0,offset-20))}>← Sebelumnya</button>}{offset+20<workspace.total&&<button className="button ghost" disabled={locked||dirty} onClick={()=>load(filter,offset+20)}>Berikutnya →</button>}<small>{workspace.total} ucapan pada filter ini</small></div></section>
 </main>;
}
