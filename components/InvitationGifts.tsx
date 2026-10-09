'use client';
import {useState} from 'react';
import type {GiftAccount} from '@/lib/types';
import {completeGift} from '@/lib/invitation-extras';
import InvitationOrnaments,{InvitationDivider} from './InvitationOrnaments';
import ThemeMotif from './ThemeMotif';

function GiftCard({row,index,demo}:{row:GiftAccount;index:number;demo:boolean}){
 const [state,setState]=useState<'idle'|'copying'|'copied'|'error'>('idle');
 async function copy(){
  setState('copying');
  try{await navigator.clipboard.writeText(row.account);setState('copied');}
  catch{setState('error');}
 }
 const status=state==='copied'?(demo?'Nomor contoh disalin. Jangan digunakan untuk transfer.':'Nomor rekening disalin.'):state==='error'?'Salin nomor secara manual dengan memilih teks nomor rekening.':'';
 return <article className="gift-account" data-copy-state={state} aria-label={`Rekening ${row.bank}, ${row.holder}`}>
  <div className="gift-account-surface" style={{'--gift-order':Math.min(index,3)} as React.CSSProperties}>
   <header className="gift-account-heading"><h3>{row.bank}</h3><span aria-hidden="true">{String(index+1).padStart(2,'0')}</span></header>
   <span className="gift-account-label">{demo?'NOMOR CONTOH':'NOMOR REKENING'}</span>
   <p className="gift-number" aria-label={'Nomor rekening '+row.account}>{row.account}</p>
   <p className="gift-holder"><small>ATAS NAMA</small><span>{row.holder}</span></p>
   <button className="inv-button outline" type="button" disabled={state==='copying'} aria-busy={state==='copying'} onClick={()=>void copy()}>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">{state==='copied'?<path d="m5 12 4 4L19 6"/>:<><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V4H4v12h4"/></>}</svg>
    {state==='copying'?'Menyalin…':demo?'Salin nomor contoh':'Salin nomor rekening'}
   </button>
   <p className="gift-copy-status" role="status">{status}</p>
  </div>
 </article>;
}

export default function InvitationGifts({id,accounts,demo=false,slug}:{id?:string;accounts:GiftAccount[];demo?:boolean;slug:string}) {
 const rows=accounts.filter(completeGift);
 if(!rows.length)return null;
 return <section id={id} tabIndex={-1} data-inv-section className="inv-section inv-gifts">
  <InvitationOrnaments slug={slug} section/>
  <p className="overline">A TOKEN OF LOVE</p><h2>Amplop digital</h2><InvitationDivider slug={slug}/>
  <p className="gift-intro">Doa restu dan kehadiran Anda adalah hadiah terindah. Bagi yang ingin berbagi tanda kasih, kami menyediakan rekening berikut.</p>
  {demo&&<p className="notice">Contoh tampilan. Nomor di bawah bukan rekening untuk menerima hadiah.</p>}
  <details className="gift-disclosure"><summary>
   <span className="gift-envelope" aria-hidden="true"><span className="gift-envelope-back"/><span className="gift-envelope-letter"><ThemeMotif slug={slug}/></span><span className="gift-envelope-front"/><span className="gift-envelope-flap"/><span className="gift-envelope-seal">♡</span></span>
   <span className="gift-disclosure-label"><span className="gift-label-closed">Tampilkan rekening</span><span className="gift-label-open">Tutup rekening</span><span className="gift-toggle-icon" aria-hidden="true">＋</span></span>
  </summary>
   <div className="gift-accounts">{rows.map((row,i)=><GiftCard key={row.bank+'|'+row.account+'|'+row.holder+'|'+i} row={row} index={i} demo={demo}/>)}</div>
  </details>
 </section>;
}
