import {notFound} from 'next/navigation';
import DraftEditor from '@/components/DraftEditor';
import {publicBackend} from '@/lib/config';
import {getTemplate} from '@/lib/templates';
export const dynamic='force-dynamic';
export const metadata={title:'Fixture editor lokal',robots:{index:false,follow:false}};
export default async function EditorFixture({searchParams}:{searchParams:Promise<{theme?:string}>}){
 if(process.env.KI_E2E_DEMO!=='true'||process.env.VERCEL==='1'||process.env.NEXT_PUBLIC_SITE_URL!=='http://127.0.0.1:3000'||publicBackend())notFound();
 const {theme}=await searchParams, template=getTemplate(theme||'sweet-birthday');
 if(!template)notFound();
 return <main><DraftEditor id="11111111-1111-4111-8111-111111111111" ownerId="22222222-2222-4222-8222-222222222222" initial={null} initialTheme={template.slug}/></main>;
}
