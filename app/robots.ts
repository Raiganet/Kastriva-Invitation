import type { MetadataRoute } from 'next';
import {publicSite} from '@/lib/cms-server';
export const dynamic='force-dynamic';
export const revalidate=0;
export default async function robots():Promise<MetadataRoute.Robots>{
 const s=await publicSite();
 if(s.source!=='database'||!s.content.allowIndex)return{rules:{userAgent:'*',disallow:'/'}};
 // Explicit marketing routes only. Robots directives are not authentication.
 return{rules:{userAgent:'*',allow:['/$','/tema$','/tema?','/harga$','/_next/','/brand/crest-v1/','/favicon.ico','/manifest.webmanifest'],disallow:'/'}};
}
