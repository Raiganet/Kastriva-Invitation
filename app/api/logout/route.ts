import { checkOrigin, json, failure } from '@/lib/http';
import { serverDb } from '@/lib/supabase/server';
export async function POST(request: Request) {
  try { checkOrigin(request); const db=await serverDb(); const {error}=await db.auth.signOut({scope:'local'}); if(error) return json({error:'Logout belum berhasil. Coba kembali.'},503); return json({ok:true}); }
  catch(error){return failure(error);}
}
