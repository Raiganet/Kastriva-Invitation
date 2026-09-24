import {UUID} from './domain.ts';
import {SALE_STATES} from './commerce.ts';
export const COMMERCE_ENDPOINTS=['/api/commerce/checkout','/api/commerce/action','/api/commerce/publication','/api/admin/commerce'] as const;
export type CommerceEndpoint=typeof COMMERCE_ENDPOINTS[number];
export type PendingCommerce={version:1;owner:string;key:string;endpoint:CommerceEndpoint;body:Record<string,unknown>};
export function decodePending(raw:string,owner:string,key:string,endpoint:CommerceEndpoint):PendingCommerce{
 if(raw.length>16384||!UUID.test(owner)||!COMMERCE_ENDPOINTS.includes(endpoint))throw new Error('Catatan permintaan tidak valid.');
 const x=JSON.parse(raw) as PendingCommerce;
 if(!x||typeof x!=='object'||Array.isArray(x)||Object.keys(x).length!==5||x.version!==1||x.owner!==owner||x.key!==key||x.endpoint!==endpoint||!x.body||Array.isArray(x.body)||typeof x.body!=='object')throw new Error('Catatan percobaan ulang tidak sesuai akun/halaman.');
 return x;
}
export function validResult(p:PendingCommerce,result:unknown):boolean{if(!result||typeof result!=='object'||Array.isArray(result))return false;const x=result as Record<string,unknown>;if(!Number.isInteger(x.revision)||Number(x.revision)<1)return false;
 if(p.endpoint==='/api/admin/commerce')return x.revision===Number(p.body.revision)+1;
 if(p.endpoint==='/api/commerce/publication')return x.sale_id===p.body.sale_id&&x.slug===p.body.slug&&x.revision===Number(p.body.publication_revision)+1&&x.active===(p.body.action==='publish');
 return typeof x.id==='string'&&UUID.test(x.id)&&(p.endpoint==='/api/commerce/checkout'||x.id===p.body.sale_id)&&SALE_STATES.includes(x.status as typeof SALE_STATES[number])&&(p.endpoint==='/api/commerce/checkout'||x.status===({submit_payment:'awaiting_review',approve:'paid',reject:'rejected',cancel:'cancelled',revoke:'revoked'} as Record<string,string>)[String(p.body.action)])&&(p.endpoint==='/api/commerce/checkout'||x.revision===Number(p.body.revision)+1);
}
export type MutationOutcome={state:'confirmed'|'rejected'|'uncertain';message:string;result?:Record<string,unknown>};
/** One deadline covers fetch AND the actual response body. Unknown outcomes retain the
 * original operation; never follow an HTTP redirect with a payment/publication payload.
 */
export async function sendCommerce(p:PendingCommerce,fetcher:typeof fetch=fetch,timeoutMs=20000):Promise<MutationOutcome>{
 const uncertain:MutationOutcome={state:'uncertain',message:'Koneksi atau balasan belum dapat dipastikan. Jangan mengirim pembayaran ulang. Gunakan Coba ulang permintaan yang sama.'};
 // Runtime guard also protects a corrupted session journal. Invalid endpoints never receive data.
 if(!COMMERCE_ENDPOINTS.includes(p.endpoint)||!Number.isInteger(timeoutMs)||timeoutMs<1||timeoutMs>60000)return uncertain;
 const controller=new AbortController();let reader:ReadableStreamDefaultReader<Uint8Array>|undefined,finished=false;
 let rejectTimeout:(error:Error)=>void=()=>{};
 const interrupted=new Promise<never>((_,reject)=>{rejectTimeout=reject;});
 const timer=setTimeout(()=>{finished=true;rejectTimeout(new Error('COMMERCE_TIMEOUT'));controller.abort();if(reader)void reader.cancel().catch(()=>{});},timeoutMs);
 try{return await Promise.race([interrupted,(async():Promise<MutationOutcome>=>{
  const response=await fetcher(p.endpoint,{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(p.body),cache:'no-store',redirect:'error',signal:controller.signal});
  if(finished){void response.body?.cancel().catch(()=>{});throw new Error('EXPIRED');}
  if(response.redirected||response.status>=300&&response.status<400||response.headers.get('content-type')?.split(';')[0].trim().toLowerCase()!=='application/json'||!response.body){void response.body?.cancel().catch(()=>{});throw new Error('BAD_RESPONSE');}
  const declared=response.headers.get('content-length');
  if(declared!==null&&(!/^\d+$/.test(declared)||!Number.isSafeInteger(Number(declared))||Number(declared)>16384)){void response.body.cancel().catch(()=>{});throw new Error('OVERSIZED_RESPONSE');}
  reader=response.body.getReader();const chunks:Uint8Array[]=[];let size=0;
  while(true){const {value,done}=await reader.read();if(finished)throw new Error('EXPIRED');if(done)break;if(value.byteLength>16384-size)throw new Error('OVERSIZED_RESPONSE');size+=value.byteLength;chunks.push(value);}
  const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
  const data:unknown=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
  if(!data||typeof data!=='object'||Array.isArray(data))return uncertain;
  const x=data as {ok?:unknown;result?:unknown;error?:unknown};
  if(response.ok&&x.ok===true&&validResult(p,x.result))return {state:'confirmed',message:'Perubahan dikonfirmasi server.',result:x.result as Record<string,unknown>};
  if(response.status>=400&&response.status<500&&![408,429].includes(response.status)&&typeof x.error==='string')return {state:'rejected',message:x.error.slice(0,500)};
  return {state:'uncertain',message:typeof x.error==='string'?x.error.slice(0,500):uncertain.message};
 })()]);}catch{return uncertain;}
 finally{clearTimeout(timer);finished=true;controller.abort();if(reader){void reader.cancel().catch(()=>{});try{reader.releaseLock();}catch{/* Pending read/cancel. */}}}
}
