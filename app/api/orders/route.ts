import { apiUser, readBody, json, failure, dbFailure, HttpError } from '@/lib/http';
import { parseOrder } from '@/lib/domain';
export async function POST(request: Request) {
  try {
    const {db,user} = await apiUser(request);
    if(process.env.ENABLE_ORDER_REQUESTS !== 'true') throw new HttpError(503,'Pemesanan belum dibuka. Draft Anda tetap tersimpan.');
    const value = parseOrder(await readBody(request));
    const {data,error} = await db.rpc('ki_request_order',{p_invitation:value.invitation_id,p_name:value.customer_name,p_phone:value.customer_phone});
    if(error) dbFailure(error);
    return json({order:data,message:'Permintaan tersimpan untuk diperiksa admin. Ini bukan konfirmasi pembayaran atau penerbitan undangan.'});
  } catch(error) { return failure(error); }
}
