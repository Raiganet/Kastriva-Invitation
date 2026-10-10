'use client';

import {useState,type ReactNode} from 'react';

type DesktopLayout='split'|'center';

/** Keep one viewport mounted when changing composition, preserving music and scroll. */
export default function InvitationDemoStage({slug,title,src,initialLayout,identity,actions,mobileNavigation,children}:{
 slug:string;title:string;src:string;initialLayout:DesktopLayout;
 identity:ReactNode;actions:ReactNode;mobileNavigation:ReactNode;children:ReactNode;
}){
 const [layout,setLayout]=useState(initialLayout);
 return <main className={`demo-desktop-layout theme-${slug}`} data-demo-layout={layout}>
  <header className="demo-preview-toolbar">
   <div className="demo-preview-identity">{identity}</div>
   <div className="demo-composition" role="group" aria-label="Komposisi desktop">
    <button type="button" aria-pressed={layout==='split'} onClick={()=>setLayout('split')}><svg viewBox="0 0 20 16" aria-hidden="true"><rect x="1" y="1" width="18" height="14" rx="2"/><path d="M12 1v14"/></svg>Samping</button>
    <button type="button" aria-pressed={layout==='center'} onClick={()=>setLayout('center')}><svg viewBox="0 0 20 16" aria-hidden="true"><rect x="1" y="1" width="18" height="14" rx="2"/><path d="M6 1v14M14 1v14"/></svg>Tengah</button>
   </div>
   <nav className="demo-preview-actions" aria-label="Navigasi demo">{actions}</nav>
  </header>
  {mobileNavigation}
  <div className="demo-desktop-stage">
   {children}
   <div className="demo-reader"><iframe className="demo-device-content" src={src} title={`Demo undangan ${title}`} allow="autoplay; fullscreen"/></div>
  </div>
 </main>;
}
