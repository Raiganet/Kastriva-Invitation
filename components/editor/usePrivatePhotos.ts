'use client';
import {useEffect,useState} from 'react';
import {browserDb} from '@/lib/supabase/client';
/** Ephemeral URLs are kept in memory, never in the draft or browser journal. */
export function usePrivatePhotos(paths:string[]) {
  const [urls,setUrls]=useState<Record<string,string>>({}),[error,setError]=useState(''),[refresh,setRefresh]=useState(0);
  const key=paths.join('|');
  useEffect(()=>{
    let active=true;
    async function load(){
      if(!key){setUrls({});setError('');return;}
      try{
        const db=browserDb();const names=key.split('|');
        const results=await Promise.all(names.map(async path=>{
          const {data,error}=await db.storage.from('ki-media').createSignedUrl(path,3600);
          return {path,url:!error?data?.signedUrl:undefined};
        }));
        if(!active)return;
        setUrls(Object.fromEntries(results.filter(r=>r.url).map(r=>[r.path,r.url!])));
        setError(results.some(r=>!r.url)?'Sebagian foto belum dapat dimuat. Foto tidak dilepas dari draft. Periksa koneksi atau muat ulang foto.':'');
      }catch{if(active)setError('Foto privat belum berhasil dimuat. Referensinya tetap tersimpan.');}
    }
    void load();
    const timer=setInterval(()=>{void load();},45*60*1000);
    const focus=()=>{void load();};window.addEventListener('focus',focus);
    return()=>{active=false;clearInterval(timer);window.removeEventListener('focus',focus);};
  },[key,refresh]);
  return {urls,error,reload:()=>setRefresh(value=>value+1)};
}
