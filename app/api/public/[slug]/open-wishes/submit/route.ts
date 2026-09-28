import {checkOrigin,readBody,json,failure,HttpError} from '@/lib/http';
import {parseSlug} from '@/lib/commerce';
import {parseVisitorCommand,parseVisitorAck} from '@/lib/open-wishes';
import {publicGateway} from '@/lib/public-gateway';
import {rateIdentity} from '@/lib/public-rate';
import {siteUrl} from '@/lib/config';
import {requirePublicWishesApp,openWishFailure} from '@/lib/open-wish-server';
export const runtime='nodejs';
export async function POST(request:Request,{params}:{params:Promise<{slug:string}>}){try{
 checkOrigin(request);requirePublicWishesApp();const slug=parseSlug((await params).slug),v=parseVisitorCommand(await readBody(request));
 if(v.action!=='submit'||v.slug!==slug)throw new HttpError(400,'Permintaan bukan untuk undangan ini.');
 const db=await publicGateway(request.headers,'respond');
 const network=rateIdentity(request.headers,{vercel:process.env.VERCEL==='1',siteOrigin:siteUrl(),hmacKey:process.env.RATE_LIMIT_HMAC_KEY||''});
 const {data,error}=await db.rpc('ki_open_wish_submit',{p_slug:slug,p_id:v.id,p_receipt:v.receipt,p_name:v.name,p_message:v.message,p_consent:v.consent,p_network:network});
 if(error)openWishFailure(error);
 try{parseVisitorAck(data,v);}catch{throw new HttpError(503,'Konfirmasi belum pasti. Coba ulang permintaan yang sama.');}
 return json({ok:true,result:data});
}catch(error){return failure(error);}}
