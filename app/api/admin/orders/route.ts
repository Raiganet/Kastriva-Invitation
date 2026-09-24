import {requireAdminDecision} from '@/lib/auth-result';
import { apiUser, readBody, json, failure, dbFailure, HttpError } from '@/lib/http';
import { asRecord, UUID, ORDER_STATUSES } from '@/lib/domain';
export async function POST(request: Request) {
  try {
    const {db} = await apiUser(request);
    const {data:admin,error:authError} = await db.rpc('ki_is_admin');
    requireAdminDecision(admin,authError);
    const x=asRecord(await readBody(request));
    if(Object.keys(x).some(k=>!['id','status'].includes(k)) || !UUID.test(String(x.id)) || !ORDER_STATUSES.includes(x.status as typeof ORDER_STATUSES[number])) throw new HttpError(400,'Status pesanan tidak valid.');
    const {error}=await db.rpc('ki_update_order_status',{p_id:x.id,p_status:x.status});
    if(error) dbFailure(error);
    return json({ok:true});
  } catch(error) { return failure(error); }
}
