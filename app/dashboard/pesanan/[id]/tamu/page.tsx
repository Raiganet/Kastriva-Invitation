import {notFound} from 'next/navigation';
import Link from 'next/link';
import {requireUser} from '@/lib/server-auth';
import {parseWorkspace,uuid} from '@/lib/guests';
import {siteUrl} from '@/lib/config';
import {rsvpAppEnabled} from '@/lib/guest-server';
import {publishingAppEnabled} from '@/lib/commerce-server';
import GuestManager from '@/components/guests/GuestManager';
export const dynamic='force-dynamic';
export const metadata={title:'Tamu & RSVP',robots:{index:false,follow:false},referrer:'no-referrer' as const};
export default async function GuestBook({params}:{params:Promise<{id:string}>}){
 let id:string;try{id=uuid((await params).id);}catch{notFound();}
 const {db,user}=await requireUser(`/dashboard/pesanan/${id}/tamu`);
 const {data,error}=await db.rpc('ki_guest_workspace',{p_sale:id,p_query:'',p_filter:'all',p_offset:0});
 if(error?.code==='42501')notFound();
 if(error||!data)return <main className="container workspace"><h1>Daftar tamu belum dimuat.</h1><p className="notice error">Periksa koneksi dan migrasi SQL 005. Kegagalan ini bukan berarti data tamu kosong.</p><Link className="button" href="/setup">Periksa Supabase</Link></main>;
 const initial=parseWorkspace(data);if(initial.sale_id!==id)throw new Error('WORKSPACE_MISMATCH');
 return <GuestManager owner={user.id} initial={initial} origin={siteUrl()} appEnabled={rsvpAppEnabled()&&publishingAppEnabled()}/>;
}
