import type {InvitationMusic,SynthMusicTrackKey} from './music-library.ts';

/** A single pairing for marketing demos, new drafts, editor previews and publications. */
export const WEDDING_MUSIC:Readonly<Record<string,{track:SynthMusicTrackKey;description:string}>>={
 'elegant-rose':{track:'serenade',description:'Melodi romantis yang menyatu dengan mawar dan palet blush.'},
 'modern-minimalist':{track:'moonlight',description:'Piano yang tenang, seimbang dengan tata letak minimalis.'},
 'tropical-paradise':{track:'ocean-vows',description:'Atmosfer lapang untuk dedaunan tropis dan suasana outdoor.'},
 'rustic-wood':{track:'ever-after',description:'Melodi hangat untuk kayu, bunga kering, dan warna bumi.'},
 'galaxy-night':{track:'celestial-waltz',description:'Waltz berkilau untuk langit malam dan aksen bintang.'},
 'islami-sakinah':{track:'moonlight',description:'Instrumental lembut tanpa vokal untuk suasana yang teduh.'},
 'adat-sunda':{track:'priangan-dew',description:'Nuansa kecapi dan suling menyertai hijau Priangan serta melati.'},
 'adat-minang':{track:'minang-radiance',description:'Denting talempong menyertai gonjong, songket, dan aksen emas.'},
 'adat-jawa':{track:'pendopo-lerem',description:'Nuansa gamelan yang tenang menyertai kawung dan pendopo.'},
 'adat-bali':{track:'bali-sunrise',description:'Nuansa rindik dan suling menyertai gerbang serta bunga tropis.'},
 'elementor-luxury-1':{track:'cinematic-bloom',description:'Lapisan harmonik megah untuk bingkai emas dan hijau zamrud.'},
 'botanical-blush':{track:'serenade',description:'Petikan romantis untuk kertas krem dan lengkung botani.'},
 'aurora-modern':{track:'starlight',description:'Nada berkilau mengikuti aurora dan orbit cahaya.'},
 'velvet-vow':{track:'ever-after',description:'Melodi intim untuk plum beludru dan pita champagne.'},
 'seraphine-garden':{track:'serenade',description:'Melodi lembut untuk taman peony dan bingkai floral.'},
};
export function weddingMusic(slug:string){return Object.hasOwn(WEDDING_MUSIC,slug)?WEDDING_MUSIC[slug]:undefined;}
export function resolveThemeMusic(slug:string,selected:InvitationMusic|undefined):Exclude<InvitationMusic,'theme'>{
 return selected==='theme'?(weddingMusic(slug)?.track??'serenade'):selected??'none';
}
