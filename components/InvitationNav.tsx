'use client';
import {useEffect,useRef,useState} from 'react';

export type InvitationNavItem={id:string;label:string;icon:'home'|'couple'|'calendar'|'story'|'gallery'|'gift'};
function NavIcon({name}:{name:InvitationNavItem['icon']}){
 const paths={gift:'M3 7h18v4H3Zm2 4v10h14V11M12 7v14M12 7C3 7 5 0 9 3l3 4Zm0 0c9 0 7-7 3-4l-3 4Z',home:'m3 10 9-7 9 7v10H3Zm6 10v-7h6v7',couple:'M10 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm10 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM2 20v-3a5 5 0 0 1 10 0v3m0-3a5 5 0 0 1 10 0v3',calendar:'M4 5h16v16H4ZM8 3v4m8-4v4M4 10h16m-11 5h2m3 0h2',story:'M12 6C8 3 4 4 2 5v15c3-2 7-2 10 0 3-2 7-2 10 0V5c-2-1-6-2-10 1Zm0 0v14',gallery:'M3 3h18v18H3Zm0 14 6-6 4 4 3-3 5 5M16 7h.01'};
 return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d={paths[name]}/></svg>;
}
export default function InvitationNav({items}:{items:InvitationNavItem[]}){
 const navRef=useRef<HTMLElement|null>(null);
 const [active,setActive]=useState(items[0]?.id);
 useEffect(()=>{
  let frame=0;
  const update=()=>{frame=0;let current=items[0]?.id;const marker=Math.max(100,window.innerHeight*.3);for(const item of items){const section=document.getElementById(item.id);if(section&&section.getBoundingClientRect().top<=marker)current=item.id;}setActive(current);};
  const schedule=()=>{if(!frame)frame=window.requestAnimationFrame(update);};
  update();window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule);
  return()=>{window.removeEventListener('scroll',schedule);window.removeEventListener('resize',schedule);window.cancelAnimationFrame(frame);};
 },[items]);
 useEffect(()=>{
  const nav=navRef.current;if(!nav)return;
  const revealActive=()=>{
   const selected=nav.querySelector<HTMLButtonElement>('button[aria-current]');if(!selected)return;
   const rail=nav.getBoundingClientRect(),tab=selected.getBoundingClientRect();
   if(tab.left>=rail.left+6&&tab.right<=rail.right-6)return;
   // Move only the horizontal rail, never the invitation's reading position.
   nav.scrollTo({left:nav.scrollLeft+tab.left-rail.left-(nav.clientWidth-tab.width)/2,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
  };
  revealActive();
  const resize=new ResizeObserver(revealActive);resize.observe(nav);
  return()=>resize.disconnect();
 },[active]);
 function go(id:string){
  const section=document.getElementById(id);if(!section)return;
  section.focus({preventScroll:true});
  // Global page padding and invitation margins otherwise add up on short screens.
  const toolbar=section.closest('.invitation')?.querySelector('.inv-toolbar');
  const inset=Math.max(0,toolbar?.getBoundingClientRect().bottom??0)+24;
  window.scrollTo({top:window.scrollY+section.getBoundingClientRect().top-inset,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
 }
 return <nav ref={navRef} className="inv-bottom-nav" aria-label="Bagian undangan">{items.map(item=><button type="button" key={item.id} aria-controls={item.id} aria-current={active===item.id?'location':undefined} onClick={()=>go(item.id)}><NavIcon name={item.icon}/><span>{item.label}</span></button>)}</nav>;
}
