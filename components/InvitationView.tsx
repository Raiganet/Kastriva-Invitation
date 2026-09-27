'use client';
import ThemeMotif from '@/components/ThemeMotif';
import InvitationAtmosphere from '@/components/InvitationAtmosphere';
import Link from 'next/link';
import PublicRsvp from '@/components/guests/PublicRsvp';
import { useEffect, useId, useState } from 'react';
import type { DraftContent, Template } from '@/lib/types';
import { calendarFile, countdown, eventInstant, invitationEvents, eventDateLabel, safeMapHref } from '@/lib/domain';
import { categories } from '@/lib/templates';
export default function InvitationView({template,content,guest='Tamu Undangan',mode='demo',photoUrls=[],coverUrl,embedded=false,expiresAt,rsvpSlug}:{template:Template;content:DraftContent;guest?:string;mode?:'demo'|'draft'|'public';photoUrls?:string[];coverUrl?:string;embedded?:boolean;expiresAt?:string;rsvpSlug?:string}) {
 const [expired,setExpired]=useState(false);
 const [opened,setOpened]=useState(false),[opening,setOpening]=useState(false), [ticks,setTicks]=useState([0,0,0,0]);
 const [message,setMessage]=useState(''), [sample,setSample]=useState<{name:string;message:string}|null>(null);
 const wedding=template.category==='pernikahan'; const names=[content.groom,content.bride].filter(Boolean).join(' & ')||'Nama pasangan';
 const target=eventInstant(content), events=invitationEvents(content);
 const uid=useId().replace(/:/g,'');const contentId='inv-content-'+uid, eventId='inv-events-'+uid;
 const Root=embedded?'div':'main', cover=coverUrl===undefined?photoUrls[0]:coverUrl;
 useEffect(()=>{const tick=()=>setTicks(countdown(target,Date.now()));tick();const timer=window.setInterval(tick,1000);return()=>window.clearInterval(timer);},[target]);
 useEffect(()=>{if(!opened)return;document.getElementById(contentId)?.focus();},[opened,contentId]);
 useEffect(()=>{if(!opening)return;const timer=window.setTimeout(()=>{setOpened(true);setOpening(false);},620);return()=>window.clearTimeout(timer);},[opening]);
 useEffect(()=>{
  if(!opened)return;
  const root=document.getElementById(contentId);
  const preference=window.matchMedia('(prefers-reduced-motion: reduce)');
  if(!root||preference.matches||!('IntersectionObserver' in window))return;
  const sections=Array.from(root.querySelectorAll<HTMLElement>('.inv-section,.inv-closing'));
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.remove('inv-reveal-pending');entry.target.classList.add('inv-revealed');observer.unobserve(entry.target);}}),{threshold:0,rootMargin:'0px 0px -35px 0px'});
  sections.forEach(section=>{if(section.getBoundingClientRect().top>window.innerHeight){section.classList.add('inv-reveal-pending');observer.observe(section);}});
  const revealAll=()=>{observer.disconnect();sections.forEach(s=>s.classList.remove('inv-reveal-pending'));};
  preference.addEventListener('change',revealAll);
  return()=>{revealAll();preference.removeEventListener('change',revealAll);};
 },[opened,contentId]);
 function openInvitation(){if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)setOpened(true);else setOpening(true);}
 useEffect(()=>{if(mode!=='public'||!expiresAt)return;const tick=()=>setExpired(Date.parse(expiresAt)<=Date.now());tick();const timer=window.setInterval(tick,1000);return()=>window.clearInterval(timer);},[mode,expiresAt]);
 const date=eventDateLabel(content.eventDate);
 function downloadCalendar(event=events[0]){try{const blob=new Blob([calendarFile({...content,...event},template.slug+'-'+event.id+'-'+event.eventDate)],{type:'text/calendar;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='undangan-kastriva.ics';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch{setMessage('Lengkapi tanggal dan jam acara terlebih dahulu.');}}
 if(expired)return <main className="empty-state"><h1>Masa aktif undangan berakhir.</h1><p>Silakan hubungi pengirim undangan.</p></main>;
 return <Root className={`invitation theme-${template.slug}${embedded?' inv-embedded':''}`}>
  {!embedded&&mode!=='public'&&<div className="inv-toolbar"><Link href={mode==='demo'?'/tema':'/dashboard'}>← {mode==='demo'?'Koleksi tema':'Dashboard'}</Link><span>{mode==='demo'?'DEMO · DATA CONTOH':'PREVIEW DRAFT · PRIVAT'}</span>{mode==='demo'&&wedding?<Link href={`/order/${template.slug}`}>Pilih tema ↗</Link>:<span>{template.name}</span>}</div>}
  {!opened?<section className={opening ? "inv-cover is-opening" : "inv-cover"}><InvitationAtmosphere slug={template.slug}/><div className="cover-frame"><span className="cover-motif" aria-hidden><ThemeMotif slug={template.slug}/></span>{cover&&<img className="cover-photo" src={cover} alt="Foto sampul undangan" referrerPolicy="no-referrer"/>}<p className="overline">{wedding?'THE WEDDING OF':categories[template.category]?.toUpperCase()}</p><h1>{names}</h1><div className="inv-rule"/><p>{date}</p><div className="guest-card"><small>Kepada Yth.</small><strong>{guest}</strong><span>Dengan hormat, kami mengundang Anda</span></div><button className="inv-button" disabled={opening} aria-busy={opening} onClick={openInvitation}>{opening?'Membuka undangan…':'Buka undangan'} <span aria-hidden>↗</span></button><p className="cover-note">{mode==='demo'?'Anda sedang mencoba demo. Bukan undangan acara nyata.':mode==='public'?'Kami menantikan kehadiran Anda.':'Draft ini hanya dapat dilihat pemilik akun.'}</p></div></section>:
  <div id={contentId} className="inv-content" tabIndex={-1}>
    <section className="inv-hero"><InvitationAtmosphere slug={template.slug}/><span className="cover-motif" aria-hidden><ThemeMotif slug={template.slug}/></span><p className="overline">{wedding?'A NEW CHAPTER BEGINS':'MOMEN ISTIMEWA'}</p><h1>{names}</h1><p>{date}</p><div className="inv-rule"/><p className="inv-opening">{content.opening||'Salam hangat untuk Anda.'}</p><a className="inv-button outline" href={"#"+eventId} onClick={e=>{if(mode==='public'&&rsvpSlug){e.preventDefault();document.getElementById(eventId)?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});}}}>Lihat detail acara ↓</a></section>
    {wedding&&<section className="inv-section"><p className="overline">BERSAMA MENUJU HARI BAHAGIA</p><h2>Kami yang berbahagia</h2><div className="couple-grid"><div><div className="person-monogram" aria-hidden>{content.groom?.slice(0,1)||'A'}</div><h3>{content.groom||'Mempelai pria'}</h3><p>{content.groomParents}</p></div><span className="couple-and">&</span><div><div className="person-monogram" aria-hidden>{content.bride?.slice(0,1)||'S'}</div><h3>{content.bride||'Mempelai wanita'}</h3><p>{content.brideParents}</p></div></div></section>}
    <section id={eventId} className="inv-section alternate"><p className="overline">SAVE THE DATE</p><h2>Waktu & tempat</h2><div className="countdown" aria-label="Hitung mundur acara utama">{['Hari','Jam','Menit','Detik'].map((label,i)=><div key={label}><strong suppressHydrationWarning>{String(ticks[i]).padStart(2,'0')}</strong><small>{label}</small></div>)}</div>{events.map((event,i)=><div className="event-box" key={event.id}><span aria-hidden>✦</span><h3>{wedding?(event.label||`Acara ${i+1}`):categories[template.category]}</h3><strong>{eventDateLabel(event.eventDate)}</strong><p>{event.eventTime||'--:--'} – {event.endTime||'--:--'} {event.timezone==='Asia/Makassar'?'WITA':event.timezone==='Asia/Jayapura'?'WIT':'WIB'}</p><h4>{event.venue||'Lokasi belum diisi'}</h4><p>{event.address}</p><div className="button-row centered">{safeMapHref(event.mapUrl)?<a className="inv-button" href={safeMapHref(event.mapUrl)} target="_blank" rel="noopener noreferrer">Buka peta ↗</a>:<span className="muted">Tautan peta belum lengkap.</span>}<button className="inv-button outline" disabled={!event.eventDate} onClick={()=>downloadCalendar(event)}>Simpan tanggal</button></div></div>)}</section>
    {content.story&&<section className="inv-section"><p className="overline">OUR JOURNEY</p><h2>Cerita kami</h2><p className="story-text">{content.story}</p></section>}
    <section className="inv-section alternate"><p className="overline">LITTLE MOMENTS, BIG MEMORIES</p><h2>Galeri kenangan</h2>{photoUrls.length?<div className="photo-grid">{photoUrls.map((url,i)=><a href={url} key={url} target="_blank" rel="noopener noreferrer"><img src={url} alt={`Foto undangan ${i+1}`} loading="lazy" referrerPolicy="no-referrer"/></a>)}</div>:<><div className="photo-placeholders" aria-hidden>{['Sebuah pertemuan','Sebuah cerita','Selamanya bersama'].map((x,i)=><div key={x}><span>{['✿','♡','✦'][i]}</span><small>{x}</small></div>)}</div><p className="inv-caption">{mode==='demo'?'Ilustrasi posisi galeri. Foto pelanggan diunggah melalui editor.':mode==='public'?'Terima kasih telah menjadi bagian dari cerita kami.':'Belum ada foto di draft ini.'}</p></>}</section>
    {mode==='demo'&&<section className="inv-section"><p className="overline">COBA INTERAKSI</p><h2>Konfirmasi kehadiran</h2><p className="notice">Simulasi saja. Respons tidak dikirim ke server dan hilang saat halaman dimuat ulang. RSVP nyata hanya tersedia pada undangan terbit melalui tautan tamu khusus.</p><form className="rsvp-form" onSubmit={e=>{e.preventDefault();const f=new FormData(e.currentTarget);setSample({name:String(f.get('name')||''),message:String(f.get('message')||'')});setMessage('Simulasi berhasil. Tidak ada konfirmasi yang disimpan ke server.');}}><label>Nama Anda<input name="name" maxLength={100} required placeholder="Nama tamu"/></label><label>Konfirmasi<select name="attendance" required defaultValue=""><option value="" disabled>Pilih kehadiran</option><option value="hadir">Hadir</option><option value="tidak">Tidak hadir</option></select></label><label>Ucapan<textarea name="message" maxLength={500} rows={3} placeholder="Tulis harapan baik Anda"/></label><button className="inv-button" type="submit">Coba simulasi RSVP</button></form>{sample&&<div className="wish-card"><strong>{sample.name}</strong><p>{sample.message||'Terima kasih atas konfirmasi contoh Anda.'}</p><small>Contoh lokal — belum tersimpan</small></div>}</section>}
    {mode==='public'&&rsvpSlug&&<PublicRsvp slug={rsvpSlug}/>}
    {message&&<p role="status" className="inv-status">{message}</p>}
    <section className="inv-closing"><p>Merupakan kebahagiaan bagi kami<br/>apabila Anda berkenan hadir.</p><h2>{names}</h2><small>Made with care · Kastriva Invitation</small>{mode==='demo'&&wedding&&<div><Link className="inv-button" href={`/order/${template.slug}`}>Gunakan tema ini ↗</Link></div>}</section>
  </div>}
 </Root>;
}
