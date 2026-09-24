import 'server-only';
import {cache} from 'react';
import {publicBackend,site} from '@/lib/config';
import {anonymousDb} from '@/lib/commerce-server';
import {parseCmsCatalog,parseCmsContent,type CmsContent,type CmsTheme} from '@/lib/cms';
import {templates} from '@/lib/templates';
import defaults from '@/data/cms-defaults.json';
import type {Template} from '@/lib/types';
import {HttpError} from '@/lib/http';
export type PublicSite={content:CmsContent;catalog:Template[];revision:number;source:'database'|'demo'|'unavailable'};
export function visualCatalog(rows:CmsTheme[]):Template[]{return rows.map(row=>{const base=templates.find(t=>t.slug===row.slug);if(!base)throw new Error('UNKNOWN_THEME');return{...base,...row};});}
/** React cache deduplicates this read inside one render, not across users or requests. */
export const publicSite=cache(async():Promise<PublicSite>=>{
 let fallback=parseCmsContent(defaults);
 try{fallback=parseCmsContent({...defaults,contactEmail:site.email||defaults.contactEmail,whatsapp:site.whatsapp||defaults.whatsapp});}catch{/* Invalid optional legacy contact config must not crash CMS/admin access. */}
 if(!publicBackend())return{content:fallback,catalog:templates,revision:0,source:'demo'};
 try{const{data,error}=await anonymousDb().rpc('ki_cms_public');if(error||!data||!Number.isSafeInteger(data.revision)||data.revision<1)throw new Error('CMS_UNAVAILABLE');return{content:parseCmsContent(data.content),catalog:visualCatalog(parseCmsCatalog(data.catalog,false)),revision:data.revision,source:'database'};}
 catch{return{content:fallback,catalog:[],revision:0,source:'unavailable'};} // Never silently quote stale JSON prices on backend failure.
});
export function cmsFailure(e:{code?:string}):never{const errors:Record<string,[number,string]>={'42501':[403,'Akses admin dengan email terkonfirmasi diperlukan.'],'22023':[400,'Dokumen CMS tidak sesuai. Periksa teks, jumlah item, dan harga.'],'P6001':[409,'Draft CMS berubah di tab lain. Unduh perubahan lalu muat versi server.'],'P6002':[409,'Identitas percobaan ulang digunakan dengan isi berbeda. Periksa status server.'],'P6003':[409,'Katalog berubah di luar CMS sejak halaman dimuat. Unduh salinan, perbarui data server, muat Published, lalu cocokkan harga sebelum menyimpan.'],'P0001':[429,'Batas 30 perubahan CMS per menit tercapai. Coba lagi nanti.']};const[status,message]=errors[e.code||'']||[503,'CMS belum dapat memproses permintaan. Periksa koneksi dan migrasi 006.'];throw new HttpError(status,message);}
