import {checkOrigin,readBody,json,failure} from '@/lib/http';
import {record,exact,cursor,parseWishes} from '@/lib/guests';
import {parseSlug} from '@/lib/commerce';
import {publicGateway} from '@/lib/public-gateway';
export const runtime='nodejs';
import {requireRsvpApp,guestFailure} from '@/lib/guest-server';
export async function POST(request:Request,{params}:{params:Promise<{slug:string}>}){try{
 checkOrigin(request);requireRsvpApp();const slug=parseSlug((await params).slug),x=record(await readBody(request));exact(x,['before']);
 const db=await publicGateway(request.headers,'wishes');
 const {data,error}=await db.rpc('ki_public_wishes',{p_slug:slug,p_before:cursor(x.before)});if(error)guestFailure(error);return json({ok:true,result:parseWishes(data)});
}catch(e){return failure(e);}}
