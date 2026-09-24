import {parseCmsCatalog} from '@/lib/cms';
import {visualCatalog} from '@/lib/cms-server';
import {randomUUID} from 'node:crypto';
import {redirect} from 'next/navigation';
import {requireUser} from '@/lib/server-auth';
import {getTemplate} from '@/lib/templates';
import {UUID} from '@/lib/domain';
import DraftEditor from '@/components/DraftEditor';
import EditorSchemaNotice from '@/components/editor/EditorSchemaNotice';
export const dynamic='force-dynamic';
export default async function NewDraft({searchParams}:{searchParams:Promise<{template?:string;draft?:string}>}){
 const params=await searchParams;
 let slug=typeof params.template==='string'&&getTemplate(params.template)?.category==='pernikahan'?params.template:'elegant-rose';
 const draftId=typeof params.draft==='string'&&UUID.test(params.draft)?params.draft:null;
 const next='/dashboard/baru?template='+slug+(draftId?'&draft='+draftId:'');
 const {db,user}=await requireUser(next);
 const {data:version,error:schemaError}=await db.rpc('ki_schema_version');
 if(schemaError||version!==7)return <main><EditorSchemaNotice/></main>;
 const {data:catalog,error:catalogError}=await db.rpc('ki_editor_catalog',{p_invitation:draftId});if(catalogError)throw new Error('EDITOR_CATALOG_UNAVAILABLE');const choices=visualCatalog(parseCmsCatalog(catalog,false));if(!choices.length)return <main className="container workspace"><h1>Belum ada tema pernikahan yang tersedia.</h1></main>;if(!choices.some(t=>t.slug===slug&&t.active))slug=choices[0].slug;
 // Identity is in the URL before the first edit. Reload/retry never chooses a new draft ID.
 if(!draftId)redirect('/dashboard/baru?template='+slug+'&draft='+randomUUID());
 const {data:existing,error}=await db.from('ki_invitations').select('id').eq('id',draftId).eq('owner_id',user.id).maybeSingle();
 if(error)throw new Error('DRAFT_LOOKUP_FAILED');
 if(existing)redirect('/dashboard/undangan/'+draftId);
 return <main><DraftEditor key={user.id+":"+draftId} id={draftId} ownerId={user.id} initial={null} initialTheme={slug} themeOptions={choices}/></main>;
}
