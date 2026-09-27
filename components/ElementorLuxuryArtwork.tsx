'use client';
import {useId} from 'react';

/** Vector reconstruction from the supplied preview; no dependency on the retired asset host. */
export function LuxuryRosette({className=''}:{className?:string}){
 const id=useId().replace(/:/g,'');
 return <svg className={'luxury-rosette '+className} viewBox="0 0 440 440" fill="none" aria-hidden="true" focusable="false"><defs><linearGradient id={id} x1="40" y1="20" x2="340" y2="420" gradientUnits="userSpaceOnUse"><stop stopColor="#9B611C"/><stop offset=".25" stopColor="#FFDEA0"/><stop offset=".5" stopColor="#C18A34"/><stop offset=".76" stopColor="#F4BF65"/><stop offset="1" stopColor="#9B611C"/></linearGradient></defs><g stroke={'url(#'+id+')'}>{Array.from({length:8},(_,i)=><g key={i} transform={`rotate(${i*45} 220 220)`}><path d="m220 12 33 56 58-2-24 61 33 48-64 19-36 52-36-52-64-19 33-48-24-61 58 2Z" strokeWidth="5"/><path d="m220 30 23 50 47-2-22 49 29 41-54 13-23 43-23-43-54-13 29-41-22-49 47 2Z" strokeWidth="1.4"/><path d="m220 60 14 37 34 6-24 29 5 32-29-16-29 16 5-32-24-29 34-6Z" strokeWidth="2"/></g>)}</g><path d="M220 79c19 22 57 5 67 32 7 21 38 19 40 48 2 25 28 32 22 61 6 29-20 36-22 61-2 29-33 27-40 48-10 27-48 10-67 32-19-22-57-5-67-32-7-21-38-19-40-48-2-25-28-32-22-61-6-29 20-36 22-61 2-29 33-27 40-48 10-27 48-10 67-32Z" fill="var(--paper)" stroke={'url(#'+id+')'} strokeWidth="2"/></svg>;
}

export default function ElementorLuxuryArtwork({slug,portrait=false,photo,names}:{slug:string;portrait?:boolean;photo?:string;names?:string[]}){
 if(slug!=='elementor-luxury-1')return null;
 if(portrait)return <div className="luxury-portrait"><LuxuryRosette/>{photo?<img src={photo} alt="Foto sampul pasangan" referrerPolicy="no-referrer"/>:<div className="luxury-initials" aria-hidden="true"><span>{names?.[0]?.trim().slice(0,1)||'A'}</span><small>&</small><span>{names?.[1]?.trim().slice(0,1)||'H'}</span></div>}</div>;
 return <div className="luxury-scene" aria-hidden="true"><div className="luxury-ribbon"/><LuxuryRosette className="luxury-corner top"/><LuxuryRosette className="luxury-corner bottom"/></div>;
}
