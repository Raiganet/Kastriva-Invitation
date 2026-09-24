 'use client';
import {useEffect,useMemo,useSyncExternalStore} from 'react';
import {useRouter} from 'next/navigation';
import {sendCommerce,type CommerceEndpoint} from '@/lib/commerce-transport';
import {CommerceController} from '@/lib/commerce-controller';
export function useCommerceMutation(owner:string,key:string,endpoint:CommerceEndpoint,done?:(result:Record<string,unknown>)=>void){
 const router=useRouter();
 // Each account/entity/endpoint owns its controller; construction does not touch browser storage.
 const controller=useMemo(()=>new CommerceController({owner,key,endpoint,
  storage:{getItem:k=>sessionStorage.getItem(k),setItem:(k,v)=>sessionStorage.setItem(k,v),removeItem:k=>sessionStorage.removeItem(k)},
  send:sendCommerce,onConfirmed:result=>{router.refresh();done?.(result);},
 // The callback is scoped to this account/entity. A new inline callback must not reset an in-flight write.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }),[owner,key,endpoint,router]);
 const state=useSyncExternalStore(controller.subscribe,controller.getSnapshot,controller.getServerSnapshot);
 useEffect(()=>{
  controller.start();
  const leave=(event:BeforeUnloadEvent)=>{if(controller.getSnapshot().pending){event.preventDefault();event.returnValue='';}};
  window.addEventListener('beforeunload',leave);
  return()=>{controller.stop();window.removeEventListener('beforeunload',leave);};
 },[controller]);
 return {submit:(body:Record<string,unknown>)=>controller.submit(body),retry:controller.retry,...state,locked:state.busy||state.pending||!state.ready||state.blocked};
}
