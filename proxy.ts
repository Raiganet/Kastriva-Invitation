import { createBoundedBackendFetch } from '@/lib/backend-fetch';
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { publicBackend } from '@/lib/config';
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  if(request.nextUrl.pathname.startsWith('/api/public/')) { response.headers.set('Cache-Control','private, no-store, max-age=0'); return response; }
  const env = publicBackend();
  if (env) {
    const db = createServerClient(env.url,env.key,{global:{fetch:createBoundedBackendFetch({origin:env.url})},cookies:{
      getAll: () => request.cookies.getAll(),
      setAll(values) {
        values.forEach(({name,value}) => request.cookies.set(name,value));
        response = NextResponse.next({request});
        values.forEach(({name,value,options}) => response.cookies.set(name,value,options));
      },
    }});
    // Refresh only. Authorization is repeated at every server page/API and by RLS.
    try { await db.auth.getUser(); } catch { /* Server page/API fails closed on unavailable Auth. */ }
  }
  response.headers.set('Cache-Control','private, no-store, max-age=0');
  response.headers.set('Pragma','no-cache');
  response.headers.set('Expires','0');
  return response;
}
export const config = { matcher: ['/dashboard/:path*','/admin/:path*','/api/:path*','/auth/:path*','/login','/daftar','/lupa-password','/reset-password','/kirim-konfirmasi'] };
