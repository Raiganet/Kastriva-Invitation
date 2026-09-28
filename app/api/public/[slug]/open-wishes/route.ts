import {checkOrigin,readBody,json,failure} from '@/lib/http';
import {record,exact,cursor} from '@/lib/guests';
import {parseSlug} from '@/lib/commerce';
import {parseOpenWishFeed} from '@/lib/open-wishes';
import {publicGateway} from '@/lib/public-gateway';
import {requirePublicWishesApp,openWishFailure} from '@/lib/open-wish-server';
export const runtime='nodejs';
export async function POST(request:Request,{params}:{params:Promise<{slug:string}>}){try{
 checkOrigin(request);requirePublicWishesApp();const slug=parseSlug((await params).slug),v=record(await readBody(request));exact(v,['before']);
 const db=await publicGateway(request.headers,'wishes');const {data,error}=await db.rpc('ki_open_wish_feed',{p_slug:slug,p_before:cursor(v.before)});
 if(error)openWishFailure(error);return json({ok:true,result:parseOpenWishFeed(data)});
}catch(error){return failure(error);}}
