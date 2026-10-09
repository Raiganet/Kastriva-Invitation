import type {HeritageMusicTrackKey} from './heritage-music.ts';

type Voice='pluck'|'bronze'|'bamboo'|'flute'|'gong';
type Arrangement={bpm:number;voice:Voice;melody:readonly number[];answer:readonly number[];flute:readonly number[];root:number};
/** Newly composed motifs in equal temperament, inspired by timbres rather than sacred repertoire. */
export const HERITAGE_ARRANGEMENTS:Record<HeritageMusicTrackKey,Arrangement>={
 'priangan-dew':{bpm:66,voice:'pluck',root:48,
  melody:[72,67,65,62,65,67,72,0,74,72,67,65,62,65,67,0,77,74,72,67,72,74,77,0,74,72,67,65,67,65,62,0],
  answer:[48,55,60,55,53,60,65,60,50,57,62,57,48,55,60,55],flute:[79,77,74,72,74,77,74,72]},
 'minang-radiance':{bpm:84,voice:'bronze',root:50,
  melody:[74,0,78,81,78,0,76,74,76,0,81,83,81,78,76,0,78,0,81,86,83,0,81,78,76,74,76,78,76,0,74,0],
  answer:[62,69,66,69,62,66,69,66,59,66,62,66,62,69,66,62],flute:[81,78,76,74,83,81,78,74]},
 'pendopo-lerem':{bpm:54,voice:'bronze',root:43,
  melody:[67,0,70,0,72,0,70,0,67,0,65,0,62,0,65,0,70,0,72,0,77,0,72,0,70,0,67,0,65,0,62,0],
  answer:[43,50,55,50,46,53,58,53,48,55,60,55,43,50,55,50],flute:[79,77,74,72,77,74,72,67]},
 'bali-sunrise':{bpm:88,voice:'bamboo',root:48,
  melody:[72,76,79,76,74,79,81,79,76,72,74,76,79,76,74,0,81,79,76,79,84,81,79,76,74,76,79,74,76,74,72,0],
  answer:[60,67,64,67,57,64,60,64,53,60,57,60,55,62,59,62],flute:[84,81,79,76,81,79,76,72]},
};
const PARTIALS:Record<Exclude<Voice,'flute'>,readonly (readonly [number,number,number])[]>={
 pluck:[[1,.72,1],[2,.18,.62],[3,.07,.38],[4,.03,.22]],
 bronze:[[1,.76,1],[2.76,.14,.48],[5.4,.07,.25],[6.8,.03,.16]],
 bamboo:[[1,.83,1],[2.76,.13,.32],[5.4,.04,.14]],
 gong:[[1,.64,1],[1.47,.15,.75],[1.96,.13,.48],[2.53,.08,.34]],
};
function hz(note:number){return 440*2**((note-69)/12);}

/** All nodes have bounded lifetimes and disconnect after their release. */
function strike(audio:BaseAudioContext,out:AudioNode,voice:Voice,note:number,at:number,level:number,duration:number){
 if(voice==='flute'){
  const envelope=audio.createGain();envelope.gain.setValueAtTime(0,at);envelope.gain.linearRampToValueAtTime(level,at+.28);envelope.gain.setTargetAtTime(level*.65,at+.3,.3);envelope.gain.setTargetAtTime(0,at+duration*.65,.18);envelope.connect(out);
  const fundamental=audio.createOscillator(),harmonic=audio.createOscillator(),harmonicGain=audio.createGain();
  const vibrato=audio.createOscillator(),depth=audio.createGain();
  fundamental.frequency.value=hz(note);harmonic.frequency.value=hz(note)*2;harmonicGain.gain.value=.12;
  vibrato.frequency.value=4.8;depth.gain.setValueAtTime(0,at);depth.gain.linearRampToValueAtTime(7,at+.7);
  vibrato.connect(depth);depth.connect(fundamental.detune);depth.connect(harmonic.detune);
  fundamental.connect(envelope);harmonic.connect(harmonicGain);harmonicGain.connect(envelope);
  for(const osc of [fundamental,harmonic,vibrato]){osc.start(at);osc.stop(at+duration+.5);}
  fundamental.onended=()=>{for(const node of [fundamental,harmonic,vibrato,depth,harmonicGain,envelope])node.disconnect();};
  return;
 }
 for(const [ratio,weight,decay] of PARTIALS[voice]){
  const osc=audio.createOscillator(),gain=audio.createGain(),release=duration*decay;
  osc.frequency.setValueAtTime(hz(note)*ratio,at);
  if(voice==='gong')osc.frequency.exponentialRampToValueAtTime(hz(note)*ratio*.994,at+release);
  gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(level*weight,at+.007);
  gain.gain.exponentialRampToValueAtTime(.00001,at+Math.max(.03,release));
  osc.connect(gain);gain.connect(out);osc.start(at);osc.stop(at+release+.03);
  osc.onended=()=>{osc.disconnect();gain.disconnect();};
 }
}

export function heritageSpacing(track:HeritageMusicTrackKey){return 30/HERITAGE_ARRANGEMENTS[track].bpm;}
export function scheduleHeritageStep(audio:BaseAudioContext,out:AudioNode,track:HeritageMusicTrackKey,step:number,at:number){
 const config=HERITAGE_ARRANGEMENTS[track],spacing=heritageSpacing(track),index=step%config.melody.length;
 // A quieter answer phrase gives each 32-step cycle room to breathe.
 const phrase=Math.floor(step/32)%4,level=(phrase===2?.28:.36)*(step%4===0?1:.82);
 const note=config.melody[index];
 if(note)strike(audio,out,config.voice,note,at,level,config.voice==='pluck'?2.2:config.voice==='bamboo'?1.05:2.8);
 if(step%2===1)strike(audio,out,config.voice,config.answer[Math.floor(step/2)%config.answer.length],at+spacing*.16,.16,1.7);
 if(step%8===0)strike(audio,out,'flute',config.flute[Math.floor(step/8)%config.flute.length],at+.08,.11,spacing*5.8);
 if(step%32===0)strike(audio,out,'gong',config.root-12,at,.23,5.5);
}
