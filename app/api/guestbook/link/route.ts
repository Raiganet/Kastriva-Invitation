import {apiUser,readBody,json,failure} from '@/lib/http';
import {record,exact,uuid,parseGuestLink} from '@/lib/guests';
import {guestFailure} from '@/lib/guest-server';
export async function POST(request:Request){try{
 const {db}=await apiUser(request);const x=record(await readBody(request));exact(x,['sale_id','guest_id']);const id=uuid(x.guest_id);
 const {data,error}=await db.rpc('ki_guest_link',{p_sale:uuid(x.sale_id),p_guest:id});if(error)guestFailure(error);
 return json({ok:true,result:parseGuestLink(data,id)});
}catch(e){return failure(e);}}
