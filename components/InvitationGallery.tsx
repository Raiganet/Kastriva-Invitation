'use client';
import {useEffect,useId,useRef,useState} from 'react';

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
 const dialog=useRef<HTMLDialogElement>(null),opener=useRef<HTMLButtonElement|null>(null);
 const titleId=useId(),open=selected!==null&&urls.length>0,elegant=variant!=='default';
 const index=Math.min(selected??0,Math.max(0,urls.length-1)),activeIndex=Math.min(active,Math.max(0,urls.length-1));

 useEffect(()=>{
  if(!open)return;
  const element=dialog.current;if(!element)return;
  const overflow=document.body.style.overflow;
  element.showModal();document.body.style.overflow='hidden';
  return()=>{element.close();document.body.style.overflow=overflow;opener.current?.focus({preventScroll:true});};
 },[open]);

 useEffect(()=>{
  if(!elegant||paused||!autoPlay||open||urls.length<2)return;
  const preference=window.matchMedia('(prefers-reduced-motion: reduce)');
  let visible=false,timer:number|undefined;
  const sync=()=>{
   window.clearInterval(timer);
   if(visible&&!document.hidden&&!preference.matches)timer=window.setInterval(()=>setActive(current=>(current+1)%urls.length),6000);
  };
  const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();},{threshold:.25});
  if(gallery.current)observer.observe(gallery.current);
  document.addEventListener('visibilitychange',sync);
  preference.addEventListener('change',sync);
  return()=>{window.clearInterval(timer);observer.disconnect();document.removeEventListener('visibilitychange',sync);preference.removeEventListener('change',sync);};
 },[elegant,paused,autoPlay,open,urls.length]);

 function moveDialog(direction:number){setSelected(current=>((current??0)+direction+urls.length)%urls.length);}
 function moveStage(direction:number){setAutoPlay(false);setActive(current=>(current+direction+urls.length)%urls.length);}
 function openPhoto(event:React.MouseEvent<HTMLButtonElement>,photoIndex:number){opener.current=event.currentTarget;setSelected(photoIndex);}

 const grid=<div className={urls.length>1?'photo-grid photo-grid-editorial':'photo-grid'}>{urls.map((url,i)=><button type="button" key={url+i} className="gallery-photo" aria-label={`Perbesar foto ${i+1}`} aria-haspopup="dialog" onClick={event=>openPhoto(event,i)}><img src={url} alt={`Foto undangan ${i+1}`} loading="lazy" referrerPolicy="no-referrer"/><span className="gallery-photo-hint" aria-hidden="true">Lihat foto ↗</span></button>)}</div>;

 const elegantGallery=<div ref={gallery} className="elegant-gallery inv-gallery" role="region" aria-label="Galeri kenangan bergulir" onMouseEnter={()=>setPaused(true)} onMouseLeave={()=>setPaused(false)} onFocusCapture={()=>setPaused(true)} onBlurCapture={event=>{if(!event.currentTarget.contains(event.relatedTarget as Node|null))setPaused(false);}}>
  <div className="elegant-gallery-stage">
   <button type="button" className="elegant-gallery-main" aria-label={`Perbesar foto ${activeIndex+1}`} aria-haspopup="dialog" onClick={event=>openPhoto(event,activeIndex)}>
    <img key={urls[activeIndex]} src={urls[activeIndex]} alt={`Foto undangan ${activeIndex+1}`} referrerPolicy="no-referrer"/>
    <span className="elegant-gallery-shade" aria-hidden="true"/>
    <span className="elegant-gallery-count">{String(activeIndex+1).padStart(2,'0')} / {String(urls.length).padStart(2,'0')}</span>
    <span className="gallery-photo-hint" aria-hidden="true">Lihat foto ↗</span>
   </button>
   {urls.length>1&&<><button type="button" className="elegant-gallery-arrow elegant-gallery-prev" aria-label="Foto sebelumnya" onClick={()=>moveStage(-1)}>←</button><button type="button" className="elegant-gallery-arrow elegant-gallery-next" aria-label="Foto berikutnya" onClick={()=>moveStage(1)}>→</button></>}
  </div>
  {urls.length>1&&<><div className="elegant-gallery-thumbs" role="group" aria-label="Pilih foto">{urls.map((url,i)=><button type="button" key={url+i} aria-pressed={i===activeIndex} aria-label={`Tampilkan foto ${i+1}`} className={i===activeIndex?'elegant-gallery-thumb is-active':'elegant-gallery-thumb'} onClick={()=>{setAutoPlay(false);setActive(i);}}><img src={url} alt="" loading="lazy" referrerPolicy="no-referrer"/></button>)}</div><button className="inv-gallery-play" type="button" aria-pressed={autoPlay} onClick={()=>setAutoPlay(value=>!value)}>{autoPlay?'Jeda slideshow':'Putar slideshow'} <span aria-hidden="true">{autoPlay?'Ⅱ':'▷'}</span></button></>}
 </div>;

 return <>
  {elegant?elegantGallery:grid}
  <p className="inv-caption">{elegant?'Pilih thumbnail atau ketuk foto utama untuk melihat lebih dekat.':'Ketuk foto untuk melihat lebih dekat.'}</p>
  <dialog ref={dialog} className="inv-gallery-dialog" aria-labelledby={titleId} onClose={()=>setSelected(null)} onCancel={()=>setSelected(null)} onClick={e=>{if(e.target===e.currentTarget)setSelected(null);}} onKeyDown={e=>{if(urls.length>1&&(e.key==='ArrowRight'||e.key==='ArrowLeft')){e.preventDefault();moveDialog(e.key==='ArrowRight'?1:-1);}}}>
   {open&&<div className="gallery-viewer"><header className="gallery-view-heading"><h2 id={titleId}>Galeri kenangan</h2><button type="button" className="gallery-control" onClick={()=>setSelected(null)} autoFocus>Tutup <span aria-hidden="true">×</span></button></header>
    <GalleryImage key={urls[index]} url={urls[index]} index={index}/>
    <footer className="gallery-view-footer">{urls.length>1&&<button type="button" className="gallery-control" onClick={()=>moveDialog(-1)} aria-label="Foto sebelumnya">← <span>Sebelumnya</span></button>}<p role="status" aria-live="polite">Foto {index+1} dari {urls.length}</p>{urls.length>1&&<button type="button" className="gallery-control" onClick={()=>moveDialog(1)} aria-label="Foto berikutnya"><span>Berikutnya</span> →</button>}</footer>
   </div>}
  </dialog>
 </>;
}
