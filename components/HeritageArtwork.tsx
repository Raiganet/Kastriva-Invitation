import {isHeritageTheme} from '@/lib/theme-registry';

/** Original decorative drawings inspired by regional forms, not ritual symbols. */
export function HeritageMotif({slug}:{slug:string}) {
 if(!isHeritageTheme(slug))return null;
 return <svg className="theme-motif" viewBox="0 0 120 100" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
  {slug==='islami-sakinah'?<><path d="M30 84V48c0-13 13-21 30-37 17 16 30 24 30 37v36M20 84h80M38 84V51c0-9 10-16 22-28 12 12 22 19 22 28v33"/><path d="m60 37 6 11 13 3-10 9 1 13-10-6-10 6 1-13-10-9 13-3Z"/><circle cx="60" cy="55" r="5"/></>:slug==='adat-sunda'?<><path d="M60 91V20M60 54C41 49 29 37 27 24c18 0 31 12 33 30Zm0 14c20-3 32-15 35-29-18-1-31 12-35 29ZM60 35C48 26 50 13 59 7c9 8 10 19 1 28Z"/>{[0,72,144,216,288].map(deg=><ellipse key={deg} cx="37" cy="65" rx="5" ry="12" transform={`rotate(${deg} 37 76)`} fill="currentColor" fillOpacity=".1"/>)}<circle cx="37" cy="76" r="4"/></>:slug==='adat-minang'?<><path d="M10 28q15 29 37 23Q54 34 60 9q6 25 13 42 22 6 37-23L99 67H21ZM25 67v21h70V67M21 91h78M37 70v17m15-17v17m16-17v17m15-17v17"/><path d="m28 55 8 8 8-8m31 0 8 8 8-8M54 57l6-10 6 10-6 9Z"/></>:slug==='adat-jawa'?<>{[0,90,180,270].map(deg=><g key={deg} transform={`rotate(${deg} 60 50)`}><ellipse cx="60" cy="29" rx="12" ry="20" transform="rotate(-25 60 29)"/><ellipse cx="60" cy="29" rx="7" ry="14" transform="rotate(-25 60 29)" opacity=".5"/></g>)}<path d="m60 43 7 7-7 7-7-7Z"/><circle cx="60" cy="50" r="44" opacity=".4"/></>:<><path d="M17 88h30V18l-8 8v10h-7v12h-7v14h-8Zm86 0H73V18l8 8v10h7v12h7v14h8ZM11 93h42m14 0h42M17 73h30m26 0h30M25 59h22m26 0h22M32 45h15m26 0h15"/><path d="M52 88h16M58 88V63m4 25V63M60 61c-14-3-16-16-9-23 10 3 14 14 9 23Zm0 0c12-5 15-15 8-22-9 4-13 14-8 22Z"/></>}
 </svg>;
}

function Kawung({x,y}:{x:number;y:number}){return <g transform={`translate(${x} ${y})`}>{[0,90,180,270].map(deg=><ellipse key={deg} cx="0" cy="-15" rx="8" ry="15" transform={`rotate(${deg})`}/>)}<circle r="3"/></g>;}
function Jasmine({x,y,scale=1}:{x:number;y:number;scale?:number}){return <g transform={`translate(${x} ${y}) scale(${scale})`}>{[0,72,144,216,288].map(deg=><ellipse key={deg} cx="0" cy="-11" rx="6" ry="12" transform={`rotate(${deg})`}/>)}<circle r="4"/></g>;}
export default function HeritageArtwork({slug}:{slug:string}) {
 if(!isHeritageTheme(slug))return null;
 return <svg className="heritage-scenery" viewBox="0 0 600 900" preserveAspectRatio="none" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true" focusable="false">
 {slug==='islami-sakinah'?<>
  <path d="M40 920V260C40 140 210 98 300 28c90 70 260 112 260 232v660" strokeWidth="2"/><path d="M53 920V265c0-113 157-149 247-223 90 74 247 110 247 223v655" opacity=".5"/>
  {[100,300,500].map(x=><g key={x} transform={`translate(${x} 797)`}><path d="m0-45 14 31 31 14-31 14-14 31-14-31-31-14 31-14Z"/><rect x="-31" y="-31" width="62" height="62" transform="rotate(45)"/><circle r="18"/></g>)}
  <path d="M40 733h520M40 856h520M28 250v650m544-650v650" opacity=".45"/>
  {[145,340,535,690].map(y=><g key={y}><path d={`m17 ${y-9} 9 9-9 9-9-9Z m566 0 9 9-9 9-9-9Z`}/></g>)}
 </>:slug==='adat-sunda'?<>
  <path d="M22 900V280C22 110 150 48 300 48s278 62 278 232v620M34 900V282C34 120 156 60 300 60s266 60 266 222v618" opacity=".5"/>
  <path d="M-20 900C0 727 89 659 107 514M620 900c-20-173-109-241-127-386" strokeWidth="2"/>
  {[0,1,2,3,4].map(i=><g key={i} transform={`translate(0 ${i*60})`}><path d="M33 820q-63-45-28-91 43 24 28 91Zm10-33q60-43 80-14-24 40-80 14" fill="currentColor" fillOpacity=".07"/><path d="M567 820q63-45 28-91-43 24-28 91Zm-10-33q-60-43-80-14 24 40 80 14" fill="currentColor" fillOpacity=".07"/></g>)}
  <path d="M65 888q130-97 237-16 122-110 241 16M100 900q85-116 194-160 120 47 206 160" opacity=".18"/>
  <Jasmine x={99} y={793} scale={1.4}/><Jasmine x={490} y={823} scale={1.7}/><Jasmine x={66} y={860}/><Jasmine x={525} y={751}/>
 </>:slug==='adat-minang'?<>
  <path d="M24 30h552v840H24Z M36 42h528v816H36Z" opacity=".45"/>
  {[90,210,330,450,570,690].map(y=><g key={y} opacity=".65"><path d={`m24 ${y} 18 25-18 25-18-25Z m552 0 18 25-18 25-18-25Z`}/><path d={`m24 ${y+14} 7 11-7 11-7-11Z m552 0 7 11-7 11-7-11Z`}/></g>)}
  <g className="heritage-building"><path d="M77 720q41 81 116 66 29-40 35-97 28 87 72 89 44-2 72-89 6 57 35 97 75 15 116-66l-30 111H107Z" fill="var(--paper)" strokeWidth="2"/><path d="M116 831v56h368v-56M105 890h390M178 835v49m80-49v49m84-49v49m80-49v49"/><path d="m133 849 18 17 18-17m99 0 18 17 18-17m99 0 18 17 18-17"/><path d="M124 816q90 4 104-79 28 65 72 62 44 3 72-62 14 83 104 79" opacity=".55"/></g>
 </>:slug==='adat-jawa'?<>
  <rect x="38" y="42" width="524" height="816" rx="240" opacity=".5"/><rect x="49" y="53" width="502" height="794" rx="229" opacity=".3"/>
  {[105,205,305,405,505,605,705,805].map(y=><g key={y} opacity=".42"><Kawung x={25} y={y}/><Kawung x={575} y={y}/></g>)}
  {[100,200,300,400,500].map(x=><g key={x} opacity=".6"><Kawung x={x} y={850}/></g>)}
  <path transform="translate(0 45)" d="m90 755 120-43 60-48h60l60 48 120 43H90Zm44 10v67m332-67v67m-203-67v67m74-67v67M110 838h380" strokeWidth="1.5"/>
 </>:<>
  <path d="M35 910V274c0-143 120-225 265-225s265 82 265 225v636M47 910V276C47 139 163 61 300 61s253 78 253 215v634" opacity=".4"/>
  <g className="heritage-building" strokeWidth="1.6"><path d="M-6 900h137V573l-26 31v30H85v42H64v44H41v48H16v49H-6Zm612 0H469V573l26 31v30h20v42h21v44h23v48h25v49h22Z" fill="var(--soft)"/><path d="M-6 876h137M16 821h115M41 773h90M64 725h67M85 681h46M105 639h26M469 876h137M469 821h115M469 773h90M469 725h67M469 681h46M469 639h26"/><path d="M-6 888h145m-151-30h137m338 30h145m-145-30h137"/></g>
  <path d="M186 900c-5-75-39-108-33-154m261 154c5-75 39-108 33-154M161 823c-43-20-52-53-35-69 28 14 39 35 35 69Zm281 0c43-20 52-53 35-69-28 14-39 35-35 69Z"/>
  <Jasmine x={172} y={855} scale={1.5}/><Jasmine x={431} y={872} scale={1.3}/>
 </>}
 </svg>;
}
