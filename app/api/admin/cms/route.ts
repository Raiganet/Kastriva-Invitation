import {requireAdminDecision} from '@/lib/auth-result';
import {apiUser,readBody,json,failure,HttpError} from '@/lib/http';
import {parseCmsCommand,parseCmsAck} from '@/lib/cms';
import {cmsFailure} from '@/lib/cms-server';
export const runtime='nodejs';
export async function POST(request:Request){try{
 const{db,user}=await apiUser(request);const{data:admin,error:ae}=await db.rpc('ki_is_admin');requireAdminDecision(admin,ae);if(!user.email_confirmed_at)throw new HttpError(403,'Akun admin terkonfirmasi diperlukan.');
 const x=parseCmsCommand(await readBody(request));const{data,error}=await db.rpc('ki_cms_mutate',{p_action:x.action,p_revision:x.revision,p_request:x.request_id,p_catalog_hash:x.catalog_hash,p_document:x.document});
 if(error)cmsFailure(error);
 // A malformed ACK after commit is uncertain, not a false claim that the save failed.
 let result;try{result=parseCmsAck(data,x);}catch{throw new HttpError(503,'Balasan CMS belum dapat dipastikan. Coba ulang permintaan yang sama.');}
 return json({ok:true,result});
}catch(e){return failure(e);}}
