'use client';
import {useEffect, useRef, useState, useSyncExternalStore} from 'react';
import {EditorController} from '@/lib/editor-controller';
import {editableDocument, blankContentForTheme, sessionKey} from '@/lib/editor-document';
import {publicBackend} from '@/lib/config';
import {browserDb} from '@/lib/supabase/client';
import type {Invitation} from '@/lib/types';
export function useDraftEditor(id:string, owner:string, initial:Invitation|null, theme:string) {
  const [controller] = useState(() => new EditorController({id,owner,document:editableDocument(initial?.content||blankContentForTheme(theme),initial?.theme_slug||theme),revision:initial?.revision||0,updatedAt:initial?.updated_at,lastRequestId:initial?.last_request_id},{
    read:()=>window.sessionStorage.getItem(sessionKey(owner,id)),
    write:raw=>window.sessionStorage.setItem(sessionKey(owner,id),raw),
    remove:()=>window.sessionStorage.removeItem(sessionKey(owner,id)),uuid:()=>crypto.randomUUID(),
    send:async payload=>{
      const abort=new AbortController(), timer=setTimeout(()=>abort.abort(),18000);
      try {
        const response=await fetch('/api/drafts',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:abort.signal,cache:'no-store',redirect:'error'});
        const body:unknown=await response.json(); return {ok:response.ok,status:response.status,body};
      } finally {clearTimeout(timer);}
    },
  }));
  const state=useSyncExternalStore(controller.subscribe,controller.getSnapshot,controller.getSnapshot);
  const [autosave,setAutosave]=useState(true);
  const ref=useRef(state);ref.current=state;
  useEffect(()=>{
    controller.initialize();controller.setOnline(navigator.onLine);
    const on=()=>controller.setOnline(true), off=()=>controller.setOnline(false);
    window.addEventListener('online',on);window.addEventListener('offline',off);
    const authSubscription=publicBackend()?browserDb().auth.onAuthStateChange((event,session)=>{
      if(event==='SIGNED_OUT' || (session?.user && session.user.id!==owner)) controller.pauseForAccountChange();
    }):null;
    return ()=>{window.removeEventListener('online',on);window.removeEventListener('offline',off);authSubscription?.data.subscription.unsubscribe();};
  },[controller,owner]);
  useEffect(()=>{
    if(!autosave||state.phase!=='idle'||!state.online||!controller.isDirty()&&!state.pending) return;
    // Coalesce keystrokes, do not call the server for every character.
    const timer=setTimeout(()=>{void controller.save();},1500);
    return ()=>clearTimeout(timer);
  },[controller,state,autosave]);
  useEffect(()=>{
    const before=(event:BeforeUnloadEvent)=>{if(controller.isDirty()||ref.current.pending){event.preventDefault();event.returnValue='';}};
    const leave=(event:MouseEvent)=>{
      if(!(controller.isDirty()||ref.current.pending)||event.defaultPrevented)return;
      const link=(event.target as Element)?.closest?.('a[href]') as HTMLAnchorElement|null;
      if(!link||link.target==='_blank'||link.hasAttribute('download')||link.getAttribute('href')?.startsWith('#'))return;
      if(!window.confirm('Ada perubahan yang belum dikonfirmasi server. Tinggalkan editor?')){event.preventDefault();event.stopPropagation();}
    };
    window.addEventListener('beforeunload',before);document.addEventListener('click',leave,true);
    return()=>{window.removeEventListener('beforeunload',before);document.removeEventListener('click',leave,true);};
  },[controller]);
  return {controller,state,autosave,setAutosave,dirty:controller.isDirty()};
}
