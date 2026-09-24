import type { ReadinessCheck } from './readiness.ts';
/** Treat missing or malformed fields as failures, not a passing empty checklist. */
export function systemChecks(value: unknown): ReadinessCheck[] {
  const x = value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
  const checks: ReadinessCheck[] = [];
  function flag(id: string, label: string, ok: boolean, pass: string, fail: string) { checks.push({ id, label, state: ok ? 'pass' : 'fail', detail: ok ? pass : fail }); }
  flag('schema', 'Migrasi tahap 7', x.schema_version === 7, 'Database melaporkan versi 7.', 'Versi tidak sesuai atau belum dapat dibaca.');
  const rows = Array.isArray(x.tables_rls) ? x.tables_rls : [];
  for (const table of ['ki_admins','ki_settings','ki_templates','ki_invitations','ki_orders','ki_order_events','ki_deleted_drafts','ki_commerce_settings','ki_sales','ki_publications','ki_sale_events','ki_guest_platform','ki_guest_settings','ki_guests','ki_rsvps','ki_guest_mutations','ki_cms','ki_cms_history','ki_cms_events','ki_public_rate_limits']) {
    flag(table, 'RLS · ' + table, rows.some(row => row?.table === table && row.enabled === true), 'RLS aktif; perilaku akses tetap harus diuji dengan dua akun.', 'Tabel tidak ditemukan, RLS nonaktif, atau hasil tidak lengkap.');
  }
  flag('cms-grants','CMS hanya melalui RPC',x.cms_writes_restricted===true,'Akses langsung tabel CMS dibatasi.','Periksa grants tabel CMS.');
  flag('cms-rpc','RPC admin CMS privat',x.cms_admin_rpc_private===true,'RPC admin tidak diberikan ke anonim.','Periksa izin RPC CMS.');
  flag('cms-published','Konten published tersedia',x.cms_publication_exists===true,'Baris konten website tersedia.','Periksa migrasi 006.');
  flag('storage', 'Bucket foto privat', x.storage_private === true, 'ki-media tidak disetel sebagai bucket publik.', 'Bucket tidak ditemukan atau tidak privat. Jangan unggah foto pelanggan.');
  flag('limits', 'Batas tipe & ukuran foto', x.storage_limit_ok === true, 'MIME JPEG/PNG/WebP dan batas maksimal 5 MB terpasang.', 'Periksa batas ukuran dan allowed MIME types bucket.');
  flag('media-policy', 'Policy media pemilik', x.storage_owner_policies_present === true, 'Policy bernama milik aplikasi ditemukan; uji akses foto tetap wajib.', 'Policy media tidak lengkap.');
  flag('admin-grants', 'Izin tabel admin', x.admin_grants_restricted === true, 'Akun klien tidak diberi SELECT/tulis langsung pada daftar admin.', 'Ada grant berlebihan atau status belum diketahui. Periksa SQL.');
  flag('draft-grants', 'Penulisan draft melalui RPC', x.draft_direct_writes_restricted === true, 'Penulisan langsung klien dibatasi.', 'Ada grant berlebihan atau status belum diketahui.');
  flag('commerce-grants','Penulisan transaksi melalui RPC',x.commerce_direct_writes_restricted===true,'Izin tulis langsung klien dibatasi.','Periksa grants tabel tahap 4.');
  flag('photo-rpc','Path foto hanya untuk server',x.public_photo_rpc_private===true,'RPC foto tidak diberikan kepada anon/authenticated.','RPC foto memiliki grant berlebihan atau belum terverifikasi.');
  flag('guest-grants','Daftar/token tamu tidak terbuka langsung',x.guest_direct_access_restricted===true,'Tabel tamu/RSVP hanya diakses lewat RPC terbatas.','Izin tabel tahap 6 berlebihan atau belum terbaca.');
  for(const [key,label]of [['checkout_enabled','Checkout database'],['publishing_enabled','Publikasi database'],['rsvp_enabled','Layanan RSVP database']])checks.push({id:key,label,state:typeof x[key]==='boolean'?'pass':'fail',detail:typeof x[key]==='boolean'?(x[key]?'Aktif. Pastikan aktivasi disengaja dan sudah diuji.':'Nonaktif. Ini status konfigurasi, bukan error koneksi.'):'Tidak dapat membaca status.'});
  const extraKnown = Number.isInteger(x.storage_extra_policies) && Number.isInteger(x.application_extra_policies);
  const clean = x.storage_extra_policies === 0 && x.application_extra_policies === 0;
  checks.push({ id: 'extra', label: 'Policy tambahan', state: extraKnown && clean ? 'pass' : 'warn', detail: extraKnown && clean ? 'Tidak ditemukan policy tambahan di luar nama yang dipakai aplikasi.' : 'Ada policy tambahan atau status belum lengkap. Periksa manual; policy lain dapat memperluas akses.' });
  checks.push({ id: 'orders', label: 'Permintaan pengerjaan', state: x.order_requests_enabled === false ? 'pass' : 'warn', detail: x.order_requests_enabled === false ? 'Flag database masih nonaktif, sesuai tahap 6.' : 'Flag database aktif atau belum terbaca. Ini bukan status pembayaran.' });
  return checks;
}
