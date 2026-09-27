'use client';
import {useRef,useState} from 'react';
import {shareUrl,type Publication} from '@/lib/commerce';
import {safeGuest} from '@/lib/domain';
import {invitationMessage} from '@/lib/invitation-share';

export default function InvitationShare({origin,publication}:{origin:string;publication:Publication}){
 const [guest,setGuest]=useState(''),[status,setStatus]=useState(''),[copying,setCopying]=useState(false);
 const linkRef=useRef<HTMLInputElement>(null),messageRef=useRef<HTMLTextAreaElement>(null);
 const normalizedGuest=guest.replace(/[\u0000-\u001f]/g,'').trim()?safeGuest(guest):'';
 const url=shareUrl(origin,publication.slug,normalizedGuest);
 const message=invitationMessage(publication.content,url,normalizedGuest);
 async function copy(kind:'message'|'link'){
  setCopying(true);setStatus('');
  try{await navigator.clipboard.writeText(kind==='message'?message:url);setStatus(kind==='message'?'Pesan dan tautan disalin.':'Tautan disalin.');}
  catch{const field=kind==='message'?messageRef.current:linkRef.current;field?.focus();field?.select();setStatus('Teks dipilih. Tekan lama lalu Salin, atau Ctrl+C.');}
  finally{setCopying(false);}
 }
 return <div id="bagikan" className="share-box">
  <span className="badge">TERBIT</span><h3>Bagikan kabar bahagia</h3>
  <p>Periksa pesan di bawah sebelum membagikannya. Isi pesan mengikuti versi undangan yang sudah terbit.</p>
  <label>Nama tamu (opsional, hanya sapaan)<input value={guest} maxLength={100} disabled={copying} placeholder="Contoh: Bapak Budi & keluarga" onChange={e=>{setGuest(e.target.value);setStatus('');}}/></label>
  <label>Pratinjau pesan<textarea ref={messageRef} value={message} readOnly rows={10} onFocus={e=>e.currentTarget.select()}/></label>
  <label>Tautan untuk dibagikan<input ref={linkRef} value={url} readOnly onFocus={e=>e.currentTarget.select()}/></label>
  <div className="button-row">
   <button type="button" className="button small" disabled={copying} onClick={()=>void copy('message')}>Salin pesan & tautan</button>
   <button type="button" className="button ghost small" disabled={copying} onClick={()=>void copy('link')}>Salin tautan</button>
   <a className="button ghost small" href={'https://wa.me/?text='+encodeURIComponent(message)} target="_blank" rel="noopener noreferrer">Buka WhatsApp ↗</a>
   <a className="text-button" href={url} target="_blank" rel="noopener noreferrer">Buka undangan ↗</a>
  </div>
  <p role="status" aria-live="polite">{status}</p>
  <small>WhatsApp akan membuka pesan untuk Anda periksa dan kirim sendiri. Nama tamu hanya mengubah sapaan pada tautan umum ini. Untuk akses RSVP, gunakan tautan khusus dari menu Tamu & RSVP.</small>
 </div>;
}
