import {apiUser,readBody,json,failure} from '@/lib/http';
import {parseGuestQuery,parseWorkspace} from '@/lib/guests';
import {guestFailure} from '@/lib/guest-server';
export async function POST(request:Request){try{
 const {db}=await apiUser(request);const x=parseGuestQuery(await readBody(request));
 const {data,error}=await db.rpc('ki_guest_workspace',{p_sale:x.sale_id,p_query:x.query,p_filter:x.filter,p_offset:x.offset});
 if(error)guestFailure(error);const v=parseWorkspace(data);if(v.sale_id!==x.sale_id)throw new Error('WORKSPACE_MISMATCH');return json({ok:true,result:v});
}catch(e){return failure(e);}}
