'use client';
import {useCallback,useEffect,useRef,useState} from 'react';

// Original instrumental: a quiet eight-bar arpeggio, synthesized locally.
// No third-party music, requests, downloads, or audio before a guest's gesture.
const CHORDS=[[60,64,67,71],[57,60,64,67],[53,57,60,64],[55,59,62,67],[60,64,67,72],[57,60,64,69],[53,57,60,65],[55,59,62,67]];
export function useInvitationMusic(enabled:boolean){
 const context=useRef<AudioContext|null>(null),timer=useRef<number|null>(null),generation=useRef(0);
 const [playing,setPlaying]=useState(false),[error,setError]=useState('');
 const stop=useCallback(()=>{
  generation.current++;
  if(timer.current!==null){window.clearInterval(timer.current);timer.current=null;}
  const old=context.current;context.current=null;
  if(old&&old.state!=='closed')void old.close().catch(()=>{});
  setPlaying(false);
 },[]);
 const start=useCallback(async()=>{
  if(!enabled||context.current)return;
  const token=++generation.current;
  let audio:AudioContext|null=null;
  try{
   audio=new AudioContext();context.current=audio;
   await audio.resume();
   if(token!==generation.current||context.current!==audio)return;
   if(audio.state!=='running')throw new Error('Audio not running');
   const master=audio.createGain();master.gain.value=.12;master.connect(audio.destination);
   let step=0,next=audio.currentTime+.08;
   const schedule=()=>{
    if(!audio||audio.state!=='running')return;
    while(next<audio.currentTime+1.5){
     const chord=CHORDS[Math.floor(step/8)%CHORDS.length],note=chord[[0,1,2,3,2,1,3,2][step%8]];
     for(const [midi,level] of [[note,.45],...(step%8===0?[[chord[0]-12,.35]]:[])]){
      const envelope=audio.createGain();envelope.gain.setValueAtTime(0,next);envelope.gain.linearRampToValueAtTime(level,next+.025);envelope.gain.exponentialRampToValueAtTime(.001,next+2.8);envelope.connect(master);
      const osc=audio.createOscillator();osc.type='sine';osc.frequency.value=440*2**((midi-69)/12);osc.connect(envelope);osc.start(next);osc.stop(next+3);osc.onended=()=>{osc.disconnect();envelope.disconnect();};
     }
     step++;next+=.48;
    }
   };
   schedule();timer.current=window.setInterval(schedule,400);setError('');setPlaying(true);
   audio.onstatechange=()=>{if(context.current===audio&&audio?.state!=='running')stop();};
  }catch{
   if(token!==generation.current)return;
   stop();setError('Musik belum dapat diputar. Ketuk tombol musik untuk mencoba lagi.');
  }
 },[enabled,stop]);
 useEffect(()=>{if(!enabled)stop();return stop;},[enabled,stop]);
 useEffect(()=>{const hide=()=>{if(document.hidden)stop();};document.addEventListener('visibilitychange',hide);return()=>document.removeEventListener('visibilitychange',hide);},[stop]);
 return {playing,error,start,stop,toggle:()=>playing?stop():void start()};
}
