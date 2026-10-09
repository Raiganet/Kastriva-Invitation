import {isOccasionTheme} from '@/lib/theme-registry';

function Star({x,y,size=1}:{x:number;y:number;size?:number}){
 return <path className="occasion-foil" transform={`translate(${x} ${y}) scale(${size})`} d="m0-10 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z"/>;
}
function Bow(){
 return <><path className="occasion-petal" d="M60 42C18 8 7 38 24 52c10 7 27 2 36-10ZM60 42C102 8 113 38 96 52c-10 7-27 2-36-10Z"/><path d="M57 46Q39 65 38 87l13-6 8 9q-5-30 3-43M65 45q21 13 25 33l-15-5-5 13q4-25-5-41"/><ellipse className="occasion-foil" cx="61" cy="43" rx="6" ry="8"/><path d="M28 39q16-3 27 4m12 0q14-7 27-4"/></>;
}

/** Original vectors, reused on the real invitation and its catalog preview. */
export function OccasionMotif({slug}:{slug:string}){
 return <svg className="theme-motif occasion-motif" viewBox="0 0 120 100" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
  {slug==='velvet-vow'?<Bow/>:slug==='peach-confetti'?<><path className="occasion-petal" d="M34 73V48a26 26 0 0 1 52 0v25Z"/><path d="M45 69V48a15 15 0 0 1 30 0v21M24 76h72"/><Star x={90} y={22} size={.7}/><path d="m23 26 5 7m67 20 8-3M56 12l3-6"/><circle className="occasion-leaf" cx="19" cy="54" r="4"/><circle className="occasion-foil" cx="84" cy="83" r="3"/></>:slug==='little-moon'?<><path className="occasion-foil" d="M65 12a31 31 0 1 0 31 41 28 28 0 0 1-31-41Z"/><path className="occasion-cloud" d="M27 72c-8-14 10-26 19-17 6-18 29-17 36 0 15-5 23 13 11 20H28Z"/><Star x={89} y={21} size={.65}/><Star x={105} y={43} size={.35}/><path d="M39 83h30m6 0h5"/></>:<><path d="M20 82V52l25-24 20 20 20-31 15 16v49M32 79V56l13-13 20 20 21-29"/><path className="occasion-foil" d="m62 10 4 10 10 4-10 4-4 10-4-10-10-4 10-4Z"/><path d="M15 88h90M85 52v25M46 62v15"/></>}
 </svg>;
}

export function OccasionCorner({slug}:{slug:string}){
 return <svg className="inv-corner-art occasion-corner" data-ornament-art={slug} viewBox="0 0 180 180" fill="none" stroke="currentColor" strokeWidth="1.15" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
  {slug==='velvet-vow'?<><path className="inv-ornament-ink" pathLength="1" d="M16 165V48q0-32 32-32h117M25 144V48q0-23 23-23h96"/><g transform="translate(5 0) scale(1.1)"><Bow/></g><path d="M21 151Q65 111 147 97"/><path className="occasion-leaf" d="M58 125q-18-18-11-34 20 6 11 34Zm23-12q9-23 32-18-7 20-32 18Zm29-13q-9-20 1-30 15 12-1 30Z"/><circle className="occasion-foil" cx="135" cy="21" r="3"/></>:slug==='peach-confetti'?<><path className="inv-ornament-ink" pathLength="1" d="M14 155V67a53 53 0 0 1 106 0M26 150V67a41 41 0 0 1 82 0"/><path className="occasion-petal" d="M39 117V68a28 28 0 0 1 56 0v49h-12V68a16 16 0 0 0-32 0v49Z"/><path className="occasion-leaf" d="m132 55 12-7 13 23-12 7ZM30 145l12-4 8 22-12 4Z"/><Star x={141} y={122}/><Star x={155} y={28} size={.5}/><circle className="occasion-foil" cx="83" cy="146" r="6"/><path d="m112 132 4 12m28-51 11-4"/></>:slug==='little-moon'?<><path className="inv-ornament-ink" pathLength="1" d="M24 12v51M61 12v28M106 12v11M13 155q31-17 58-2t68-3"/><path className="occasion-foil" d="M126 22a37 37 0 1 0 34 50 32 32 0 0 1-34-50Z"/><path className="occasion-cloud" d="M25 128c-19-11-3-36 12-26-1-28 38-37 51-10 23-13 46 11 30 32 17-3 25 16 11 24H20c-12-8-7-19 5-20Z"/><Star x={24} y={73} size={.8}/><Star x={61} y={48} size={.55}/><Star x={150} y={105} size={.5}/></>:<><path className="inv-ornament-ink" pathLength="1" d="M16 163V59L59 16h104M27 163V64L64 27h99M39 163V70l31-31h93"/><path className="occasion-petal" d="m91 47 42 42-42 42-42-42Z" opacity=".3"/><path d="m68 90 23-23 23 23-23 23ZM101 163l61-62"/><Star x={149} y={148}/><circle className="occasion-leaf" cx="159" cy="67" r="4"/></>}
 </svg>;
}

export default function OccasionArtwork({slug}:{slug:string}){
 if(!isOccasionTheme(slug))return null;
 return <div className="occasion-artwork" data-occasion-art={slug} aria-hidden="true">
  <svg className="occasion-scene" viewBox="0 0 600 800" preserveAspectRatio="xMidYMid slice" fill="none" stroke="currentColor" strokeWidth="1" focusable="false">
   {slug==='velvet-vow'?<><path className="occasion-ribbon" d="M-60 30C170 220 420-85 670 155M-60 75C170 265 420-40 670 200"/><path d="M36 680V136q0-100 100-100h328q100 0 100 100v544M48 680V136q0-88 88-88h328q88 0 88 88v544"/><path className="occasion-ribbon" d="M-40 665C140 550 405 880 650 690"/></>:slug==='peach-confetti'?<><path className="occasion-rainbow" d="M-50 665V315a350 350 0 0 1 700 0v350M-10 665V315a310 310 0 0 1 620 0v350M30 665V315a270 270 0 0 1 540 0v350"/>{[[44,80],[533,136],[74,520],[518,630],[84,722],[507,360]].map(([x,y],i)=><g key={x} className="occasion-confetti" transform={`translate(${x} ${y}) rotate(${i*27})`}><rect className={i%2?'occasion-leaf':'occasion-petal'} width="9" height="23" rx="3"/><circle className="occasion-foil" cx="26" cy="24" r="4"/></g>)}</>:slug==='little-moon'?<><path d="M66 0v120M518 0v202M130 0v58"/><Star x={66} y={133} size={1.4}/><Star x={518} y={215} size={1.1}/><Star x={130} y={71} size={.7}/><path className="occasion-cloud" d="M-80 660q45-80 90-25 55-110 124-8 70-46 104 62 63-18 72 70H-80ZM650 760q-23-97-83-75-27-112-119-62-24-93-102-47-32-57-69-5v260h373Z"/><circle cx="453" cy="55" r="3"/><circle cx="158" cy="535" r="3"/></>:<><path className="occasion-grid" d="M0 120h600M0 240h600M0 360h600M0 480h600M0 600h600M0 720h600M120 0v800M240 0v800M360 0v800M480 0v800"/><path className="occasion-beam" d="M-100 500 440-40M-100 550 490-40M165 840l490-490M205 840l450-450"/><path d="M28 230V28h203M372 772h200V573"/><circle cx="28" cy="230" r="4"/><circle cx="372" cy="772" r="4"/></>}
  </svg>
 </div>;
}
