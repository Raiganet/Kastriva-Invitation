'use client';
import {useState} from 'react';
import {mapLink} from '@/lib/maps';

export default function InvitationLocation({venue,address,url,demo=false}:{venue:string;address:string;url:string;demo?:boolean}) {
 const link=mapLink(url),[status,setStatus]=useState('');
 async function copy(){try{await navigator.clipboard.writeText([venue,address].filter(Boolean).join('\n'));setStatus('Alamat disalin.');}catch{setStatus('Pilih teks alamat lalu salin secara manual.');}}
 return <div className="inv-location" data-copy-state={status==='Alamat disalin.'?'copied':'idle'}>
  <div className="location-heading">
  <svg className="location-symbol" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true"><path d="m7 24 16-6 18 6 16-6v32l-16 6-18-6-16 6Zm16-6v32m18-17v23"/><path d="M43 7a10 10 0 0 0-10 10c0 8 10 17 10 17s10-9 10-17A10 10 0 0 0 43 7Z" fill="var(--soft)"/><circle cx="43" cy="17" r="3"/></svg>
  <div><span className="location-label">LOKASI ACARA</span><h4>{venue||'Lokasi belum diisi'}</h4></div></div><p className="location-address">{address}</p>
  {demo&&link.href&&<p className="location-demo">Lokasi contoh untuk mencoba fitur Maps.</p>}
  <div className="location-actions">{link.href?<a className="inv-button" href={link.href} target="_blank" rel="noopener noreferrer">{link.label} <span aria-hidden="true">↗</span></a>:<p className="location-note">Tautan peta belum ditambahkan.</p>}{address.trim()&&<button className="inv-button outline" type="button" onClick={()=>void copy()}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">{status==='Alamat disalin.'?<path d="m5 12 4 4L19 6"/>:<><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V4H4v12h4"/></>}</svg>Salin alamat</button>}</div>
  <p role="status" className="location-status">{status}</p>
 </div>;
}
