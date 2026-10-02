'use client';
import BotanicalBlushArtwork from '@/components/BotanicalBlushArtwork';
import ElementorLuxuryArtwork from '@/components/ElementorLuxuryArtwork';
import HeritageArtwork from '@/components/HeritageArtwork';
import AuroraModernArtwork from '@/components/AuroraModernArtwork';
import ElegantRoseCouple from '@/components/ElegantRoseCouple';
import {isHeritageTheme} from '@/lib/theme-registry';
import ThemeMotif from '@/components/ThemeMotif';
import InvitationAtmosphere from '@/components/InvitationAtmosphere';
import InvitationNames from '@/components/InvitationNames';
import InvitationGallery from '@/components/InvitationGallery';
import InvitationLocation from '@/components/InvitationLocation';
import InvitationGifts from '@/components/InvitationGifts';
import {completeGift} from '@/lib/invitation-extras';
import InvitationStory from '@/components/InvitationStory';
import {useInvitationMusic} from '@/components/useInvitationMusic';
import InvitationNav,{type InvitationNavItem} from '@/components/InvitationNav';
import Link from 'next/link';
import PublicOpenWishes from '@/components/wishes/PublicOpenWishes';
import PublicRsvp from '@/components/guests/PublicRsvp';
import { useEffect, useId, useMemo, useState } from 'react';
import type { DraftContent, Template } from '@/lib/types';
import { calendarFile, countdown, eventInstant, invitationEvents, eventDateLabel } from '@/lib/domain';
import { categories } from '@/lib/templates';
import {DEFAULT_MUSIC_VOLUME} from '@/lib/music-library';
export default function InvitationView({template,content,guest='Tamu Undangan',mode='demo',photoUrls=[],coverUrl,embedded=false,expiresAt,rsvpSlug,openWishesSlug,previewOnly=false}:{template:Template;content:DraftContent;guest?:string;mode?:'demo'|'draft'|'public';photoUrls?:string[];coverUrl?:string;embedded?:boolean;expiresAt?:string;rsvpSlug?:string;openWishesSlug?:string;previewOnly?:boolean}) {
 const [expired,setExpired]=useState(false);
 const [opened,setOpened]=useState(false),[opening,setOpening]=useState(false), [ticks,setTicks]=useState([0,0,0,0]);
 const [message,setMessage]=useState(''), [sample,setSample]=useState<{name:string;message:string}|null>(null);
 const cinematic=template.slug==='galaxy-night';
  const importedLuxury=template.slug==='elementor-luxury-1';
 const botanicalBlush=template.slug==='botanical-blush';
 const auroraModern=template.slug==='aurora-modern';
 const elegantRose=template.slug==='elegant-rose';
 const music=useInvitationMusic(content.music||'none',!expired,content.musicVolume??DEFAULT_MUSIC_VOLUME);
 const wedding=template.category==='pernikahan'; const names=[content.groom,content.bride].filter(Boolean).join(' & ')||'Nama pasangan';
 const target=eventInstant(content), events=invitationEvents(content);
 const uid=useId().replace(/:/g,'');const contentId='inv-content-'+uid, eventId='inv-events-'+uid;
 const heroId='inv-hero-'+uid,coupleId='inv-couple-'+uid,storyId='inv-story-'+uid,galleryId='inv-gallery-'+uid,giftId='inv-gifts-'+uid,wishesId='inv-wishes-'+uid;
 const hasGifts=!!content.gifts?.some(completeGift);
 const hasStory=!!content.story;
 const navigation=useMemo<InvitationNavItem[]>(()=>[
  {id:heroId,label:'Awal',icon:'home'},
  ...(wedding?[{id:coupleId,label:'Pasangan',icon:'couple' as const}]:[]),
  {id:eventId,label:'Acara',icon:'calendar'},
  ...(hasStory?[{id:storyId,label:'Cerita',icon:'story' as const}]:[]),
  {id:galleryId,label:'Galeri',icon:'gallery'},
  ...(mode==='public'&&openWishesSlug?[{id:wishesId,label:'Ucapan',icon:'story' as const}]:[]),
  ...(hasGifts?[{id:giftId,label:'Hadiah',icon:'gift' as const}]:[]),
 ],[heroId,coupleId,eventId,storyId,galleryId,giftId,wedding,hasStory,hasGifts,mode,openWishesSlug,wishesId]);
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
 function openInvitation(){void music.start();if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)setOpened(true);else setOpening(true);}
 useEffect(()=>{if(mode!=='public'||!expiresAt)return;const tick=()=>setExpired(Date.parse(expiresAt)<=Date.now());tick();const timer=window.setInterval(tick,1000);return()=>window.clearInterval(timer);},[mode,expiresAt]);
 const date=eventDateLabel(content.eventDate);
 function downloadCalendar(event=events[0]){try{const blob=new Blob([calendarFile({...content,...event},template.slug+'-'+event.id+'-'+event.eventDate)],{type:'text/calendar;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='undangan-kastriva.ics';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch{setMessage('Lengkapi tanggal dan jam acara terlebih dahulu.');}}
 if(expired)return <main className="empty-state"><h1>Masa aktif undangan berakhir.</h1><p>Silakan hubungi pengirim undangan.</p></main>;
   return <Root className={`invitation theme-${template.slug}${embedded?' inv-embedded':''}${cinematic?' inv-cinematic':''}${auroraModern?' inv-aurora':''}${isHeritageTheme(template.slug)?' inv-heritage':''}`}>
   {!embedded&&mode!=='public'&&<div className="inv-toolbar"><Link href={mode==='demo'?'/tema':'/dashboard'}>← {mode==='demo'?'Koleksi tema':'Dashboard'}</Link><span>{mode==='demo'?'DEMO · DATA CONTOH':'PREVIEW DRAFT · PRIVAT'}</span>{mode==='demo'&&wedding&&!previewOnly?<Link href={`/order/${template.slug}`}>Pilih tema ↗</Link>:<span>{template.name}</span>}</div>}
   {!opened?<section className={opening ? "inv-cover is-opening" : "inv-cover"}>{cinematic&&cover&&<img className="cinematic-photo" src={cover} alt="" referrerPolicy="no-referrer"/>}<BotanicalBlushArtwork slug={template.slug}/><ElementorLuxuryArtwork slug={template.slug}/><HeritageArtwork slug={template.slug}/><AuroraModernArtwork slug={template.slug} mode="ambient"/><InvitationAtmosphere slug={template.slug}/><div className="cover-frame"><span className="cover-motif" aria-hidden><ThemeMotif slug={template.slug}/></span>{template.slug==='islami-sakinah'&&<p className="heritage-bismillah" lang="ar" dir="rtl">بسم الله الرحمن الرحيم</p>}{auroraModern&&<AuroraModernArtwork slug={template.slug} mode="portrait" photo={cover} names={names}/>} {botanicalBlush&&<BotanicalBlushArtwork slug={template.slug} portrait photo={cover} names={[content.groom,content.bride]}/>}{importedLuxury&&<ElementorLuxuryArtwork slug={template.slug} portrait photo={cover} names={[content.groom,content.bride]}/>}{cover&&!cinematic&&!importedLuxury&&!botanicalBlush&&!auroraModern&&<img className="cover-photo" src={cover} alt="Foto sampul undangan" referrerPolicy="no-referrer"/>}<p className="overline">{wedding?'THE WEDDING OF':categories[template.category]?.toUpperCase()}</p><InvitationNames groom={content.groom} bride={content.bride} wedding={wedding}/><div className="inv-rule"/><p>{date}</p><div className="guest-card"><small>Kepada Yth.</small><strong>{guest}</strong><span>Dengan hormat, kami mengundang Anda</span></div><button className="inv-button" disabled={opening} aria-busy={opening} onClick={openInvitation}>{opening?'Membuka undangan…':'Buka undangan'} <span aria-hidden>↗</span></button><p className="cover-note">{mode==='demo'?'Anda sedang mencoba demo. Bukan undangan acara nyata.':mode==='public'?'Kami menantikan kehadiran Anda.':'Draft ini hanya dapat dilihat pemilik akun.'}</p></div></section>:
  <div id={contentId} className="inv-content" tabIndex={-1}>
    <section id={heroId} tabIndex={-1} data-inv-section className="inv-hero">{cinematic&&cover&&<img className="cinematic-photo" src={cover} alt="" referrerPolicy="no-referrer"/>}<BotanicalBlushArtwork slug={template.slug}/><ElementorLuxuryArtwork slug={template.slug}/><HeritageArtwork slug={template.slug}/><AuroraModernArtwork slug={template.slug} mode="ambient"/><InvitationAtmosphere slug={template.slug}/><span className="cover-motif" aria-hidden><ThemeMotif slug={template.slug}/></span>{auroraModern&&<AuroraModernArtwork slug={template.slug} mode="portrait" photo={cover} names={names}/>}{botanicalBlush&&<BotanicalBlushArtwork slug={template.slug} portrait photo={cover} names={[content.groom,content.bride]}/>}{importedLuxury&&<ElementorLuxuryArtwork slug={template.slug} portrait photo={cover} names={[content.groom,content.bride]}/>}<p className="overline">{wedding?'A NEW CHAPTER BEGINS':'MOMEN ISTIMEWA'}</p><InvitationNames groom={content.groom} bride={content.bride} wedding={wedding}/><p>{date}</p><div className="inv-rule"/><p className="inv-opening">{content.opening||'Salam hangat untuk Anda.'}</p><a className="inv-button outline" href={"#"+eventId} onClick={e=>{if(mode==='public'&&rsvpSlug){e.preventDefault();document.getElementById(eventId)?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});}}}>Lihat detail acara ↓</a></section>
    {wedding&&<section id={coupleId} tabIndex={-1} data-inv-section className="inv-section"><p className="overline">BERSAMA MENUJU HARI BAHAGIA</p><h2>Kami yang berbahagia</h2>{elegantRose?<ElegantRoseCouple content={content} photos={photoUrls}/>:<div className="couple-grid"><div><div className="person-monogram" aria-hidden>{content.groom?.slice(0,1)||'A'}</div><h3>{content.groom||'Mempelai pria'}</h3><p>{content.groomParents}</p></div><span className="couple-and">&</span><div><div className="person-monogram" aria-hidden>{content.bride?.slice(0,1)||'S'}</div><h3>{content.bride||'Mempelai wanita'}</h3><p>{content.brideParents}</p></div></div>}</section>}
    <section id={eventId} tabIndex={-1} data-inv-section className="inv-section alternate"><p className="overline">SAVE THE DATE</p><h2>Waktu & tempat</h2><div className="countdown" aria-label="Hitung mundur acara utama">{['Hari','Jam','Menit','Detik'].map((label,i)=><div key={label}><strong suppressHydrationWarning>{String(ticks[i]).padStart(2,'0')}</strong><small>{label}</small></div>)}</div>{events.map((event,i)=><div className="event-box" key={event.id}><span className="event-sequence">ACARA {String(i+1).padStart(2,'0')}</span><h3>{wedding?(event.label||`Acara ${i+1}`):categories[template.category]}</h3><strong>{eventDateLabel(event.eventDate)}</strong><p>{event.eventTime||'--:--'} – {event.endTime||'--:--'} {event.timezone==='Asia/Makassar'?'WITA':event.timezone==='Asia/Jayapura'?'WIT':'WIB'}</p><InvitationLocation venue={event.venue} address={event.address} url={event.mapUrl} demo={mode==='demo'}/><div className="button-row centered"><button className="inv-button outline" disabled={!event.eventDate} onClick={()=>downloadCalendar(event)}>Simpan tanggal</button></div></div>)}</section>
    {content.story&&<section id={storyId} tabIndex={-1} data-inv-section className="inv-section"><p className="overline">OUR JOURNEY</p><h2>Cerita kami</h2><InvitationStory story={content.story} cinematic={cinematic} variant={elegantRose?'elegant-rose':'default'} photos={elegantRose?photoUrls.slice(2):[]}/></section>}
    <section id={galleryId} tabIndex={-1} data-inv-section className="inv-section alternate"><p className="overline">LITTLE MOMENTS, BIG MEMORIES</p><h2>Galeri kenangan</h2>{photoUrls.length?<InvitationGallery key={photoUrls.join('|')} urls={photoUrls} variant={elegantRose?'elegant-rose':'default'}/>:<><div className="photo-placeholders" aria-hidden>{['Sebuah pertemuan','Sebuah cerita','Selamanya bersama'].map(x=><div key={x}><span><ThemeMotif slug={template.slug}/></span><small>{x}</small></div>)}</div><p className="inv-caption">{mode==='demo'?'Ilustrasi posisi galeri. Foto pelanggan diunggah melalui editor.':mode==='public'?'Terima kasih telah menjadi bagian dari cerita kami.':'Belum ada foto di draft ini.'}</p></>}</section>
    {mode==='demo'&&<section className="inv-section"><p className="overline">COBA INTERAKSI</p><h2>Konfirmasi kehadiran</h2><p className="notice">Simulasi saja. Respons tidak dikirim ke server dan hilang saat halaman dimuat ulang. RSVP nyata hanya tersedia pada undangan terbit melalui tautan tamu khusus.</p><form className="rsvp-form" onSubmit={e=>{e.preventDefault();const f=new FormData(e.currentTarget);setSample({name:String(f.get('name')||''),message:String(f.get('message')||'')});setMessage('Simulasi berhasil. Tidak ada konfirmasi yang disimpan ke server.');}}><label>Nama Anda<input name="name" maxLength={100} required placeholder="Nama tamu"/></label><label>Konfirmasi<select name="attendance" required defaultValue=""><option value="" disabled>Pilih kehadiran</option><option value="hadir">Hadir</option><option value="tidak">Tidak hadir</option></select></label><label>Ucapan<textarea name="message" maxLength={500} rows={3} placeholder="Tulis harapan baik Anda"/></label><button className="inv-button" type="submit">Coba simulasi RSVP</button></form>{sample&&<div className="wish-card"><strong>{sample.name}</strong><p>{sample.message||'Terima kasih atas konfirmasi contoh Anda.'}</p><small>Contoh lokal — belum tersimpan</small></div>}</section>}
    {mode==='public'&&openWishesSlug&&<PublicOpenWishes key={openWishesSlug} slug={openWishesSlug} id={wishesId}/>}
    {mode==='public'&&rsvpSlug&&<PublicRsvp slug={rsvpSlug}/>}
    {!!content.gifts?.length&&<InvitationGifts id={giftId} accounts={content.gifts} demo={mode==='demo'}/> }
    {message&&<p role="status" className="inv-status">{message}</p>}
    <section className="inv-closing"><p>Merupakan kebahagiaan bagi kami<br/>apabila Anda berkenan hadir.</p><h2>{names}</h2><small>Made with care · Kastriva Invitation</small>{mode==='demo'&&wedding&&!previewOnly&&<div><Link className="inv-button" href={`/order/${template.slug}`}>Gunakan tema ini ↗</Link></div>}</section>
  </div>}
  {opened&&content.music&&content.music!=='none'&&<div className="inv-music"><button type="button" className="music-toggle" onClick={music.toggle} aria-label={music.playing?`Jeda ${music.label}`:`Putar ${music.label}`} aria-pressed={music.playing} title={music.label}><span className="music-bars" aria-hidden="true"><i/><i/><i/></span><span>{music.playing?'Jeda':'Musik'}</span></button><small className="music-track-label">{music.label}</small>{music.error&&<p role="status">{music.error}</p>}</div>}
  {opened&&!embedded&&<InvitationNav items={navigation}/>}
 </Root>;
}
