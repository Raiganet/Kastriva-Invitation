import {publicGateway} from '@/lib/public-gateway';
import {HttpError} from '@/lib/http-errors';
import {renderPublicPhoto} from '@/lib/render-public-photo';
import {ValidationError} from '@/lib/domain';
import {parseSlug,publicPhotoIndex} from '@/lib/commerce';
import {publishingAppEnabled} from '@/lib/commerce-server';
import {MAX_PUBLIC_PHOTO_BYTES,photoMagic,validPrivatePhotoPath} from '@/lib/public-media';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store, max-age=0','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Robots-Tag':'noindex, nofollow, noarchive','Content-Security-Policy':"default-src 'none'; sandbox"};
export async function GET(request:Request,{params}:{params:Promise<{slug:string;index:string}>}){try{
 if(!publishingAppEnabled())return new Response(null,{status:404,headers});
 const p=await params,slug=parseSlug(p.slug),index=publicPhotoIndex(p.index),raw=new URL(request.url).searchParams.get('v')||'';
 if(!/^[1-9]\d{0,8}$/.test(raw))return new Response(null,{status:404,headers});
 const db=await publicGateway(request.headers,'media');
 const {data:path,error}=await db.rpc('ki_public_photo',{p_slug:slug,p_index:index,p_revision:Number(raw)});
 if(error)return new Response(null,{status:503,headers});
 if(!validPrivatePhotoPath(path))return new Response(null,{status:404,headers});
 const {data:blob,error:downloadError}=await db.storage.from('ki-media').download(path);
 if(downloadError||!blob)return new Response(null,{status:503,headers});
 if(blob.size>MAX_PUBLIC_PHOTO_BYTES)return new Response(null,{status:415,headers});
 const bytes=new Uint8Array(await blob.arrayBuffer());if(!photoMagic(bytes))return new Response(null,{status:415,headers});
 // Decode, cap pixels/frames, remove metadata, re-encode. Never serve user HTML/SVG or proxy arbitrary URLs.
 let image:Uint8Array;try{image=await renderPublicPhoto(bytes);}catch{return new Response(null,{status:415,headers});}
 // Recheck after I/O so a revoked/unpublished photo is not served from an in-flight render.
 const {data:stillAllowed,error:againError}=await db.rpc('ki_public_photo',{p_slug:slug,p_index:index,p_revision:Number(raw)});
 if(againError||stillAllowed!==path)return new Response(null,{status:404,headers});
 return new Response(new Uint8Array(image),{headers:{...headers,'Content-Type':'image/webp','Content-Length':String(image.length),'Content-Disposition':'inline; filename="undangan.webp"'}});
 }catch(error){return new Response(null,{status:error instanceof HttpError?error.status:error instanceof ValidationError?404:503,headers:{...headers,...(error instanceof HttpError&&error.retryAfter?{'Retry-After':String(error.retryAfter)}:{})}});}}
