import {notFound} from 'next/navigation';
import InvitationView from '@/components/InvitationView';
import InvitationPhoneDemo from '@/components/InvitationPhoneDemo';
import {publicSite} from '@/lib/cms-server';
import {demoContent} from '@/lib/templates';
import {demoPhotos} from '@/lib/invitation-demo';
import {safeGuest} from '@/lib/domain';
export const dynamic='force-dynamic';
export const metadata={title:'Demo Undangan',robots:{index:false,follow:false}};
export default async function Demo({params,searchParams}:{params:Promise<{slug:string}>;searchParams:Promise<{to?:string;view?:string}>}){
 const {slug}=await params;
 const site=await publicSite();
 if(site.source==='unavailable')throw new Error('CATALOG_UNAVAILABLE');
 const template=site.catalog.find(t=>t.slug===slug&&t.active);
 if(!template)notFound();
 const query=await searchParams,guest=safeGuest(query.to);
 if(query.view!=='screen'&&query.view!=='full')return <InvitationPhoneDemo template={template} guest={guest}/>;
 const invitation=<InvitationView template={template} content={demoContent(template)} guest={guest} previewOnly={query.view==='screen'} {...demoPhotos(template.category,template.slug)}/>;
 return query.view==='screen'?<div className="inv-device-screen">{invitation}</div>:invitation;
}
