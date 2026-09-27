import {isHeritageTheme} from './theme-registry';
import items from '@/data/templates.json';
import type { DraftContent, Template } from '@/lib/types';
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
    story: template.slug==='galaxy-night' ? '2021 — Awal sebuah cerita\nPertemuan sederhana membawa kami pada percakapan yang tak ingin berakhir.\n\n2024 — Memilih melangkah bersama\nDengan restu keluarga, kami merangkai mimpi dan saling menguatkan.\n\n2026 — Babak baru\nKami siap menyambut perjalanan berikutnya, bersama orang-orang tercinta. Cerita ini adalah contoh untuk demo.' : wedding ? 'Berawal dari pertemuan sederhana, tumbuh menjadi perjalanan yang penuh cerita. Dengan restu keluarga, kami melangkah ke babak baru bersama.\n\nIni adalah cerita contoh untuk demo, bukan data pelanggan.' : '',
    ...((template.slug==='galaxy-night'||template.slug==='elementor-luxury-1'||template.slug==='botanical-blush'||isHeritageTheme(template.slug))?{music:'serenade' as const,gifts:[{bank:'Bank Contoh',account:'0000000000',holder:'Nama Pasangan (Contoh)'}]}:{}),
    photoPaths: [],
  };
}
