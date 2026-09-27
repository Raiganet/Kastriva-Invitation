'use client';
import {useRef,useState} from 'react';

export default function CopyPaymentValue({label,value}:{label:string;value:string}) {
 const input=useRef<HTMLInputElement>(null);
 const [message,setMessage]=useState('');
 const [busy,setBusy]=useState(false);
 async function copy(){
  setBusy(true);setMessage('');
  try {await navigator.clipboard.writeText(value);setMessage(label+' berhasil disalin.');}
  catch {input.current?.focus();input.current?.select();setMessage('Salin otomatis tidak tersedia. Pilih teks lalu gunakan Salin atau Ctrl+C.');}
  finally {setBusy(false);}
 }
 return <div className="payment-copy no-print"><label>{label}<input ref={input} value={value} readOnly onFocus={e=>e.currentTarget.select()} spellCheck={false}/></label><button type="button" className="button ghost small" disabled={busy} onClick={()=>void copy()}>{busy?'Menyalin…':'Salin '+label.toLowerCase()}</button><p role="status" aria-live="polite">{message}</p></div>;
}
