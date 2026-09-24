import {apiUser,readBody,failure} from '@/lib/http';
import {record,exact,uuid,parseGuestRow,guestCsv,MAX_GUESTS} from '@/lib/guests';
import {guestFailure} from '@/lib/guest-server';
export async function POST(request:Request){try{
 const {db}=await apiUser(request);const x=record(await readBody(request));exact(x,['sale_id']);
 const {data,error}=await db.rpc('ki_guest_export',{p_sale:uuid(x.sale_id)});if(error)guestFailure(error);
 if(!Array.isArray(data)||data.length>MAX_GUESTS)throw new Error('EXPORT_RESPONSE_INVALID');
 const csv=guestCsv(data.map(parseGuestRow));return new Response(csv,{headers:{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="tamu-kastriva.csv"','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
}catch(e){return failure(e);}}
