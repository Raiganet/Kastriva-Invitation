import type {ReadinessCheck} from './readiness.ts';
export function launchChecks(raw:unknown):ReadinessCheck[]{
 const x=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw as Record<string,unknown>:{};
 const checks:ReadinessCheck[]=[{id:'schema',label:'Migrasi keamanan 007',state:x.schema_version===7?'pass':'fail',detail:x.schema_version===7?'Skema 7 terbaca.':'Jalankan migrasi 007 setelah 001–006 dan periksa akses admin.'}];
 for(const[key,label]of [['public_rpc_server_only','Jalur RPC publik hanya melalui server'],['rate_rls','RLS tabel pembatasan aktif'],['rate_table_private','Tabel pembatasan tidak terbuka ke browser'],['rate_service_grant','Server dapat memakai pembatasan'],['public_service_grants','Server dapat membaca undangan dan memproses RSVP']])checks.push({id:key,label,state:x[key]===true?'pass':'fail',detail:x[key]===true?'Metadata izin sesuai; tes perilaku tetap diperlukan.':'Izin belum sesuai atau tidak dapat diverifikasi.'});
 return checks;
}
