'use client';
import {useId} from 'react';
import InvitationAutoScroll from './InvitationAutoScroll';
import InvitationNav,{type InvitationNavItem} from './InvitationNav';

type Playback={playing:boolean;label:string;error:string;toggle:()=>void};

function MusicControl({music,compact=false}:{music:Playback;compact?:boolean}){
 const errorId=useId();
 return <div className="inv-music">
  <button type="button" className="music-toggle" onClick={music.toggle} aria-label={`${music.playing?'Jeda':'Putar'} ${music.label}`} aria-pressed={music.playing} aria-describedby={music.error?errorId:undefined} title={music.label}>
   <span className="music-bars" aria-hidden="true"><i/><i/><i/></span>
   {compact?<span>{music.playing?'Jeda':'Musik'}</span>:<span className="music-caption"><span>{music.playing?'Jeda musik':'Putar musik'}</span><small className="music-track-label">{music.label}</small></span>}
  </button>
  {compact&&<small className="music-track-label">{music.label}</small>}
  {music.error&&<p id={errorId} role="status">{music.error}</p>}
 </div>;
}

/** One reading dock; the editor's embedded preview keeps its independent player. */
export default function InvitationControls({contentId,items,music,embedded=false}:{contentId:string;items:InvitationNavItem[];music?:Playback;embedded?:boolean}){
 if(embedded)return music?<MusicControl music={music} compact/>:null;
 return <div className="inv-controls">
  <div className="inv-playback-controls" role="group" aria-label="Pemutaran undangan">
   <InvitationAutoScroll contentId={contentId}/>
   {music&&<MusicControl music={music}/>}
  </div>
  <InvitationNav items={items}/>
 </div>;
}
