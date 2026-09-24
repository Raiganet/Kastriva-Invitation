import 'server-only';
import { redirect } from 'next/navigation';
import { serverDb } from '@/lib/supabase/server';
import { publicBackend } from '@/lib/config';
import { verifiedUser, requireAdminDecision } from '@/lib/auth-result';
import { HttpError } from '@/lib/http-errors';
export async function requireUser(next = '/dashboard') {
  if (!publicBackend()) redirect('/setup');
  const db = await serverDb();
  try {
    const user = await verifiedUser(() => db.auth.getUser());
    return { db, user };
  } catch (error) {
    if (error instanceof HttpError && error.status === 401) redirect('/login?next='+encodeURIComponent(next));
    throw error; // The error boundary offers retry; an outage is not a revoked session.
  }
}
export async function requireAdmin() {
  const context = await requireUser('/admin');
  const { data,error } = await context.db.rpc('ki_is_admin');
  try { requireAdminDecision(data, error); }
  catch (reason) {
    if (reason instanceof HttpError && reason.status === 403) redirect('/dashboard?notice=admin-only');
    throw reason;
  }
  return context;
}
