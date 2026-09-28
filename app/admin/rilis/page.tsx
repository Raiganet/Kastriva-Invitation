import Link from 'next/link';
import {requireAdmin} from '@/lib/server-auth';
import {launchChecks} from '@/lib/launch-status';
import {featureChecks} from '@/lib/database-capabilities';
import {APP_VERSION} from '@/lib/release';
import {validHmacKey} from '@/lib/public-rate';
import {privateStorageKey} from '@/lib/commerce-server';
import RefreshButton from '@/components/RefreshButton';
export const dynamic='force-dynamic';
export const metadata={title:'Kesiapan Rilis',robots:{index:false,follow:false}};
export default async function LaunchPage(){
 const {db}=await requireAdmin();
 const [security,features]=await Promise.all([db.rpc('ki_launch_audit'),db.rpc('ki_feature_readiness')]);
 const checks=[...launchChecks(security.error?null:security.data),...featureChecks(features.error?null:features.data)];
 const runtime=[{id:'key',label:'Secret Supabase khusus server',ok:!!privateStorageKey()},{id:'rate',label:'Kunci pembatasan trafik',ok:validHmacKey(process.env.RATE_LIMIT_HMAC_KEY||'')},{id:'host',label:'Hosting publik Vercel',ok:process.env.VERCEL==='1'}];
 return <main className="container workspace"><div className="workspace-heading"><div><span className="eyebrow">ADMIN / RILIS {APP_VERSION}</span><h1>Kesiapan rilis.</h1><p>Skema dasar tetap 7. Diagnostik 012 memeriksa kemampuan musik/hadiah, 15 tema, dan CMS tanpa mengubah data.</p></div><RefreshButton/></div>
 <p className="notice">Halaman ini hanya membaca konfigurasi. Semua indikator berhasil bukan persetujuan otomatis untuk menerima pelanggan. Checkout, publikasi, dan RSVP tidak dinyalakan dari sini.</p>
 <div className="system-grid">{checks.map(c=><article key={c.id} className={'panel check-item check-'+c.state}><span className="badge">{c.state==='pass'?'Sesuai':'Perlu diperiksa'}</span><div><h2>{c.label}</h2><p>{c.detail}</p></div></article>)}{runtime.map(c=><article key={c.id} className={'panel check-item check-'+(c.ok?'pass':'warn')}><span className="badge">{c.ok?'Terisi / terdeteksi':'Belum siap publik'}</span><div><h2>{c.label}</h2><p>{c.ok?'Nilai rahasia tidak ditampilkan. Koneksi tetap perlu diuji.':'Demo/editor dapat diperiksa dahulu. Localhost hanya untuk pengujian, bukan bukti deployment publik.'}</p></div></article>)}</div>
 <section className="panel"><h2>Bukti pengujian yang masih wajib</h2><p>Jalankan <code>npm run verify:release</code> pada mesin dengan dependensi lengkap. Laporan tersimpan di <code>.release/report.json</code>; jangan menyamakan hasil tes fungsi dengan build atau tes Supabase.</p><p>Setelah kode lolos: uji dua akun, email konfirmasi/reset, foto privat, simpan dan buka ulang, pembayaran manual, tarik/publish ulang, token tamu, moderasi, serta CMS. Simpan hasil dan lakukan percobaan pemulihan backup di staging.</p><p>Baca <code>docs/UPGRADE_v1.8.0.md</code>, <code>docs/UJI_RILIS_TAHAP7.md</code>, dan <code>docs/BACKUP_ROLLBACK.md</code>. Belum ada audit otomatis yang dapat mengesahkan seluruh langkah ini.</p><div className="button-row"><Link className="button ghost" href="/admin/sistem">Status sistem</Link><Link className="button ghost" href="/admin/transaksi">Pengaturan layanan</Link><Link className="button ghost" href="/admin/panduan#rilis">Panduan rilis</Link></div></section></main>;
}
