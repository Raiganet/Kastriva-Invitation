'use client';
import {useEffect,useState} from 'react';
import {publicBackend} from '@/lib/config';
import {browserDb} from '@/lib/supabase/client';
import {accountNavigation,type AccountNavState} from '@/lib/account-navigation';
export function useAccountNavigation(visible:boolean){
 const [state,setState]=useState<AccountNavState>(()=>publicBackend()?'unknown':'guest');
 useEffect(()=>{if(!visible)return;if(!publicBackend()){setState('guest');return;}
  let alive=true,generation=0;const db=browserDb();
  // Session events only affect a navigation label. Every protected page/RPC still verifies identity.
  const {data:{subscription}}=db.auth.onAuthStateChange((_event,session)=>{++generation;if(alive)setState(session?.user?'signed-in':'guest');});
  const current=generation;
  void db.auth.getUser().then(({data,error})=>{if(!alive||generation!==current)return;if(!error&&data.user)setState('signed-in');else if(error?.status===401||error?.name==='AuthSessionMissingError'||(!error&&!data.user))setState('guest');else setState('unknown');}).catch(()=>{if(alive&&generation===current)setState('unknown');});
  return()=>{alive=false;++generation;subscription.unsubscribe();};
 },[visible]);
 return accountNavigation(state);
}
