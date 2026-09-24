'use client';
import {useEffect,useRef,useState} from 'react';
import {GuestTransportError} from '@/lib/guest-transport';
/** Journal-before-send, single in-flight operation, explicit same-payload retry. */
export function useRetainedRequest<T,R>({storageKey,decode,encode,send,onSuccess}:{storageKey:string;decode:(raw:string)=>T;encode:(body:T)=>string;send:(body:T)=>Promise<R>;onSuccess:(result:R)=>void}){
 const pendingRef=useRef<T|null>(null),flight=useRef(false),epoch=useRef(0);
 const [body,setBody]=useState<T|null>(null),[busy,setBusy]=useState(false),[ready,setReady]=useState(false),[blocked,setBlocked]=useState(false),[message,setMessage]=useState(''),[success,setSuccess]=useState(false);
 useEffect(()=>{
  ++epoch.current;pendingRef.current=null;flight.current=false;setBody(null);setReady(false);setBusy(false);setBlocked(false);setMessage('');setSuccess(false);
  try{const raw=sessionStorage.getItem(storageKey);if(raw){const p=decode(raw);pendingRef.current=p;setBody(p);setMessage('Ada permintaan yang belum dipastikan pada tab ini. Coba ulang memakai isi yang sama.');}}
  catch{setBlocked(true);setMessage('Catatan sesi tidak dapat dibaca. Tidak ada permintaan dikirim. Periksa penyimpanan browser dan status server.');}
  setReady(true);
  const leave=(e:BeforeUnloadEvent)=>{if(pendingRef.current){e.preventDefault();e.returnValue='';}};window.addEventListener('beforeunload',leave);
  return()=>{++epoch.current;window.removeEventListener('beforeunload',leave);};
  // The key contains the account/entity. Codec changes never replay pending operations.
  // eslint-disable-next-line react-hooks/exhaustive-deps
 },[storageKey]);
 function clear(){try{sessionStorage.removeItem(storageKey);pendingRef.current=null;setBody(null);return true;}catch{setBlocked(true);return false;}}
 async function transmit(p:T){
  if(flight.current||blocked)return;const current=epoch.current;flight.current=true;setBusy(true);setSuccess(false);
  try{const result=await send(p);if(current!==epoch.current)return;const removed=clear();setSuccess(true);setMessage(removed?'Perubahan dikonfirmasi server.':'Server mengonfirmasi, tetapi catatan sesi tidak dapat dibersihkan. Periksa penyimpanan sebelum tindakan baru.');
   try{onSuccess(result);}catch{setMessage('Server mengonfirmasi. Tampilan terbaru belum termuat; muat ulang untuk memeriksa.');}
  }catch(e){if(current!==epoch.current)return;const error=e instanceof GuestTransportError?e:new GuestTransportError('Hasil permintaan belum dapat dipastikan.',true);if(!error.uncertain)clear();setMessage(error.message);}
  finally{if(current===epoch.current){flight.current=false;setBusy(false);}}
 }
 async function submit(p:T){if(!ready||blocked||flight.current||pendingRef.current)return;
  try{const raw=encode(p);decode(raw);sessionStorage.setItem(storageKey,raw);pendingRef.current=p;setBody(p);}
  catch{setBlocked(true);setMessage('Penyimpanan sesi diblokir/penuh atau data tidak valid. Tidak ada permintaan dikirim.');return;}
  await transmit(p);
 }
 return {submit,retry:()=>pendingRef.current?transmit(pendingRef.current):Promise.resolve(),body,busy,ready,message,success,blocked,locked:!ready||busy||blocked||body!==null};
}
