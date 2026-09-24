import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { publicBackend } from '@/lib/config';
import { HttpError } from '@/lib/http';
import { createBoundedBackendFetch } from '@/lib/backend-fetch';
export const checkoutAppEnabled=()=>process.env.ENABLE_CHECKOUT==='true';
export const publishingAppEnabled=()=>process.env.ENABLE_PUBLIC_INVITATIONS==='true';
export function requireCheckoutApp(){if(!checkoutAppEnabled())throw new HttpError(503,'Checkout belum dibuka pada deployment ini.');}
export function requirePublishingApp(){if(!publishingAppEnabled())throw new HttpError(503,'Penerbitan undangan belum dibuka pada deployment ini.');}
export function commerceFailure(error:{code?:string}):never{
 const map:Record<string,[number,string]>={
  '42501':[403,'Akun ini tidak memiliki akses. Pastikan email terkonfirmasi.'],
  '22023':[400,'Data belum lengkap atau tidak sesuai. Periksa formulir.'],
  'P4001':[409,'Data berubah di tab/perangkat lain. Muat ulang untuk membaca versi terbaru.'],
  'P4002':[503,'Fitur dinonaktifkan pengelola atau rekening penerima belum siap.'],
  'P4003':[409,'Pembayaran belum terverifikasi atau masa aktif berakhir.'],
  'P4004':[409,'Alamat sudah dipakai atau berbeda dari alamat pertama. Alamat terbit tidak dapat diganti.'],
  'P4005':[400,'Lengkapi nama kedua mempelai, tanggal, nama acara, tempat, dan alamat semua acara.'],
  'P4006':[409,'Tema tidak tersedia atau tidak sama dengan tema yang dibeli.'],
  'P4007':[409,'Sebagian foto tidak ditemukan. Periksa galeri draft.'],
  'P4008':[400,'Jumlah dana yang benar-benar diterima harus sama dengan tagihan dan mutasi wajib diverifikasi.'],
  'P4009':[409,'Tindakan tidak sesuai status saat ini. Muat ulang.'],
  'P4010':[409,'Identitas percobaan ulang sudah dipakai untuk isi berbeda. Baca ulang status sebelum melanjutkan.'],
  'P4011':[409,'Harga, masa aktif, atau rekening berubah. Muat ulang dan setujui ringkasan terbaru.'],
  'P0001':[429,'Batas tindakan tercapai. Hubungi pengelola.'],
 };
 const [status,message]=map[error.code||'']||[503,'Database belum dapat memproses permintaan. Periksa migrasi tahap 4.'];
 throw new HttpError(status,message);
}
/** The anonymous client has no cookies, no user session, and explicitly disables caching. */
export function anonymousDb(){const env=publicBackend();if(!env)throw new HttpError(503,'Backend belum dikonfigurasi.');return createClient(env.url,env.key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},global:{fetch:createBoundedBackendFetch({origin:env.url})}});}
export function privateStorageKey():string|null{const key=process.env.SUPABASE_SECRET_KEY||'';if(/^sb_secret_\S{10,}$/.test(key))return key;try{const p=JSON.parse(Buffer.from(key.split('.')[1]||'','base64url').toString());if(p.role==='service_role'&&key.split('.').length===3)return key;}catch{}return null;}
/** Never import this module into a client component. Secret used after gateway limits and scoped public validation. Never use for owner/admin RPCs. */
export function privateStorageDb(){const env=publicBackend(),key=privateStorageKey();if(!env||!key)throw new HttpError(503,'Gateway publik belum dikonfigurasi.');return createClient(env.url,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},global:{fetch:createBoundedBackendFetch({origin:env.url})}});}
