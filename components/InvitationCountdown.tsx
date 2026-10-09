'use client';
import {memo,useEffect,useRef,useState} from 'react';
import {countdown} from '@/lib/domain';

const units=['Hari','Jam','Menit','Detik'];
const CountdownCell=memo(function CountdownCell({value,label,animate}:{value:string;label:string;animate:boolean}){
 const [reading,setReading]=useState({value,previous:value,animate});
 // Retain the previous face for this value only; unchanged units never flip.
 if(reading.value!==value||reading.animate!==animate)setReading({value,previous:reading.value!==value?reading.value:value,animate});
 const flip=animate&&reading.previous!==value&&reading.previous!=='--';
 return <div className="inv-countdown-cell" data-countdown-unit={label}>
  <div className="inv-flap-face" style={{'--digit-count':Math.max(value.length,2)} as React.CSSProperties}><strong>{value}</strong>
   {flip&&<span className="inv-flap-motion" key={value} aria-hidden="true">
    <span className="inv-flap-half inv-flap-under"><span>{reading.previous}</span></span>
    <span className="inv-flap-half inv-flap-old"><span>{reading.previous}</span></span>
    <span className="inv-flap-half inv-flap-new"><span>{value}</span></span>
   </span>}
  </div><small>{label}</small>
 </div>;
});

/** Own the clock locally. Offscreen/background timers sleep, then catch up to real time. */
export default function InvitationCountdown({target}:{target:number}){
 const root=useRef<HTMLDivElement>(null);
 const [clock,setClock]=useState<{now:number|null;active:boolean}>({now:null,active:false});
 const [reduced,setReduced]=useState(true);
 useEffect(()=>{
  const preference=window.matchMedia('(prefers-reduced-motion: reduce)');
  const change=()=>setReduced(preference.matches);change();
  preference.addEventListener('change',change);
  return()=>preference.removeEventListener('change',change);
 },[]);
 useEffect(()=>{
  let visible=!('IntersectionObserver' in window),timer:number|undefined;
  const sync=()=>{
   window.clearInterval(timer);
   const now=Date.now(),active=visible&&!document.hidden&&Number.isFinite(target)&&now<target;
   setClock({now,active});
   if(active)timer=window.setInterval(()=>{
    const now=Date.now(),active=now<target;
    setClock({now,active});if(!active)window.clearInterval(timer);
   },1000);
  };
  const observer='IntersectionObserver' in window?new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();},{rootMargin:'40px 0px'}):null;
  if(root.current)observer?.observe(root.current);
  document.addEventListener('visibilitychange',sync);sync();
  return()=>{window.clearInterval(timer);observer?.disconnect();document.removeEventListener('visibilitychange',sync);};
 },[target]);
 const valid=Number.isFinite(target),values=countdown(target,clock.now??target);
 const note=!valid?'Tanggal dan jam acara belum lengkap.':clock.now!==null&&clock.now>=target?'Hari istimewa telah tiba. Sampai berjumpa!':'';
 return <div className="inv-countdown-wrap">
  <div ref={root} className="countdown inv-countdown" data-inv-countdown data-countdown-running={clock.active} data-countdown-motion={clock.active&&!reduced} role="timer" aria-live="off" aria-label="Hitung mundur acara utama">
   {units.map((label,index)=><CountdownCell key={label} label={label} value={valid&&clock.now!==null?String(values[index]).padStart(2,'0'):'--'} animate={clock.active&&!reduced}/>) }
  </div>
  {note&&<p className="inv-countdown-note">{note}</p>}
 </div>;
}
