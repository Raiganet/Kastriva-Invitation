'use client';
import type {DraftContent,GiftAccount} from '@/lib/types';
import {DEFAULT_MUSIC_VOLUME,MUSIC_TRACKS,ORIGINAL_MUSIC_TRACKS,HERITAGE_MUSIC_TRACKS,musicTrack,type InvitationMusic} from '@/lib/music-library';
import {resolveThemeMusic,weddingMusic} from '@/lib/theme-music';
import {useInvitationMusic} from '@/components/useInvitationMusic';

export default function InvitationExtrasEditor({theme,content,onChange}:{theme:string;content:DraftContent;onChange:(next:DraftContent)=>void}){
 const gifts=content.gifts||[],selected=content.music??'none',volume=content.musicVolume??DEFAULT_MUSIC_VOLUME;
 const resolved=resolveThemeMusic(theme,selected),preview=useInvitationMusic(resolved,true,volume),meta=musicTrack(resolved);
 const recommendation=weddingMusic(theme),recommended=musicTrack(recommendation?.track??'none');
 const weddingTracks=MUSIC_TRACKS.filter(track=>track.group==='wedding');
 const aqiqahTracks=MUSIC_TRACKS.filter(track=>track.group==='aqiqah');
 function changeGift(index:number,key:keyof GiftAccount,value:string){onChange({...content,gifts:gifts.map((row,i)=>i===index?{...row,[key]:value}:row)});}
 return <>
  <h2>Musik & tanda kasih.</h2>
  <section className="music-picker" aria-label="Pilihan musik undangan">
   <div className="music-picker-heading"><div><span className="eyebrow">{recommendation?'INSTRUMENTAL WEDDING COLLECTION':'MUSIC COLLECTION'}</span><h3>Pilih suasana undangan</h3><p>{recommendation?'Instrumental pilihan untuk melengkapi warna, ornamen, dan karakter tema pernikahan Anda.':'Musik original Kastriva dan koleksi MP3 yang telah diimpor pengelola.'} Audio baru diputar setelah interaksi pengguna.</p></div>{selected!=='none'&&<button className="button ghost small" type="button" onClick={preview.toggle}>{preview.playing?'Hentikan preview':'▶ Preview musik'}</button>}</div>
   {recommendation&&recommended&&<div className="music-theme-recommendation"><span className="eyebrow">SERASI DENGAN TEMA ANDA</span><strong>{recommended.name}</strong><p>{recommendation.description}</p>{selected==='theme'?<small>Otomatis aktif · musik mengikuti pilihan tema.</small>:<button type="button" className="button ghost small" onClick={()=>onChange({...content,music:'theme',musicVolume:content.musicVolume??45})}>Gunakan musik sesuai tema</button>}</div>}
   <label>Musik latar<select value={selected} onChange={e=>onChange({...content,music:e.target.value as InvitationMusic,musicVolume:content.musicVolume??DEFAULT_MUSIC_VOLUME})}>
    <option value="none">Tanpa musik</option>
    {(recommendation||selected==='theme')&&<option value="theme">Otomatis sesuai tema{recommended?' — '+recommended.name:''}</option>}
    {(recommendation||meta?.group==='heritage')&&<optgroup label="Instrumental Nusantara · Original Kastriva">{HERITAGE_MUSIC_TRACKS.map(track=><option value={track.id} key={track.id}>{track.name} — {track.mood}</option>)}</optgroup>}
    <optgroup label="Instrumental romantis · Original Kastriva">{ORIGINAL_MUSIC_TRACKS.map(track=><option value={track.id} key={track.id}>{track.name} — {track.mood}</option>)}</optgroup>
    {!!weddingTracks.length&&<optgroup label="Pop Indonesia · Pernikahan">{weddingTracks.map(track=><option value={track.id} key={track.id}>{track.artist} — {track.name}</option>)}</optgroup>}
    {!!aqiqahTracks.length&&<optgroup label="Aqiqah">{aqiqahTracks.map(track=><option value={track.id} key={track.id}>{track.artist} — {track.name}</option>)}</optgroup>}
   </select></label>
   {meta&&<div className="music-selection-card"><span className={preview.playing?'music-selection-icon is-playing':'music-selection-icon'} aria-hidden><i/><i/><i/><i/></span><div><strong>{meta.name}</strong><small>{meta.kind==='file'?meta.artist:meta.mood}</small><p>{meta.detail}</p></div></div>}
   {selected!=='none'&&<label className="music-volume-control"><span>Volume musik <strong>{volume}%</strong></span><input aria-label="Volume musik" type="range" min={0} max={100} step={5} value={volume} onChange={e=>onChange({...content,musicVolume:Number(e.target.value)})}/><small>0% senyap · 100% maksimal. Perubahan terdengar langsung saat preview musik sedang berjalan.</small></label>}
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
