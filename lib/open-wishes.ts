/** General wishes are independent of guest tokens and never carry attendance/capacity fields. */
import {ValidationError} from './domain.ts';
import {parseSlug} from './commerce.ts';
import {record,exact,text,integer,uuid,guestToken,parseWishes,type WishPage} from './guests.ts';
export const OPEN_WISH_FILTERS=['all','pending','approved','hidden','private','removed'] as const;
export type OpenWishFilter=typeof OPEN_WISH_FILTERS[number];
export type WishSubmit={action:'submit';slug:string;id:string;receipt:string;name:string;message:string;consent:boolean};
export type WishWithdraw={action:'withdraw';slug:string;id:string;receipt:string};
export type WishVisitorCommand=WishSubmit|WishWithdraw;
export type WishVisitorAck={id:string;state:'received'|'removed'};
export type OpenWishFeed={accepting:boolean;showing:boolean;items:WishPage['items'];next:string|null};
export type OpenWishRow={id:string;name:string;message:string;consent:boolean;moderation:'pending'|'approved'|'hidden';removed:boolean;revision:number;created_at:string};
export type OpenWishWorkspace={sale_id:string;slug:string|null;live:boolean;can_open:boolean;platform_enabled:boolean;settings:{revision:number;accepting:boolean;showing:boolean};stats:{total:number;pending:number;approved:number;private:number};rows:OpenWishRow[];total:number;offset:number};
export type WishOwnerCommand={sale_id:string;request_id:string;action:'settings'|'approve'|'hide'|'remove';revision:number;entry_id:string|null;data:Record<string,boolean>};
export type WishOwnerAck={sale_id:string;request_id:string;action:WishOwnerCommand['action'];revision:number};
export type WishPlatformCommand={request_id:string;revision:number;enabled:boolean};
export function booleanValue(value:unknown):boolean{if(typeof value!=='boolean')throw new ValidationError('Nilai pilihan tidak valid.');return value;}
function time(value:unknown){const s=text(value,10,64);if(!Number.isFinite(Date.parse(s)))throw new ValidationError('Waktu server tidak valid.');return s;}
export function wishFilter(value:unknown):OpenWishFilter{if(!OPEN_WISH_FILTERS.includes(value as OpenWishFilter))throw new ValidationError('Filter ucapan tidak dikenal.');return value as OpenWishFilter;}
export function parseVisitorCommand(value:unknown):WishVisitorCommand {
 const v=record(value);
 if(v.action!=='submit'&&v.action!=='withdraw')throw new ValidationError('Tindakan ucapan tidak dikenal.');
 const base={slug:parseSlug(v.slug),id:uuid(v.id),receipt:guestToken(v.receipt)};
 if(v.action==='withdraw'){exact(v,['action','slug','id','receipt']);return {action:'withdraw',...base};}
 exact(v,['action','slug','id','receipt','name','message','consent']);
 return {action:'submit',...base,name:text(v.name,1,80,'Nama'),message:text(v.message,1,500,'Ucapan'),consent:booleanValue(v.consent)};
}
export function parseVisitorAck(value:unknown,sent:WishVisitorCommand):WishVisitorAck {
 const v=record(value),field=sent.action==='submit'?'received':'removed';exact(v,['id',field]);
 if(v.id!==sent.id||v[field]!==true)throw new ValidationError('Konfirmasi ucapan belum sesuai.');
 return {id:sent.id,state:field};
}
export function receiptCode(command:WishVisitorCommand){return `${command.slug}.${command.id}.${command.receipt}`;}
export function parseReceipt(code:string):WishWithdraw {
 if(code.length>170)throw new ValidationError('Kode penghapusan tidak valid.');
 const parts=code.trim().split('.');if(parts.length!==3)throw new ValidationError('Salin kode penghapusan lengkap.');
 return parseVisitorCommand({action:'withdraw',slug:parts[0],id:parts[1],receipt:parts[2]}) as WishWithdraw;
}
export function decodeVisitorPending(raw:string,slug:string):WishVisitorCommand {
 if(raw.length>8192)throw new ValidationError('Catatan ucapan terlalu besar.');const v=record(JSON.parse(raw));exact(v,['version','body']);
 if(v.version!==1)throw new ValidationError('Catatan ucapan tidak dikenal.');const body=parseVisitorCommand(v.body);
 if(body.slug!==slug)throw new ValidationError('Catatan berasal dari undangan berbeda.');return body;
}
export function parseOpenWishFeed(value:unknown):OpenWishFeed {
 const v=record(value);exact(v,['accepting','showing','items','next']);const showing=booleanValue(v.showing);
 const list=parseWishes({enabled:showing,items:v.items,next:v.next});
 if(!showing&&(list.items.length||list.next))throw new ValidationError('Ucapan tersembunyi tidak boleh dikirim.');
 return {accepting:booleanValue(v.accepting),showing,items:list.items,next:list.next};
}
export function parseWishRow(value:unknown):OpenWishRow {
 const v=record(value);exact(v,['id','name','message','consent','moderation','removed','revision','created_at']);
 if(!['pending','approved','hidden'].includes(String(v.moderation)))throw new ValidationError('Status moderasi tidak valid.');
 const removed=booleanValue(v.removed),consent=booleanValue(v.consent),name=text(v.name,removed?0:1,80),message=text(v.message,removed?0:1,500);
 if((removed&&(name||message||consent||v.moderation!=='hidden'))||(v.moderation==='approved'&&!consent))throw new ValidationError('Status izin ucapan tidak sesuai.');
 return {id:uuid(v.id),name,message,consent,removed,moderation:v.moderation as OpenWishRow['moderation'],revision:integer(v.revision,1,2147483647),created_at:time(v.created_at)};
}
export function parseWishWorkspace(value:unknown):OpenWishWorkspace {
 const v=record(value);exact(v,['sale_id','slug','live','can_open','platform_enabled','settings','stats','rows','total','offset']);
 const s=record(v.settings),t=record(v.stats);exact(s,['revision','accepting','showing']);exact(t,['total','pending','approved','private']);
 if(!Array.isArray(v.rows)||v.rows.length>20)throw new ValidationError('Daftar ucapan tidak valid.');
 return {sale_id:uuid(v.sale_id),slug:v.slug===null?null:parseSlug(v.slug),live:booleanValue(v.live),can_open:booleanValue(v.can_open),platform_enabled:booleanValue(v.platform_enabled),
 settings:{revision:integer(s.revision,0,2147483647),accepting:booleanValue(s.accepting),showing:booleanValue(s.showing)},
 stats:{total:integer(t.total,0,2000),pending:integer(t.pending,0,2000),approved:integer(t.approved,0,2000),private:integer(t.private,0,2000)},
 rows:v.rows.map(parseWishRow),total:integer(v.total,0,2000),offset:integer(v.offset,0,2000)};
}
export function parseWishOwnerCommand(value:unknown):WishOwnerCommand {
 const v=record(value);exact(v,['sale_id','request_id','action','revision','entry_id','data']);
 if(!['settings','approve','hide','remove'].includes(String(v.action)))throw new ValidationError('Tindakan tidak valid.');
 const d=record(v.data),entry_id=v.entry_id===null?null:uuid(v.entry_id),revision=integer(v.revision,0,2147483646);
 let data:Record<string,boolean>={};
 if(v.action==='settings'){exact(d,['accepting','showing']);if(entry_id!==null)throw new ValidationError('Pengaturan bukan ucapan.');data={accepting:booleanValue(d.accepting),showing:booleanValue(d.showing)};}
 else{exact(d,[]);if(!entry_id||revision<1)throw new ValidationError('Pilih ucapan dan versi yang benar.');}
 return {sale_id:uuid(v.sale_id),request_id:uuid(v.request_id),action:v.action as WishOwnerCommand['action'],revision,entry_id,data};
}
export function parseWishOwnerAck(value:unknown,sent:WishOwnerCommand):WishOwnerAck {
 const v=record(value);exact(v,['sale_id','request_id','action','revision']);
 if(v.sale_id!==sent.sale_id||v.request_id!==sent.request_id||v.action!==sent.action||v.revision!==sent.revision+1)throw new ValidationError('Konfirmasi tindakan berbeda.');
 return {sale_id:sent.sale_id,request_id:sent.request_id,action:sent.action,revision:sent.revision+1};
}
export function decodeOwnerWishPending(raw:string,owner:string,sale:string){
 if(raw.length>4096)throw new ValidationError('Catatan sesi terlalu besar.');const v=record(JSON.parse(raw));exact(v,['version','owner','body']);
 if(v.version!==1||v.owner!==owner)throw new ValidationError('Catatan akun berbeda.');const body=parseWishOwnerCommand(v.body);
 if(body.sale_id!==sale)throw new ValidationError('Catatan undangan berbeda.');return body;
}
export function parseWishPlatform(value:unknown){const v=record(value);exact(v,['enabled','revision']);return {enabled:booleanValue(v.enabled),revision:integer(v.revision,1,2147483647)};}
export function parseWishPlatformCommand(value:unknown):WishPlatformCommand{const v=record(value);exact(v,['request_id','revision','enabled']);return {request_id:uuid(v.request_id),revision:integer(v.revision,1,2147483646),enabled:booleanValue(v.enabled)};}
export function parseWishPlatformAck(value:unknown,sent:WishPlatformCommand){const v=record(value);exact(v,['request_id','revision','enabled']);if(v.request_id!==sent.request_id||v.revision!==sent.revision+1||v.enabled!==sent.enabled)throw new ValidationError('Konfirmasi pengaturan tidak sesuai.');return {enabled:sent.enabled,revision:sent.revision+1};}
