'use client';
import {useEffect,useState} from 'react';
import {parseReceipt,parseVisitorCommand,parseVisitorAck,receiptCode,type WishVisitorCommand,type WishVisitorAck} from '@/lib/open-wishes';
import {useRetainedRequest} from '@/components/guests/useRetainedRequest';
import {guestRequest} from '@/lib/guest-transport';
export default function WithdrawWish(){
 const [code,setCode]=useState(''),[error,setError]=useState('');
 const request=useRetainedRequest<WishVisitorCommand,WishVisitorAck>({storageKey:'ki:open-wish-removal:v1',
  decode:raw=>{if(raw.length>1024)throw new Error('Catatan terlalu besar');const data=JSON.parse(raw);if(data.version!==1)throw new Error('Versi salah');const c=parseVisitorCommand(data.body);if(c.action!=='withdraw')throw new Error('Bukan penghapusan');return c;},
  encode:body=>JSON.stringify({version:1,body}),send:body=>guestRequest(`/api/public/${body.slug}/open-wishes/withdraw`,body,v=>parseVisitorAck(v,body)),onSuccess:()=>setError('')});
 useEffect(()=>{if(request.body)setCode(receiptCode(request.body));},[request.body]);
 async function submit(){setError('');try{const body=parseReceipt(code);if(!confirm('Hapus nama dan ucapan ini? Tindakan tidak dapat dibatalkan dan tidak mengubah RSVP.'))return;await request.submit(body);}catch(e){setError(e instanceof Error?e.message:'Periksa kode.');}}
 return <div className="panel"><form onSubmit={e=>{e.preventDefault();void submit();}}><fieldset disabled={request.locked}><label>Kode penghapusan privat<textarea autoComplete="off" spellCheck={false} required rows={4} maxLength={170} value={code} onChange={e=>setCode(e.target.value)} placeholder="Tempel kode lengkap yang disimpan saat mengirim ucapan"/></label><button type="submit" className="button">{request.busy?'Memproses…':'Hapus ucapan saya'}</button></fieldset></form>
 {error&&<p className="notice error" role="alert">{error}</p>}{request.message&&<p className="notice" role="status">{request.message}{request.success&&' Nama dan pesan tidak lagi tersedia untuk pembacaan baru. Salinan atau screenshot yang sudah diterima orang lain tidak dapat ditarik kembali.'}</p>}
 {request.body&&<button className="button ghost" disabled={request.busy||request.blocked} onClick={request.retry}>Coba ulang penghapusan yang sama</button>}
 <p className="muted">Fitur ini khusus ucapan umum. Untuk ucapan dari RSVP, gunakan tautan tamu personal. Bila kode hilang, hubungi pemilik undangan untuk penghapusan.</p></div>;
}
