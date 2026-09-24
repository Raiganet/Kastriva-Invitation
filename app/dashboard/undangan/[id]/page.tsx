import {parseCmsCatalog} from '@/lib/cms';
import {visualCatalog} from '@/lib/cms-server';
import Link from 'next/link';
import {notFound} from 'next/navigation';
import {requireUser} from '@/lib/server-auth';
import {UUID,parseDraft} from '@/lib/domain';
import type {Invitation} from '@/lib/types';
import DraftEditor from '@/components/DraftEditor';
import EditorSchemaNotice from '@/components/editor/EditorSchemaNotice';
import OrderRequest from '@/components/OrderRequest';
export const dynamic='force-dynamic';
export default async function Edit({params}:{params:Promise<{id:string}>}){const{id}=await params;if(!UUID.test(id))notFound();const{db,user}=await requireUser('/dashboard/undangan/'+id);const{data,error}=await db.from('ki_invitations').select('*').eq('id',id).eq('owner_id',user.id).maybeSingle();if(error)throw new Error('DRAFT_LOAD_FAILED');if(!data)notFound();const{data:settings}=await db.from('ki_settings').select('accept_order_requests').eq('id',1).maybeSingle();const {data:version,error:schemaError}=await db.rpc('ki_schema_version');if(schemaError||version!==7)return <main><EditorSchemaNotice/></main>;const {data:catalog,error:catalogError}=await db.rpc('ki_editor_catalog',{p_invitation:id});if(catalogError)throw new Error('EDITOR_CATALOG_UNAVAILABLE');const choices=visualCatalog(parseCmsCatalog(catalog,false));const inv={...data,content:parseDraft(data.content,user.id)} as Invitation;return <main><DraftEditor key={user.id+":"+id} id={id} ownerId={user.id} initial={inv} initialTheme={inv.theme_slug} themeOptions={choices}/><section className="container section compact"><div className="panel"><h2>Pesanan & publikasi</h2><p>Simpan perubahan sampai status tersimpan, lalu periksa ringkasan. Editor tidak menerbitkan undangan otomatis.</p><Link className="button" href={`/dashboard/undangan/${id}/pesan`}>Pesan & terbitkan →</Link></div><details><summary>Permintaan bantuan pengerjaan (alur lama, bukan tagihan)</summary><OrderRequest invitationId={id} enabled={process.env.ENABLE_ORDER_REQUESTS==='true'&&settings?.accept_order_requests===true}/></details></section></main>;}
