import {headers} from 'next/headers';
import {publicGateway} from '@/lib/public-gateway';
import {notFound} from 'next/navigation';
import {rsvpAppEnabled} from '@/lib/guest-server';
import InvitationView from '@/components/InvitationView';
import {publishingAppEnabled} from '@/lib/commerce-server';
import {parseSlug,parsePublicInvitation} from '@/lib/commerce';
import {getTemplate} from '@/lib/templates';
import {safeGuest} from '@/lib/domain';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const revalidate=0;
export const metadata={title:'Undangan untuk Anda',robots:{index:false,follow:false,noarchive:true},referrer:'no-referrer' as const};
export default async function Published({params,searchParams}:{params:Promise<{slug:string}>;searchParams:Promise<{to?:string|string[]}>}){
 if(!publishingAppEnabled())notFound();const p=await params;let slug:string;try{slug=parseSlug(p.slug);}catch{notFound();}
 const db=await publicGateway(new Headers(await headers()),'page');const {data,error}=await db.rpc('ki_public_invitation',{p_slug:slug});
 if(error)throw new Error('PUBLIC_LOOKUP_UNAVAILABLE');if(!data)notFound();const v=parsePublicInvitation(data);const template=getTemplate(v.theme_slug);if(!template)notFound();const q=await searchParams;
 return <InvitationView template={template} content={v.content} mode="public" rsvpSlug={rsvpAppEnabled()?v.slug:undefined} guest={safeGuest(q.to)} expiresAt={v.expires_at} photoUrls={Array.from({length:v.photo_count},(_,i)=>`/api/public/${v.slug}/photos/${i}?v=${v.revision}`)}/>;
}
