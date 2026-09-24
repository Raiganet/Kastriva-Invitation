import 'server-only';
import {HttpError} from '@/lib/http';
import {requirePublishingApp} from '@/lib/commerce-server';
export const rsvpAppEnabled=()=>process.env.ENABLE_RSVP==='true';
export function requireRsvpApp(){requirePublishingApp();if(!rsvpAppEnabled())throw new HttpError(503,'RSVP belum dibuka pada deployment ini. Hubungi pengirim undangan.');}
export function guestFailure(error:{code?:string}):never{
 const errors:Record<string,[number,string]>={
 '42501':[403,'Data ini hanya dapat dikelola oleh pemilik dengan email terkonfirmasi.'],
 '22023':[400,'Data tamu atau respons tidak sesuai ketentuan.'],
 '23505':[409,'Identitas tamu sudah digunakan. Muat ulang daftar sebelum mencoba lagi.'],
 'P5001':[409,'Data telah berubah. Muat versi terbaru sebelum melanjutkan.'],
 'P5002':[409,'RSVP sedang ditutup atau undangan tidak aktif. Hubungi pengirim.'],
 'P5003':[404,'Tautan tamu tidak valid atau sudah dinonaktifkan.'],
 'P5004':[429,'Terlalu sering mengubah jawaban. Tunggu setidaknya 30 detik; batas 20 perubahan dalam 24 jam.'],
 'P5005':[409,'Batas daftar tamu atau tindakan tercapai. Hubungi pengelola.'],
 'P5006':[409,'ID percobaan sudah digunakan dengan isi berbeda. Muat status terbaru.'],
 'P5007':[409,'Pesanan harus terverifikasi dan masa aktif belum berakhir untuk menambah atau mengaktifkan tamu.'],
 'P5008':[409,'Kapasitas tidak boleh lebih kecil daripada jumlah yang sudah dikonfirmasi.'],
 };
 const [status,message]=errors[error.code||'']||[503,'Layanan tamu belum dapat diproses. Periksa koneksi dan migrasi SQL 005.'];
 throw new HttpError(status,message);
}
