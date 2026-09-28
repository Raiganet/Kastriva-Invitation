import {apiUser,readBody,json,failure,HttpError} from '@/lib/http';
import {parseWishOwnerCommand,parseWishOwnerAck} from '@/lib/open-wishes';
import {openWishFailure} from '@/lib/open-wish-server';
export async function POST(request:Request){try{
 const {db}=await apiUser(request),v=parseWishOwnerCommand(await readBody(request));
 const {data,error}=await db.rpc('ki_open_wish_manage',{p_sale:v.sale_id,p_request:v.request_id,p_action:v.action,p_revision:v.revision,p_entry:v.entry_id,p_data:v.data});if(error)openWishFailure(error);
 let result;try{result=parseWishOwnerAck(data,v);}catch{throw new HttpError(503,'Konfirmasi belum pasti. Coba ulang tindakan yang sama.');}
 return json({ok:true,result});
}catch(error){return failure(error);}}
