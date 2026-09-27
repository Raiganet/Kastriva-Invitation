'use client';
import {useState} from 'react';
import type {GiftAccount} from '@/lib/types';
import {completeGift} from '@/lib/invitation-extras';

export default function InvitationGifts({id,accounts,demo=false}:{id?:string;accounts:GiftAccount[];demo?:boolean}) {
 const [status,setStatus]=useState('');
 const rows=accounts.filter(completeGift);
 if(!rows.length)return null;
 async function copy(account:string){
  try{await navigator.clipboard.writeText(account);setStatus(demo?'Nomor contoh disalin. Jangan digunakan untuk transfer.':'Nomor rekening disalin.');}
  catch{setStatus('Salin nomor secara manual dengan memilih teks nomor rekening.');}
 }
 return <section id={id} tabIndex={-1} data-inv-section className="inv-section inv-gifts">
  <p className="overline">A TOKEN OF LOVE</p><h2>Amplop digital</h2>
  <p className="gift-intro">Doa restu dan kehadiran Anda adalah hadiah terindah. Bagi yang ingin berbagi tanda kasih, kami menyediakan rekening berikut.</p>
  {demo&&<p className="notice">Contoh tampilan. Nomor di bawah bukan rekening untuk menerima hadiah.</p>}
  <details className="gift-disclosure"><summary>Tampilkan rekening <span aria-hidden="true">＋</span></summary>
   <div className="gift-accounts">{rows.map((row,i)=><article className="gift-account" key={i}>
    <svg viewBox="0 0 40 28" aria-hidden="true" fill="none" stroke="currentColor"><rect x="1" y="1" width="38" height="26" rx="4"/><path d="M1 8h38M7 19h9m4 0h5"/></svg>
    <h3>{row.bank}</h3><p className="gift-number" aria-label={'Nomor rekening '+row.account}>{row.account}</p><p>a.n. {row.holder}</p>
    <button className="inv-button outline" type="button" onClick={()=>void copy(row.account)}>{demo?'Salin nomor contoh':'Salin nomor rekening'}</button>
   </article>)}</div>
   <p className="gift-copy-status" role="status">{status}</p>
  </details>
 </section>;
}
