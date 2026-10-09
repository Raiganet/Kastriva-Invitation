'use client';
import {useEffect,useState} from 'react';

type Photo={url:string;index:number;ready:boolean};

/** Keep the last decoded photo on screen while the next selection loads. */
export function useInvitationGallerySlide(url:string,index:number){
 const [slide,setSlide]=useState<{current:Photo;previous:Photo|null;serial:number}>(()=>({current:{url,index,ready:false},previous:null,serial:0}));
 const [loading,setLoading]=useState(true),[error,setError]=useState(false);
 useEffect(()=>{
  let disposed=false,settled=false;
  const image=new Image();image.referrerPolicy='no-referrer';
  setLoading(true);setError(false);
  const ready=async()=>{
   if(settled)return;settled=true;
   try{await image.decode();}catch{/* onload already confirms a usable image. */}
   if(disposed)return;
   setSlide(old=>old.current.url===url&&old.current.index===index
    ?{...old,current:{url,index,ready:true}}
    :{current:{url,index,ready:true},previous:old.current.ready?old.current:null,serial:old.serial+1});
   setLoading(false);
  };
  const failed=()=>{if(disposed||settled)return;settled=true;setLoading(false);setError(true);};
  image.onload=()=>void ready();image.onerror=failed;
  if(url){image.src=url;if(image.complete&&image.naturalWidth>0)void ready();}
  else failed();
  return()=>{disposed=true;image.onload=null;image.onerror=null;};
 },[url,index]);
 useEffect(()=>{
  if(!slide.serial)return;
  const timer=window.setTimeout(()=>setSlide(old=>({...old,previous:null})),750);
  return()=>window.clearTimeout(timer);
 },[slide.serial]);
 return {...slide,loading,error};
}
