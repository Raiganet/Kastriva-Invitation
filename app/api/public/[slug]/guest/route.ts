import {checkOrigin,readBody,json,failure,HttpError} from '@/lib/http';
import {record,exact,guestToken,parseContext} from '@/lib/guests';
import {parseSlug} from '@/lib/commerce';
import {publicGateway} from '@/lib/public-gateway';
export const runtime='nodejs';
import {requireRsvpApp,guestFailure} from '@/lib/guest-server';
export async function POST(request:Request,{params}:{params:Promise<{slug:string}>}){try{
 checkOrigin(request);requireRsvpApp();const slug=parseSlug((await params).slug),x=record(await readBody(request));exact(x,['token']);
 const db=await publicGateway(request.headers,'guest');
 const {data,error}=await db.rpc('ki_guest_context',{p_slug:slug,p_token:guestToken(x.token)});if(error)guestFailure(error);
 if(!data)throw new HttpError(404,'Tautan tamu tidak tersedia. Hubungi pengirim untuk tautan terbaru.');return json({ok:true,result:parseContext(data)});
}catch(e){return failure(e);}}
