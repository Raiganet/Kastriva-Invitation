'use client';
import type {CSSProperties} from 'react';

export default function AuroraModernArtwork({slug,mode='preview',photo,names}:{
  slug:string;mode?:'preview'|'ambient'|'portrait';photo?:string;names?:string;
}){
 if(slug!=='aurora-modern')return null;
 if(mode==='preview')return <div className="aurora-art-preview" aria-hidden="true"><span className="aurora-preview-ribbon ribbon-a"/><span className="aurora-preview-ribbon ribbon-b"/><span className="aurora-preview-orbit orbit-a"/><span className="aurora-preview-orbit orbit-b"/><span className="aurora-preview-star">✦</span></div>;
 if(mode==='ambient')return <div className="aurora-ambient" aria-hidden="true"><div className="aurora-ribbons"><span/><span/><span/></div><div className="aurora-orbs"><i/><i/><i/><i/></div><div className="aurora-particles">{Array.from({length:22},(_,i)=><b key={i} style={{'--x':`${(i*37)%97}%`,'--delay':`${(i%9)*-.9}s`,'--duration':`${8+(i%7)*1.35}s`,'--size':`${2+(i%4)}px`} as CSSProperties}/>)}</div><span className="aurora-grid"/></div>;
 const initials=(names||'A & S').split('&').map(v=>v.trim().slice(0,1)).filter(Boolean).join(' · ');
 return <div className="aurora-portrait-stage" aria-hidden="true"><span className="aurora-orbit-ring ring-one"/><span className="aurora-orbit-ring ring-two"/><span className="aurora-orbit-ring ring-three"/><div className="aurora-photo-shell">{photo?<img src={photo} alt="" referrerPolicy="no-referrer"/>:<div className="aurora-initials">{initials||'A · S'}</div>}<span className="aurora-photo-glint"/></div><small>PREMIUM MOTION</small></div>;
}
