import {createHmac} from 'node:crypto';
import {isIP} from 'node:net';
import {HttpError} from './http-errors.ts';
export type PublicScope='page'|'guest'|'respond'|'wishes'|'media';
export const PUBLIC_SCOPES:PublicScope[]=['page','guest','respond','wishes','media'];
export type RateResult={allowed:boolean;retry_after:number;remaining:number};
export type PublicRuntime={vercel:boolean;siteOrigin:string;hmacKey:string};
export function validHmacKey(value:string){return /^[0-9a-fA-F]{64}$/.test(value)&&new Set(value.toLowerCase()).size>=8;}
/** Vercel-only trusted header. On localhost all visitors share one development bucket. */
export function rateIdentity(headers:Headers,config:PublicRuntime,now=new Date()):string {
  if(!validHmacKey(config.hmacKey)||!Number.isFinite(now.valueOf()))throw new HttpError(503,'Perlindungan layanan publik belum dikonfigurasi.',30);
  let client:string;
  if(config.vercel){
    const raw=headers.get('x-vercel-forwarded-for')||'';
    // Never trust arbitrary x-forwarded-for, a bearer token, or a caller supplied ID.
    if(raw.length>64||raw.includes('%')||raw!==raw.trim()||!isIP(raw))throw new HttpError(503,'Alamat jaringan tepercaya tidak tersedia.',30);
    client=isIP(raw)===6?new URL('http://['+raw+']/').hostname.toLowerCase():raw;
  }else{
    let local=false;try{const u=new URL(config.siteOrigin);local=['localhost','127.0.0.1','[::1]'].includes(u.hostname)&&['http:','https:'].includes(u.protocol);}catch{}
    if(!local)throw new HttpError(503,'Layanan publik memerlukan Vercel atau pengujian localhost.',30);
    client='local-shared-test-bucket';
  }
  // Daily pseudonym; the raw IP never enters SQL/logs. This is NOT anonymous data or encryption.
  return createHmac('sha256',Buffer.from(config.hmacKey,'hex')).update('ki-public-v1|'+now.toISOString().slice(0,10)+'|'+client).digest('hex');
}
export function parseRateResult(value:unknown):RateResult {
  const x=value as Record<string,unknown>|null;
  if(!x||typeof x!=='object'||Array.isArray(x)||typeof x.allowed!=='boolean'||!Number.isInteger(x.retry_after)||!Number.isInteger(x.remaining)||Number(x.remaining)<0||Number(x.remaining)>600||Number(x.retry_after)<0||Number(x.retry_after)>60||(x.allowed?x.retry_after!==0:(x.retry_after===0||x.remaining!==0)))throw new HttpError(503,'Pembatasan layanan belum dapat diverifikasi.',30);
  return {allowed:x.allowed,retry_after:Number(x.retry_after),remaining:Number(x.remaining)};
}
export async function takePublicLimit(scope:PublicScope,identity:string,rpc:(scope:PublicScope,identity:string)=>Promise<unknown>,timeoutMs=8000):Promise<RateResult> {
  if(!PUBLIC_SCOPES.includes(scope)||!/^[a-f0-9]{64}$/.test(identity))throw new HttpError(503,'Pembatasan layanan belum valid.',30);
  let timer:ReturnType<typeof setTimeout>|undefined;
  try{
    const raw=await Promise.race([rpc(scope,identity),new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(new HttpError(503,'Pembatasan layanan belum merespons.',30)),timeoutMs);})]);
    const result=parseRateResult(raw);if(!result.allowed)throw new HttpError(429,'Terlalu banyak permintaan dari jaringan ini. Tunggu lalu coba kembali.',result.retry_after);
    return result;
  }catch(error){if(error instanceof HttpError)throw error;throw new HttpError(503,'Perlindungan layanan belum tersedia. Coba kembali.',30);}
  finally{if(timer)clearTimeout(timer);}
}
