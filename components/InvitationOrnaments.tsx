import ThemeMotif from './ThemeMotif';

type OrnamentStyle = 'floral' | 'palm' | 'wheat' | 'celestial' | 'celebration' | 'geometric' | 'lattice' | 'orbit';

const styles: Record<string, OrnamentStyle> = {
  'elegant-rose': 'floral',
  'modern-minimalist': 'geometric',
  'tropical-paradise': 'palm',
  'rustic-wood': 'wheat',
  'galaxy-night': 'celestial',
  'sweet-birthday': 'celebration',
  'aqiqah-blessing': 'celestial',
  'corporate-event': 'geometric',
  'islami-sakinah': 'lattice',
  'adat-sunda': 'floral',
  'adat-minang': 'lattice',
  'adat-jawa': 'lattice',
  'adat-bali': 'floral',
  'elementor-luxury-1': 'geometric',
  'botanical-blush': 'floral',
  'aurora-modern': 'orbit',
};

function Blossom({x,y,scale=1}:{x:number;y:number;scale?:number}){
  return <g className="inv-painted-flower" transform={`translate(${x} ${y}) scale(${scale})`}>
    {[0,60,120,180,240,300].map(angle=><ellipse className="ornament-petal" key={angle} cx="0" cy="-13" rx="10" ry="17" transform={`rotate(${angle})`}/>)}
    {[30,102,174,246,318].map(angle=><ellipse className="ornament-petal-inner" key={angle} cx="0" cy="-7" rx="6" ry="10" transform={`rotate(${angle})`}/>)}
    <circle className="ornament-foil" r="4"/><path d="m-2 1 3-3m-1 5 3-2" strokeWidth=".7"/>
  </g>;
}

function CornerDrawing({style}: {style: OrnamentStyle}) {
  return <svg viewBox="0 0 180 180" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" focusable="false">
    {style === 'floral' && <>
      <path d="M12 174C22 104 70 38 171 12M28 161C35 107 82 51 151 30" />
      <path className="ornament-leaf" d="M36 121C9 106 11 82 16 70c24 13 30 32 20 51ZM58 89C32 67 38 45 47 33c20 18 24 38 11 56ZM91 57C78 31 91 14 106 8c10 22 6 38-15 49ZM46 109c27-21 51-16 58-7-18 18-38 19-58 7ZM78 74c22-23 48-24 57-16-14 21-36 27-57 16Z"/>
      <path d="M17 78q18 26 19 43M49 40l9 49m48-73L91 57m-42 50 48-5" opacity=".45"/>
      <Blossom x={32} y={43} scale={.82}/><Blossom x={81} y={25} scale={.48}/>
      <path d="m125 23 3-8 3 8 8 3-8 3-3 8-3-8-8-3Z" opacity=".55" />
      <circle cx="15" cy="140" r="2"/><circle cx="151" cy="45" r="2"/>
    </>}
    {(style === 'palm' || style === 'wheat') && <>
      <path d="M14 172Q47 69 152 16M22 175Q62 111 158 90" strokeWidth="1.5"/>
      {[0, 1, 2, 3, 4, 5].map(i => <g key={i} transform={`translate(${27 + i * 19} ${134 - i * 21}) rotate(${i * 4 - 28})`}>
        <path className={i%2?'ornament-leaf':'ornament-petal'} d={style === 'palm' ? 'M0 0Q-38-12-25-50 0-34 0 0ZM0 0Q34 2 43-28 12-24 0 0Z' : 'M0 0Q-18-7-13-29 2-21 0 0ZM0 0Q22-1 25-21 3-18 0 0Z'}/>
      </g>)}
      <path d="M70 125q-8-22 4-38 13 19-4 38Zm30-16q16-23 40-18-14 20-40 18" fill="currentColor" fillOpacity=".07"/>
      {style==='palm'&&<Blossom x={35} y={139} scale={.6}/>}
    </>}
    {style === 'celestial' && <>
      <path d="M18 8v67M55 8v35M99 8v13" opacity=".4"/>
      <path d="m18 75 5 14 14 5-14 5-5 14-5-14-14-5 14-5Zm37-32 3 9 9 3-9 3-3 9-3-9-9-3 9-3Zm75 60 4 12 12 4-12 4-4 12-4-12-12-4 12-4Z" fill="currentColor" fillOpacity=".12"/>
      <path className="ornament-foil" d="M112 31a29 29 0 1 0 33 38 25 25 0 0 1-33-38Z"/>
      <circle className="ornament-petal" cx="117" cy="59" r="38" fillOpacity=".1" strokeDasharray="1 8"/>
      <path d="m28 153 40-24 27 25 32-35" strokeDasharray="2 6" opacity=".6"/>
      {[ [28,153], [68,129], [95,154], [99,26], [156,92] ].map(([cx,cy]) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="2" fill="currentColor" />)}
    </>}
    {style === 'celebration' && <>
      <path d="M10 15q64 65 157 23M29 32l-2 25 22-13m15 8 6 24 16-20m15 0 14 23 10-24"/>
      <ellipse className="ornament-leaf" cx="87" cy="92" rx="18" ry="23"/><path d="M87 115q-16 30-9 42"/>
      <ellipse className="ornament-petal" cx="49" cy="106" rx="22" ry="28"/><path d="m49 134-4 6h8l-4-6Zm0 6q20 20-1 37M37 92q-6 6-5 14"/>
      <path d="m124 84 4 13 14 4-14 4-4 13-4-13-14-4 14-4ZM91 144l8 11m-82-74 7-8m127 67-9 4"/><circle cx="91" cy="90" r="4"/><circle cx="19" cy="151" r="3"/>
    </>}
    {style === 'geometric' && <>
      <path className="ornament-petal" d="M14 14h98a98 98 0 0 1-98 98Z" fillOpacity=".18" stroke="none"/>
      <path d="M14 168V14h154M24 130V24h106M34 94V34h60"/>
      <path d="M48 16v32H16M164 15l-10-10m10 10-10 10M15 164l-10-10m10 10 10-10"/>
      <circle cx="97" cy="97" r="42" opacity=".3"/><path d="M55 97h84M97 55v84M67 67l60 60m-60 0 60-60" opacity=".25"/>
      <path className="ornament-foil" d="m97 81 16 16-16 16-16-16Z" fillOpacity=".28"/>
      <path className="ornament-leaf" d="M55 97a42 42 0 0 1 42-42" fill="none" strokeWidth="3"/>
    </>}
    {style === 'lattice' && <>
      <path d="M16 166V16h150M24 142V24h118" opacity=".5"/>
      {[ [48,48], [104,48], [48,104] ].map(([x,y]) => <g key={`${x}-${y}`} transform={`translate(${x} ${y})`}>
        <path className="ornament-petal" d="m0-25 8 17 17 8-17 8-8 17-8-17-17-8 17-8Z" fillOpacity=".4"/>
        <rect x="-17" y="-17" width="34" height="34" transform="rotate(45)" opacity=".5"/><circle r="7"/>
      </g>)}
      <path d="m151 20 5-5 5 5-5 5ZM20 151l5 5-5 5-5-5Z"/>
    </>}
    {style === 'orbit' && <>
      <ellipse className="ornament-petal" cx="66" cy="75" rx="57" ry="27" transform="rotate(-38 66 75)" fillOpacity=".15"/>
      <ellipse cx="66" cy="75" rx="38" ry="64" transform="rotate(25 66 75)" opacity=".45"/>
      <circle cx="66" cy="75" r="19" strokeDasharray="2 5"/>
      <path d="m127 117 4 13 13 4-13 4-4 13-4-13-13-4 13-4Z"/>
      <circle className="ornament-leaf" cx="113" cy="39" r="5"/><circle className="ornament-foil" cx="34" cy="115" r="3"/>
    </>}
  </svg>;
}

/** Local vector artwork. Kept outside the text flow and hidden from assistive technology. */
export default function InvitationOrnaments({slug,section=false}: {slug: string;section?:boolean}) {
  const style = styles[slug] ?? 'floral';
  return <div className={`inv-ornaments inv-ornaments-${style}${section?' inv-ornaments-section':''}`} aria-hidden="true">
    <span className="inv-ornament-corner inv-ornament-start"><CornerDrawing style={style}/></span>
    <span className="inv-ornament-corner inv-ornament-end"><CornerDrawing style={style}/></span>
    <span className="inv-ornament-speck speck-a"/><span className="inv-ornament-speck speck-b"/><span className="inv-ornament-speck speck-c"/>
  </div>;
}

export function InvitationDivider({slug}: {slug: string}) {
  return <div className="inv-section-divider" aria-hidden="true"><span/><ThemeMotif slug={slug}/><span/></div>;
}
