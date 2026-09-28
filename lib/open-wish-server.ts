import 'server-only';
import {HttpError} from '@/lib/http-errors';
import {requirePublishingApp} from '@/lib/commerce-server';
export const publicWishesAppEnabled=()=>process.env.ENABLE_PUBLIC_WISHES==='true';
export function requirePublicWishesApp(){requirePublishingApp();if(!publicWishesAppEnabled())throw new HttpError(503,'Ucapan umum belum dibuka pada deployment ini.');}
export function openWishFailure(error:{code?:string}):never {
 const messages:Record<string,[number,string]>={
 '42501':[403,'Ucapan ini hanya dapat dikelola pemilik akun yang berhak.'],
 '22023':[400,'Periksa nama, ucapan, izin penayangan, dan tindakan yang dipilih.'],
 '23505':[409,'Identitas pengiriman sudah digunakan. Periksa hasil sebelum mengirim ulang.'],
 'P1301':[409,'Ucapan atau pengaturan berubah. Muat data terbaru dahulu.'],
 'P1302':[409,'Penerimaan ucapan ditutup atau undangan tidak aktif. Hubungi tuan rumah.'],
 'P1303':[403,'Kode penghapusan tidak valid untuk undangan ini.'],
 'P1304':[429,'Terlalu sering mengirim. Tunggu minimal 30 detik. Batas pengiriman adalah 5 ucapan per jaringan per periode harian pada undangan ini.'],
 'P1305':[409,'Kapasitas ucapan undangan ini sudah penuh. Hubungi tuan rumah.'],
 'P1306':[409,'Identitas percobaan sudah dipakai dengan isi berbeda. Periksa hasil sebelumnya.'],
 };
 const [status,message]=messages[error.code||'']||[503,'Ucapan belum dapat diproses. Periksa koneksi dan migrasi 013.'];
 throw new HttpError(status,message,status===429?30:undefined);
}
