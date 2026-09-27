import type {Metadata} from 'next';
import {cache} from 'react';
import {siteUrl} from '@/lib/config';
import {invitationShareText} from '@/lib/invitation-share';
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
const publishedInvitation=cache(async(rawSlug:string)=>{
 if(!publishingAppEnabled())return null;
 let slug:string;try{slug=parseSlug(rawSlug);}catch{return null;}
 const db=await publicGateway(new Headers(await headers()),'page');
 const {data,error}=await db.rpc('ki_public_invitation',{p_slug:slug});
 if(error)throw new Error('PUBLIC_LOOKUP_UNAVAILABLE');
 if(!data)return null;
 const v=parsePublicInvitation(data);return getTemplate(v.theme_slug)?v:null;
});
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{
 const base:Metadata={title:'Undangan belum tersedia',description:'Hubungi pengirim untuk memperoleh tautan undangan yang aktif.',robots:{index:false,follow:false,noarchive:true},referrer:'no-referrer',openGraph:{title:'Undangan belum tersedia',description:'Hubungi pengirim untuk memperoleh tautan undangan yang aktif.',images:[]},twitter:{card:'summary',title:'Undangan belum tersedia',description:'Hubungi pengirim untuk memperoleh tautan undangan yang aktif.',images:[]}};
 let v;try{v=await publishedInvitation((await params).slug);}catch{return base;}
 if(!v)return base;
 const text=invitationShareText(v.content),url=new URL('/u/'+v.slug,siteUrl()).toString();
 const images=[{url:new URL('/share/invitation',siteUrl()).toString(),width:1200,height:630,alt:'Kastriva Invitation — Anda diundang'}];
 return {...base,...text,openGraph:{...text,type:'website',locale:'id_ID',siteName:'Kastriva Invitation',url,images},twitter:{card:'summary_large_image',...text,images:images.map(i=>i.url)}};
}
export default async function Published({params,searchParams}:{params:Promise<{slug:string}>;searchParams:Promise<{to?:string|string[]}>}){
 const v=await publishedInvitation((await params).slug);if(!v)notFound();
 const template=getTemplate(v.theme_slug)!;const q=await searchParams;
 return <InvitationView template={template} content={v.content} mode="public" rsvpSlug={rsvpAppEnabled()?v.slug:undefined} guest={safeGuest(q.to)} expiresAt={v.expires_at} photoUrls={Array.from({length:v.photo_count},(_,i)=>`/api/public/${v.slug}/photos/${i}?v=${v.revision}`)}/>;
}
