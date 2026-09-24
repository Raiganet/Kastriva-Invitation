import 'server-only';
import {privateStorageDb} from '@/lib/commerce-server';
import {siteUrl} from '@/lib/config';
import {rateIdentity,takePublicLimit,type PublicScope} from '@/lib/public-rate';
import {HttpError} from '@/lib/http-errors';
/** Returns a privileged client ONLY after the distributed limiter allows this public read/write.
 * Callers still validate slug, guest token, status, consent, expiry and media index through existing RPCs.
 * This is deliberately not used for owner/admin calls: they keep their real Supabase user session.
 */
export async function publicGateway(headers:Headers,scope:PublicScope){
  const identity=rateIdentity(headers,{vercel:process.env.VERCEL==='1',siteOrigin:siteUrl(),hmacKey:process.env.RATE_LIMIT_HMAC_KEY||''});
  const db=privateStorageDb();
  await takePublicLimit(scope,identity,async(p_scope,p_identity)=>{
    const {data,error}=await db.rpc('ki_take_public_rate',{p_scope,p_identity});
    if(error)throw new HttpError(503,'Pembatasan layanan belum siap. Periksa migrasi 007.',30);
    return data;
  });
  return db;
}
