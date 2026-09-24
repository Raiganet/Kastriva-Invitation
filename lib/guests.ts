import { ValidationError } from './domain.ts';
import { parseSlug, shareUrl } from './commerce.ts';
export const MAX_GUESTS=500, MAX_BATCH=25, MAX_PEOPLE=10, PAGE_SIZE=25;
export const ATTENDANCE={yes:'Hadir',no:'Tidak hadir',maybe:'Belum pasti'} as const;
export type Attendance=keyof typeof ATTENDANCE;
export type Moderation='pending'|'approved'|'hidden';
export type GuestResponse={attendance:Attendance;people:number;message:string;display_name:string;consent:boolean;moderation:Moderation;revision:number;updated_at:string};
export type GuestRow={id:string;name:string;max_people:number;active:boolean;revision:number;created_at:string;response:GuestResponse|null};
export type GuestWorkspace={sale_id:string;slug:string|null;can_manage:boolean;live:boolean;platform_enabled:boolean;settings:{revision:number;accepting:boolean;show_wishes:boolean};stats:{registered:number;active:number;yes:number;no:number;maybe:number;unanswered:number;people:number;pending:number};rows:GuestRow[];total:number;offset:number};
export type GuestContext={name:string;max_people:number;accepting:boolean;response:GuestResponse|null};
export type WishPage={enabled:boolean;items:{id:string;name:string;message:string;updated_at:string}[];next:string|null};
export type GuestAction='add_many'|'update'|'activate'|'rotate'|'moderate'|'settings';
export type GuestCommand={sale_id:string;action:GuestAction;guest_id:string|null;revision:number;request_id:string;data:Record<string,unknown>};
export type RsvpCommand={slug:string;token:string;revision:number;request_id:string;attendance:Attendance;people:number;message:string;display_name:string;consent:boolean};
export function record(x:unknown):Record<string,unknown>{if(!x||typeof x!=='object'||Array.isArray(x))throw new ValidationError('Format data tidak valid.');return x as Record<string,unknown>;}
export function exact(x:Record<string,unknown>,keys:string[]){if(Object.keys(x).length!==keys.length||Object.keys(x).some(k=>!keys.includes(k)))throw new ValidationError('Kolom data tidak sesuai.');}
export function text(x:unknown,min:number,max:number,label='Teks'):string{if(typeof x!=='string'||x.trim().length<min||x.trim().length>max||/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(x))throw new ValidationError(label+' tidak valid.');return x.trim();}
export function integer(x:unknown,min:number,max:number):number{if(typeof x!=='number'||!Number.isSafeInteger(x)||x<min||x>max)throw new ValidationError('Angka di luar batas.');return x;}
function bool(x:unknown):boolean{if(typeof x!=='boolean')throw new ValidationError('Nilai pilihan tidak valid.');return x;}
export function uuid(x:unknown):string{if(typeof x!=='string'||!/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(x))throw new ValidationError('Identitas data tidak valid.');return x.toLowerCase();}
export function guestToken(x:unknown):string{if(typeof x!=='string'||!/^[a-f0-9]{64}$/.test(x))throw new ValidationError('Tautan tamu tidak valid.');return x;}
function timestamp(x:unknown):string{const s=text(x,10,64);if(!Number.isFinite(Date.parse(s)))throw new ValidationError('Waktu respons tidak valid.');return s;}
export function parseGuestCommand(value:unknown):GuestCommand{
 const x=record(value);exact(x,['sale_id','action','guest_id','revision','request_id','data']);
 const sale_id=uuid(x.sale_id),request_id=uuid(x.request_id),revision=integer(x.revision,0,2147483646),d=record(x.data);
 const action=x.action as GuestAction;if(!['add_many','update','activate','rotate','moderate','settings'].includes(action))throw new ValidationError('Tindakan tidak dikenal.');
 const guest_id=x.guest_id===null?null:uuid(x.guest_id);let data:Record<string,unknown>;
 if(action==='add_many'){
  if(guest_id!==null||revision!==0)throw new ValidationError('Batch baru tidak memakai versi tamu lama.');exact(d,['guests']);
  if(!Array.isArray(d.guests)||d.guests.length<1||d.guests.length>MAX_BATCH)throw new ValidationError('Masukkan 1–25 nama per batch.');
  const guests=d.guests.map(v=>{const g=record(v);exact(g,['id','name','max_people']);return {id:uuid(g.id),name:text(g.name,1,100,'Nama'),max_people:integer(g.max_people,1,MAX_PEOPLE)};});
  if(new Set(guests.map(g=>g.id)).size!==guests.length)throw new ValidationError('ID tamu berulang.');data={guests};
 }else if(action==='settings'){
  if(guest_id!==null)throw new ValidationError('Pengaturan bukan data tamu.');exact(d,['accepting','show_wishes']);data={accepting:bool(d.accepting),show_wishes:bool(d.show_wishes)};
 }else{
  if(!guest_id||revision<1)throw new ValidationError('Pilih tamu/versi respons yang benar.');
  if(action==='update'){exact(d,['name','max_people']);data={name:text(d.name,1,100,'Nama'),max_people:integer(d.max_people,1,MAX_PEOPLE)};}
  else if(action==='activate'){exact(d,['active']);data={active:bool(d.active)};}
  else if(action==='moderate'){exact(d,['moderation']);if(d.moderation!=='approved'&&d.moderation!=='hidden')throw new ValidationError('Pilih setujui atau sembunyikan.');data={moderation:d.moderation};}
  else{exact(d,[]);data={};}
 }
 return {sale_id,request_id,revision,guest_id,action,data};
}
export function parseRsvp(value:unknown,maxPeople=MAX_PEOPLE):RsvpCommand{
 const x=record(value);exact(x,['slug','token','revision','request_id','attendance','people','message','display_name','consent']);
 const attendance=x.attendance as Attendance;if(!Object.hasOwn(ATTENDANCE,attendance))throw new ValidationError('Pilih kehadiran.');
 const people=integer(x.people,0,maxPeople),consent=bool(x.consent),message=text(x.message,0,500,'Ucapan'),display_name=text(x.display_name,0,80,'Nama tampilan');
 if((attendance==='yes'&&people<1)||(attendance!=='yes'&&people!==0))throw new ValidationError('Jumlah orang hanya diisi saat memilih Hadir.');
 if(consent&&(!message||!display_name))throw new ValidationError('Untuk menampilkan ucapan, isi nama tampilan dan ucapan.');
 if(!consent&&display_name!=='')throw new ValidationError('Nama publik harus kosong bila ucapan privat.');
 return {slug:parseSlug(x.slug),token:guestToken(x.token),revision:integer(x.revision,0,2147483646),request_id:uuid(x.request_id),attendance,people,message,display_name,consent};
}
export function parseResponse(value:unknown,max=MAX_PEOPLE):GuestResponse|null{
 if(value===null)return null;const x=record(value);exact(x,['attendance','people','message','display_name','consent','moderation','revision','updated_at']);
 if(!['yes','no','maybe'].includes(String(x.attendance))||!['pending','approved','hidden'].includes(String(x.moderation)))throw new ValidationError('Balasan RSVP tidak dikenal.');
 const people=integer(x.people,0,max);if((x.attendance==='yes'&&people<1)||(x.attendance!=='yes'&&people!==0))throw new ValidationError('Jumlah respons tidak valid.');
 return {attendance:x.attendance as Attendance,people,message:text(x.message,0,500),display_name:text(x.display_name,0,80),consent:bool(x.consent),moderation:x.moderation as Moderation,revision:integer(x.revision,1,2147483647),updated_at:timestamp(x.updated_at)};
}
export function parseContext(value:unknown):GuestContext{
 const x=record(value);exact(x,['name','max_people','accepting','response']);const max_people=integer(x.max_people,1,MAX_PEOPLE);
 return {name:text(x.name,1,100),max_people,accepting:bool(x.accepting),response:parseResponse(x.response,max_people)};
}
export function parseGuestRow(value:unknown):GuestRow{
 const x=record(value);exact(x,['id','name','max_people','active','revision','created_at','response']);const max_people=integer(x.max_people,1,MAX_PEOPLE);
 return {id:uuid(x.id),name:text(x.name,1,100),max_people,active:bool(x.active),revision:integer(x.revision,1,2147483647),created_at:timestamp(x.created_at),response:parseResponse(x.response,max_people)};
}
export function parseWorkspace(value:unknown):GuestWorkspace{
 const x=record(value);exact(x,['sale_id','slug','can_manage','live','platform_enabled','settings','stats','rows','total','offset']);const s=record(x.settings),stats=record(x.stats);
 exact(s,['revision','accepting','show_wishes']);const keys=['registered','active','yes','no','maybe','unanswered','people','pending'];exact(stats,keys);
 if(!Array.isArray(x.rows)||x.rows.length>PAGE_SIZE)throw new ValidationError('Halaman daftar tamu tidak valid.');
 return {sale_id:uuid(x.sale_id),slug:x.slug===null?null:parseSlug(x.slug),can_manage:bool(x.can_manage),live:bool(x.live),platform_enabled:bool(x.platform_enabled),settings:{revision:integer(s.revision,0,2147483647),accepting:bool(s.accepting),show_wishes:bool(s.show_wishes)},stats:Object.fromEntries(keys.map(k=>[k,integer(stats[k],0,k==='people'?MAX_GUESTS*MAX_PEOPLE:MAX_GUESTS)])) as GuestWorkspace['stats'],rows:x.rows.map(parseGuestRow),total:integer(x.total,0,MAX_GUESTS),offset:integer(x.offset,0,MAX_GUESTS)};
}
export function cursor(x:unknown):string|null{if(x===null||x===undefined||x==='')return null;if(typeof x!=='string'||!/^[1-9]\d{0,17}$/.test(x))throw new ValidationError('Halaman ucapan tidak valid.');return x;}
export function parseWishes(value:unknown):WishPage{
 const x=record(value);exact(x,['enabled','items','next']);if(!Array.isArray(x.items)||x.items.length>20)throw new ValidationError('Daftar ucapan tidak valid.');
 const items=x.items.map(v=>{const r=record(v);exact(r,['id','name','message','updated_at']);const id=cursor(r.id);if(!id)throw new ValidationError('Ucapan tidak valid.');return {id,name:text(r.name,1,80),message:text(r.message,1,500),updated_at:timestamp(r.updated_at)};});
 return {enabled:bool(x.enabled),items,next:cursor(x.next)};
}
export function personalGuestUrl(origin:string,slug:string,name:string,token:string){const u=new URL(shareUrl(origin,slug,text(name,1,100)));u.hash=new URLSearchParams({guest:guestToken(token)}).toString();return u.toString();}
export function tokenFromFragment(fragment:string):string|null{if(!fragment||fragment.length>120)return null;const q=new URLSearchParams(fragment.replace(/^#/,''));if([...q.keys()].length!==1||q.getAll('guest').length!==1)return null;try{return guestToken(q.get('guest'));}catch{return null;}}
export function guestShareMessage(name:string,url:string):string{return `Yth. ${text(name,1,100)},\n\nDengan hormat, kami mengundang Anda ke acara kami. Silakan buka undangan dan konfirmasi kehadiran melalui tautan khusus berikut:\n${url}\n\nTautan ini khusus untuk Anda/rombongan Anda. Terima kasih.`;}
function csvCell(v:unknown):string{let s=String(v??'');if(/^[\s]*[=+@-]/u.test(s)||/^[\t\r]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';}
export function guestCsv(rows:GuestRow[]):string{
 if(rows.length>MAX_GUESTS)throw new ValidationError('Ekspor melebihi batas.');
 const header=['Nama tamu','Aktif','Kapasitas','Konfirmasi','Jumlah orang','Ucapan','Izin tampil','Moderasi','Diperbarui'];
 const body=rows.map(g=>[g.name,g.active?'Ya':'Tidak',g.max_people,g.response?ATTENDANCE[g.response.attendance]:'Belum menjawab',g.response?.people??0,g.response?.message??'',g.response?.consent?'Ya':'Tidak',g.response?.moderation??'',g.response?.updated_at??'']);
 return '\uFEFF'+[header,...body].map(row=>row.map(csvCell).join(',')).join('\r\n')+'\r\n';
}

export type GuestAck={sale_id:string;action:GuestAction;request_id:string;revision:number};
export function parseGuestAck(value:unknown,sent:GuestCommand):GuestAck{const x=record(value);exact(x,['sale_id','action','request_id','revision']);if(x.sale_id!==sent.sale_id||x.action!==sent.action||x.request_id!==sent.request_id)throw new ValidationError('Balasan berbeda dari permintaan.');const revision=integer(x.revision,1,2147483647);if(revision!==sent.revision+1)throw new ValidationError('Versi balasan tidak sesuai.');return {sale_id:sent.sale_id,action:sent.action,request_id:sent.request_id,revision};}
export function parseRsvpAck(value:unknown,sent:RsvpCommand){const x=record(value);exact(x,['request_id','response']);const response=parseResponse(x.response);if(x.request_id!==sent.request_id||!response||response.revision!==sent.revision+1||response.attendance!==sent.attendance||response.people!==sent.people||response.message!==sent.message||response.display_name!==sent.display_name||response.consent!==sent.consent)throw new ValidationError('Balasan berbeda dari respons yang dikirim.');return {request_id:sent.request_id,response};}
export function parsePlatform(value:unknown){const x=record(value);exact(x,['enabled','revision']);return {enabled:bool(x.enabled),revision:integer(x.revision,1,2147483647)};}
export function parseGuestQuery(value:unknown){const x=record(value);exact(x,['sale_id','query','filter','offset']);if(!['all','yes','no','maybe','unanswered','pending','hidden','approved','inactive'].includes(String(x.filter)))throw new ValidationError('Filter tidak valid.');return {sale_id:uuid(x.sale_id),query:text(x.query,0,100),filter:x.filter as string,offset:integer(x.offset,0,MAX_GUESTS)};}
export function parseGuestLink(value:unknown,id:string){const x=record(value);exact(x,['id','name','slug','token']);if(uuid(x.id)!==id)throw new ValidationError('Tautan tamu berbeda.');return {id,name:text(x.name,1,100),slug:parseSlug(x.slug),token:guestToken(x.token)};}
export function decodeGuestPending(raw:string,owner:string,sale:string){if(raw.length>16000)throw new ValidationError('Catatan sesi terlalu besar.');const x=record(JSON.parse(raw));exact(x,['version','owner','body']);if(x.version!==1||x.owner!==owner)throw new ValidationError('Catatan sesi bukan milik akun ini.');const body=parseGuestCommand(x.body);if(body.sale_id!==sale)throw new ValidationError('Catatan sesi undangan berbeda.');return body;}
export function decodeRsvpPending(raw:string,slug:string,token:string){if(raw.length>8000)throw new ValidationError('Catatan sesi terlalu besar.');const x=record(JSON.parse(raw));exact(x,['version','body']);if(x.version!==1)throw new ValidationError('Versi catatan tidak dikenal.');const body=parseRsvp(x.body);if(body.slug!==slug||body.token!==token)throw new ValidationError('Catatan sesi tamu berbeda.');return body;}
