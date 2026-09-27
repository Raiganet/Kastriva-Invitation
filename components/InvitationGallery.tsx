'use client';
import {useEffect,useId,useRef,useState} from 'react';

function GalleryImage({url,index}:{url:string;index:number}){
 const [failed,setFailed]=useState(false),[loaded,setLoaded]=useState(false);
 return <div className="gallery-view-image" aria-busy={!loaded&&!failed}>
  {!loaded&&!failed&&<p role="status">Memuat foto…</p>}
  {failed?<p role="alert">Foto belum dapat dimuat. Coba foto lain atau tutup galeri dan muat ulang undangan.</p>:<img src={url} alt={`Foto undangan ${index+1}`} referrerPolicy="no-referrer" onLoad={()=>setLoaded(true)} onError={()=>setFailed(true)}/>}
 </div>;
}

export default function InvitationGallery({urls}:{urls:string[]}){
 const [selected,setSelected]=useState<number|null>(null);
 const dialog=useRef<HTMLDialogElement>(null),opener=useRef<HTMLButtonElement|null>(null);
 const titleId=useId(),open=selected!==null&&urls.length>0;
 const index=Math.min(selected??0,Math.max(0,urls.length-1));
 useEffect(()=>{
  if(!open)return;
  const element=dialog.current;if(!element)return;
  const overflow=document.body.style.overflow;
  element.showModal();document.body.style.overflow='hidden';
  return()=>{element.close();document.body.style.overflow=overflow;opener.current?.focus({preventScroll:true});};
 },[open]);
 function move(direction:number){setSelected(current=>((current??0)+direction+urls.length)%urls.length);}
 return <>
  <div className={urls.length>1?'photo-grid photo-grid-editorial':'photo-grid'}>{urls.map((url,i)=><button type="button" key={url+i} className="gallery-photo" aria-label={`Perbesar foto ${i+1}`} aria-haspopup="dialog" onClick={event=>{opener.current=event.currentTarget;setSelected(i);}}><img src={url} alt={`Foto undangan ${i+1}`} loading="lazy" referrerPolicy="no-referrer"/><span className="gallery-photo-hint" aria-hidden="true">Lihat foto ↗</span></button>)}</div>
  <p className="inv-caption">Ketuk foto untuk melihat lebih dekat.</p>
  <dialog ref={dialog} className="inv-gallery-dialog" aria-labelledby={titleId} onClose={()=>setSelected(null)} onCancel={()=>setSelected(null)} onClick={e=>{if(e.target===e.currentTarget)setSelected(null);}} onKeyDown={e=>{if(urls.length>1&&(e.key==='ArrowRight'||e.key==='ArrowLeft')){e.preventDefault();move(e.key==='ArrowRight'?1:-1);}}}>
   {open&&<div className="gallery-viewer"><header className="gallery-view-heading"><h2 id={titleId}>Galeri kenangan</h2><button type="button" className="gallery-control" onClick={()=>setSelected(null)} autoFocus>Tutup <span aria-hidden="true">×</span></button></header>
    <GalleryImage key={urls[index]} url={urls[index]} index={index}/>
    <footer className="gallery-view-footer">{urls.length>1&&<button type="button" className="gallery-control" onClick={()=>move(-1)} aria-label="Foto sebelumnya">← <span>Sebelumnya</span></button>}<p role="status" aria-live="polite">Foto {index+1} dari {urls.length}</p>{urls.length>1&&<button type="button" className="gallery-control" onClick={()=>move(1)} aria-label="Foto berikutnya"><span>Berikutnya</span> →</button>}</footer>
   </div>}
  </dialog>
 </>;
}
