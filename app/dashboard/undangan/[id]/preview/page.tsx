import {notFound} from 'next/navigation';
import {requireUser} from '@/lib/server-auth';
import {UUID,parseDraft} from '@/lib/domain';
import {getTemplate} from '@/lib/templates';
import DraftPreview from '@/components/editor/DraftPreview';
export const dynamic='force-dynamic';
export const metadata={title:'Preview Draft Privat',robots:{index:false,follow:false}};
export default async function Preview({params}:{params:Promise<{id:string}>}){const{id}=await params;if(!UUID.test(id))notFound();const{db,user}=await requireUser('/dashboard/undangan/'+id+'/preview');const{data,error}=await db.from('ki_invitations').select('*').eq('id',id).eq('owner_id',user.id).maybeSingle();if(error)throw new Error('PREVIEW_LOAD_FAILED');if(!data)notFound();const template=getTemplate(data.theme_slug);if(!template)notFound();const content=parseDraft(data.content,user.id);return <DraftPreview id={id} revision={data.revision} template={template} content={content}/>;}
