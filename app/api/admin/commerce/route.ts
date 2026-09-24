import {requireAdminDecision} from '@/lib/auth-result';
import {apiUser,readBody,json,failure,HttpError} from '@/lib/http';
import {parseCommerceSettings} from '@/lib/commerce';
import {commerceFailure} from '@/lib/commerce-server';
export async function POST(request:Request){try{const {db}=await apiUser(request);const {data:admin,error:ae}=await db.rpc('ki_is_admin');requireAdminDecision(admin,ae);const x=parseCommerceSettings(await readBody(request));const {data,error}=await db.rpc('ki_update_commerce_settings',{p_revision:x.revision,p_checkout:x.checkout_enabled,p_publishing:x.publishing_enabled,p_days:x.active_days,p_bank:x.bank_name,p_account:x.bank_account,p_holder:x.bank_holder,p_instructions:x.instructions});if(error)commerceFailure(error);if(!data?.revision)throw new HttpError(503,'Balasan pengaturan belum dapat diverifikasi.');return json({ok:true,result:data});}catch(e){return failure(e);}}
