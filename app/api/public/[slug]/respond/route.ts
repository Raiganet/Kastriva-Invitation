import {checkOrigin,readBody,json,failure,HttpError} from '@/lib/http';
import {parseRsvp,parseRsvpAck} from '@/lib/guests';
import {parseSlug} from '@/lib/commerce';
import {publicGateway} from '@/lib/public-gateway';
export const runtime='nodejs';
import {requireRsvpApp,guestFailure} from '@/lib/guest-server';
export async function POST(request:Request,{params}:{params:Promise<{slug:string}>}){try{
 checkOrigin(request);requireRsvpApp();const slug=parseSlug((await params).slug),x=parseRsvp(await readBody(request));if(x.slug!==slug)throw new HttpError(400,'Alamat undangan tidak cocok.');
 const db=await publicGateway(request.headers,'respond');
 const {data,error}=await db.rpc('ki_submit_rsvp',{p_slug:slug,p_token:x.token,p_revision:x.revision,p_request:x.request_id,p_attendance:x.attendance,p_people:x.people,p_message:x.message,p_display_name:x.display_name,p_consent:x.consent});
 if(error)guestFailure(error);let ack;try{ack=parseRsvpAck(data,x);}catch{throw new HttpError(503,'Balasan belum dapat dipastikan. Coba ulang dengan identitas yang sama.');}return json({ok:true,result:ack});
}catch(e){return failure(e);}}
