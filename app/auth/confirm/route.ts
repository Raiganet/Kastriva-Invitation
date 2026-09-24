import { NextResponse } from 'next/server';
import { serverDb } from '@/lib/supabase/server';
import { safeNext } from '@/lib/domain';
import { siteUrl } from '@/lib/config';
export async function GET(request: Request) {
  const url=new URL(request.url), token_hash=url.searchParams.get('token_hash'), type=url.searchParams.get('type');
  const code=url.searchParams.get('code');
  if(type==='email' || type==='recovery') {
    try {
      const db=await serverDb();
      const result=token_hash ? await db.auth.verifyOtp({token_hash,type}) : code ? await db.auth.exchangeCodeForSession(code) : null;
      if(result && !result.error) {
        const response=NextResponse.redirect(new URL(type==='recovery'?'/reset-password':safeNext(url.searchParams.get('next')),siteUrl()));
        response.headers.set('Cache-Control','private, no-store');
        return response;
      }
    } catch { /* Invalid/expired links never expose upstream errors or tokens. */ }
  }
  const response=NextResponse.redirect(new URL('/login?error=link',siteUrl()));
  response.headers.set('Cache-Control','private, no-store');
  return response;
}
