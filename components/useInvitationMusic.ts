'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {DEFAULT_MUSIC_VOLUME,isSynthMusicTrack,musicLabel,musicTrack,type InvitationMusic,type SynthMusicTrackKey} from '@/lib/music-library';

type SynthConfig={
 bpm:number; chords:readonly (readonly number[])[]; pattern:readonly number[]; waveform:OscillatorType;
 volume:number; release:number; octave?:number; filter:number; sparkle?:boolean; bass?:boolean; waltz?:boolean;
};
const TRACKS:Record<SynthMusicTrackKey,SynthConfig>={
 serenade:{bpm:78,chords:[[60,64,67,71],[57,60,64,67],[53,57,60,64],[55,59,62,67]],pattern:[0,1,2,3,2,1,3,2],waveform:'sine',volume:.105,release:2.8,filter:3200,bass:true},
 starlight:{bpm:92,chords:[[57,60,64,69],[53,57,60,64],[60,64,67,71],[55,59,62,67]],pattern:[0,2,1,3,2,3,1,2],waveform:'sine',volume:.09,release:2.3,filter:5200,sparkle:true},
 moonlight:{bpm:68,chords:[[57,60,64,69],[52,55,59,64],[53,57,60,64],[55,59,62,67]],pattern:[0,1,2,1,3,2,1,2],waveform:'triangle',volume:.085,release:3.4,filter:2500,bass:true},
 'ever-after':{bpm:86,chords:[[60,64,67,72],[55,59,62,67],[57,60,64,69],[53,57,60,65]],pattern:[0,1,2,3,2,1,2,3],waveform:'triangle',volume:.09,release:2.5,filter:3600,bass:true},
 'ocean-vows':{bpm:64,chords:[[48,55,60,64],[53,60,64,67],[57,64,67,72],[55,62,67,71]],pattern:[0,2,3,2,1,2,3,2],waveform:'sine',volume:.075,release:4.2,filter:1800,octave:12,sparkle:true},
 'sakura-promise':{bpm:94,chords:[[62,66,69,74],[57,62,66,69],[59,62,66,71],[54,59,62,66]],pattern:[0,2,1,3,2,0,3,1],waveform:'triangle',volume:.085,release:2.1,filter:4300,sparkle:true},
 'celestial-waltz':{bpm:84,chords:[[60,64,67,72],[57,60,64,69],[53,57,60,65],[55,59,62,67]],pattern:[0,2,1,0,3,1],waveform:'sine',volume:.095,release:3.0,filter:3300,bass:true,waltz:true},
 'cinematic-bloom':{bpm:72,chords:[[48,55,60,64],[45,52,57,60],[41,48,53,57],[43,50,55,59]],pattern:[0,2,1,3,2,1,3,2],waveform:'triangle',volume:.085,release:4.0,filter:2800,octave:12,bass:true,sparkle:true},
};
const ARP_NORMAL=[0,1,2,3,2,1,3,2] as const;
function midiHz(midi:number){return 440*2**((midi-69)/12);}

export function useInvitationMusic(track:InvitationMusic,active=true,volumePercent=DEFAULT_MUSIC_VOLUME){
 const context=useRef<AudioContext|null>(null),masterGain=useRef<GainNode|null>(null),timer=useRef<number|null>(null);
 const fileAudio=useRef<HTMLAudioElement|null>(null),generation=useRef(0);
 const volume=Math.max(0,Math.min(100,Number.isFinite(volumePercent)?Math.round(volumePercent):DEFAULT_MUSIC_VOLUME));
 const gainFor=(id:SynthMusicTrackKey)=>TRACKS[id].volume*(volume/50);
 const [playing,setPlaying]=useState(false),[error,setError]=useState('');

 const stop=useCallback(()=>{
  generation.current++;
  if(timer.current!==null){window.clearInterval(timer.current);timer.current=null;}
  const old=context.current;context.current=null;masterGain.current=null;
  if(old&&old.state!=='closed')void old.close().catch(()=>{});
  const media=fileAudio.current;fileAudio.current=null;
  if(media){media.pause();media.removeAttribute('src');media.load();}
  setPlaying(false);
 },[]);

 const start=useCallback(async()=>{
  if(!active||track==='none'||context.current||fileAudio.current)return;
  const meta=musicTrack(track),token=++generation.current;
  if(!meta){setError('Pilihan musik tidak tersedia pada versi ini.');return;}
  if(meta.kind==='file'){
   try{
    const media=new Audio(meta.src);
    media.loop=true;media.preload='auto';media.volume=volume/100;
    fileAudio.current=media;
    media.onerror=()=>{if(fileAudio.current===media){stop();setError('Berkas musik belum dapat dimuat.');}};
    await media.play();
    if(token!==generation.current||fileAudio.current!==media){media.pause();return;}
    setError('');setPlaying(true);
   }catch{
    if(token!==generation.current)return;
    stop();setError('Musik belum dapat diputar. Ketuk tombol musik untuk mencoba lagi.');
   }
   return;
  }
  if(!isSynthMusicTrack(track)){setError('Pilihan musik tidak didukung.');return;}
  const config=TRACKS[track];
  let audio:AudioContext|null=null;
  try{
   audio=new AudioContext();context.current=audio;await audio.resume();
   if(token!==generation.current||context.current!==audio)return;
   if(audio.state!=='running')throw new Error('Audio not running');
   const master=audio.createGain();master.gain.value=gainFor(track);masterGain.current=master;
   const filter=audio.createBiquadFilter();filter.type='lowpass';filter.frequency.value=config.filter;filter.Q.value=.5;
   filter.connect(master);master.connect(audio.destination);
   let step=0,next=audio.currentTime+.06;
   const beat=60/config.bpm,spacing=config.waltz?beat/3:beat/2,pattern=config.pattern.length?config.pattern:ARP_NORMAL;
   const tone=(midi:number,at:number,level:number,release:number,wave:OscillatorType,detune=0)=>{
    if(!audio)return;
    const envelope=audio.createGain();envelope.gain.setValueAtTime(.0001,at);envelope.gain.exponentialRampToValueAtTime(Math.max(.001,level),at+.03);envelope.gain.exponentialRampToValueAtTime(.0001,at+release);envelope.connect(filter);
    const osc=audio.createOscillator();osc.type=wave;osc.frequency.value=midiHz(midi);osc.detune.value=detune;osc.connect(envelope);osc.start(at);osc.stop(at+release+.05);osc.onended=()=>{osc.disconnect();envelope.disconnect();};
   };
   const schedule=()=>{
    if(!audio||audio.state!=='running')return;
    while(next<audio.currentTime+1.35){
     const chord=config.chords[Math.floor(step/pattern.length)%config.chords.length];
     const idx=pattern[step%pattern.length]%chord.length,note=chord[idx]+(config.octave??0);
     tone(note,next,.42,config.release,config.waveform);
     tone(note+12,next+.012,.08,Math.max(1.1,config.release*.65),'sine',4);
     if(config.sparkle&&step%2===0)tone(note+24,next+.04,.075,1.35,'sine',-5);
     if(config.bass&&step%pattern.length===0)tone(chord[0]-12,next,.30,Math.min(3.8,config.release+1),'sine');
     step++;next+=spacing;
    }
   };
   schedule();timer.current=window.setInterval(schedule,360);setError('');setPlaying(true);
   audio.onstatechange=()=>{if(context.current===audio&&audio?.state!=='running')stop();};
  }catch{
   if(token!==generation.current)return;
   stop();setError('Musik belum dapat diputar. Ketuk tombol musik untuk mencoba lagi.');
  }
 },[active,track,stop,volume]);

 useEffect(()=>{
  const media=fileAudio.current;if(media)media.volume=volume/100;
  const audio=context.current,node=masterGain.current;
  if(!audio||!node||audio.state==='closed'||track==='none'||!isSynthMusicTrack(track))return;
  node.gain.cancelScheduledValues(audio.currentTime);node.gain.setTargetAtTime(gainFor(track),audio.currentTime,.05);
 },[track,volume]);
 useEffect(()=>{stop();},[track,active,stop]);
 useEffect(()=>{return stop;},[stop]);
 useEffect(()=>{const hide=()=>{if(document.hidden)stop();};document.addEventListener('visibilitychange',hide);return()=>document.removeEventListener('visibilitychange',hide);},[stop]);
 return {playing,error,start,stop,toggle:()=>playing?stop():void start(),label:musicLabel(track),track};
}
