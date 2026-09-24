'use client';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {parsePlatform,record,exact} from '@/lib/guests';
import {guestRequest} from '@/lib/guest-transport';
import {useRetainedRequest} from './useRetainedRequest';
export default function GuestPlatformControl({owner,initial,appEnabled}:{owner:string;initial:{enabled:boolean;revision:number};appEnabled:boolean}){
 const [cfg,setCfg]=useState(initial),[enabled,setEnabled]=useState(initial.enabled);const router=useRouter();
 const mutation=useRetainedRequest({storageKey:'ki:guest-platform:v1:'+owner,
  encode:(body:{enabled:boolean;revision:number})=>JSON.stringify({version:1,body}),
  decode:(raw:string)=>{const x=record(JSON.parse(raw));exact(x,['version','body']);if(x.version!==1)throw new Error('Unknown journal');return parsePlatform(x.body);},
  send:(body:{enabled:boolean;revision:number})=>guestRequest('/api/admin/guestbook',body,value=>{const v=parsePlatform(value);if(v.revision!==body.revision+1||v.enabled!==body.enabled)throw new Error('ACK_MISMATCH');return v;}),
  onSuccess:v=>{setCfg(v);setEnabled(v.enabled);router.refresh();}});
 return <section className="panel"><span className="eyebrow">KENDALI SELURUH PLATFORM</span><h2>Daftar tamu & RSVP</h2><p>Database: <strong>{cfg.enabled?'Aktif':'Nonaktif'}</strong> · Environment RSVP: <strong>{appEnabled?'Aktif':'Nonaktif'}</strong></p>
  <form onSubmit={e=>{e.preventDefault();if(confirm(enabled?'Buka layanan RSVP pada database? Pastikan pengujian staging telah selesai.':'Tutup layanan RSVP dan ucapan publik di seluruh aplikasi yang memakai database ini? Riwayat tetap disimpan.'))void mutation.submit({revision:cfg.revision,enabled});}}><fieldset disabled={mutation.locked}><label className="guest-checkbox"><input type="checkbox" checked={enabled} onChange={e=>setEnabled(e.target.checked)}/><span><strong>Aktifkan layanan RSVP pada database</strong><small>Pemilik undangan tetap harus membuka penerimaan masing-masing.</small></span></label><button className="button" type="submit">Simpan pengaturan platform</button></fieldset></form>
  {mutation.message&&<p className="notice" role="status">{mutation.message}</p>}{mutation.body&&<button className="button ghost" disabled={mutation.busy||mutation.blocked} onClick={mutation.retry}>Coba ulang pengaturan yang sama</button>}
  <p className="field-help">Untuk membuka formulir web, ENABLE_RSVP dan ENABLE_PUBLIC_INVITATIONS harus true. Mematikan environment saja bukan penutupan database global. Tidak ada perubahan rekening, pembayaran, atau masa aktif melalui pengaturan ini.</p>
 </section>;
}
