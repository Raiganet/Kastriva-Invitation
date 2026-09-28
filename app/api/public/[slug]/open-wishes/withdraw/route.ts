import {checkOrigin,readBody,json,failure,HttpError} from '@/lib/http';
import {parseSlug} from '@/lib/commerce';
import {parseVisitorCommand,parseVisitorAck} from '@/lib/open-wishes';
import {publicGateway} from '@/lib/public-gateway';
import {openWishFailure} from '@/lib/open-wish-server';
export const runtime='nodejs';
// Privacy removal does not require the intake/publication flags to stay open.
// It still requires same-origin JSON, the server gateway rate budget, and the private receipt.
export async function POST(request:Request,{params}:{params:Promise<{slug:string}>}){try{
 checkOrigin(request);const slug=parseSlug((await params).slug),v=parseVisitorCommand(await readBody(request));
 if(v.action!=='withdraw'||v.slug!==slug)throw new HttpError(400,'Permintaan penghapusan tidak sesuai.');
 const db=await publicGateway(request.headers,'respond');
 const {data,error}=await db.rpc('ki_open_wish_withdraw',{p_slug:slug,p_id:v.id,p_receipt:v.receipt});if(error)openWishFailure(error);
 try{parseVisitorAck(data,v);}catch{throw new HttpError(503,'Konfirmasi belum pasti. Coba ulang penghapusan yang sama.');}
 return json({ok:true,result:data});
}catch(error){return failure(error);}}
