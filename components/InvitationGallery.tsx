'use client';
import {useEffect,useId,useRef,useState} from 'react';
import {useInvitationGallerySlide} from './useInvitationGallerySlide';

type GalleryVariant='default'|'elegant-rose'|'story';

function GalleryImage({url,index}:{url:string;index:number}){
 const [failed,setFailed]=useState(false),[loaded,setLoaded]=useState(false);
 return <div className="gallery-view-image" aria-busy={!loaded&&!failed}>
  {!loaded&&!failed&&<p role="status">Memuat foto…</p>}
  {failed?<p role="alert">Foto belum dapat dimuat. Coba foto lain atau tutup galeri dan muat ulang undangan.</p>:<img src={url} alt={`Foto undangan ${index+1}`} referrerPolicy="no-referrer" onLoad={()=>setLoaded(true)} onError={()=>setFailed(true)}/>}
 </div>;
}

export default function InvitationGallery({urls,variant='default'}:{urls:string[];variant?:GalleryVariant}){
 const [selected,setSelected]=useState<number|null>(null),[active,setActive]=useState(0),[paused,setPaused]=useState(false),[autoPlay,setAutoPlay]=useState(true);
 const gallery=useRef<HTMLDivElement>(null);
 const swipeStart=useRef<{x:number;y:number;id:number}|null>(null),swiped=useRef(false);
 const [direction,setDirection]=useState(1),[running,setRunning]=useState(false);
 const dialog=useRef<HTMLDialogElement>(null),opener=useRef<HTMLButtonElement|null>(null);
 const titleId=useId(),open=selected!==null&&urls.length>0,elegant=variant!=='default';
 const index=Math.min(selected??0,Math.max(0,urls.length-1)),activeIndex=Math.min(active,Math.max(0,urls.length-1));
 const slide=useInvitationGallerySlide(elegant?urls[activeIndex]||'':'',activeIndex);
 const shown=slide.current.index;

 useEffect(()=>{
  if(!open)return;
  const element=dialog.current;if(!element)return;
  const overflow=document.body.style.overflow;
  element.showModal();document.body.style.overflow='hidden';
  return()=>{element.close();document.body.style.overflow=overflow;opener.current?.focus({preventScroll:true});};
 },[open]);

 useEffect(()=>{
  setRunning(false);
  if(!elegant||paused||!autoPlay||open||slide.loading||urls.length<2)return;
  const preference=window.matchMedia('(prefers-reduced-motion: reduce)');
  let visible=false,timer:number|undefined;
  const sync=()=>{
   window.clearInterval(timer);
   const playing=visible&&!document.hidden&&!preference.matches;setRunning(playing);
   if(playing)timer=window.setInterval(()=>{setDirection(1);setActive(current=>(current+1)%urls.length);},6000);
  };
  if(!('IntersectionObserver' in window))return;
  const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting&&entries[0].intersectionRatio>=.25;sync();},{threshold:.25});
  if(gallery.current)observer.observe(gallery.current);
  document.addEventListener('visibilitychange',sync);
  preference.addEventListener('change',sync);
  return()=>{window.clearInterval(timer);observer.disconnect();document.removeEventListener('visibilitychange',sync);preference.removeEventListener('change',sync);};
 },[elegant,paused,autoPlay,open,urls.length,slide.loading]);

 useEffect(()=>{
  const track=gallery.current?.querySelector<HTMLElement>('.elegant-gallery-thumbs');
  const thumb=track?.querySelector<HTMLElement>('[aria-pressed=true]');
  if(!track||!thumb)return;
  const item=thumb.getBoundingClientRect(),box=track.getBoundingClientRect();
  const delta=item.left<box.left?item.left-box.left:item.right>box.right?item.right-box.right:0;
  if(delta)track.scrollBy({left:delta,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
 },[activeIndex]);

 function moveDialog(direction:number){setSelected(current=>((current??0)+direction+urls.length)%urls.length);}
 function moveStage(step:number){setAutoPlay(false);setDirection(step);setActive(current=>(current+step+urls.length)%urls.length);}
 function beginSwipe(event:React.PointerEvent<HTMLButtonElement>){
  swiped.current=false;
  if(event.pointerType!=='touch'||urls.length<2)return;
  swipeStart.current={x:event.clientX,y:event.clientY,id:event.pointerId};
  event.currentTarget.setPointerCapture(event.pointerId);
 }
 function endSwipe(event:React.PointerEvent<HTMLButtonElement>){
  const start=swipeStart.current;swipeStart.current=null;
  if(!start||start.id!==event.pointerId)return;
  const dx=event.clientX-start.x,dy=event.clientY-start.y;
  if(Math.abs(dx)<44||Math.abs(dx)<Math.abs(dy)*1.5)return;
  swiped.current=true;moveStage(dx<0?1:-1);
 }
 function openPhoto(event:React.MouseEvent<HTMLButtonElement>,photoIndex:number){opener.current=event.currentTarget;setSelected(photoIndex);}

 const grid=<div className={urls.length>1?'photo-grid photo-grid-editorial':'photo-grid'}>{urls.map((url,i)=><button type="button" key={url+i} className="gallery-photo" aria-label={`Perbesar foto ${i+1}`} aria-haspopup="dialog" onClick={event=>openPhoto(event,i)}><img src={url} alt={`Foto undangan ${i+1}`} loading="lazy" referrerPolicy="no-referrer"/><span className="gallery-photo-hint" aria-hidden="true">Lihat foto ↗</span></button>)}</div>;

 const elegantGallery=<div ref={gallery} className="elegant-gallery inv-gallery" data-gallery-running={running} data-gallery-loading={slide.loading} role="region" aria-label="Galeri kenangan bergulir" onMouseEnter={()=>setPaused(true)} onMouseLeave={()=>setPaused(false)} onFocusCapture={()=>setPaused(true)} onBlurCapture={event=>{if(!event.currentTarget.contains(event.relatedTarget as Node|null))setPaused(false);}}>
  <div className="elegant-gallery-stage">
   <button type="button" className="elegant-gallery-main" aria-label={`Perbesar foto ${shown+1}`} aria-haspopup="dialog" disabled={!slide.current.ready} aria-busy={slide.loading} style={{'--gallery-direction':direction} as React.CSSProperties} onPointerDown={beginSwipe} onPointerUp={endSwipe} onPointerCancel={()=>{swipeStart.current=null;swiped.current=false;}} onClick={event=>{if(swiped.current&&event.detail!==0){swiped.current=false;return;}openPhoto(event,shown);}} onKeyDown={event=>{if(urls.length>1&&(event.key==='ArrowLeft'||event.key==='ArrowRight')){event.preventDefault();moveStage(event.key==='ArrowRight'?1:-1);}}}>
    {slide.previous&&<img className="inv-gallery-slide is-leaving" src={slide.previous.url} alt="" aria-hidden="true" referrerPolicy="no-referrer"/>}
    {(slide.current.ready||!slide.error)&&<img className={`inv-gallery-slide${slide.serial?' is-entering':''}`} key={slide.serial} src={slide.current.url} alt={`Foto undangan ${shown+1}`} referrerPolicy="no-referrer"/>}
    {!slide.current.ready&&<span className="inv-gallery-placeholder">{slide.error?'Foto belum tersedia':'Menyiapkan kenangan…'}</span>}
    <span className="elegant-gallery-shade" aria-hidden="true"/>
    <span className="elegant-gallery-count">{String(shown+1).padStart(2,'0')} / {String(urls.length).padStart(2,'0')}</span>
    <span className="inv-gallery-progress" aria-hidden="true"><i key={`${shown}-${running}`}/></span>
    <span className="gallery-photo-hint" aria-hidden="true">Lihat foto ↗</span>
   </button>
   {urls.length>1&&<><button type="button" className="elegant-gallery-arrow elegant-gallery-prev" aria-label="Foto sebelumnya" onClick={()=>moveStage(-1)}>←</button><button type="button" className="elegant-gallery-arrow elegant-gallery-next" aria-label="Foto berikutnya" onClick={()=>moveStage(1)}>→</button></>}
  </div>
  {urls.length>1&&<><div className="elegant-gallery-thumbs" role="group" aria-label="Pilih foto">{urls.map((url,i)=><button type="button" key={url+i} aria-pressed={i===activeIndex} aria-label={`Tampilkan foto ${i+1}`} className={i===activeIndex?'elegant-gallery-thumb is-active':'elegant-gallery-thumb'} onClick={()=>{setAutoPlay(false);setDirection(i<activeIndex?-1:1);setActive(i);}}><img src={url} alt="" loading="lazy" referrerPolicy="no-referrer"/></button>)}</div><button className="inv-gallery-play" type="button" aria-pressed={autoPlay} onClick={()=>{setAutoPlay(value=>!value);setPaused(false);}}>{autoPlay?'Jeda slideshow':'Putar slideshow'} <span aria-hidden="true">{autoPlay?'Ⅱ':'▷'}</span></button></>}
  <p className="inv-gallery-feedback" role="status" aria-live="polite">{slide.error?`Foto ${activeIndex+1} belum dapat dimuat. Silakan pilih foto lain.`:slide.loading?`Memuat foto ${activeIndex+1}…`:''}</p>
 </div>;

 return <>
  {elegant?elegantGallery:grid}
  <p className="inv-caption">{elegant?'Geser foto, pilih thumbnail, atau ketuk foto utama untuk melihat lebih dekat.':'Ketuk foto untuk melihat lebih dekat.'}</p>
  <dialog ref={dialog} className="inv-gallery-dialog" aria-labelledby={titleId} onClose={()=>setSelected(null)} onCancel={()=>setSelected(null)} onClick={e=>{if(e.target===e.currentTarget)setSelected(null);}} onKeyDown={e=>{if(urls.length>1&&(e.key==='ArrowRight'||e.key==='ArrowLeft')){e.preventDefault();moveDialog(e.key==='ArrowRight'?1:-1);}}}>
   {open&&<div className="gallery-viewer"><header className="gallery-view-heading"><h2 id={titleId}>Galeri kenangan</h2><button type="button" className="gallery-control" onClick={()=>setSelected(null)} autoFocus>Tutup <span aria-hidden="true">×</span></button></header>
    <GalleryImage key={urls[index]} url={urls[index]} index={index}/>
    <footer className="gallery-view-footer">{urls.length>1&&<button type="button" className="gallery-control" onClick={()=>moveDialog(-1)} aria-label="Foto sebelumnya">← <span>Sebelumnya</span></button>}<p role="status" aria-live="polite">Foto {index+1} dari {urls.length}</p>{urls.length>1&&<button type="button" className="gallery-control" onClick={()=>moveDialog(1)} aria-label="Foto berikutnya"><span>Berikutnya</span> →</button>}</footer>
   </div>}
  </dialog>
 </>;
}
