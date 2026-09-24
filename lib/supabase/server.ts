import 'server-only';
import { createBoundedBackendFetch } from '@/lib/backend-fetch';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { publicBackend } from '@/lib/config';
export async function serverDb() {
  const env = publicBackend();
  if (!env) throw new Error('BACKEND_NOT_CONFIGURED');
  const jar = await cookies();
  return createServerClient(env.url, env.key, {
    global: { fetch: createBoundedBackendFetch({origin:env.url}) },
    cookies: {
      getAll() { return jar.getAll(); },
      setAll(values) {
        try { values.forEach(({name,value,options}) => jar.set(name,value,options)); }
        catch { /* Read-only Server Component: token refresh is handled by proxy.ts. */ }
      },
    },
  });
}
