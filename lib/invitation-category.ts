import {ALL_THEME_SLUGS} from './theme-registry.ts';

export const INVITATION_CATEGORIES = ['pernikahan','ulang-tahun','aqiqah','acara-kantor'] as const;
export type InvitationCategory = typeof INVITATION_CATEGORIES[number];
export const categoryFields = {
  pernikahan: {tab:'Pasangan', heading:'Pasangan & keluarga', name:'Nama mempelai pria', host:'Keterangan keluarga pria', event:'Akad & resepsi', story:'Cerita pasangan', placeholder:'Ceritakan pertemuan pertama hingga keputusan melangkah bersama…', opening:'Dengan penuh kebahagiaan, kami mengundang Anda untuk hadir di hari istimewa kami.'},
  'ulang-tahun': {tab:'Yang berulang tahun', heading:'Hari bahagia siapa?', name:'Nama yang berulang tahun', host:'Nama orang tua / tuan rumah (opsional)', event:'Perayaan ulang tahun', story:'Cerita yang berulang tahun', placeholder:'Bagikan kenangan, hobi, atau pesan untuk para tamu…', opening:'Dengan penuh sukacita, kami mengundang Anda untuk merayakan ulang tahun bersama keluarga dan sahabat.'},
  aqiqah: {tab:'Anak & keluarga', heading:'Anak & keluarga', name:'Nama anak', host:'Nama orang tua (opsional)', event:'Syukuran aqiqah', story:'Cerita kelahiran & doa', placeholder:'Bagikan cerita kelahiran dan harapan baik untuk buah hati…', opening:'Assalamu’alaikum warahmatullahi wabarakatuh. Dengan memohon rahmat Allah SWT, kami mengundang Bapak/Ibu/Saudara/i dalam syukuran aqiqah buah hati kami.'},
  'acara-kantor': {tab:'Acara & penyelenggara', heading:'Acara & penyelenggara', name:'Judul acara', host:'Nama perusahaan / penyelenggara (opsional)', event:'Acara utama', story:'Tentang acara', placeholder:'Jelaskan tujuan acara, agenda, atau informasi yang perlu diketahui peserta…', opening:'Dengan hormat, kami mengundang Anda untuk menghadiri acara kami. Kehadiran Anda akan menjadi bagian berarti dari momen ini.'},
} as const;

/** Theme identity is code-owned; a CMS name/description cannot change a draft's category. */
export function categoryForTheme(slug:string):InvitationCategory | undefined {
  if (!(ALL_THEME_SLUGS as readonly string[]).includes(slug)) return undefined;
  if (['sweet-birthday','peach-confetti','jubilee-carousel','citrus-reverie'].includes(slug)) return 'ulang-tahun';
  if (['aqiqah-blessing','little-moon','nur-eden','safiya-orbit'].includes(slug)) return 'aqiqah';
  if (['corporate-event','sapphire-summit','nocturne-gala','atlas-salon'].includes(slug)) return 'acara-kantor';
  return 'pernikahan';
}
export function fieldsForCategory(category:string) {
  return categoryFields[category as InvitationCategory] || categoryFields.pernikahan;
}
