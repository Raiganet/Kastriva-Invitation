'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ORDER_STATUSES, STATUS_LABEL } from '@/lib/domain';
export default function OrderStatus({id,status}:{id:string;status:string}) {
 const [selected,setSelected]=useState(status),[busy,setBusy]=useState(false),[error,setError]=useState('');const router=useRouter();
 return <form className="status-form" onSubmit={async e=>{e.preventDefault();setBusy(true);setError('');try{const r=await fetch('/api/admin/orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,status:selected})});const result=await r.json();if(!r.ok)throw new Error(result.error);router.refresh();}catch(err){setError(err instanceof Error?err.message:'Status belum diubah.');}finally{setBusy(false);}}}><select aria-label="Status permintaan" value={selected} disabled={busy} onChange={e=>setSelected(e.target.value)}>{ORDER_STATUSES.map(s=><option key={s} value={s}>{STATUS_LABEL[s]}</option>)}</select><button className="button small" disabled={busy}>{busy?'…':'Simpan'}</button>{error&&<span role="alert">{error}</span>}</form>;
}
