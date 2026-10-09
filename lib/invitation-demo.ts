import type {SynthMusicTrackKey} from './music-library';
import {weddingMusic} from './theme-music.ts';

const image=(name:string)=>`/images/demo/${name}.webp`;
const music:Record<string,SynthMusicTrackKey>={
 'sweet-birthday':'sakura-promise','aqiqah-blessing':'moonlight','corporate-event':'ocean-vows',
 'jubilee-carousel':'sakura-promise','nur-eden':'moonlight','nocturne-gala':'cinematic-bloom',
 'peach-confetti':'sakura-promise','little-moon':'moonlight','sapphire-summit':'ocean-vows',
};
export function demoMusic(slug:string):SynthMusicTrackKey{return weddingMusic(slug)?.track??music[slug]??'serenade';}

/** Public marketing samples only. Never persisted as customer media or messages. */
export function demoPhotos(category:string){
 const cover=category==='ulang-tahun'?'birthday':category==='aqiqah'?'aqiqah':category==='acara-kantor'?'corporate':'wedding-couple';
 return {
  coverUrl:image(cover),
  photoUrls:category==='pernikahan'
   ?['wedding-groom','wedding-bride','wedding-couple','wedding-walk','celebration-details'].map(image)
   :[cover,'celebration-details'].map(image),
 };
}

const messages:Record<string,string[]>={
 pernikahan:[
  'Selamat menempuh perjalanan baru. Semoga selalu saling menguatkan dan dipenuhi kebahagiaan.',
  'Turut bahagia untuk kalian berdua! Tidak sabar merayakan hari istimewa ini bersama.',
  'Semoga rumah tangga kalian penuh kasih, kehangatan, dan cerita indah sepanjang masa.',
 ],
 'ulang-tahun':[
  'Selamat ulang tahun, Aruna! Semoga tumbuh sehat, ceria, dan selalu dikelilingi kasih sayang.',
  'Tidak sabar datang dan merayakan hari bahagiamu. Sampai bertemu di pesta!',
  'Semoga tahun ini penuh tawa, pengalaman baru, dan kenangan manis bersama keluarga.',
 ],
 aqiqah:[
  'Selamat atas kelahiran buah hati. Semoga tumbuh sehat dan menjadi penyejuk hati keluarga.',
  'Semoga Aruna selalu dalam lindungan Allah dan tumbuh menjadi anak yang berbakti.',
  'Turut berbahagia menyambut anggota keluarga baru. Semoga acaranya berjalan lancar.',
 ],
 'acara-kantor':[
  'Senang bisa berkumpul dan merayakan perjalanan tim. Sampai bertemu di acara!',
  'Semoga kebersamaan ini membawa semangat dan ide baru untuk langkah berikutnya.',
  'Terima kasih untuk kolaborasi yang luar biasa. Mari ciptakan lebih banyak pencapaian bersama.',
 ],
};
export function demoWishes(category:string){
 return (messages[category]??messages.pernikahan).map((message,index)=>({name:['Alya & keluarga','Rafi Pratama','Nadia Putri'][index],message}));
}
