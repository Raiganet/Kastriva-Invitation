export const MUSIC_TRACKS = [
  {id:'serenade',name:'Serenade',mood:'Lembut & romantis',detail:'Arpeggio hangat untuk pembuka yang klasik.'},
  {id:'starlight',name:'Starlight',mood:'Dreamy & modern',detail:'Nada berkilau yang cocok dengan Aurora Modern.'},
  {id:'moonlight',name:'Moonlight Piano',mood:'Elegan & tenang',detail:'Nuansa piano malam yang lembut dan intim.'},
  {id:'ever-after',name:'Ever After',mood:'Hangat & bahagia',detail:'Progresi mayor yang terasa optimistis dan manis.'},
  {id:'ocean-vows',name:'Ocean Vows',mood:'Ambient & lapang',detail:'Atmosfer luas, tenang, dan tidak terlalu ramai.'},
  {id:'sakura-promise',name:'Sakura Promise',mood:'Ringan & cerah',detail:'Motif pentatonik lembut dengan rasa modern.'},
  {id:'celestial-waltz',name:'Celestial Waltz',mood:'Mewah & berayun',detail:'Waltz pelan untuk kesan ballroom kontemporer.'},
  {id:'cinematic-bloom',name:'Cinematic Bloom',mood:'Megah & emosional',detail:'Lapisan harmonik luas untuk momen yang dramatis.'},
] as const;

export type MusicTrackKey = typeof MUSIC_TRACKS[number]['id'];
export type InvitationMusic = 'none' | MusicTrackKey;
export const DEFAULT_MUSIC_VOLUME = 75;
export const MUSIC_TRACK_IDS: readonly InvitationMusic[] = ['none',...MUSIC_TRACKS.map(track=>track.id)];

export function isInvitationMusic(value:unknown):value is InvitationMusic {
  return typeof value==='string' && (MUSIC_TRACK_IDS as readonly string[]).includes(value);
}
export function musicTrack(id:InvitationMusic){return MUSIC_TRACKS.find(track=>track.id===id)??null;}
export function musicLabel(id:InvitationMusic){return id==='none'?'Tanpa musik':musicTrack(id)?.name??'Musik';}
