import {notFound} from 'next/navigation';
import Link from 'next/link';
import {requireUser} from '@/lib/server-auth';
import {uuid} from '@/lib/guests';
import {parseWishWorkspace} from '@/lib/open-wishes';
import {publicWishesAppEnabled} from '@/lib/open-wish-server';
import {publishingAppEnabled} from '@/lib/commerce-server';
import OpenWishManager from '@/components/wishes/OpenWishManager';
export const dynamic='force-dynamic';export const metadata={title:'Ucapan & doa umum',robots:{index:false,follow:false},referrer:'no-referrer' as const};
export default async function Wishes({params}:{params:Promise<{id:string}>}){
 let id:string;try{id=uuid((await params).id);}catch{notFound();}
 const {db,user}=await requireUser(`/dashboard/pesanan/${id}/ucapan`);
 const {data,error}=await db.rpc('ki_open_wish_workspace',{p_sale:id,p_filter:'all',p_offset:0});
 if(error?.code==='42501')notFound();
 if(error||!data)return <main className="container workspace"><h1>Ucapan belum dapat dimuat.</h1><p className="notice error">Periksa koneksi dan migrasi 013_public_wishes.sql. Data tidak dianggap kosong.</p><Link className="button" href="/setup">Periksa Supabase</Link></main>;
 const initial=parseWishWorkspace(data);if(initial.sale_id!==id)throw new Error('WISH_WORKSPACE_MISMATCH');
 return <OpenWishManager key={user.id+id} owner={user.id} initial={initial} appEnabled={publicWishesAppEnabled()&&publishingAppEnabled()}/>;
}
