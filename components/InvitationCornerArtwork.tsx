import {isOccasionTheme} from '@/lib/theme-registry';
import {OccasionCorner} from './OccasionArtwork';
/** Original vector compositions. Colors come from the invitation's three decorative inks. */
function Ink({d}:{d:string}){return <path className="inv-ornament-ink" pathLength="1" d={d}/>;}
function Flower({x,y,size=1,petals=5}:{x:number;y:number;size?:number;petals?:number}){
 return <g transform={`translate(${x} ${y}) scale(${size})`}>
  {Array.from({length:petals},(_,i)=><ellipse key={i} className="ornament-petal-inner" cx="0" cy="-11" rx="7" ry="14" transform={`rotate(${i*360/petals})`}/>)}
  <circle className="ornament-foil" r="4"/>
 </g>;
}
function Rose({x,y,size=1}:{x:number;y:number;size?:number}){
 return <g transform={`translate(${x} ${y}) scale(${size})`}>
  <path className="ornament-petal" d="M-24 3C-33-9-22-24-11-21-8-34 11-33 16-23 31-25 35-8 26 1 31 17 15 29 5 24-8 33-26 21-24 3Z"/>
  <path className="ornament-petal-inner" d="M-17-4C-9-21 10-24 16-11 28-1 15 19 1 19-16 21-24 5-17-4Z"/>
  <path d="M-16-5Q2-15 13-4T1 17M-13 1Q-3 15 8 4T-2-7Q-11-3-3 5"/>
 </g>;
}
function Diamond({x,y,size=1}:{x:number;y:number;size?:number}){
 return <g transform={`translate(${x} ${y}) scale(${size})`}><path className="ornament-petal" d="m0-19 19 19L0 19-19 0Z"/><path className="ornament-foil" d="m0-10 10 10L0 10-10 0Z"/><circle fill="var(--paper)" r="3" stroke="none"/></g>;
}

export default function InvitationCornerArtwork({slug}:{slug:string}){
 if(isOccasionTheme(slug))return <OccasionCorner slug={slug}/>;
 let artwork;
 switch(slug){
  case 'elegant-rose': artwork=<>
   <Ink d="M13 168C20 100 62 29 165 16M23 170C32 117 70 53 146 32"/>
   <path className="ornament-leaf" d="M28 125C6 115 9 91 12 80c23 12 27 30 16 45Zm25-31C35 74 42 52 48 40c18 18 18 39 5 54Zm16-21c22-20 44-16 53-7-21 15-37 19-53 7Zm30-30C95 22 112 10 125 9c1 20-9 32-26 34Z"/>
   <Rose x={38} y={47} size={.9}/><Rose x={89} y={24} size={.45}/>
   <circle className="ornament-foil" cx="23" cy="144" r="2"/><circle className="ornament-foil" cx="146" cy="42" r="2"/>
  </>;break;
  case 'modern-minimalist': artwork=<>
   <path className="ornament-petal" d="M14 14h65a65 65 0 0 1-65 65Z" stroke="none" opacity=".35"/>
   <Ink d="M14 169V14h155M24 142V24h118M39 113V39h74"/>
   <path className="ornament-leaf" d="M56 110a54 54 0 0 1 54-54" fill="none" strokeWidth="3"/>
   <path d="M110 67v43h43"/><circle cx="110" cy="110" r="12"/>
   <path className="ornament-foil" d="m155 22 4-4 4 4-4 4ZM22 155l4 4-4 4-4-4Z"/>
  </>;break;
  case 'tropical-paradise': artwork=<>
   <Ink d="M14 171Q49 73 158 18M25 172Q88 110 167 105"/>
   <path className="ornament-leaf" d="M38 137C7 113 7 69 21 45c30 12 52 50 17 92Zm20-43C46 58 67 22 95 9c20 29 10 70-37 85Zm15 33c16-32 57-49 87-31-13 37-52 52-87 31Z"/>
   <path d="m24 57 14 80m-19-38 14 8m-14-28 11 8m16 9-10 18M86 24 58 94m4-38 9 3m-8 17 17-3m66 28-73 26m24-5 8-16m13 10 14 7" stroke="var(--soft)" strokeWidth="2"/>
   <Flower x={32} y={141} size={.76}/><circle className="ornament-foil" cx="137" cy="41" r="15" opacity=".35"/>
  </>;break;
  case 'rustic-wood': artwork=<>
   <Ink d="M20 170Q61 100 112 27M29 169Q93 133 161 83M14 157Q27 98 29 58"/>
   {[0,1,2,3,4].map(i=><g key={i} transform={`translate(${40+i*14} ${135-i*22}) rotate(22)`}><path className="ornament-petal" d="M0 0q-19-3-18-22Q-2-23 0 0Zm0 0q18-5 14-24Q-3-20 0 0Z"/></g>)}
   <path className="ornament-leaf" d="M84 142q10-30 34-26-4 20-34 26Zm25-15q12-29 35-22-9 21-35 22Z"/>
   <path d="m11 158 25 14m-25-7 21 14" strokeWidth="2"/>
   {[62,82,103].map((y,i)=><circle key={y} className="ornament-foil" cx={25-i*3} cy={y} r="3"/>)}
  </>;break;
  case 'galaxy-night': artwork=<>
   <Ink d="m17 140 35-35 36 18 24-60 45-21M23 13v46m28-42v18"/>
   <path className="ornament-foil" d="M118 14a31 31 0 1 0 37 39 27 27 0 0 1-37-39Z"/>
   <circle cx="128" cy="41" r="39" strokeDasharray="1 6" opacity=".45"/>
   {[[17,140],[52,105],[88,123],[112,63],[157,42],[23,66]].map(([x,y])=><path key={`${x}-${y}`} className="ornament-petal-inner" d={`m${x} ${y-6} 2 4 4 2-4 2-2 4-2-4-4-2 4-2Z`}/>)}
   <circle className="ornament-leaf" cx="39" cy="156" r="2"/><circle className="ornament-foil" cx="153" cy="106" r="2"/>
  </>;break;
  case 'sweet-birthday': artwork=<>
   <Ink d="M10 17q75 59 158 18M47 119q-12 24 0 49M101 110q18 35 9 61"/>
   <path className="ornament-petal" d="m22 26 4 23 18-10m19 7 10 22 14-18m20 1 15 20 10-22"/>
   <ellipse className="ornament-petal-inner" cx="46" cy="96" rx="21" ry="28"/><ellipse className="ornament-leaf" cx="100" cy="85" rx="18" ry="25"/>
   <path d="m46 124-4 5h8Zm54-14-4 5h8ZM34 82q-5 5-4 13m65-24-5 8"/>
   <path className="ornament-foil" d="m140 88 3 9 9 3-9 3-3 9-3-9-9-3 9-3Z"/><path d="m18 146 8-6m128-1-6 8m-73-16 6 8"/>
  </>;break;
  case 'aqiqah-blessing': artwork=<>
   <Ink d="M18 12v74M63 12v29M108 12v14M23 146q22 16 44 0t44 0"/>
   <path className="ornament-foil" d="M121 28a29 29 0 1 0 27 41 25 25 0 0 1-27-41Z"/>
   <path className="ornament-petal-inner" d="M78 97c-17-18-36-3-33 8-19-9-30 13-18 24h104c16-14 2-31-12-22-3-21-30-29-41-10Z"/>
   <path className="ornament-leaf" d="m18 85 4 9 10 2-7 7 1 10-8-5-8 5 1-10-7-7 10-2Zm45-44 3 7 7 2-5 5 1 7-6-4-6 4 1-7-5-5 7-2Z"/>
   <circle cx="149" cy="120" r="3"/><circle cx="64" cy="159" r="2"/>
  </>;break;
  case 'corporate-event': artwork=<>
   <path className="ornament-leaf" d="M12 12h115l-21 21H33v73l-21 21Z" opacity=".25"/>
   <Ink d="M13 168V13h155M29 153V29h124M47 115V47h68"/>
   <path d="M75 60v62m22-62v62m22-62v62M60 75h62m-62 22h62m-62 22h62" opacity=".3"/>
   <path className="ornament-petal" d="M67 112V91h9v21Zm18 0V81h9v31Zm18 0V63h9v49Z" opacity=".55"/>
   <circle className="ornament-foil" cx="152" cy="29" r="3"/>
  </>;break;
  case 'islami-sakinah': artwork=<>
   <Ink d="M15 169V59c0-21 18-30 36-46 18 16 36 25 36 46M24 169V64c0-17 14-27 27-38"/>
   <g transform="translate(98 87)"><path className="ornament-petal" d="M0-38 11-27 27-27 27-11 38 0 27 11 27 27 11 27 0 38-11 27-27 27-27 11-38 0-27-11-27-27-11-27Z" opacity=".4"/><path d="m0-39 28 11 11 28-11 28-28 11-28-11-11-28 11-28Z"/><rect x="-20" y="-20" width="40" height="40" transform="rotate(45)"/><circle className="ornament-foil" r="5"/></g>
   <path className="ornament-leaf" d="M35 154q19-28 33-18-5 18-33 18Zm94-107q7-28 27-25-2 22-27 25Z"/>
  </>;break;
  case 'adat-sunda': artwork=<>
   <Ink d="M15 169Q29 82 93 20M19 139Q88 71 168 28"/>
   <path className="ornament-leaf" d="M32 115Q3 100 17 76q26 8 15 39Zm18-31Q31 53 52 35q21 26-2 49Zm18-22q9-28 37-19-8 24-37 19Zm34-21q7-27 34-22-6 23-34 22Z"/>
   {[0,1,2,3,4].map(i=><Flower key={i} x={26+i*24} y={143-i*23} size={.42+i*.02}/>)}
   <path d="M39 163q9-17 21-13m-8 19q9-17 21-13"/>
  </>;break;
  case 'adat-minang': artwork=<>
   <Ink d="M15 171V15h156M31 171V31h140M10 153l10-9-10-9 10-9-10-9m143-107-9 10-9-10-9 10-9-10"/>
   <Diamond x={51} y={51}/><Diamond x={108} y={51} size={.75}/><Diamond x={51} y={108} size={.75}/>
   <path d="m86 103 15-17 16 17-16 17Z"/><path className="ornament-leaf" d="m143 48 10 10-10 10-10-10ZM48 143l10-10 10 10-10 10Z"/>
  </>;break;
  case 'adat-jawa': artwork=<>
   <Ink d="M13 169V13h156M24 158V24h134"/>
   {[[53,53],[114,53],[53,114]].map(([x,y])=><g key={`${x}-${y}`} transform={`translate(${x} ${y})`}>{[0,90,180,270].map(a=><ellipse key={a} className="ornament-petal-inner" cx="0" cy="-15" rx="9" ry="16" transform={`rotate(${a})`}/>)}<path className="ornament-foil" d="m0-5 5 5-5 5-5-5Z"/></g>)}
   <path d="m93 113 20-20 20 20-20 20ZM35 158h36m87-123v36" strokeDasharray="1 5"/>
  </>;break;
  case 'adat-bali': artwork=<>
   <Ink d="M17 170Q20 86 56 22M23 161Q100 134 159 59M36 26Q86 5 154 16"/>
   <path className="ornament-leaf" d="M30 130C4 103 12 71 24 56c24 25 24 51 6 74Zm49 1c10-31 46-56 75-40-10 28-45 48-75 40Z"/>
   <path d="M68 29q28 10 69 1M64 39q28 10 69 1M60 49q28 10 69 1"/>
   <Flower x={45} y={51} size={1.05}/><Flower x={66} y={119} size={.74}/><Flower x={128} y={70} size={.45}/>
  </>;break;
  case 'elementor-luxury-1': artwork=<>
   <Ink d="M15 169V47q0-32 32-32h122M27 149V52q0-25 25-25h97M44 140q27-3 14-25-15-25 11-38 27-13 24 15-2 18-18 8"/>
   <path className="ornament-petal" d="M38 38h83L38 121Z" opacity=".15"/>
   {[0,1,2,3,4].map(i=><path key={i} d={`M38 112Q${47+i*8} ${47+i*5} 112 38`} opacity=".6"/>)}
   <path className="ornament-foil" d="m131 36 5 10 10 5-10 5-5 10-5-10-10-5 10-5Z"/><circle cx="25" cy="155" r="3"/>
  </>;break;
  case 'botanical-blush': artwork=<>
   <Ink d="M13 169C16 102 65 49 155 17M20 170Q71 113 167 93"/>
   {[[29,130,-28],[51,90,-15],[83,55,12],[116,30,30],[79,124,65],[115,109,75]].map(([x,y,a],i)=><ellipse key={i} className="ornament-leaf" cx={x} cy={y} rx="12" ry="24" transform={`rotate(${a} ${x} ${y})`} opacity={i%2 ? .45 : .7}/>)}
   <Rose x={34} y={50} size={.72}/><Rose x={67} y={25} size={.4}/><path d="m138 62 3-5 3 5-3 5ZM36 155l4 3-4 3Z"/>
  </>;break;
  case 'aurora-modern': artwork=<>
   <Ink d="M15 153C29 56 101 10 166 19M19 166C34 98 111 63 168 79"/>
   <ellipse className="ornament-petal" cx="74" cy="78" rx="58" ry="26" transform="rotate(-35 74 78)" fill="none" strokeWidth="4" opacity=".6"/>
   <ellipse className="ornament-leaf" cx="74" cy="78" rx="30" ry="58" transform="rotate(29 74 78)" fill="none" strokeWidth="2"/>
   <ellipse cx="74" cy="78" rx="22" ry="35" transform="rotate(-17 74 78)" strokeDasharray="2 5"/>
   <circle className="ornament-foil" cx="117" cy="41" r="5"/><circle className="ornament-leaf" cx="29" cy="104" r="3"/>
   <path className="ornament-foil" d="m137 116 3 10 10 3-10 3-3 10-3-10-10-3 10-3Z"/>
  </>;break;
  default: artwork=<Ink d="M15 165V15h150M25 140V25h115"/>;
 }
 return <svg className="inv-corner-art" data-ornament-art={slug} viewBox="0 0 180 180" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{artwork}</svg>;
}
