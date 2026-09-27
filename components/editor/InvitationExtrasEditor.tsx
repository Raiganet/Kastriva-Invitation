'use client';
import type {DraftContent,GiftAccount} from '@/lib/types';

export default function InvitationExtrasEditor({content,onChange}:{content:DraftContent;onChange:(next:DraftContent)=>void}){
 const gifts=content.gifts||[];
 function changeGift(index:number,key:keyof GiftAccount,value:string){onChange({...content,gifts:gifts.map((row,i)=>i===index?{...row,[key]:value}:row)});}
 return <>
  <h2>Musik & tanda kasih.</h2>
  <label>Musik latar<select value={content.music||'none'} onChange={e=>onChange({...content,music:e.target.value as DraftContent['music']})}><option value="none">Tanpa musik</option><option value="serenade">Serenade — instrumental lembut</option></select></label>
  <p className="editor-tip">Instrumental bawaan Kastriva. Musik dimulai setelah tamu menekan Buka undangan dan dapat dijeda kapan saja. Untuk mendengarkan, buka preview dan tekan tombol Musik.</p>
  <h3>Amplop digital</h3><p className="muted">Opsional, maksimal 3 rekening bank atau dompet digital. Rekening ini untuk hadiah dari tamu, terpisah dari pembayaran paket Kastriva.</p>
  {gifts.map((gift,i)=><section className="event-editor" key={i}><div className="event-editor-heading"><strong>Rekening hadiah {i+1}</strong><button type="button" className="text-button danger-text" onClick={()=>onChange({...content,gifts:gifts.filter((_,index)=>index!==i)})}>Hapus rekening {i+1}</button></div>
   <label>Nama bank / dompet digital<input value={gift.bank} maxLength={60} placeholder="Misalnya Mandiri atau DANA" onChange={e=>changeGift(i,'bank',e.target.value)}/></label>
   <label>Nomor rekening / nomor dompet digital<input value={gift.account} inputMode="numeric" maxLength={30} placeholder="Hanya angka, termasuk awalan nol" onChange={e=>changeGift(i,'account',e.target.value.replace(/[^0-9]/g,''))}/></label>
   <label>Nama pemilik rekening<input value={gift.holder} maxLength={100} onChange={e=>changeGift(i,'holder',e.target.value)}/></label>
  </section>)}
  <button className="button ghost" type="button" disabled={gifts.length>=3} onClick={()=>onChange({...content,gifts:[...gifts,{bank:'',account:'',holder:''}]})}>+ Tambah rekening hadiah</button>
  <p className="notice">Rekening yang Anda isi akan terlihat oleh pengunjung setelah undangan diterbitkan. Periksa nama dan nomor sebelum menerbitkan. Kastriva menampilkan rekening dan tombol salin; transfer dilakukan langsung melalui aplikasi bank atau dompet digital tamu.</p>
 </>;
}
