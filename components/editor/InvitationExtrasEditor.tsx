'use client';
import type {DraftContent,GiftAccount} from '@/lib/types';
import {MUSIC_TRACKS,musicTrack,type InvitationMusic} from '@/lib/music-library';
import {useInvitationMusic} from '@/components/useInvitationMusic';

export default function InvitationExtrasEditor({content,onChange}:{content:DraftContent;onChange:(next:DraftContent)=>void}){
 const gifts=content.gifts||[],selected=(content.music||'none') as InvitationMusic,preview=useInvitationMusic(selected,true),meta=musicTrack(selected);
 function changeGift(index:number,key:keyof GiftAccount,value:string){onChange({...content,gifts:gifts.map((row,i)=>i===index?{...row,[key]:value}:row)});}
 return <>
  <h2>Musik & tanda kasih.</h2>
  <section className="music-picker" aria-label="Pilihan musik undangan">
   <div className="music-picker-heading"><div><span className="eyebrow">MUSIC COLLECTION</span><h3>Pilih suasana undangan</h3><p>8 komposisi instrumental original Kastriva. Tidak memakai lagu pihak ketiga dan baru diputar setelah interaksi pengguna.</p></div>{selected!=='none'&&<button className="button ghost small" type="button" onClick={preview.toggle}>{preview.playing?'Hentikan preview':'▶ Preview musik'}</button>}</div>
   <label>Musik latar<select value={selected} onChange={e=>onChange({...content,music:e.target.value as InvitationMusic})}><option value="none">Tanpa musik</option>{MUSIC_TRACKS.map(track=><option value={track.id} key={track.id}>{track.name} — {track.mood}</option>)}</select></label>
   {meta&&<div className="music-selection-card"><span className={preview.playing?'music-selection-icon is-playing':'music-selection-icon'} aria-hidden><i/><i/><i/><i/></span><div><strong>{meta.name}</strong><small>{meta.mood}</small><p>{meta.detail}</p></div></div>}
   {preview.error&&<p className="notice error" role="status">{preview.error}</p>}
  </section>
  <p className="editor-tip">Musik diputar setelah tamu menekan <strong>Buka undangan</strong>, dapat dijeda kapan saja, dan otomatis berhenti saat tab tidak aktif.</p>
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
