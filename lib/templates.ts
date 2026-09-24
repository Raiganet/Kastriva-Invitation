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
    venue: 'Gedung Serbaguna', address: 'Alamat contoh untuk tampilan demo. Ganti dengan lokasi acara Anda.',
    mapUrl: '', opening: wedding ? 'Dengan penuh kebahagiaan, kami mengundang Anda untuk menjadi bagian dari hari istimewa kami.' : 'Dengan senang hati kami mengundang Anda untuk hadir dan merayakan momen istimewa ini bersama.',
    story: wedding ? 'Berawal dari pertemuan sederhana, tumbuh menjadi perjalanan yang penuh cerita. Dengan restu keluarga, kami melangkah ke babak baru bersama.\n\nIni adalah cerita contoh untuk demo, bukan data pelanggan.' : '',
    photoPaths: [],
  };
}
