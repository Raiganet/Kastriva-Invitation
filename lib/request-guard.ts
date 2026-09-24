import {HttpError} from './http-errors.ts';
/** Canonical configured origin only; request.url/Host/forwarded-host never grant write access. */
export function assertWriteOrigin(headers: Headers, configuredOrigin: string) {
  let canonical:string;
  try { const u=new URL(configuredOrigin); if(!['http:','https:'].includes(u.protocol)||u.username||u.password||u.pathname!=='/'||u.search||u.hash)throw new Error(); canonical=u.origin; }
  catch { throw new HttpError(503,'Origin aplikasi belum dikonfigurasi dengan benar.'); }
  if(headers.get('origin')!==canonical || headers.get('sec-fetch-site')==='cross-site')
    throw new HttpError(403,'Permintaan lintas situs ditolak.');
}
/** Real streamed byte limit + deadline, including a producer that ignores cancellation. */
export async function readBoundedJson(request:Request, options:{limit?:number;timeoutMs?:number}={}) {
  const limit=options.limit??32768,timeoutMs=options.timeoutMs??8000;
  if(!Number.isInteger(limit)||limit<1||limit>131072||!Number.isFinite(timeoutMs)||timeoutMs<1)throw new Error('INVALID_BODY_POLICY');
  if(!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type')||''))throw new HttpError(415,'Gunakan format JSON.');
  const declared=request.headers.get('content-length');
  if(declared!==null && (!/^\d+$/.test(declared)||!Number.isSafeInteger(Number(declared))))throw new HttpError(400,'Ukuran permintaan tidak valid.');
  if(declared!==null&&Number(declared)>limit)throw new HttpError(413,'Data terlalu besar.');
  if(!request.body)throw new HttpError(400,'Data kosong.');
  const reader=request.body.getReader();let timer:ReturnType<typeof setTimeout>|undefined;
  const cancel=()=>{void reader.cancel().catch(()=>{});};
  try {
    return await Promise.race([
      (async()=>{const parts:Uint8Array[]=[];let size=0;
        while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>limit)throw new HttpError(413,'Data terlalu besar.');parts.push(value);}
        const bytes=new Uint8Array(size);let offset=0;for(const part of parts){bytes.set(part,offset);offset+=part.byteLength;}
        try{return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes)) as unknown;}
        catch{throw new HttpError(400,'JSON atau UTF-8 tidak valid.');}
      })(),
      new Promise<never>((_,reject)=>{timer=setTimeout(()=>{reject(new HttpError(408,'Pengiriman data terlalu lama. Coba kembali.'));cancel();},timeoutMs);}),
    ]);
  } finally {if(timer)clearTimeout(timer);cancel();}
}
