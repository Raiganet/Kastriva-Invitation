import {apiUser,readBody,json,failure,HttpError} from '@/lib/http';
import {parseWishPlatformCommand,parseWishPlatformAck} from '@/lib/open-wishes';
import {requireAdminDecision} from '@/lib/auth-result';
import {openWishFailure} from '@/lib/open-wish-server';
export async function POST(request:Request){try{
 const {db}=await apiUser(request);const role=await db.rpc('ki_is_admin');requireAdminDecision(role.data,role.error);
 const v=parseWishPlatformCommand(await readBody(request));
 const {data,error}=await db.rpc('ki_open_wish_admin_set',{p_request:v.request_id,p_revision:v.revision,p_enabled:v.enabled});if(error)openWishFailure(error);
 try{parseWishPlatformAck(data,v);}catch{throw new HttpError(503,'Konfirmasi belum pasti. Coba ulang pengaturan yang sama.');}return json({ok:true,result:data});
}catch(error){return failure(error);}}
