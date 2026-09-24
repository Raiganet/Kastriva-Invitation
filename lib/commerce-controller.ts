import {decodePending,validResult,type CommerceEndpoint,type MutationOutcome,type PendingCommerce} from './commerce-transport.ts';

export type CommerceState=Readonly<{ready:boolean;busy:boolean;pending:boolean;blocked:boolean;success:boolean;message:string}>;
export const COMMERCE_INITIAL:CommerceState=Object.freeze({ready:false,busy:false,pending:false,blocked:false,success:false,message:''});
type Store={getItem:(key:string)=>string|null;setItem:(key:string,value:string)=>void;removeItem:(key:string)=>void};
export type CommerceControllerOptions={owner:string;key:string;endpoint:CommerceEndpoint;storage:Store;send:(pending:PendingCommerce)=>Promise<MutationOutcome>;onConfirmed?:(result:Record<string,unknown>)=>void|Promise<void>};
function freeze<T>(value:T):T{if(value&&typeof value==='object'){for(const child of Object.values(value))freeze(child);Object.freeze(value);}return value;}

/** React-independent controller: lifecycle epochs, immutable wire snapshot and compare-before-clear.
 * Instantiation is side-effect free. start()/stop() are called only from the committed UI effect.
 */
export class CommerceController{
 readonly storageKey:string;
 private options:CommerceControllerOptions;
 private state:CommerceState=COMMERCE_INITIAL;
 private listeners=new Set<()=>void>();
 private active=false;private epoch=0;private flight=false;
 private pending:PendingCommerce|null=null;private journal:string|null=null;
 constructor(options:CommerceControllerOptions){this.options=options;this.storageKey='ki:commerce:v1:'+options.owner+':'+options.key;}
 getSnapshot=():CommerceState=>this.state;
 getServerSnapshot=():CommerceState=>COMMERCE_INITIAL;
 subscribe=(notify:()=>void)=>{this.listeners.add(notify);return()=>{this.listeners.delete(notify);};};
 private update(patch:Partial<CommerceState>){this.state=Object.freeze({...this.state,...patch});for(const notify of this.listeners){try{notify();}catch{/* Subscriber errors do not reinterpret a server mutation. */}}}
 private decode(raw:string){return freeze(decodePending(raw,this.options.owner,this.options.key,this.options.endpoint));}
 start(){if(this.active)return;this.active=true;++this.epoch;this.flight=false;this.pending=null;this.journal=null;this.state=COMMERCE_INITIAL;
  try{const raw=this.options.storage.getItem(this.storageKey);if(raw!==null){this.pending=this.decode(raw);this.journal=raw;this.update({pending:true,message:'Ada permintaan sebelumnya yang belum dikonfirmasi pada tab ini. Coba ulang memakai isi yang sama.'});}}
  catch{this.update({blocked:true,message:'Catatan sesi tidak dapat dibaca. Periksa penyimpanan browser dan status server sebelum mengirim.'});}
  this.update({ready:true});
 }
 stop(){this.active=false;++this.epoch;this.flight=false;/* Keep journal: a server write may still commit. */}
 private matches(){try{return this.journal!==null&&this.options.storage.getItem(this.storageKey)===this.journal;}catch{return false;}}
 private clear(){
  if(!this.matches()){this.update({blocked:true,message:'Catatan sesi berubah atau tidak dapat dibaca. Periksa status server; catatan tidak dihapus.'});return false;}
  try{this.options.storage.removeItem(this.storageKey);this.pending=null;this.journal=null;this.update({pending:false});return true;}
  catch{this.update({blocked:true,message:'Catatan sesi belum dapat dibersihkan. Periksa status server dan penyimpanan sebelum tindakan baru.'});return false;}
 }
 async submit(body:Record<string,unknown>):Promise<void>{
  if(!this.active||!this.state.ready||this.flight||this.state.blocked||this.pending)return;
  try{
   // The object sent to the network is re-decoded from the persisted representation, never caller-owned.
   const raw=JSON.stringify({version:1,owner:this.options.owner,key:this.options.key,endpoint:this.options.endpoint,body});const snapshot=this.decode(raw);
   if(this.options.storage.getItem(this.storageKey)!==null)throw new Error('EXISTING_JOURNAL');
   this.options.storage.setItem(this.storageKey,raw);this.pending=snapshot;this.journal=raw;this.update({pending:true,success:false});
  }catch{this.update({blocked:true,message:'Penyimpanan sesi diblokir/penuh, sudah berisi permintaan, atau data tidak valid. Tidak ada permintaan baru dikirim.'});return;}
  await this.transmit();
 }
 retry=async():Promise<void>=>{if(this.pending)await this.transmit();};
 private async transmit():Promise<void>{
  if(!this.active||this.flight||this.state.blocked||!this.pending)return;
  if(!this.matches()){this.update({blocked:true,message:'Catatan sesi tidak cocok lagi. Tidak ada retry dikirim; periksa status server lalu muat ulang.'});return;}
  const generation=this.epoch,pending=this.pending;this.flight=true;this.update({busy:true,success:false});
  try{
   const result=await this.options.send(pending);
   if(!this.active||generation!==this.epoch)return;
   if(!result||!['confirmed','rejected','uncertain'].includes(result.state)||typeof result.message!=='string'||result.state==='confirmed'&&!validResult(pending,result.result))throw new Error('UNKNOWN_ACK');
   this.update({message:result.message.slice(0,500)});
   const removed=result.state==='uncertain'?false:this.clear();
   if(result.state==='confirmed'){
    this.update({success:true,...(!removed?{message:'Server mengonfirmasi, tetapi catatan sesi belum dapat dibersihkan. Tindakan baru ditahan; periksa status sebelum mencoba lagi.'}:{})});
    try{await this.options.onConfirmed?.(result.result!);}catch{if(this.active&&generation===this.epoch&&removed)this.update({message:'Server mengonfirmasi. Tampilan terbaru belum termuat; muat ulang untuk memeriksa. Jangan membayar ulang.'});}
   }
  }catch{if(this.active&&generation===this.epoch)this.update({message:'Hasil permintaan belum dapat dipastikan. Jangan membayar ulang. Coba ulang permintaan yang sama.'});}
  finally{if(this.active&&generation===this.epoch){this.flight=false;this.update({busy:false});}}
 }
}
