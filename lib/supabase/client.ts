'use client';
import { createBoundedBackendFetch } from '@/lib/backend-fetch';
import { createBrowserClient } from '@supabase/ssr';
import { publicBackend } from '@/lib/config';
export function browserDb() {
  const env = publicBackend();
  if (!env) throw new Error('Supabase belum dikonfigurasi. Mode demo tidak menyimpan data ke server.');
  return createBrowserClient(env.url, env.key, {global:{fetch:createBoundedBackendFetch({origin:env.url})}});
}
