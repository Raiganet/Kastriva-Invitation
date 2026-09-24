import {requireAdmin} from '@/lib/server-auth';
import {parseCmsState} from '@/lib/cms';
import CmsEditor from '@/components/cms/CmsEditor';
export const dynamic='force-dynamic';
export const metadata={title:'CMS website',robots:{index:false,follow:false}};
export default async function Cms(){const{db,user}=await requireAdmin();const{data,error}=await db.rpc('ki_cms_read');let state;try{if(error)throw error;state=parseCmsState(data);}catch{return <main className="container workspace"><h1>CMS belum dapat dimuat.</h1><p className="notice error">Periksa koneksi, akun admin terkonfirmasi, dan migrasi 006. Kegagalan tidak dianggap draft kosong.</p><a className="button ghost" href="/setup">Periksa koneksi</a></main>;}return <main className="container workspace"><CmsEditor initial={state} owner={user.id}/></main>;}
