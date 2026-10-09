export const CARD_SELECTOR='.couple-grid>div,.elegant-couple-person,.event-box,.inv-story-timeline>li,.modern-story-list>li,.elegant-story-timeline>li';

type CardKind='portrait'|'event'|'story';
type Preferences={reduced:MediaQueryList;fine:MediaQueryList};
const HOVER_PROPERTIES=['--card-hover-x','--card-hover-y','--card-light-x','--card-light-y'];

/** Progressive enhancement: markup is readable before this controller is installed. */
export function createInvitationCardMotion({reduced,fine}:Preferences){
 const cards=new Set<HTMLElement>();
 let entrance:IntersectionObserver|null=null,departure:IntersectionObserver|null=null;
 let active:HTMLElement|null=null,rect:DOMRect|null=null,pointerFrame=0;

 function resetHover(){
  if(pointerFrame)cancelAnimationFrame(pointerFrame);
  pointerFrame=0;
  if(active){delete active.dataset.invTilt;HOVER_PROPERTIES.forEach(name=>active?.style.removeProperty(name));}
  active=null;rect=null;
 }
 function sizeCard(element:HTMLElement){
  element.classList.toggle('inv-card-long',element.offsetHeight>window.innerHeight*1.15);
 }
 function reveal(element:HTMLElement){
  sizeCard(element);
  element.classList.remove('inv-reveal-pending');
  element.classList.add('inv-revealed','pm-section-live');
  element.dataset.invCardState='shown';
  entrance?.unobserve(element);
 }
 function wait(element:HTMLElement){
  if(element.contains(document.activeElement))return;
  if(active===element)resetHover();
  element.classList.remove('inv-revealed','pm-section-live');
  element.classList.add('inv-reveal-pending');
  element.dataset.invCardState='waiting';
  entrance?.observe(element);
 }
 function refresh(){
  resetHover();entrance?.disconnect();departure?.disconnect();entrance=null;departure=null;
  if(reduced.matches||!('IntersectionObserver' in window)){cards.forEach(reveal);return;}
  // A zero threshold also reveals chapters taller than the viewport.
  entrance=new IntersectionObserver(entries=>{
   for(const entry of entries)if(entry.isIntersecting)reveal(entry.target as HTMLElement);
  },{threshold:0,rootMargin:'0px 0px -48px 0px'});
  departure=new IntersectionObserver(entries=>{
   for(const entry of entries){
    const element=entry.target as HTMLElement;
    // Re-arm only once the complete card is well outside the reading area.
    if(!entry.isIntersecting&&element.dataset.invCardState==='shown')wait(element);
   }
  },{threshold:0,rootMargin:'180px 0px'});
  cards.forEach(element=>{departure?.observe(element);if(element.dataset.invCardState!=='shown')entrance?.observe(element);});
 }
 function watch(element:HTMLElement,index:number){
  if(cards.has(element))return;
  cards.add(element);
  const kind:CardKind=element.matches('.event-box')?'event':element.matches('li')?'story':'portrait';
  element.classList.add('inv-card-reveal');
  element.dataset.invCardKind=kind;
  element.style.setProperty('--card-side',index%2?'1':'-1');
  sizeCard(element);
  if(reduced.matches||!entrance||element.contains(document.activeElement))reveal(element);
  else wait(element);
  departure?.observe(element);
 }
 function prune(){
  for(const element of cards)if(!element.isConnected){
   if(active===element)resetHover();
   entrance?.unobserve(element);departure?.unobserve(element);cards.delete(element);
  }
 }
 function pointerMove(event:PointerEvent){
  if(reduced.matches||!fine.matches||document.hidden||event.pointerType!=='mouse'){resetHover();return;}
  const target=event.target as Element|null;
  const card=target?.closest<HTMLElement>('.inv-card-reveal');
  if(!card||!cards.has(card)||card.dataset.invCardState!=='shown'||card.matches(':focus-within')||target?.closest('a,button,input,select,textarea,[contenteditable="true"]')){resetHover();return;}
  if(active!==card){resetHover();active=card;rect=card.getBoundingClientRect();sizeCard(card);}
  const box=rect;
  if(!box?.width||!box.height)return;
  const x=Math.max(0,Math.min(1,(event.clientX-box.left)/box.width));
  const y=Math.max(0,Math.min(1,(event.clientY-box.top)/box.height));
  if(pointerFrame)cancelAnimationFrame(pointerFrame);
  pointerFrame=requestAnimationFrame(()=>{
   pointerFrame=0;if(active!==card)return;
   const long=card.classList.contains('inv-card-long');
   card.style.setProperty('--card-hover-x',`${long?0:((.5-y)*4).toFixed(2)}deg`);
   card.style.setProperty('--card-hover-y',`${long?0:((x-.5)*6).toFixed(2)}deg`);
   card.style.setProperty('--card-light-x',`${(x*100).toFixed(1)}%`);
   card.style.setProperty('--card-light-y',`${(y*100).toFixed(1)}%`);
   card.dataset.invTilt='true';
  });
 }
 function pointerOut(event:PointerEvent){
  if(active&&(!(event.relatedTarget instanceof Node)||!active.contains(event.relatedTarget)))resetHover();
 }
 function resize(){resetHover();cards.forEach(sizeCard);}
 refresh();
 document.addEventListener('pointermove',pointerMove,{passive:true});
 document.addEventListener('pointerout',pointerOut,{passive:true});
 document.addEventListener('pointercancel',resetHover);
 document.addEventListener('focusin',resetHover);
 document.addEventListener('visibilitychange',resetHover);
 window.addEventListener('scroll',resetHover,{passive:true});
 window.addEventListener('resize',resize,{passive:true});
 window.addEventListener('blur',resetHover);
 fine.addEventListener('change',resetHover);
 return {watch,reveal,refresh,prune,has:(element:HTMLElement)=>cards.has(element),dispose:()=>{
  resetHover();entrance?.disconnect();departure?.disconnect();
  document.removeEventListener('pointermove',pointerMove);document.removeEventListener('pointerout',pointerOut);
  document.removeEventListener('pointercancel',resetHover);document.removeEventListener('focusin',resetHover);
  document.removeEventListener('visibilitychange',resetHover);window.removeEventListener('scroll',resetHover);
  window.removeEventListener('resize',resize);window.removeEventListener('blur',resetHover);fine.removeEventListener('change',resetHover);
  cards.forEach(element=>{
   reveal(element);element.classList.remove('inv-card-reveal','inv-card-long');
   delete element.dataset.invCardState;delete element.dataset.invCardKind;element.style.removeProperty('--card-side');
  });cards.clear();
 }};
}
