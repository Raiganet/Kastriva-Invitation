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

export default function PremiumMotionBoot(){
 useEffect(()=>{
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  let observer:IntersectionObserver|null=null;
  let mutations:MutationObserver|null=null;
  let frame=0;

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

  rebuildObserver();
  schedule();
  mutations=new MutationObserver(schedule);
  mutations.observe(document.body,{childList:true,subtree:true});
  reduced.addEventListener('change',preferenceChanged);
  return()=>{
   if(frame)window.cancelAnimationFrame(frame);
   observer?.disconnect();mutations?.disconnect();
   reduced.removeEventListener('change',preferenceChanged);
  };
 },[]);
 return null;
}
