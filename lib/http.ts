import 'server-only';
import { NextResponse } from 'next/server';
import { ValidationError } from '@/lib/domain';
import { publicBackend, siteUrl } from '@/lib/config';
import { serverDb } from '@/lib/supabase/server';
import {HttpError} from '@/lib/http-errors';
import {assertWriteOrigin,readBoundedJson} from '@/lib/request-guard';
import {verifiedUser} from '@/lib/auth-result';
export {HttpError} from '@/lib/http-errors';
export function json(value: unknown, status = 200, extraHeaders:Record<string,string>={}) { return NextResponse.json(value,{status,headers:{'Cache-Control':'private, no-store',...extraHeaders}}); }
export function checkOrigin(request:Request) { assertWriteOrigin(request.headers,siteUrl()); }
export async function readBody(request:Request) { return readBoundedJson(request); }
export async function apiUser(request: Request) {
  checkOrigin(request);
  if (!publicBackend()) throw new HttpError(503,'Supabase belum dikonfigurasi. Tidak ada data yang disimpan.');
  const db = await serverDb();
  const user = await verifiedUser(() => db.auth.getUser());
  return {db,user};
}
export function dbFailure(error: {code?:string;message?:string}): never {
  if(error.code === '40001') throw new HttpError(409,'Draft berubah di tab/perangkat lain. Salin perubahan Anda lalu muat ulang sebelum menyimpan.');
  if(error.code === '42501') throw new HttpError(403,'Anda tidak memiliki akses ke data ini.');
  if(error.code === '22023' || error.code === '23514') throw new HttpError(400,'Data belum lengkap atau tidak sesuai ketentuan.');
  if(error.code === 'P0002') throw new HttpError(409,'Draft sudah terhubung ke permintaan pengerjaan dan tidak dapat dihapus.');
  if(error.code === 'P0001') throw new HttpError(429,'Batas draft/permintaan tercapai. Hubungi admin.');
  throw new HttpError(503,'Penyimpanan belum berhasil. Periksa koneksi atau konfigurasi database.');
}
export function failure(error: unknown) {
  if (error instanceof HttpError) return json({error:error.message},error.status,error.retryAfter ? {'Retry-After':String(error.retryAfter)} : {});
  if (error instanceof ValidationError) return json({error:error.message},400);
  // Do not expose SQL details, tokens, environment variables, or PII in responses/logs.
  return json({error:'Permintaan belum berhasil. Silakan coba kembali.'},500);
}
