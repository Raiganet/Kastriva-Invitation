'use client';
import {useEffect} from 'react';

const SECTION_SELECTOR='.inv-section,.inv-closing';
const STAGGER_SELECTOR=[
  '.couple-grid>div',
  '.event-box',
  '.photo-grid>:is(a,button)',
  '.photo-placeholders>div',
  '.wish-card',
  '.gift-disclosure',
  '.countdown>div',
  '.inv-location',
].join(',');
const INTERACTIVE_SELECTOR=[
  '.event-box',
  '.couple-grid>div',
  '.wish-card',
  '.gift-disclosure',
  '.inv-location',
  '.countdown>div',
  '.guest-card',
  '.photo-grid>:is(a,button)',
  '.photo-placeholders>div',
].join(',');
const DEPTH_SELECTOR=[
  '.event-box',
  '.couple-grid>div',
  '.wish-card',
  '.gift-account',
  '.inv-location',
  '.countdown>div',
  '.gallery-photo',
].join(',');

export default function PremiumMotionBoot(){
 useEffect(()=>{
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  const fine=window.matchMedia('(hover:hover) and (pointer:fine)');
  let observer:IntersectionObserver|null=null;
  let mutations:MutationObserver|null=null;
  let frame=0;
  let pointerFrame=0;

  const reveal=(section:HTMLElement)=>{
   section.classList.remove('inv-reveal-pending');
   section.classList.add('inv-revealed','pm-section-live');
  };

  const rebuildObserver=()=>{
   observer?.disconnect();observer=null;
   if(reduced.matches||!('IntersectionObserver' in window))return;
   observer=new IntersectionObserver(entries=>{
    for(const entry of entries){
     if(!entry.isIntersecting)continue;
     reveal(entry.target as HTMLElement);
     observer?.unobserve(entry.target);
    }
   },{threshold:.14,rootMargin:'0px 0px -8% 0px'});
  };

  const enhanceRoot=(root:HTMLElement)=>{
   root.classList.add('inv-premium-motion');
   const sections=Array.from(root.querySelectorAll<HTMLElement>(SECTION_SELECTOR));
   sections.forEach((section,index)=>{
    section.classList.add('pm-section');
    section.style.setProperty('--pm-section-order',String(index));
    if(!section.dataset.pmVariant){
     section.dataset.pmVariant=String(index%4);
     section.classList.add(['pm-rise','pm-left','pm-right','pm-scale'][index%4]);
    }
    const staggered=Array.from(section.querySelectorAll<HTMLElement>(STAGGER_SELECTOR));
    staggered.forEach((item,itemIndex)=>{
     item.classList.add('pm-stagger');
     item.style.setProperty('--pm-order',String(Math.min(itemIndex,12)));
    });
    section.querySelectorAll<HTMLElement>(INTERACTIVE_SELECTOR).forEach(item=>item.classList.add('pm-interactive'));
    section.querySelectorAll<HTMLElement>(DEPTH_SELECTOR).forEach(item=>item.classList.add('pm-depth-card'));

    if(reduced.matches||!observer){
     reveal(section);
    }else if(section.classList.contains('inv-revealed')){
     section.classList.remove('inv-reveal-pending');
    }else if(section.getBoundingClientRect().top<=window.innerHeight*.82){
     reveal(section);
    }else{
     section.classList.add('inv-reveal-pending');
     observer.observe(section);
    }
   });

   root.querySelectorAll<HTMLElement>(INTERACTIVE_SELECTOR).forEach(item=>item.classList.add('pm-interactive'));
   root.querySelectorAll<HTMLElement>(DEPTH_SELECTOR).forEach(item=>item.classList.add('pm-depth-card'));
   root.querySelectorAll<HTMLElement>('.inv-bottom-nav,.inv-music').forEach(item=>item.classList.add('pm-floating-control'));
  };

  const scan=()=>document.querySelectorAll<HTMLElement>('.invitation').forEach(enhanceRoot);
  const schedule=()=>{
   if(frame)return;
   frame=window.requestAnimationFrame(()=>{frame=0;scan();});
  };
  const preferenceChanged=()=>{
   rebuildObserver();
   if(reduced.matches)document.querySelectorAll<HTMLElement>('.invitation .pm-section').forEach(reveal);
   schedule();
  };

  const pointerMove=(event:PointerEvent)=>{
   if(reduced.matches||!fine.matches)return;
   const root=(event.target as Element|null)?.closest?.('.invitation.inv-premium-motion') as HTMLElement|null;
   if(!root)return;
   if(pointerFrame)cancelAnimationFrame(pointerFrame);
   pointerFrame=requestAnimationFrame(()=>{
    pointerFrame=0;
    const rr=root.getBoundingClientRect();
    if(!rr.width||!rr.height)return;
    const nx=(event.clientX-rr.left)/rr.width-.5;
    const ny=(event.clientY-rr.top)/rr.height-.5;
    const x=Math.max(-10,Math.min(10,nx*12));
    const y=Math.max(-8,Math.min(8,ny*10));
    root.style.setProperty('--pm-ambient-x',`${x.toFixed(2)}px`);
    root.style.setProperty('--pm-ambient-y',`${y.toFixed(2)}px`);
    root.style.setProperty('--pm-ambient-inverse-x',`${(-x*.35).toFixed(2)}px`);
    root.style.setProperty('--pm-ambient-inverse-y',`${(-y*.35).toFixed(2)}px`);
   });
  };

  const pointerOut=(event:PointerEvent)=>{
   const from=(event.target as Element|null)?.closest?.('.invitation.inv-premium-motion') as HTMLElement|null;
   const to=(event.relatedTarget as Element|null)?.closest?.('.invitation.inv-premium-motion') as HTMLElement|null;
   if(!from||from===to)return;
   from.style.setProperty('--pm-ambient-x','0px');
   from.style.setProperty('--pm-ambient-y','0px');
   from.style.setProperty('--pm-ambient-inverse-x','0px');
   from.style.setProperty('--pm-ambient-inverse-y','0px');
  };

  rebuildObserver();
  schedule();
  mutations=new MutationObserver(schedule);
  mutations.observe(document.body,{childList:true,subtree:true});
  reduced.addEventListener('change',preferenceChanged);
  document.addEventListener('pointermove',pointerMove,{passive:true});
  document.addEventListener('pointerout',pointerOut,{passive:true});
  return()=>{
   if(frame)window.cancelAnimationFrame(frame);
   if(pointerFrame)window.cancelAnimationFrame(pointerFrame);
   observer?.disconnect();mutations?.disconnect();
   reduced.removeEventListener('change',preferenceChanged);
   document.removeEventListener('pointermove',pointerMove);
   document.removeEventListener('pointerout',pointerOut);
  };
 },[]);
 return null;
}
