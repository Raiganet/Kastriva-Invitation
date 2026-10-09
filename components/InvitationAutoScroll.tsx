'use client';
import {useEffect,useState} from 'react';

type ScrollStatus='running'|'paused'|'complete';
const SPEED=28; // CSS pixels per second: slow enough to read, independent of frame rate.
const SCROLL_KEYS=new Set(['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' ']);

/** A reading tour, not a scroll lock. Every manual interaction yields control. */
export default function InvitationAutoScroll({contentId}:{contentId:string}){
 const [status,setStatus]=useState<ScrollStatus>('paused');

 useEffect(()=>{
  const preference=window.matchMedia('(prefers-reduced-motion: reduce)');
  setStatus(preference.matches||document.hidden?'paused':'running');
  const pause=()=>setStatus(current=>current==='running'?'paused':current);
  const interact=(event:Event)=>{
   if((event.target as Element|null)?.closest?.('[data-inv-auto-scroll]'))return;
   pause();
  };
  const key=(event:KeyboardEvent)=>{
   if(!SCROLL_KEYS.has(event.key))return;
   // Space activates the focused toggle; Page/Arrow keys still yield to manual scrolling.
   if(event.key===' '&&(event.target as Element|null)?.closest?.('[data-inv-auto-scroll]'))return;
   pause();
  };
  const focus=(event:FocusEvent)=>{
   if((event.target as Element|null)?.closest?.('a,button,input,select,textarea,summary,[contenteditable="true"],dialog'))interact(event);
  };
  const visibility=()=>{if(document.hidden)pause();};
  const reduce=()=>{if(preference.matches)pause();};
  window.addEventListener('wheel',pause,{passive:true});
  window.addEventListener('touchstart',interact,{passive:true});
  window.addEventListener('touchmove',pause,{passive:true});
  window.addEventListener('pointerdown',interact,{passive:true});
  window.addEventListener('keydown',key);
  document.addEventListener('focusin',focus);
  document.addEventListener('visibilitychange',visibility);
  preference.addEventListener('change',reduce);
  return()=>{
   window.removeEventListener('wheel',pause);window.removeEventListener('touchstart',interact);window.removeEventListener('touchmove',pause);
   window.removeEventListener('pointerdown',interact);window.removeEventListener('keydown',key);
   document.removeEventListener('focusin',focus);document.removeEventListener('visibilitychange',visibility);
   preference.removeEventListener('change',reduce);
  };
 },[contentId]);

 useEffect(()=>{
  if(status!=='running')return;
  const content=document.getElementById(contentId);
  if(!content)return;
  let frame=0,last=0,position=window.scrollY,lastApplied=window.scrollY;
  const begins=performance.now()+1600;
  const step=(now:number)=>{
   if(document.hidden||document.querySelector('dialog[open]')){setStatus('paused');return;}
   if(now<begins){last=now;position=lastApplied=window.scrollY;frame=requestAnimationFrame(step);return;}
   // Includes scrollbar dragging and programmatic navigation, without fighting the user.
   if(Math.abs(window.scrollY-lastApplied)>3){setStatus('paused');return;}
   const end=Math.max(0,Math.min(window.scrollY+content.getBoundingClientRect().bottom-window.innerHeight,document.documentElement.scrollHeight-window.innerHeight));
   if(window.scrollY>=end-1){setStatus('complete');return;}
   const elapsed=last?Math.min(now-last,64):0;last=now;
   position=Math.min(end,position+SPEED*elapsed/1000);
   window.scrollTo({top:position,behavior:'instant'});
   lastApplied=window.scrollY;
   frame=requestAnimationFrame(step);
  };
  frame=requestAnimationFrame(step);
  return()=>cancelAnimationFrame(frame);
 },[status,contentId]);

 function toggle(){
  if(status==='running'){setStatus('paused');return;}
  if(status==='complete')document.getElementById(contentId)?.scrollIntoView({behavior:'instant',block:'start'});
  setStatus('running');
 }
 const label=status==='running'?'Jeda gulir':status==='complete'?'Ulangi tur':'Lanjut gulir';
 return <div className="inv-auto-scroll" data-inv-auto-scroll data-scroll-state={status}>
  <button type="button" onClick={toggle} aria-label={label} aria-pressed={status==='running'} title="Gulir otomatis perlahan; gulir manual untuk menjeda">
   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" focusable="false">{status==='running'?<path d="M8 5v14M16 5v14"/>:status==='complete'?<path d="M5 10a7 7 0 1 1 0 7M5 4v6h6"/>:<path d="m9 5 10 7-10 7Z"/>}</svg>
   <span>{label}</span>
  </button>
 </div>;
}
