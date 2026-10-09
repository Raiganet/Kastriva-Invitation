/** Original instrumental sketches; digitally voiced, not recordings of ceremonial repertoire. */
export const HERITAGE_MUSIC_TRACKS = [
 {id:'priangan-dew',name:'Embun Priangan',artist:'Kastriva',mood:'Sunda · kecapi & suling',detail:'Petikan kecapi dan alunan suling yang lembut. Komposisi instrumental orisinal dengan bunyi digital terinspirasi Sunda.',kind:'synth',group:'heritage'},
 {id:'minang-radiance',name:'Cahaya Minang',artist:'Kastriva',mood:'Minang · talempong',detail:'Denting talempong bersahutan dengan melodi tiup yang hangat. Komposisi instrumental orisinal bernuansa Minang.',kind:'synth',group:'heritage'},
 {id:'pendopo-lerem',name:'Lerem Pendopo',artist:'Kastriva',mood:'Jawa · gamelan lembut',detail:'Denting metalofon, gong rendah, dan melodi panjang yang teduh. Interpretasi instrumental orisinal terinspirasi gamelan Jawa.',kind:'synth',group:'heritage'},
 {id:'bali-sunrise',name:'Fajar Bali',artist:'Kastriva',mood:'Bali · rindik & suling',detail:'Pola bambu bersahutan, suling, dan gong lembut. Komposisi instrumental orisinal bernuansa rindik Bali.',kind:'synth',group:'heritage'},
] as const;
export type HeritageMusicTrackKey=typeof HERITAGE_MUSIC_TRACKS[number]['id'];
export function isHeritageMusicTrack(value:string):value is HeritageMusicTrackKey{return HERITAGE_MUSIC_TRACKS.some(track=>track.id===value);}
