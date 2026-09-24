import {requireAdminDecision} from '@/lib/auth-result';
import {apiUser,readBody,json,failure,HttpError} from '@/lib/http';
import {parsePlatform} from '@/lib/guests';
import {guestFailure} from '@/lib/guest-server';
export async function POST(request:Request){try{
 const {db}=await apiUser(request);const {data:admin,error:ae}=await db.rpc('ki_is_admin');requireAdminDecision(admin,ae);
 const x=parsePlatform(await readBody(request));const {data,error}=await db.rpc('ki_guest_platform_update',{p_revision:x.revision,p_enabled:x.enabled});if(error)guestFailure(error);
 let v;try{v=parsePlatform(data);}catch{throw new HttpError(503,'Balasan pengaturan belum dapat dipastikan.');}if(v.revision!==x.revision+1||v.enabled!==x.enabled)throw new Error('PLATFORM_ACK_INVALID');return json({ok:true,result:v});
}catch(e){return failure(e);}}
