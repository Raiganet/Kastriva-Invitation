import {apiUser,readBody,json,failure,HttpError} from '@/lib/http';
import {record,exact,uuid,integer} from '@/lib/guests';
import {wishFilter,parseWishWorkspace} from '@/lib/open-wishes';
import {openWishFailure} from '@/lib/open-wish-server';
export async function POST(request:Request){try{
 const {db}=await apiUser(request),v=record(await readBody(request));exact(v,['sale_id','filter','offset']);const id=uuid(v.sale_id);
 const {data,error}=await db.rpc('ki_open_wish_workspace',{p_sale:id,p_filter:wishFilter(v.filter),p_offset:integer(v.offset,0,2000)});if(error)openWishFailure(error);
 const result=parseWishWorkspace(data);if(result.sale_id!==id)throw new HttpError(503,'Balasan undangan tidak cocok.');return json({ok:true,result});
}catch(error){return failure(error);}}
