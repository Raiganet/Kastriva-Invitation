import {isHeritageTheme} from './theme-registry';
import items from '@/data/templates.json';
import type { DraftContent, Template } from '@/lib/types';
import {demoMusic} from './invitation-demo';
export const templates = items as Template[];
export const weddingTemplates = templates.filter(t => t.category === 'pernikahan');
export const categories: Record<string,string> = {
  all: 'Semua tema', pernikahan: 'Pernikahan', 'ulang-tahun': 'Ulang tahun', aqiqah: 'Aqiqah', 'acara-kantor': 'Acara kantor',
};
export function getTemplate(slug: string): Template | undefined { return templates.find(t => t.slug === slug && t.active); }
export function demoContent(template: Template): DraftContent {
  const wedding = template.category === 'pernikahan';
  return {
    groom: wedding ? 'Ahmad' : template.category === 'ulang-tahun' ? 'Aruna' : template.category === 'aqiqah' ? 'Bayi Aruna' : 'Annual Gathering',
    bride: wedding ? 'Siti' : '',
    groomParents: wedding ? 'Putra dari Bapak Rahman & Ibu Aisyah' : '',
    brideParents: wedding ? 'Putri dari Bapak Yusuf & Ibu Fatimah' : '',
    eventDate: '2026-12-25', eventTime: '08:00', endTime: '14:00', timezone: 'Asia/Jakarta',
    venue: 'Monumen Nasional (contoh)', address: 'Gambir, Jakarta Pusat. Lokasi ini hanya contoh, bukan tempat acara nyata.',
    mapUrl: 'https://www.google.com/maps/search/?api=1&query=Monumen+Nasional+Jakarta', opening: template.slug==='islami-sakinah' ? 'Assalamu’alaikum warahmatullahi wabarakatuh. Dengan memohon rahmat dan rida Allah SWT, kami mengundang Bapak/Ibu/Saudara/i untuk menghadiri pernikahan kami.' : wedding ? 'Dengan penuh kebahagiaan, kami mengundang Anda untuk menjadi bagian dari hari istimewa kami.' : 'Dengan senang hati kami mengundang Anda untuk hadir dan merayakan momen istimewa ini bersama.',
    story: template.slug==='elegant-rose' ? '2022 — Pertemuan pertama\nBerawal dari pertemuan sederhana dan percakapan yang terus berlanjut, kami mulai mengenal satu sama lain.\n\n2025 — Menetapkan langkah\nDengan restu keluarga, kami memilih melangkah lebih serius dan menyiapkan babak baru bersama.\n\n2026 — Hari yang dinanti\nKami ingin membagikan kebahagiaan ini bersama orang-orang terdekat. Cerita ini adalah contoh untuk demo.' : template.slug==='galaxy-night' ? '2021 — Awal sebuah cerita\nPertemuan sederhana membawa kami pada percakapan yang tak ingin berakhir.\n\n2024 — Memilih melangkah bersama\nDengan restu keluarga, kami merangkai mimpi dan saling menguatkan.\n\n2026 — Babak baru\nKami siap menyambut perjalanan berikutnya, bersama orang-orang tercinta. Cerita ini adalah contoh untuk demo.' : wedding ? '2022 — Pertemuan pertama\nSebuah pertemuan sederhana mempertemukan dua cerita. Dari percakapan kecil, kami menemukan banyak alasan untuk terus saling mengenal.\n\n2025 — Melangkah bersama\nMelalui banyak tawa dan perjalanan, kami belajar saling mendukung. Dengan restu keluarga, kami memutuskan untuk menjaga cerita ini bersama.\n\n2026 — Hari yang dinanti\nKini kami membuka babak baru dan ingin membagikan kebahagiaan bersama orang-orang tercinta. Cerita ini adalah ilustrasi untuk demo.' : '',
    ...((template.slug==='elegant-rose'||template.slug==='galaxy-night'||template.slug==='elementor-luxury-1'||template.slug==='botanical-blush'||template.slug==='aurora-modern'||template.slug==='velvet-vow'||template.slug==='seraphine-garden'||isHeritageTheme(template.slug))?{gifts:[{bank:'Bank Contoh',account:'0000000000',holder:'Nama Pasangan (Contoh)'}]}:{}),
    music: demoMusic(template.slug), musicVolume: 45,
    photoPaths: [],
  };
}
