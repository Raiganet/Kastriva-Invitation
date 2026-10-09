'use client';
import {useCallback,useState} from 'react';

/** Keep the original frame intact; a failed URL falls back without a broken image. */
export default function InvitationPhoto({src,alt,initials,className='',loading='eager'}:{src?:string;alt:string;initials:string;className?:string;loading?:'eager'|'lazy'}){
 const [failed,setFailed]=useState<string>();
 // A cached or inline image can fail before React attaches its error listener.
 const checkPhoto=useCallback((image:HTMLImageElement|null)=>{
  if(src&&image?.complete&&!image.naturalWidth)setFailed(src);
 },[src]);
 const classes=`inv-framed-photo ${className}`;
 if(!src||failed===src)return <span className={`${classes} inv-photo-fallback`} role="img" aria-label={`${alt} belum tersedia`}><span aria-hidden="true">{initials||'♡'}</span></span>;
 return <img ref={checkPhoto} className={classes} src={src} alt={alt} loading={loading} decoding="async" referrerPolicy="no-referrer" draggable={false} onError={()=>setFailed(src)}/>;
}
