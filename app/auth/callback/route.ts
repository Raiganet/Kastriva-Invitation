import { NextResponse } from 'next/server';
import { serverDb } from '@/lib/supabase/server';
import { safeNext } from '@/lib/domain';
import { siteUrl } from '@/lib/config';
export async function GET(request: Request) {
  const url = new URL(request.url), code = url.searchParams.get('code');
  if(code) { try { const db=await serverDb(); const {error}=await db.auth.exchangeCodeForSession(code); if(!error) return NextResponse.redirect(new URL(safeNext(url.searchParams.get('next')),siteUrl())); } catch {} }
  return NextResponse.redirect(new URL('/login?error=link',siteUrl()));
}
