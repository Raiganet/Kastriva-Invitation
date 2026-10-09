'use client';
import BotanicalBlushArtwork from '@/components/BotanicalBlushArtwork';
import ElementorLuxuryArtwork from '@/components/ElementorLuxuryArtwork';
import HeritageArtwork from '@/components/HeritageArtwork';
import AuroraModernArtwork from '@/components/AuroraModernArtwork';
import ElegantRoseCouple from '@/components/ElegantRoseCouple';
import {isHeritageTheme} from '@/lib/theme-registry';
import ThemeMotif from '@/components/ThemeMotif';
import InvitationAtmosphere from '@/components/InvitationAtmosphere';
import InvitationOrnaments, {InvitationDivider} from '@/components/InvitationOrnaments';
import InvitationNames from '@/components/InvitationNames';
import InvitationAutoScroll from '@/components/InvitationAutoScroll';
import InvitationCoverPanels,{invitationOpeningStyle} from '@/components/InvitationCoverPanels';
import InvitationDemoWishes from '@/components/InvitationDemoWishes';
import InvitationPortrait from '@/components/InvitationPortrait';
import InvitationGallery from '@/components/InvitationGallery';
import InvitationClosing from '@/components/InvitationClosing';
import InvitationCountdown from '@/components/InvitationCountdown';
import InvitationEventCard from '@/components/InvitationEventCard';
import InvitationGifts from '@/components/InvitationGifts';
import {completeGift} from '@/lib/invitation-extras';
import InvitationStory from '@/components/InvitationStory';
import {useInvitationMusic} from '@/components/useInvitationMusic';
import InvitationNav,{type InvitationNavItem} from '@/components/InvitationNav';
import Link from 'next/link';
import PublicOpenWishes from '@/components/wishes/PublicOpenWishes';
import PublicRsvp from '@/components/guests/PublicRsvp';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { DraftContent, Template } from '@/lib/types';
import { calendarFile, eventInstant, invitationEvents, eventDateLabel } from '@/lib/domain';
import { categories } from '@/lib/templates';
import {DEFAULT_MUSIC_VOLUME} from '@/lib/music-library';
export default function InvitationView({template,content,guest='Tamu Undangan',mode='demo',photoUrls=[],coverUrl,embedded=false,expiresAt,rsvpSlug,openWishesSlug,previewOnly=false}:{template:Template;content:DraftContent;guest?:string;mode?:'demo'|'draft'|'public';photoUrls?:string[];coverUrl?:string;embedded?:boolean;expiresAt?:string;rsvpSlug?:string;openWishesSlug?:string;previewOnly?:boolean}) {
 const rootRef=useRef<HTMLElement|null>(null);
 useEffect(()=>{
  const root=rootRef.current;
  if(!root)return;
  root.dataset.invHydrated='true';
  root.dispatchEvent(new Event('invitation:ready',{bubbles:true}));
  return()=>{delete root.dataset.invHydrated;};
 },[]);
 const [expired,setExpired]=useState(false);
 const [opened,setOpened]=useState(false),[opening,setOpening]=useState(false);
 const openingStyle=invitationOpeningStyle(template.slug);
 const openingDuration=openingStyle==='slide'?900:1100;
 const [message,setMessage]=useState(''), [sample,setSample]=useState<{name:string;message:string}|null>(null);
 const cinematic=template.slug==='galaxy-night';
  const importedLuxury=template.slug==='elementor-luxury-1';
 const botanicalBlush=template.slug==='botanical-blush';
 const auroraModern=template.slug==='aurora-modern';
 const elegantRose=template.slug==='elegant-rose';
 const modernMinimalist=template.slug==='modern-minimalist';
 const music=useInvitationMusic(content.music||'none',!expired,content.musicVolume??DEFAULT_MUSIC_VOLUME);
 const wedding=template.category==='pernikahan'; const names=[content.groom,content.bride].filter(Boolean).join(' & ')||'Nama pasangan';
 const target=eventInstant(content), events=invitationEvents(content);
 const galleryPhotos=mode==='demo'&&wedding&&photoUrls.length>2?[...photoUrls.slice(2),...photoUrls.slice(0,2)]:photoUrls;
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
  ...((mode==='demo'||(mode==='public'&&openWishesSlug))?[{id:wishesId,label:'Ucapan',icon:'story' as const}]:[]),
  ...(hasGifts?[{id:giftId,label:'Hadiah',icon:'gift' as const}]:[]),
 ],[heroId,coupleId,eventId,storyId,galleryId,giftId,wedding,hasStory,hasGifts,mode,openWishesSlug,wishesId]);
 const Root=embedded?'div':'main', cover=coverUrl===undefined?photoUrls[0]:coverUrl;
 useEffect(()=>{
  if(!opened)return;
  const content=document.getElementById(contentId);
  content?.focus({preventScroll:true});
  if(!embedded)content?.scrollIntoView({block:'start',behavior:'instant'});
 },[opened,contentId,embedded]);
 useEffect(()=>{
  if(!opening)return;
  const preference=window.matchMedia('(prefers-reduced-motion: reduce)');
  const finish=()=>{setOpened(true);setOpening(false);};
  const change=()=>{if(preference.matches||document.hidden)finish();};
  const leaf=rootRef.current?.querySelector<HTMLElement>('[data-inv-door="end"]');
  // Mounting the first page can delay its first paint on a slower phone.
  // Start the normal fallback from the actual CSS start, with a separate no-event limit.
  let timer=window.setTimeout(finish,openingDuration+1500);
  const started=(event:AnimationEvent)=>{
   if(event.target!==leaf||event.animationName!==`invitation-door-${openingStyle}`)return;
   window.clearTimeout(timer);timer=window.setTimeout(finish,openingDuration+500);
  };
  leaf?.addEventListener('animationstart',started);
  preference.addEventListener('change',change);
  document.addEventListener('visibilitychange',change);
  change();
  return()=>{window.clearTimeout(timer);leaf?.removeEventListener('animationstart',started);preference.removeEventListener('change',change);document.removeEventListener('visibilitychange',change);};
 },[opening,openingDuration,openingStyle]);
 function openInvitation(){
  if(opened||opening)return;
  void music.start();
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)setOpened(true);
  else setOpening(true);
 }
 useEffect(()=>{if(mode!=='public'||!expiresAt)return;const tick=()=>setExpired(Date.parse(expiresAt)<=Date.now());tick();const timer=window.setInterval(tick,1000);return()=>window.clearInterval(timer);},[mode,expiresAt]);
 const date=eventDateLabel(content.eventDate);
 function downloadCalendar(event=events[0]){try{const blob=new Blob([calendarFile({...content,...event},template.slug+'-'+event.id+'-'+event.eventDate)],{type:'text/calendar;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='undangan-kastriva.ics';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);return 'File kalender siap ditambahkan.';}catch{return 'Lengkapi tanggal dan jam acara terlebih dahulu.';}}
 if(expired)return <main className="empty-state"><h1>Masa aktif undangan berakhir.</h1><p>Silakan hubungi pengirim undangan.</p></main>;
   return <Root ref={node=>{rootRef.current=node;}} data-inv-opening-style={openingStyle} data-inv-opening-state={opened?'open':opening?'opening':'closed'} style={{'--inv-opening-duration':`${openingDuration}ms`} as import('react').CSSProperties} className={`invitation inv-refined theme-${template.slug}${embedded?' inv-embedded':''}${cinematic?' inv-cinematic':''}${auroraModern?' inv-aurora':''}${isHeritageTheme(template.slug)?' inv-heritage':''}`}>
   {!embedded&&mode!=='public'&&<div className="inv-toolbar"><Link href={mode==='demo'?'/tema':'/dashboard'}>← {mode==='demo'?'Koleksi tema':'Dashboard'}</Link><span>{mode==='demo'?'DEMO · DATA CONTOH':'PREVIEW DRAFT · PRIVAT'}</span>{mode==='demo'&&wedding&&!previewOnly?<Link href={`/order/${template.slug}`}>Pilih tema ↗</Link>:<span>{template.name}</span>}</div>}
   <div className="inv-scenes">
   {!opened&&<section className={opening ? "inv-cover is-opening" : "inv-cover"} onAnimationEnd={event=>{if(opening&&event.target instanceof HTMLElement&&event.target.dataset.invDoor==='end'){setOpened(true);setOpening(false);}}}><InvitationCoverPanels slug={template.slug}/>{cinematic&&cover&&<img className="cinematic-photo" src={cover} alt="" referrerPolicy="no-referrer"/>}<BotanicalBlushArtwork slug={template.slug}/><ElementorLuxuryArtwork slug={template.slug}/><HeritageArtwork slug={template.slug}/><AuroraModernArtwork slug={template.slug} mode="ambient"/><InvitationAtmosphere slug={template.slug}/><InvitationOrnaments slug={template.slug}/><div className="cover-frame"><span className="cover-motif" aria-hidden><ThemeMotif slug={template.slug}/></span>{template.slug==='islami-sakinah'&&<p className="heritage-bismillah" lang="ar" dir="rtl">بسم الله الرحمن الرحيم</p>}{auroraModern&&<AuroraModernArtwork slug={template.slug} mode="portrait" photo={cover} names={names}/>} {botanicalBlush&&<BotanicalBlushArtwork slug={template.slug} portrait photo={cover} names={[content.groom,content.bride]}/>}{importedLuxury&&<ElementorLuxuryArtwork slug={template.slug} portrait photo={cover} names={[content.groom,content.bride]}/>}{cover&&!cinematic&&!importedLuxury&&!botanicalBlush&&!auroraModern&&<img className="cover-photo" src={cover} alt="Foto sampul undangan" referrerPolicy="no-referrer"/>}<p className="overline">{wedding?'THE WEDDING OF':categories[template.category]?.toUpperCase()}</p><InvitationNames groom={content.groom} bride={content.bride} wedding={wedding}/><div className="inv-rule"/><p className="inv-date"><time dateTime={content.eventDate||undefined}>{date}</time></p><div className="guest-card"><small>Kepada Yth.</small><strong>{guest}</strong><span>Dengan hormat, kami mengundang Anda</span></div><button className="inv-button" disabled={opening} aria-busy={opening} onClick={openInvitation}>{opening?'Membuka undangan…':'Buka undangan'} <span aria-hidden>↗</span></button><p className="cover-note">{mode==='demo'?'Anda sedang mencoba demo. Bukan undangan acara nyata.':mode==='public'?'Kami menantikan kehadiran Anda.':'Draft ini hanya dapat dilihat pemilik akun.'}</p></div></section>}
  {(opening||opened)&&<div id={contentId} className="inv-content inv-stationery" tabIndex={-1} inert={!opened} aria-hidden={!opened}>
    <section id={heroId} tabIndex={-1} data-inv-section className="inv-hero">{cinematic&&cover&&<img className="cinematic-photo" src={cover} alt="" referrerPolicy="no-referrer"/>}<BotanicalBlushArtwork slug={template.slug}/><ElementorLuxuryArtwork slug={template.slug}/><HeritageArtwork slug={template.slug}/><AuroraModernArtwork slug={template.slug} mode="ambient"/><InvitationAtmosphere slug={template.slug}/><InvitationOrnaments slug={template.slug}/><span className="cover-motif" aria-hidden><ThemeMotif slug={template.slug}/></span>{auroraModern&&<AuroraModernArtwork slug={template.slug} mode="portrait" photo={cover} names={names}/>}{botanicalBlush&&<BotanicalBlushArtwork slug={template.slug} portrait photo={cover} names={[content.groom,content.bride]}/>}{importedLuxury&&<ElementorLuxuryArtwork slug={template.slug} portrait photo={cover} names={[content.groom,content.bride]}/>}<span className="inv-hero-photo-wrap">{cover&&!cinematic&&!importedLuxury&&!botanicalBlush&&!auroraModern&&<img className="inv-hero-photo" src={cover} alt="Momen istimewa" referrerPolicy="no-referrer"/>}</span><p className="overline">{wedding?'A NEW CHAPTER BEGINS':'MOMEN ISTIMEWA'}</p><InvitationNames groom={content.groom} bride={content.bride} wedding={wedding}/><p className="inv-date"><time dateTime={content.eventDate||undefined}>{date}</time></p><div className="inv-rule"/><p className="inv-opening">{content.opening||'Salam hangat untuk Anda.'}</p><a className="inv-button outline" href={"#"+eventId} onClick={e=>{if(mode==='public'&&rsvpSlug){e.preventDefault();document.getElementById(eventId)?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});}}}>Lihat detail acara ↓</a><span className="inv-scroll-cue" aria-hidden="true"><i/>SCROLL UNTUK MENJELAJAH</span></section>
    {wedding&&<section id={coupleId} tabIndex={-1} data-inv-section className="inv-section"><InvitationOrnaments slug={template.slug} section/><p className="overline">BERSAMA MENUJU HARI BAHAGIA</p><h2>Kami yang berbahagia</h2><InvitationDivider slug={template.slug}/>{elegantRose?<ElegantRoseCouple content={content} photos={photoUrls}/>:<div className="couple-grid"><div><InvitationPortrait key={photoUrls[0]} photo={photoUrls[0]} name={content.groom||'Mempelai pria'}/><span className="person-label">Mempelai pria</span><h3>{content.groom||'Mempelai pria'}</h3><p>{content.groomParents}</p></div><span className="couple-and">&</span><div><InvitationPortrait key={photoUrls[1]} photo={photoUrls[1]} name={content.bride||'Mempelai wanita'}/><span className="person-label">Mempelai wanita</span><h3>{content.bride||'Mempelai wanita'}</h3><p>{content.brideParents}</p></div></div>}</section>}
    <section id={eventId} tabIndex={-1} data-inv-section className="inv-section alternate"><InvitationOrnaments slug={template.slug} section/><p className="overline">SAVE THE DATE</p><h2>Waktu & tempat</h2><InvitationDivider slug={template.slug}/><InvitationCountdown target={target}/><ol className="inv-event-list">{events.map((event,i)=><InvitationEventCard key={event.id} event={event} index={i} slug={template.slug} title={wedding?(event.label||`Acara ${i+1}`):categories[template.category]} demo={mode==='demo'} onDownload={downloadCalendar}/>)}</ol></section>
    {content.story&&<section id={storyId} tabIndex={-1} data-inv-section className="inv-section"><InvitationOrnaments slug={template.slug} section/><p className="overline">OUR JOURNEY</p><h2>Cerita kami</h2><InvitationDivider slug={template.slug}/><InvitationStory story={content.story} cinematic={cinematic} variant={elegantRose?'elegant-rose':modernMinimalist?'modern-minimalist':'default'} photos={photoUrls.slice(2)}/></section>}
    <section id={galleryId} tabIndex={-1} data-inv-section className="inv-section alternate"><InvitationOrnaments slug={template.slug} section/><p className="overline">LITTLE MOMENTS, BIG MEMORIES</p><h2>Galeri kenangan</h2><InvitationDivider slug={template.slug}/>{photoUrls.length?<InvitationGallery key={galleryPhotos.join('|')} urls={galleryPhotos} variant={elegantRose?'elegant-rose':'story'}/>:<><div className="photo-placeholders" aria-hidden>{(wedding?['Sebuah pertemuan','Sebuah cerita','Selamanya bersama']:['Momen istimewa','Senyum bahagia','Kenangan bersama']).map(x=><div key={x}><span><ThemeMotif slug={template.slug}/></span><small>{x}</small></div>)}</div><p className="inv-caption">{mode==='demo'?'Ilustrasi posisi galeri. Foto pelanggan diunggah melalui editor.':mode==='public'?'Terima kasih telah menjadi bagian dari cerita kami.':'Belum ada foto di draft ini.'}</p></>}{mode==='demo'&&photoUrls.length>0&&<p className="inv-caption inv-demo-media-note">Foto ilustrasi AI untuk demo. Foto dapat diganti dengan milik Anda.</p>}</section>
    {mode==='demo'&&<InvitationDemoWishes id={wishesId} slug={template.slug} category={template.category}/>}
    {mode==='demo'&&<section className="inv-section"><InvitationOrnaments slug={template.slug} section/><p className="overline">COBA INTERAKSI</p><h2>Konfirmasi kehadiran</h2><InvitationDivider slug={template.slug}/><p className="notice">Simulasi saja. Respons tidak dikirim ke server dan hilang saat halaman dimuat ulang. RSVP nyata hanya tersedia pada undangan terbit melalui tautan tamu khusus.</p><form className="rsvp-form" onSubmit={e=>{e.preventDefault();const f=new FormData(e.currentTarget);setSample({name:String(f.get('name')||''),message:String(f.get('message')||'')});setMessage('Simulasi berhasil. Tidak ada konfirmasi yang disimpan ke server.');}}><label>Nama Anda<input name="name" maxLength={100} required placeholder="Nama tamu"/></label><label>Konfirmasi<select name="attendance" required defaultValue=""><option value="" disabled>Pilih kehadiran</option><option value="hadir">Hadir</option><option value="tidak">Tidak hadir</option></select></label><label>Ucapan<textarea name="message" maxLength={500} rows={3} placeholder="Tulis harapan baik Anda"/></label><button className="inv-button" type="submit">Coba simulasi RSVP</button></form>{sample&&<div className="wish-card" data-demo-response><strong>{sample.name}</strong><p>{sample.message||'Terima kasih atas konfirmasi contoh Anda.'}</p><small>Contoh lokal — belum tersimpan</small></div>}</section>}
    {mode==='public'&&openWishesSlug&&<PublicOpenWishes key={openWishesSlug} slug={openWishesSlug} id={wishesId}/>}
    {mode==='public'&&rsvpSlug&&<PublicRsvp slug={rsvpSlug}/>}
    {!!content.gifts?.length&&<InvitationGifts id={giftId} accounts={content.gifts} demo={mode==='demo'} slug={template.slug}/> }
    {message&&<p role="status" className="inv-status">{message}</p>}
    <InvitationClosing slug={template.slug} names={names} date={date} eventDate={content.eventDate} wedding={wedding} showThemeLink={mode==='demo'&&wedding&&!previewOnly}/>
  </div>}
  </div>
  {opened&&content.music&&content.music!=='none'&&<div className="inv-music"><button type="button" className="music-toggle" onClick={music.toggle} aria-label={music.playing?`Jeda ${music.label}`:`Putar ${music.label}`} aria-pressed={music.playing} title={music.label}><span className="music-bars" aria-hidden="true"><i/><i/><i/></span><span>{music.playing?'Jeda':'Musik'}</span></button><small className="music-track-label">{music.label}</small>{music.error&&<p role="status">{music.error}</p>}</div>}
  {opened&&!embedded&&<InvitationAutoScroll contentId={contentId}/>}
  {opened&&!embedded&&<InvitationNav items={navigation}/>}
 </Root>;
}
