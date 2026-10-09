import {useState} from 'react';

/** Invitation photos remain optional; an initial also works without any upload. */
export default function InvitationPortrait({photo,name}:{photo?:string;name:string}){
 const [failed,setFailed]=useState(false);
 return <div className="inv-portrait">
  <span className="inv-portrait-halo" aria-hidden="true"/>
  {photo&&!failed
   ?<img src={photo} alt={`Foto ${name}`} loading="lazy" referrerPolicy="no-referrer" onError={()=>setFailed(true)}/>
   :<span className="inv-portrait-initial" aria-hidden="true">{name.slice(0,1)}</span>}
  <svg className="inv-portrait-sprig" viewBox="0 0 180 80" fill="none" stroke="currentColor" aria-hidden="true" focusable="false">
   <path d="M3 13q65 89 174 1M90 61v12"/>
   {[25,48,72,101,126,148].map((x,i)=><path key={x} d={`M${x} ${35+Math.sin(i*.6)*22}q-18-4-14-22 18 4 14 22q3 16 20 12-4-14-20-12Z`} fill="currentColor" fillOpacity=".16"/>)}
  </svg>
 </div>;
}
