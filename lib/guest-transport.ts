/** JSON transport shared by owner and guest forms; never logs tokens or payloads. */
export class GuestTransportError extends Error {
 uncertain:boolean;status:number;
 constructor(message:string,uncertain:boolean,status=0){super(message);this.name='GuestTransportError';this.uncertain=uncertain;this.status=status;}
}
export async function guestRequest<T>(endpoint:string,body:unknown,parse:(value:unknown)=>T,fetcher:typeof fetch=fetch):Promise<T>{
 if(!/^\/api\/(?:guestbook\/(?:manage|workspace|link)|open-wishes\/(?:manage|workspace)|public\/[a-z0-9-]+\/(?:guest|respond|wishes|open-wishes(?:\/(?:submit|withdraw))?)|admin\/(?:guestbook|cms|open-wishes))$/.test(endpoint))throw new GuestTransportError('Endpoint tidak dikenal.',false);
 try{
  const res=await fetcher(endpoint,{method:'POST',credentials:'same-origin',redirect:'error',cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(15000)});
  if(!/^application\/json(?:\s*;|$)/i.test(res.headers.get('content-type')||''))throw new GuestTransportError('Balasan tidak dikenali. Status simpan belum pasti.',true,res.status);
  const reader=res.body?.getReader();if(!reader)throw new GuestTransportError('Balasan kosong. Status simpan belum pasti.',true,res.status);
  let size=0;const chunks:Uint8Array[]=[];
  while(true){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>1024*1024){await reader.cancel();throw new GuestTransportError('Balasan terlalu besar.',true,res.status);}chunks.push(value);}
  const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
  let x:unknown;try{x=JSON.parse(new TextDecoder().decode(bytes));}catch{throw new GuestTransportError('Balasan belum dapat dibaca. Status simpan belum pasti.',true,res.status);}
  const v=x as {ok?:unknown;error?:unknown;result?:unknown}|null;
  if(!res.ok){const message=typeof v?.error==='string'&&v.error.length<=500?v.error:'Permintaan ditolak atau belum dapat diproses.';throw new GuestTransportError(message,res.status>=500||res.status===408,res.status);}
  if(v?.ok!==true||!Object.hasOwn(v,'result'))throw new GuestTransportError('Balasan belum dapat diverifikasi.',true,res.status);
  try{return parse(v.result);}catch{throw new GuestTransportError('Isi balasan tidak cocok. Periksa status sebelum mencoba lagi.',true,res.status);}
 }catch(e){if(e instanceof GuestTransportError)throw e;throw new GuestTransportError('Koneksi terputus atau melewati batas waktu. Hasil simpan belum pasti; coba ulang permintaan yang sama.',true);}
}
