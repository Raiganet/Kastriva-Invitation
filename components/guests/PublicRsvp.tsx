'use client';
import {useEffect,useRef,useState} from 'react';
import {ATTENDANCE,parseContext,parseRsvp,parseRsvpAck,parseWishes,tokenFromFragment,decodeRsvpPending,type Attendance,type GuestContext,type GuestResponse,type RsvpCommand,type WishPage} from '@/lib/guests';
import {guestRequest} from '@/lib/guest-transport';
import {useRetainedRequest} from './useRetainedRequest';
export default function PublicRsvp({slug}:{slug:string}){
 const [token,setToken]=useState<string|null>(null),[ready,setReady]=useState(false);
 useEffect(()=>{const read=()=>{setToken(tokenFromFragment(window.location.hash));setReady(true);};read();window.addEventListener('hashchange',read);return()=>window.removeEventListener('hashchange',read);},[]);
 return <><section className="inv-section guest-rsvp-section"><p className="overline">WE SAVED YOU A SEAT</p><h2>Konfirmasi kehadiran</h2>
  {!ready?<p role="status">Memeriksa tautan tamu…</p>:token?<RsvpForm key={slug+token} slug={slug} token={token}/>:<div className="guest-rsvp-notice"><h3>Gunakan tautan khusus Anda.</h3><p>Halaman undangan ini dapat dibaca tanpa akun. Untuk memberikan konfirmasi kehadiran, buka tautan personal yang dikirim oleh tuan rumah. Ucapan umum, bila diaktifkan pemilik, tersedia pada bagian Ucapan & doa.</p><small>Nama pada sapaan bukan kunci akses RSVP. Hubungi pengirim bila tautan terpotong atau tidak berfungsi.</small></div>}
 </section><PublicWishes slug={slug}/></>;
}
function RsvpForm({slug,token}:{slug:string;token:string}){
 const [context,setContext]=useState<GuestContext|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState(''),[attendance,setAttendance]=useState<Attendance|''>(''),[people,setPeople]=useState(1),[message,setMessage]=useState(''),[displayName,setDisplayName]=useState(''),[consent,setConsent]=useState(false);
 const version=useRef(0),pendingMirror=useRef<RsvpCommand|null>(null);
 function fill(r:GuestResponse|RsvpCommand|null){setAttendance(r?.attendance||'');setPeople(r?.people??1);setMessage(r?.message||'');setDisplayName(r?.display_name||'');setConsent(r?.consent||false);}
 async function load(){const id=++version.current;setLoading(true);setError('');
  try{const v=await guestRequest(`/api/public/${slug}/guest`,{token},parseContext);if(id===version.current){setContext(v);if(!pendingMirror.current)fill(v.response);}}
  catch(e){if(id===version.current){setContext(null);setError(e instanceof Error?e.message:'Tautan belum dapat diperiksa.');}}
  finally{if(id===version.current)setLoading(false);}
 }
 const mutation=useRetainedRequest({storageKey:'ki:rsvp:v1:'+slug+':'+token,
  decode:(raw:string)=>decodeRsvpPending(raw,slug,token),encode:(body:RsvpCommand)=>JSON.stringify({version:1,body}),
  send:(body:RsvpCommand)=>guestRequest(`/api/public/${slug}/respond`,body,v=>parseRsvpAck(v,body)),
  onSuccess:result=>{setContext(v=>v?{...v,response:result.response}:v);fill(result.response);setError('');}});
 pendingMirror.current=mutation.body;
 useEffect(()=>{void load();return()=>{++version.current;};/* slug/token bound by keyed parent */},[slug,token]);
 useEffect(()=>{if(mutation.body)fill(mutation.body);},[mutation.body]);
 async function submit(withdraw=false){if(!context)return;setError('');
  try{const prev=context.response;const data=withdraw&&prev?{attendance:prev.attendance,people:prev.people,message:prev.message,display_name:'',consent:false}:{attendance,people:attendance==='yes'?people:0,message,display_name:consent?displayName:'',consent};
   const body=parseRsvp({slug,token,revision:context.response?.revision||0,request_id:crypto.randomUUID(),...data},context.max_people);await mutation.submit(body);
  }catch(e){setError(e instanceof Error?e.message:'Periksa isian.');}
 }
 return <div className="guest-rsvp-wrap">
  {(loading||error)&&<p className={'notice'+(error?' error':'')} role="status">{loading?'Memuat konfirmasi Anda…':error}</p>}
  {mutation.message&&<p className={'notice'+(mutation.success?' success':'')} role="status">{mutation.message}{mutation.success&&' Kehadiran tercatat; ucapan berizin tetap melalui moderasi pemilik.'}</p>}
  {mutation.body&&<div className="guest-rsvp-pending"><p>Jangan kirim jawaban baru sampai hasil percobaan sebelumnya diperiksa.</p><button className="inv-button" disabled={mutation.busy||mutation.blocked} onClick={mutation.retry}>{mutation.busy?'Memeriksa…':'Coba ulang jawaban yang sama'}</button></div>}
  {!context&&!loading&&<button className="inv-button outline" onClick={load} disabled={mutation.busy}>Periksa tautan lagi</button>}
  {context&&<><div className="guest-rsvp-identity"><span>KHUSUS UNTUK</span><strong>{context.name}</strong><small>Maksimal {context.max_people} orang, termasuk Anda.</small></div>
   {!context.accepting&&<p className="notice">Penerimaan jawaban sedang ditutup oleh tuan rumah. Jawaban sebelumnya tetap tersimpan.</p>}
   {context.response&&<p className="guest-response-summary">Jawaban server: <strong>{ATTENDANCE[context.response.attendance]}</strong> · {context.response.people} orang.<br/><small>Terakhir diperbarui {new Date(context.response.updated_at).toLocaleString('id-ID',{timeZone:'Asia/Jakarta'})} WIB</small></p>}
   <form className="rsvp-form guest-live-form" onSubmit={e=>{e.preventDefault();void submit();}}><fieldset disabled={loading||mutation.locked||!context.accepting}>
    <RsvpFields attendance={attendance} people={people} message={message} displayName={displayName} consent={consent} maxPeople={context.max_people}
     setAttendance={v=>{setAttendance(v);setPeople(v==='yes'?Math.max(1,people):0);}} setPeople={setPeople} setMessage={setMessage} setDisplayName={setDisplayName} setConsent={v=>{setConsent(v);if(!v)setDisplayName('');}}/>
    <button className="inv-button" type="submit">{mutation.busy?'Menyimpan…':context.response?'Perbarui konfirmasi':'Kirim konfirmasi'}</button>
   </fieldset></form><div className="guest-rsvp-secondary"><button className="inv-button outline" disabled={loading||mutation.locked} onClick={()=>{if(confirm('Muat jawaban server terbaru? Isian yang belum dikirim akan diganti.'))void load();}}>Muat jawaban terbaru</button>
    {context.response?.consent&&<button className="inv-button outline" disabled={loading||mutation.locked} onClick={()=>{if(confirm('Tarik izin penayangan ucapan? Konfirmasi hadir tetap tersimpan. Isian form yang belum dikirim tidak akan disimpan.'))void submit(true);}}>Tarik izin tampilkan ucapan</button>}</div>
   <p className="inv-caption">Tautan ini adalah akses untuk jawaban Anda/rombongan Anda, bukan verifikasi identitas. Jangan teruskan ke orang lain. Tidak ada pembayaran yang diminta pada formulir ini.</p>
  </>}
 </div>;
}
export function RsvpFields({attendance,people,message,displayName,consent,maxPeople,setAttendance,setPeople,setMessage,setDisplayName,setConsent}:{attendance:Attendance|'';people:number;message:string;displayName:string;consent:boolean;maxPeople:number;setAttendance:(value:Attendance|'')=>void;setPeople:(value:number)=>void;setMessage:(value:string)=>void;setDisplayName:(value:string)=>void;setConsent:(value:boolean)=>void}){
 return <><label>Apakah Anda akan hadir?<select required value={attendance} onChange={e=>setAttendance(e.target.value as Attendance)}><option value="" disabled>Pilih konfirmasi</option>{Object.entries(ATTENDANCE).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
  {attendance==='yes'&&<label>Jumlah orang yang hadir<input type="number" required min={1} max={maxPeople} value={people} onChange={e=>setPeople(Number(e.target.value))}/><small>Termasuk Anda; maksimal {maxPeople} orang.</small></label>}
  <label>Ucapan untuk tuan rumah <small>(opsional)</small><textarea rows={4} value={message} maxLength={500} onChange={e=>setMessage(e.target.value)} placeholder="Tuliskan doa atau harapan baik Anda…"/><small>{message.length}/500 karakter</small></label>
  <label className="guest-checkbox"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/><span>Saya mengizinkan ucapan dan nama tampilan di bawah dipublikasikan setelah disetujui tuan rumah.</span></label>
  {consent&&<label>Nama yang boleh ditampilkan<input value={displayName} required maxLength={80} onChange={e=>setDisplayName(e.target.value)} placeholder="Nama panggilan / nama keluarga" autoComplete="off"/></label>}
  <p className="field-help">Tanpa izin, ucapan hanya terlihat oleh pemilik undangan dan pemegang tautan Anda. Jumlah orang dan status kehadiran tidak ditampilkan di daftar ucapan publik.</p>
 </>;
}
function PublicWishes({slug}:{slug:string}){
 const [page,setPage]=useState<WishPage|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('');const flight=useRef(false),version=useRef(0);
 async function load(before:string|null=null){if(flight.current)return;flight.current=true;const id=version.current;setBusy(true);setError('');
  try{const p=await guestRequest(`/api/public/${slug}/wishes`,{before},parseWishes);if(id!==version.current)return;setPage(old=>before&&old&&p.enabled?{...p,items:[...old.items,...p.items.filter(i=>!old.items.some(o=>o.id===i.id))]}:p);}
  catch(e){if(id===version.current){setPage(null);setError('Ucapan belum dapat dimuat. Coba kembali.');}}
  finally{if(id===version.current){flight.current=false;setBusy(false);}}
 }
 useEffect(()=>{++version.current;flight.current=false;setPage(null);void load();return()=>{++version.current;};},[slug]);
 if(page&&!page.enabled&&!error)return null;
 return <section className="inv-section alternate guest-public-wishes"><p className="overline">WARM WORDS, LASTING MEMORIES</p><h2>Ucapan dari RSVP personal</h2><p>Ucapan ditampilkan dengan izin tamu dan persetujuan tuan rumah.</p>
  {busy&&!page&&<p role="status">Memuat ucapan…</p>}{error&&<p className="notice error" role="alert">{error}</p>}{page?.enabled&&!page.items.length&&<p>Belum ada ucapan yang ditampilkan.</p>}
  <div className="guest-wishes-grid">{page?.items.map(w=><article className="wish-card" key={w.id}><strong>{w.name}</strong><p>{w.message}</p></article>)}</div>
  <div className="button-row centered">{page?.next&&<button className="inv-button" disabled={busy} onClick={()=>load(page.next)}>Lihat ucapan lainnya</button>}<button className="inv-button outline" disabled={busy} onClick={()=>load()}>Perbarui ucapan</button></div>
 </section>;
}
