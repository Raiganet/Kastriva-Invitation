import {IMPORTED_MUSIC_TRACKS} from './imported-music.generated.ts';

export const ORIGINAL_MUSIC_TRACKS = [
  {id:'serenade',name:'Serenade',artist:'Kastriva',mood:'Lembut & romantis',detail:'Arpeggio hangat untuk pembuka yang klasik.',kind:'synth',group:'original'},
  {id:'starlight',name:'Starlight',artist:'Kastriva',mood:'Dreamy & modern',detail:'Nada berkilau yang cocok dengan Aurora Modern.',kind:'synth',group:'original'},
  {id:'moonlight',name:'Moonlight Piano',artist:'Kastriva',mood:'Elegan & tenang',detail:'Nuansa piano malam yang lembut dan intim.',kind:'synth',group:'original'},
  {id:'ever-after',name:'Ever After',artist:'Kastriva',mood:'Hangat & bahagia',detail:'Progresi mayor yang terasa optimistis dan manis.',kind:'synth',group:'original'},
  {id:'ocean-vows',name:'Ocean Vows',artist:'Kastriva',mood:'Ambient & lapang',detail:'Atmosfer luas, tenang, dan tidak terlalu ramai.',kind:'synth',group:'original'},
  {id:'sakura-promise',name:'Sakura Promise',artist:'Kastriva',mood:'Ringan & cerah',detail:'Motif pentatonik lembut dengan rasa modern.',kind:'synth',group:'original'},
  {id:'celestial-waltz',name:'Celestial Waltz',artist:'Kastriva',mood:'Mewah & berayun',detail:'Waltz pelan untuk kesan ballroom kontemporer.',kind:'synth',group:'original'},
  {id:'cinematic-bloom',name:'Cinematic Bloom',artist:'Kastriva',mood:'Megah & emosional',detail:'Lapisan harmonik luas untuk momen yang dramatis.',kind:'synth',group:'original'},
] as const;

export const MUSIC_TRACKS = [...ORIGINAL_MUSIC_TRACKS,...IMPORTED_MUSIC_TRACKS] as const;
export type SynthMusicTrackKey = typeof ORIGINAL_MUSIC_TRACKS[number]['id'];
export type ImportedMusicTrackKey = typeof IMPORTED_MUSIC_TRACKS[number]['id'];
export type MusicTrackKey = SynthMusicTrackKey | ImportedMusicTrackKey;
export type InvitationMusic = 'none' | MusicTrackKey;
export const DEFAULT_MUSIC_VOLUME = 75;
export const MUSIC_TRACK_IDS: readonly InvitationMusic[] = ['none',...MUSIC_TRACKS.map(track=>track.id)];

export function isInvitationMusic(value:unknown):value is InvitationMusic {
  return typeof value==='string' && (MUSIC_TRACK_IDS as readonly string[]).includes(value);
}
export function isSynthMusicTrack(value:InvitationMusic):value is SynthMusicTrackKey {
  return value!=='none' && (ORIGINAL_MUSIC_TRACKS as readonly {id:string}[]).some(track=>track.id===value);
}
export function musicTrack(id:InvitationMusic){return MUSIC_TRACKS.find(track=>track.id===id)??null;}
export function musicLabel(id:InvitationMusic){
 const track=musicTrack(id);
 return id==='none'?'Tanpa musik':track?(track.kind==='file'?`${track.name} — ${track.artist}`:track.name):'Musik';
}
