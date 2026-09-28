'use client';
import Link from 'next/link';
import {useEffect,useRef,useState} from 'react';
import {guestRequest} from '@/lib/guest-transport';
import {useRetainedRequest} from '@/components/guests/useRetainedRequest';
import {parseVisitorCommand,parseVisitorAck,decodeVisitorPending,parseOpenWishFeed,receiptCode,parseReceipt,type WishVisitorCommand,type WishVisitorAck,type OpenWishFeed} from '@/lib/open-wishes';
export function OpenWishFields({name,message,consent,setName,setMessage,setConsent}:{name:string;message:string;consent:boolean;setName:(v:string)=>void;setMessage:(v:string)=>void;setConsent:(v:boolean)=>void}){
 return <><label>Nama Anda<input name="wishName" autoComplete="name" required maxLength={80} value={name} onChange={e=>setName(e.target.value)} placeholder="Nama atau nama keluarga"/></label>
 <label>Ucapan & doa<textarea name="wishMessage" required maxLength={500} rows={4} value={message} onChange={e=>setMessage(e.target.value)} placeholder="Selamat menempuh hidup baru. Semoga selalu berbahagia…"/><small>{message.length}/500 karakter</small></label>
 <label className="guest-checkbox"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/><span>Saya mengizinkan nama dan ucapan ini ditampilkan otomatis pada halaman undangan.</span></label>
 <p className="field-help">Jika izin penayangan tidak dicentang, pesan hanya dibaca pemilik undangan. Formulir ini tidak mengisi RSVP atau jumlah kehadiran.</p></>;
}
function randomReceipt(){return Array.from(crypto.getRandomValues(new Uint8Array(32)),n=>n.toString(16).padStart(2,'0')).join('');}
function downloadCode(code:string){const url=URL.createObjectURL(new Blob([code+'\n'],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='kode-hapus-ucapan.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
async function copyCode(code:string){if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(code);return;}const ta=document.createElement('textarea');ta.value=code;ta.setAttribute('readonly','');ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();document.execCommand('copy');document.body.removeChild(ta);}
export default function PublicOpenWishes({slug,id}:{slug:string;id?:string}){
 const [feed,setFeed]=useState<OpenWishFeed|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState('');
 const [name,setName]=useState(''),[message,setMessage]=useState(''),[consent,setConsent]=useState(false),[receipt,setReceipt]=useState(''),[receiptWarning,setReceiptWarning]=useState(''),[showReceipt,setShowReceipt]=useState(false),[copyState,setCopyState]=useState('');
 const version=useRef(0),flight=useRef(false),lastCommand=useRef<WishVisitorCommand|null>(null);
 const receiptKey='ki:open-wish-receipt:v1:'+slug;
 async function load(before:string|null=null){if(flight.current)return;flight.current=true;const v=version.current;setLoading(true);setError('');
  try{const result=await guestRequest(`/api/public/${slug}/open-wishes`,{before},parseOpenWishFeed);if(v!==version.current)return;
   setFeed(old=>before&&old&&result.showing?{...result,items:[...old.items,...result.items.filter(i=>!old.items.some(o=>o.id===i.id))]}:result);
  }catch(e){if(v===version.current){setFeed(null);setError(e instanceof Error?e.message:'Ucapan belum dapat dimuat.');}}
  finally{if(v===version.current){flight.current=false;setLoading(false);}}
 }
 const mutation=useRetainedRequest<WishVisitorCommand,WishVisitorAck>({storageKey:'ki:open-wish-send:v1:'+slug,
  decode:raw=>decodeVisitorPending(raw,slug),encode:body=>JSON.stringify({version:1,body}),
  send:body=>guestRequest(`/api/public/${slug}/open-wishes/${body.action}`,body,v=>parseVisitorAck(v,body)),
  onSuccess:()=>{const command=lastCommand.current;if(command){const code=receiptCode(command);setReceipt(code);setShowReceipt(false);setCopyState('');try{sessionStorage.setItem(receiptKey,code);}catch{setReceiptWarning('Kode belum tersimpan pada tab. Unduh kode penghapusan di bawah sebelum menutup halaman.');}}
   setName('');setMessage('');setConsent(false);setError('');void load();}
 });
 useEffect(()=>{++version.current;flight.current=false;setFeed(null);void load();try{const saved=sessionStorage.getItem(receiptKey);if(saved&&parseReceipt(saved).slug===slug)setReceipt(saved);}catch{}
  setShowReceipt(false);setCopyState('');
  return()=>{++version.current;};},[slug]);
 useEffect(()=>{if(mutation.body){lastCommand.current=mutation.body;if(mutation.body.action==='submit'){setName(mutation.body.name);setMessage(mutation.body.message);setConsent(mutation.body.consent);}}},[mutation.body]);
 async function submit(){setError('');try{const command=parseVisitorCommand({action:'submit',slug,id:crypto.randomUUID(),receipt:randomReceipt(),name,message,consent});lastCommand.current=command;await mutation.submit(command);}catch(e){setError(e instanceof Error?e.message:'Periksa isian.');}}
 return <section id={id} tabIndex={id?-1:undefined} data-inv-section className="inv-section alternate general-wishes"><p className="overline">WARM WORDS, LASTING MEMORIES</p><h2>Ucapan & doa</h2><p>Titipkan doa dan harapan baik Anda. Tidak perlu akun atau tautan tamu khusus.</p>
 {loading&&!feed&&<p role="status">Memuat ruang ucapan…</p>}{error&&<p className="notice error" role="alert">{error}</p>}
 {mutation.message&&<p className={'notice'+(mutation.success?' success':'')} role="status">{mutation.message}{mutation.success&&' Penerimaan dikonfirmasi. Jika Anda memberi izin tampil, ucapan akan muncul otomatis selama penayangan dibuka dan ucapan belum dihapus.'}</p>}
 {mutation.body&&<div className="notice"><p>Ada pengiriman yang belum dipastikan. Jangan mengirim pesan baru dahulu.</p><button className="inv-button" disabled={mutation.busy||mutation.blocked} onClick={mutation.retry}>Coba ulang pengiriman yang sama</button></div>}
 {feed&&!feed.accepting&&<p className="notice">Tuan rumah belum membuka atau telah menutup penerimaan ucapan. Anda tetap dapat membaca ucapan yang diizinkan tampil.</p>}
 <form className="rsvp-form guest-live-form" onSubmit={e=>{e.preventDefault();void submit();}}><fieldset disabled={mutation.locked||loading||!feed?.accepting}>
 <OpenWishFields name={name} message={message} consent={consent} setName={setName} setMessage={setMessage} setConsent={setConsent}/>
 <button className="inv-button" type="submit">{mutation.busy?'Mengirim…':'Kirim ucapan'}</button></fieldset></form>
 {receipt&&<details className="wish-receipt"><summary>Simpan kode penghapusan ucapan Anda</summary><div className="wish-receipt-body"><p className="wish-receipt-lead">Ucapan berhasil dikirim. Simpan kode ini secara privat jika suatu saat Anda ingin menghapus ucapan tersebut.</p><div className="wish-receipt-actions"><button className="inv-button outline" type="button" onClick={async()=>{try{await copyCode(receipt);setCopyState('Kode berhasil disalin.');}catch{setCopyState('Kode belum bisa disalin otomatis. Gunakan tombol unduh.');}}}>Salin kode</button><button className="inv-button outline" type="button" onClick={()=>downloadCode(receipt)}>Unduh kode</button><button className="inv-button outline" type="button" onClick={()=>setShowReceipt(v=>!v)}>{showReceipt?'Sembunyikan kode':'Tampilkan kode'}</button></div>{copyState&&<p className="wish-receipt-meta" role="status">{copyState}</p>}{showReceipt&&<label className="wish-receipt-code">Kode penghapusan privat<textarea aria-label="Kode penghapusan privat" readOnly rows={3} value={receipt}/></label>}{receiptWarning&&<p className="wish-receipt-meta" role="status">{receiptWarning}</p>}<p className="wish-receipt-meta">Jangan bagikan kode ini di grup atau status. Tab ini hanya mengingat kode ucapan terakhir dan bukan cadangan permanen.</p></div></details>}
 <p className="inv-caption"><Link href="/ucapan/hapus" target="_blank" rel="noopener noreferrer">Hapus ucapan memakai kode privat ↗</Link> · Nama pada ucapan bukan verifikasi identitas.</p>
 {feed?.showing&&<><h3>Doa dari orang-orang terkasih</h3>{!feed.items.length&&<p>Belum ada ucapan yang ditampilkan. Ucapan berizin akan muncul otomatis di sini.</p>}<div className="guest-wishes-grid">{feed.items.map(w=>{const stamp=new Date(w.updated_at).toLocaleString('id-ID',{timeZone:'Asia/Jakarta',day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});return <article className="wish-card" key={w.id}><span className="wish-card-mark" aria-hidden>✦</span><strong>{w.name}</strong><p>{w.message}</p><small>{stamp} WIB</small></article>;})}</div></>}
 <div className="button-row centered">{feed?.next&&<button className="inv-button" disabled={loading||mutation.busy} onClick={()=>load(feed.next)}>Ucapan lainnya</button>}<button className="inv-button outline" disabled={loading||mutation.busy} onClick={()=>load()}>Perbarui ucapan</button></div>
 </section>;
}
