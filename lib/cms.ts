/** CMS domain contract. Plain text only; never accepts HTML, scripts, or renderer definitions. */
import {ValidationError,UUID} from './domain.ts';
import {ALL_THEME_SLUGS,LEGACY_THEME_SLUGS} from './theme-registry.ts';
export const CMS_TEXT_LIMITS={brandName:[1,40],tagline:[1,40],heroEyebrow:[1,80],heroTitle:[1,160],heroAccent:[1,100],heroBody:[1,700],heroPrimary:[1,50],heroSecondary:[1,50],aboutTitle:[1,150],aboutBody:[1,1200],featuresTitle:[1,150],collectionTitle:[1,150],collectionBody:[1,500],stepsTitle:[1,150],faqTitle:[1,150],ctaTitle:[1,160],ctaBody:[1,500],ctaLabel:[1,50],footerText:[1,600],contactEmail:[0,120],whatsapp:[0,15],companyUrl:[1,200],seoTitle:[10,70],seoDescription:[20,180]} as const;
export const CMS_SLUGS=ALL_THEME_SLUGS;
export type CmsTextKey=keyof typeof CMS_TEXT_LIMITS;
export type CmsContent=Record<CmsTextKey,string>&{features:{title:string;body:string}[];steps:{title:string;body:string}[];faqs:{question:string;answer:string}[];allowIndex:boolean};
export type CmsTheme={slug:string;name:string;description:string;price:number;active:boolean};
export type CmsDocument={version:1;content:CmsContent;catalog:CmsTheme[]};
export type CmsHistory={revision:number;published_at:string;document:CmsDocument};
export type CmsState={revision:number;published_revision:number;updated_at:string;published_at:string;draft:CmsDocument;live:CmsDocument;catalog_hash:string;history:CmsHistory[]};
export type CmsCommand={action:'save'|'publish';revision:number;request_id:string;catalog_hash:string;document:CmsDocument|null};
export type CmsAck={action:'save'|'publish';request_id:string;revision:number;published_revision:number};
function fail(message:string):never{throw new ValidationError(message);}
function object(value:unknown,keys:readonly string[]):Record<string,unknown>{if(!value||typeof value!=='object'||Array.isArray(value))fail('Format CMS harus objek.');const x=value as Record<string,unknown>;if(Object.keys(x).some(k=>!keys.includes(k))||keys.some(k=>!Object.hasOwn(x,k)))fail('Kolom CMS tidak sesuai.');return x;}
export function cmsText(value:unknown,min:number,max:number,label='Teks'):string{if(typeof value!=='string'||value.trim().length<min||value.length>max||/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f]/.test(value)||/[<>]/.test(value))fail(`${label}: gunakan teks biasa ${min}–${max} karakter tanpa HTML.`);return value;}
function integer(value:unknown,min=1,max=2147483646){if(typeof value!=='number'||!Number.isInteger(value)||value<min||value>max)fail('Angka CMS di luar batas.');return value;}
function stamp(value:unknown){if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}T/.test(value)||!Number.isFinite(Date.parse(value)))fail('Waktu CMS tidak valid.');return value;}
export function parseCmsContent(value:unknown):CmsContent{
 const x=object(value,[...Object.keys(CMS_TEXT_LIMITS),'features','steps','faqs','allowIndex']);const out={} as CmsContent;
 for(const [k,[min,max]]of Object.entries(CMS_TEXT_LIMITS))out[k as CmsTextKey]=cmsText(x[k],min,max,k);
 if(out.contactEmail&&!/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9.-]*[a-zA-Z0-9])?\.[a-zA-Z]{2,}$/.test(out.contactEmail))fail('Email kontak tidak valid.');
 if(out.whatsapp&&!/^62\d{8,13}$/.test(out.whatsapp))fail('WhatsApp harus memakai 62 tanpa spasi.');
 // No arbitrary protocol, credentials, query, port, path, or fragment in company link.
 if(!/^https:\/\/[a-zA-Z0-9](?:[a-zA-Z0-9.-]*[a-zA-Z0-9])?\.[a-zA-Z]{2,}\/?$/.test(out.companyUrl)||out.companyUrl.includes('..'))fail('Website utama harus origin HTTPS, tanpa path/query/port.');
 for(const key of ['features','steps'] as const){const rows=x[key];if(!Array.isArray(rows)||rows.length<1||rows.length>(key==='steps'?3:6)||(key==='steps'&&rows.length!==3))fail('Jumlah langkah harus 3; keunggulan 1–6.');out[key]=rows.map(v=>{const a=object(v,['title','body']);return{title:cmsText(a.title,1,90),body:cmsText(a.body,1,500)};});}
 if(!Array.isArray(x.faqs)||x.faqs.length<1||x.faqs.length>8)fail('FAQ harus 1–8 pertanyaan.');out.faqs=x.faqs.map(v=>{const a=object(v,['question','answer']);return{question:cmsText(a.question,1,160),answer:cmsText(a.answer,1,800)};});
 if(typeof x.allowIndex!=='boolean')fail('Pilihan indeks mesin pencari tidak valid.');out.allowIndex=x.allowIndex;return out;
}
export function parseCmsCatalog(value:unknown,complete=true):CmsTheme[]{
 if(!Array.isArray(value)||value.length>CMS_SLUGS.length||(complete&&value.length!==CMS_SLUGS.length&&value.length!==LEGACY_THEME_SLUGS.length))fail('Katalog harus memuat seluruh tema yang tersedia.');const seen=new Set<string>();
 const rows=value.map(v=>{const x=object(v,['slug','name','description','price','active']);if(typeof x.slug!=='string'||!CMS_SLUGS.includes(x.slug as typeof CMS_SLUGS[number])||seen.has(x.slug))fail('Tema asing atau ganda tidak diizinkan.');seen.add(x.slug);if(typeof x.active!=='boolean')fail('Status tema harus boolean.');return{slug:x.slug,name:cmsText(x.name,1,80),description:cmsText(x.description,1,500),price:integer(x.price,1000,100000000),active:x.active};});
 if(complete&&rows.length===LEGACY_THEME_SLUGS.length&&rows.some(row=>!(LEGACY_THEME_SLUGS as readonly string[]).includes(row.slug)))fail('Salinan katalog lama harus memuat seluruh tema lama.');
 return rows;
}
/** Restore old history without dropping themes added since that snapshot. Current DB prices win only for absent themes. */
export function restoreCmsDocument(document:CmsDocument,current:CmsTheme[]):CmsDocument{
 const restored=parseCmsDocument(document),known=new Set(restored.catalog.map(row=>row.slug));
 return {...restored,catalog:[...restored.catalog,...parseCmsCatalog(current).filter(row=>!known.has(row.slug))]};
}
export function parseCmsDocument(value:unknown):CmsDocument{const x=object(value,['version','content','catalog']);if(x.version!==1)fail('Versi dokumen CMS tidak sesuai.');const result:CmsDocument={version:1,content:parseCmsContent(x.content),catalog:parseCmsCatalog(x.catalog)};if(new TextEncoder().encode(JSON.stringify(result)).byteLength>28000)fail('Dokumen CMS maksimal 28 KB.');return result;}
export function parseCmsState(value:unknown):CmsState{const x=object(value,['revision','published_revision','updated_at','published_at','draft','live','catalog_hash','history']);const revision=integer(x.revision),published_revision=integer(x.published_revision,0);if(published_revision>revision)fail('Versi CMS tidak konsisten.');if(typeof x.catalog_hash!=='string'||!(/^[a-f0-9]{32}$/).test(x.catalog_hash))fail('Sidik katalog tidak valid.');if(!Array.isArray(x.history)||x.history.length>20)fail('Riwayat CMS tidak valid.');return{revision,published_revision,updated_at:stamp(x.updated_at),published_at:stamp(x.published_at),draft:parseCmsDocument(x.draft),live:parseCmsDocument(x.live),catalog_hash:x.catalog_hash,history:x.history.map(v=>{const h=object(v,['revision','published_at','document']);return{revision:integer(h.revision,0),published_at:stamp(h.published_at),document:parseCmsDocument(h.document)};})};}
export function parseCmsCommand(value:unknown):CmsCommand{const x=object(value,['action','revision','request_id','catalog_hash','document']);if(x.action!=='save'&&x.action!=='publish')fail('Tindakan CMS tidak dikenal.');if(typeof x.request_id!=='string'||!UUID.test(x.request_id))fail('Identitas permintaan tidak valid.');if(typeof x.catalog_hash!=='string'||!/^[a-f0-9]{32}$/.test(x.catalog_hash))fail('Sidik katalog tidak valid.');if(x.action==='publish'&&x.document!==null)fail('Publish hanya menggunakan draft yang sudah tersimpan.');return{action:x.action,revision:integer(x.revision),request_id:x.request_id,catalog_hash:x.catalog_hash,document:x.action==='save'?parseCmsDocument(x.document):null};}
export function parseCmsAck(value:unknown,command:CmsCommand):CmsAck{const x=object(value,['action','request_id','revision','published_revision']);if(x.action!==command.action||x.request_id!==command.request_id||x.revision!==command.revision+1)fail('Balasan CMS tidak cocok dengan permintaan.');const pub=integer(x.published_revision,0);if(pub>Number(x.revision)||(command.action==='publish'&&pub!==x.revision))fail('Versi terbit tidak cocok.');return{action:command.action,request_id:command.request_id,revision:Number(x.revision),published_revision:pub};}
export function encodeCmsPending(owner:string,command:CmsCommand){return JSON.stringify({version:1,owner,command:parseCmsCommand(command)});}
export function decodeCmsPending(raw:string,owner:string):CmsCommand{if(raw.length>128000)fail('Catatan CMS terlalu besar.');const x=object(JSON.parse(raw),['version','owner','command']);if(x.version!==1||x.owner!==owner||!UUID.test(owner))fail('Catatan CMS berbeda akun.');return parseCmsCommand(x.command);}
export function cmsBackup(document:CmsDocument){return JSON.stringify({kind:'kastriva-cms',version:1,document:parseCmsDocument(document)},null,2);}
export function readCmsBackup(raw:string){if(new TextEncoder().encode(raw).byteLength>128*1024)fail('Salinan CMS maksimal 128 KB.');const x=object(JSON.parse(raw),['kind','version','document']);if(x.kind!=='kastriva-cms'||x.version!==1)fail('Bukan salinan CMS yang didukung.');return parseCmsDocument(x.document);}
