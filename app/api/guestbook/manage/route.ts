import {apiUser,readBody,json,failure,HttpError} from '@/lib/http';
import {parseGuestCommand,parseGuestAck} from '@/lib/guests';
import {guestFailure} from '@/lib/guest-server';
export async function POST(request:Request){try{
 const {db}=await apiUser(request);const x=parseGuestCommand(await readBody(request));
 const {data,error}=await db.rpc('ki_guest_manage',{p_sale:x.sale_id,p_action:x.action,p_guest:x.guest_id,p_revision:x.revision,p_request:x.request_id,p_data:x.data});
 if(error)guestFailure(error);let ack;try{ack=parseGuestAck(data,x);}catch{throw new HttpError(503,'Balasan belum dapat dipastikan. Coba ulang dengan identitas yang sama.');}return json({ok:true,result:ack});
}catch(e){return failure(e);}}
