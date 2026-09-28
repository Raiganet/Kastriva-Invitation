'use client';
import {useState} from 'react';
import {useRetainedRequest} from '@/components/guests/useRetainedRequest';
import {guestRequest} from '@/lib/guest-transport';
import {parseWishPlatformCommand,parseWishPlatformAck,type WishPlatformCommand} from '@/lib/open-wishes';
export default function WishPlatformSettings({owner,initial,appEnabled}:{owner:string;initial:{enabled:boolean;revision:number};appEnabled:boolean}){
 const [config,setConfig]=useState(initial),[enabled,setEnabled]=useState(initial.enabled),[error,setError]=useState('');
 const request=useRetainedRequest<WishPlatformCommand,{enabled:boolean;revision:number}>({storageKey:'ki:open-wish-platform:v1:'+owner,
 decode:raw=>{if(raw.length>2048)throw new Error('Catatan terlalu besar');const v=JSON.parse(raw);if(v.version!==1||v.owner!==owner)throw new Error('Catatan akun berbeda');return parseWishPlatformCommand(v.body);},
 encode:body=>JSON.stringify({version:1,owner,body}),send:body=>guestRequest('/api/admin/open-wishes',body,v=>parseWishPlatformAck(v,body)),onSuccess:result=>{setConfig(result);setEnabled(result.enabled);setError('');}});
 async function save(){try{setError('');await request.submit(parseWishPlatformCommand({request_id:crypto.randomUUID(),revision:config.revision,enabled}));}catch{setError('Pengaturan belum dapat dikirim.');}}
 return <section className="panel"><h2>Layanan ucapan umum</h2><p>Status deployment: <strong>{appEnabled?'ENABLE_PUBLIC_WISHES aktif':'ENABLE_PUBLIC_WISHES belum aktif'}</strong>. Status database: <strong>{config.enabled?'Terbuka':'Ditutup'}</strong>.</p>
 <form onSubmit={e=>{e.preventDefault();void save();}}><fieldset disabled={request.locked}><label className="guest-checkbox"><input type="checkbox" checked={enabled} onChange={e=>setEnabled(e.target.checked)}/><span>Buka penerimaan dan pembacaan ucapan umum pada platform. Pemilik tetap perlu mengaktifkan per undangan.</span></label><button className="button" type="submit" disabled={enabled===config.enabled}>{request.busy?'Menyimpan…':'Simpan layanan'}</button></fieldset></form>
 {error&&<p className="notice error" role="alert">{error}</p>}{request.message&&<p className="notice" role="status">{request.message}</p>}{request.body&&<button className="button ghost" disabled={request.busy||request.blocked} onClick={request.retry}>Coba ulang pengaturan yang sama</button>}
 <p className="muted">Menutup layanan menyembunyikan ucapan pada permintaan baru di seluruh deployment yang menggunakan database ini. Tidak mengubah RSVP, pembayaran, undangan, atau menghapus data. Penghapusan dengan kode privat tetap tersedia melalui gateway.</p>
 <button className="button ghost small" disabled={request.locked} onClick={()=>{if(confirm('Muat ulang pengaturan server? Perubahan belum tersimpan akan diganti.'))window.location.reload();}}>Muat ulang halaman</button>
 </section>;
}
