'use client';
import {useEffect} from 'react';

const SECTION_SELECTOR='.inv-section,.inv-closing';
const AMBIENT_SELECTOR='.inv-cover,.inv-hero,.inv-section,.inv-closing';
const STAGGER_SELECTOR=[
  ':scope>.overline',
  ':scope>h2',
  ':scope>.inv-section-divider',
  '.couple-grid>div',
  '.elegant-couple-person',
  '.event-box',
  '.photo-grid>:is(a,button)',
  '.photo-placeholders>div',
  '.wish-card',
  '.general-wishes .wish-card',
  '.gift-disclosure',
  '.gift-account',
  '.countdown',
  '.inv-timeline>li',
  '.inv-story-timeline>li',
  '.modern-story-list>li',
  '.inv-gallery',
  '.story-text',
  '.rsvp-form',
].join(',');
const INTERACTIVE_SELECTOR=[
  '.event-box',
  '.couple-grid>div',
  '.wish-card',
  '.gift-disclosure',
  '.gift-account',
  '.inv-location',
  '.countdown>div',
  '.guest-card',
  '.photo-grid>:is(a,button)',
  '.photo-placeholders>div',
  '.inv-timeline>li',
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
  let ambientObserver:IntersectionObserver|null=null;
  const ambientTargets=new Set<HTMLElement>();
  let mutations:MutationObserver|null=null;
  let frame=0;
  let pointerFrame=0;

  const reveal=(section:HTMLElement)=>{
   section.classList.remove('inv-reveal-pending');
   section.classList.add('inv-revealed','pm-section-live');
  };

  const restartDigit=(node:Node)=>{
   const element=(node.nodeType===Node.TEXT_NODE?node.parentElement:node) as HTMLElement|null;
   const digit=element?.closest?.('.countdown strong') as HTMLElement|null;
   if(!digit)return;
   digit.classList.remove('rm-digit-flip');
   // Force a reflow so a changed countdown value replays the 3D flip.
   void digit.offsetWidth;
   digit.classList.add('rm-digit-flip');
  };

  const rebuildObserver=()=>{
   observer?.disconnect();observer=null;
   ambientObserver?.disconnect();ambientObserver=null;
   ambientTargets.forEach(element=>element.classList.remove('inv-motion-visible'));
   ambientTargets.clear();
   if(reduced.matches||!('IntersectionObserver' in window))return;
   // Decorative loops run only around the viewport; reveal animations remain one-shot.
   ambientObserver=new IntersectionObserver(entries=>{
    for(const entry of entries)(entry.target as HTMLElement).classList.toggle('inv-motion-visible',entry.isIntersecting);
   },{threshold:0,rootMargin:'80px 0px'});
   observer=new IntersectionObserver(entries=>{
    for(const entry of entries){
     if(!entry.isIntersecting)continue;
     reveal(entry.target as HTMLElement);
     observer?.unobserve(entry.target);
    }
   },{threshold:0,rootMargin:'0px 0px -32px 0px'});
  };

  const enhanceRoot=(root:HTMLElement)=>{
   // Streaming can expose server HTML before InvitationView has hydrated.
   // Its effect signals when imperative decoration is safe for this root.
   if(root.dataset.invHydrated!=='true')return;
   root.classList.add('inv-premium-motion','inv-reference-motion');
   root.dataset.invPageHidden=String(document.hidden);
   for(const element of ambientTargets){
    if(!element.isConnected){ambientObserver?.unobserve(element);ambientTargets.delete(element);}
   }
   if(ambientObserver)root.querySelectorAll<HTMLElement>(AMBIENT_SELECTOR).forEach(element=>{
    if(ambientTargets.has(element))return;
    ambientTargets.add(element);ambientObserver?.observe(element);
   });
   const watch=(element:HTMLElement)=>{
    if(reduced.matches||!observer||element.classList.contains('inv-revealed'))reveal(element);
    else if(!element.classList.contains('inv-reveal-pending')){
     element.classList.add('inv-reveal-pending');
     observer.observe(element);
    }
   };
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
     item.classList.add('pm-stagger','inv-moment');
     item.style.setProperty('--pm-order',String(itemIndex%3));
     watch(item);
    });
    section.querySelectorAll<HTMLElement>(INTERACTIVE_SELECTOR).forEach(item=>item.classList.add('pm-interactive'));
    section.querySelectorAll<HTMLElement>(DEPTH_SELECTOR).forEach(item=>item.classList.add('pm-depth-card'));

    watch(section);
   });

   root.querySelectorAll<HTMLElement>(INTERACTIVE_SELECTOR).forEach(item=>item.classList.add('pm-interactive'));
   root.querySelectorAll<HTMLElement>(DEPTH_SELECTOR).forEach(item=>item.classList.add('pm-depth-card'));
   root.querySelectorAll<HTMLElement>('.inv-bottom-nav,.inv-music').forEach(item=>item.classList.add('pm-floating-control'));
   root.querySelectorAll<HTMLElement>('.countdown strong').forEach(item=>item.classList.add('rm-digit-flip'));
  };

  const scan=()=>document.querySelectorAll<HTMLElement>('.invitation').forEach(enhanceRoot);
  const visibilityChanged=()=>document.querySelectorAll<HTMLElement>('.invitation').forEach(root=>{root.dataset.invPageHidden=String(document.hidden);});
  const schedule=()=>{
   if(frame)return;
   frame=window.requestAnimationFrame(()=>{frame=0;scan();});
  };
  const preferenceChanged=()=>{
   rebuildObserver();
   document.querySelectorAll<HTMLElement>('.invitation .inv-reveal-pending').forEach(element=>{
    if(reduced.matches)reveal(element);
    else observer?.observe(element);
   });
   schedule();
  };

  // Keyboard navigation must never land in a visually hidden section.
  const focusSection=(event:FocusEvent)=>{
   let element=event.target as HTMLElement|null;
   while(element?.closest('.invitation')){
    if(element.classList.contains('inv-reveal-pending')){reveal(element);observer?.unobserve(element);}
    element=element.parentElement;
   }
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
  document.addEventListener('invitation:ready',schedule);
  document.addEventListener('visibilitychange',visibilityChanged);
  mutations=new MutationObserver(records=>{
   // Countdown text changes every second. Only new element trees need enhancement.
   if(records.some(record=>record.type==='childList'&&Array.from(record.addedNodes).some(node=>
    node instanceof Element&&(node.closest('.invitation')||node.querySelector('.invitation'))
   )))schedule();
   if(reduced.matches)return;
   for(const record of records){
    if(record.type==='characterData')restartDigit(record.target);
    else for(const node of Array.from(record.addedNodes))restartDigit(node);
   }
  });
  mutations.observe(document.body,{childList:true,subtree:true,characterData:true});
  reduced.addEventListener('change',preferenceChanged);
  document.addEventListener('pointermove',pointerMove,{passive:true});
  document.addEventListener('pointerout',pointerOut,{passive:true});
  document.addEventListener('focusin',focusSection);
  return()=>{
   if(frame)window.cancelAnimationFrame(frame);
   if(pointerFrame)window.cancelAnimationFrame(pointerFrame);
   observer?.disconnect();ambientObserver?.disconnect();ambientTargets.clear();mutations?.disconnect();
   reduced.removeEventListener('change',preferenceChanged);
   document.removeEventListener('pointermove',pointerMove);
   document.removeEventListener('pointerout',pointerOut);
   document.removeEventListener('focusin',focusSection);
   document.removeEventListener('invitation:ready',schedule);
   document.removeEventListener('visibilitychange',visibilityChanged);
  };
 },[]);
 return null;
}
