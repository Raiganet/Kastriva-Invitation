import {isPremiumEditionTheme} from '@/lib/theme-registry';

/* Original layered vector illustrations. No remote assets, filters or SVG IDs. */
function Bloom({x,y,scale=1,rose=false}:{x:number;y:number;scale?:number;rose?:boolean}) {
 return <g transform={`translate(${x} ${y}) scale(${scale})`}>
  {[0,45,90,135,180,225,270,315].map(angle=><ellipse key={angle} className={rose?'pe-bloom-deep':'pe-bloom'} cx="0" cy="-13" rx="12" ry="20" transform={`rotate(${angle})`}/>)}
  {[20,80,140,200,260,320].map(angle=><ellipse key={angle} className="pe-petal" cx="0" cy="-9" rx="8" ry="13" transform={`rotate(${angle})`}/>)}
  <path className="pe-cream" d="M-9 1C-15-13 9-18 13-5S-2 18-9 1Z"/>
  <path className="pe-fine" d="M-7-3Q5-11 9-2T0 8Q-8 3-2-2t5 3"/>
  <circle className="pe-gold" r="2.5"/>
 </g>;
}
function Branch({x,y,angle=0,scale=1}:{x:number;y:number;angle?:number;scale?:number}) {
 return <g transform={`translate(${x} ${y}) rotate(${angle}) scale(${scale})`}>
  <path className="pe-stem" d="M0 0Q-3-55 12-113"/>
  {[0,1,2,3].map(i=><g key={i} transform={`translate(${i*1.6} ${-15-i*24})`}>
   <path className={i%2?'pe-sage':'pe-leaf'} d="M0 0Q-37-5-28-28 0-22 0 0Z"/>
   <path className={i%2?'pe-leaf':'pe-sage'} d="M1-7Q29-36 32-11 17-1 1-7Z"/>
   <path className="pe-leaf-vein" d="m0 0-21-21M2-7l24-10"/>
  </g>)}
  <path className="pe-gold" d="M12-103Q-6-137 13-144q16 17-1 41Z"/>
 </g>;
}
function Spark({x,y,scale=1}:{x:number;y:number;scale?:number}) {return <path className="pe-gold" transform={`translate(${x} ${y}) scale(${scale})`} d="m0-11 3 8 8 3-8 3-3 8-3-8-8-3 8-3Z"/>;}
function Balloon({x,y,scale=1,tone='pe-petal'}:{x:number;y:number;scale?:number;tone?:string}) {
 return <g transform={`translate(${x} ${y}) scale(${scale})`}>
  <path className="pe-fine" d="M0 29C-19 61 17 69-1 99"/>
  <ellipse className={tone} cy="-2" rx="22" ry="29"/>
  <path className="pe-cream" opacity=".6" d="M-14-13q2-13 11-11-8 3-8 18Z"/>
  <path className="pe-gold" d="m0 26-4 6h8Z"/>
 </g>;
}
function Carousel() {
 return <g strokeLinejoin="round">
  <path className="pe-cream" d="M14 38 60 9l46 29v9H14Z"/>
  <path className="pe-bloom" d="m14 38 46-29-24 29Zm46-29 8 29H51Zm0 0 46 29H85Z"/>
  <path className="pe-gold" d="M14 38h92v5H14ZM23 83h74v6H23ZM17 91h86v5H17Z"/>
  <path className="pe-fine" d="M29 44v39m31-39v39m31-39v39M14 43q8 14 16 0 7 14 15 0 8 14 15 0 7 14 15 0 8 14 15 0 8 14 16 0"/>
  <path className="pe-sage" d="m41 70 7-9 13 2 6-9 7 4-3 8-8 4-2 7h-4l1-9-8 1-5 8h-5l6-9Z"/>
  <path className="pe-gold" d="m54 9 2-7 4 4 4-4 2 7Z"/>
 </g>;
}
function Lantern({x=60,y=50,scale=1}:{x?:number;y?:number;scale?:number}) {
 return <g transform={`translate(${x} ${y}) scale(${scale})`}>
  <path className="pe-fine" d="M0-63v25"/><circle className="pe-fine" cy="-35" r="4"/>
  <path className="pe-gold" d="m-19-22 19-12 19 12-5 5H-14Z"/>
  <path className="pe-cream" d="M-18-16h36v36L0 33-18 20Z"/>
  <path className="pe-fine" d="M-18-16h36v36L0 33-18 20ZM-7-16v37l7 12 7-12v-37M-18 20h36"/>
  <path className="pe-gold" d="M-5 12q-9-9 5-23 14 14 5 23Z"/>
  <path className="pe-fine" d="M0 33v12m-4-3 4 7 4-7"/>
 </g>;
}
function DecoFan() {
 return <g>
  <path className="pe-deco" d="M12 99V37L37 12h62v18H48L30 48v51Z"/>
  {[0,1,2,3,4].map(i=><path className="pe-fine" key={i} d={`M${16+i*9} 106V${42+i*6}L${42+i*6} ${16+i*9}H106`}/>)}
  <path className="pe-gold" d="m70 70 12-30 12 30-24 0Zm0 0-30 12 30 12Z"/>
  <path className="pe-fine" d="m77 77 29-3-32 32Z"/>
  <Spark x={83} y={83} scale={.75}/>
 </g>;
}

export function PremiumEditionMotif({slug}:{slug:string}) {
 return <svg className="theme-motif premium-edition-motif" viewBox="0 0 120 100" fill="none" aria-hidden="true" focusable="false">
  {slug==='seraphine-garden'?<><Branch x={50} y={84} angle={-35} scale={.45}/><Branch x={69} y={84} angle={35} scale={.45}/><Bloom x={60} y={44} scale={.83}/><path className="pe-fine" d="M34 76q26 17 52 0"/></>:slug==='jubilee-carousel'?<Carousel/>:slug==='nur-eden'?<><Branch x={39} y={89} angle={-30} scale={.4}/><Branch x={79} y={89} angle={30} scale={.4}/><Lantern x={60} y={48} scale={.85}/><Spark x={24} y={30} scale={.4}/><Spark x={93} y={24} scale={.5}/></>:<><g transform="translate(4 -4)"><DecoFan/></g><path className="pe-fine" d="m35 72 25-25 25 25-25 24Z"/></>}
 </svg>;
}

export function PremiumEditionCorner({slug}:{slug:string}) {
 return <svg className="inv-corner-art premium-edition-corner" data-ornament-art={slug} viewBox="0 0 240 240" fill="none" aria-hidden="true" focusable="false">
  {slug==='seraphine-garden'?<>
   <path className="pe-fine inv-ornament-ink" pathLength="1" d="M13 229V80q0-67 67-67h149M24 215V80q0-56 56-56h135"/>
   <Branch x={59} y={82} angle={76} scale={1.02}/><Branch x={62} y={87} angle={178} scale={.9}/><Branch x={73} y={61} angle={30} scale={.62}/>
   <Bloom x={59} y={65} scale={1.16} rose/><Bloom x={105} y={44} scale={.82}/><Bloom x={38} y={110} scale={.72}/><Bloom x={145} y={33} scale={.45} rose/>
   <path className="pe-fine" d="M78 100q32 9 15 47m24-80q20 17 41 3M35 168q41 24 20 57"/>
   {[ [27,157],[79,124],[152,69],[191,28],[18,204] ].map(([x,y])=><circle key={x} className="pe-gold" cx={x} cy={y} r="3"/>)}
  </>:slug==='jubilee-carousel'?<>
   <path className="pe-fine inv-ornament-ink" pathLength="1" d="M12 173V70q0-58 58-58h148M22 173V70q0-48 48-48h148"/>
   <Balloon x={39} y={59} scale={.8}/><Balloon x={77} y={31} scale={.85} tone="pe-sage"/><Balloon x={111} y={62} scale={.64} tone="pe-bloom-deep"/>
   <g transform="translate(45 92) scale(.85)"><Carousel/></g><Spark x={162} y={36}/><Spark x={22} y={174} scale={.6}/><Spark x={171} y={159} scale={.65}/>
   <path className="pe-gold" d="m155 85 7-5 11 17-7 4ZM24 207l6-5 12 17-6 5Z"/><circle className="pe-bloom" cx="186" cy="111" r="6"/>
  </>:slug==='nur-eden'?<>
   <path className="pe-fine inv-ornament-ink" pathLength="1" d="M17 221V88q0-44 48-59L115 9l50 20M26 216V89q0-36 44-51l45-18"/>
   <Branch x={48} y={174} angle={-6} scale={.74}/><Branch x={59} y={178} angle={37} scale={.67}/>
   <Lantern x={90} y={67} scale={1.18}/><Lantern x={163} y={57} scale={.6}/>
   <Bloom x={46} y={156} scale={.61}/><Bloom x={84} y={177} scale={.38}/><Spark x={36} y={43} scale={.55}/><Spark x={157} y={119} scale={.55}/>
   <path className="pe-gold" d="M201 25a20 20 0 1 0 21 30 22 22 0 0 1-21-30Z"/>
  </>:<>
   <g transform="scale(1.8)"><DecoFan/></g>
   <path className="pe-fine inv-ornament-ink" pathLength="1" d="M12 223V52L52 12h171M25 223v-24m174-174h24"/>
   {[0,1,2,3,4].map(i=><g key={i} transform={`translate(${83+i*24} 20)`}><path className="pe-fine" d={`M0 0v${37+i*15}`}/><path className="pe-gold" d={`m0 ${37+i*15}-4 7 4 9 4-9Z`}/></g>)}
   <Spark x={168} y={173} scale={1.1}/><Spark x={211} y={207} scale={.5}/>
  </>}
 </svg>;
}

/** Rich margins surround the reading area; the center stays clear for names/photos. */
export default function PremiumEditionArtwork({slug,frame=false}:{slug:string;frame?:boolean}) {
 if(!isPremiumEditionTheme(slug))return null;
 return <div className={frame?'premium-frame-art':'premium-edition-art'} data-premium-edition-art={slug} aria-hidden="true">
  {frame?<><span className="premium-frame-corner premium-frame-start"><PremiumEditionCorner slug={slug}/></span><span className="premium-frame-corner premium-frame-end"><PremiumEditionCorner slug={slug}/></span></>:<>
   <svg className="premium-scene" viewBox="0 0 600 850" preserveAspectRatio="xMidYMid slice" fill="none" focusable="false">
    {slug==='seraphine-garden'?<><path className="pe-fine" d="M36 800V280C36-28 564-28 564 280v520M49 800V280C49-8 551-8 551 280v520"/><g opacity=".6"><Branch x={80} y={850} angle={-4} scale={2.5}/><Branch x={550} y={850} angle={-35} scale={2.2}/></g><Bloom x={39} y={745} scale={1.8}/><Bloom x={567} y={690} scale={1.4}/></>:slug==='jubilee-carousel'?<><path className="pe-fine" d="M-30 24q330 180 660 0M24 850V280a276 276 0 0 1 552 0v570M42 850V280a258 258 0 0 1 516 0v570"/>{[70,180,290,400,510].map((x,i)=><path key={x} className={i%2?'pe-sage':'pe-petal'} d={`m${x} ${60+Math.sin(i)*16} 40 13-27 41Z`}/>)}<Balloon x={48} y={570} scale={1.7}/><Balloon x={561} y={680} scale={1.9} tone="pe-sage"/></>:slug==='nur-eden'?<><path className="pe-fine" d="M28 830V220q0-70 122-118L300 23l150 79q122 48 122 118v610M42 830V220q0-65 115-106L300 40l143 74q115 41 115 106v610"/><Lantern x={72} y={215} scale={1.5}/><Lantern x={532} y={260} scale={1.7}/><Branch x={89} y={858} angle={5} scale={2.7}/><Branch x={544} y={858} angle={-15} scale={2.6}/></>:<><path className="pe-fine" d="M26 824V146L146 26h308l120 120v678M40 810V153L153 40h294l113 113v657M55 795V160L160 55h280l105 105v635"/><g transform="translate(9 9) scale(1.8)"><DecoFan/></g><g transform="translate(591 841) rotate(180) scale(1.8)"><DecoFan/></g>{[0,1,2,3,4,5,6].map(i=><g key={i}><path className="pe-fine" d={`M${195+i*35} 26v${45+Math.sin(i/6*Math.PI)*70}`}/><Spark x={195+i*35} y={76+Math.sin(i/6*Math.PI)*70} scale={.7}/></g>)}</>}
   </svg>
   <span className="premium-glint glint-one"/><span className="premium-glint glint-two"/><span className="premium-glint glint-three"/>
  </>}
 </div>;
}
